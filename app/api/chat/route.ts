// AI Chat API — powers the dealership AI assistant
// Uses DeepSeek with tool calling to let the AI actually do things

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { vehicles, leads } from "@/lib/db/schema"
import { eq, desc, like, and, sql } from "drizzle-orm"

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions"

const SYSTEM_PROMPT = `You are DealX AI — an AI assistant for South African car dealerships.

You help dealership staff manage their daily operations. You have access to tools that let you search inventory, manage leads, create finance applications, and more.

ALWAYS respond in a helpful, professional tone. Use South African Rands (R) for all pricing. Be concise but thorough.

Your capabilities:
- Search vehicle inventory by make, model, year, price range, colour, etc.
- Get detailed info on specific vehicles
- Search and manage leads
- Calculate finance estimates (monthly instalments, total repayment)
- Provide advice on inventory management

When a user asks you to DO something (create, update, delete), confirm with them first before taking action.`

type Message = {
  role: "system" | "user" | "assistant"
  content: string
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }>
}

const tools = [
  {
    type: "function" as const,
    function: {
      name: "searchInventory",
      description: "Search vehicle inventory by make, model, year range, price range, colour, or any combination",
      parameters: {
        type: "object",
        properties: {
          make: { type: "string", description: "Vehicle make e.g. Toyota, BMW, Ford" },
          model: { type: "string", description: "Vehicle model e.g. Fortuner, X3, Ranger" },
          minPrice: { type: "number", description: "Minimum price in Rands" },
          maxPrice: { type: "number", description: "Maximum price in Rands" },
          minYear: { type: "number", description: "Minimum year" },
          maxYear: { type: "number", description: "Maximum year" },
          colour: { type: "string", description: "Vehicle colour" },
          status: { type: "string", enum: ["in_stock", "sold", "reserved"], description: "Inventory status" },
          limit: { type: "number", description: "Max results to return (default 10)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getVehicleDetails",
      description: "Get full details on a specific vehicle by stock number or ID",
      parameters: {
        type: "object",
        properties: {
          stockNo: { type: "string", description: "Stock number of the vehicle" },
        },
        required: ["stockNo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchLeads",
      description: "Search leads by name, phone, status, or source",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search by name or phone" },
          status: { type: "string", description: "Filter by lead status" },
          limit: { type: "number", description: "Max results" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculateFinance",
      description: "Calculate monthly instalment and total repayment for vehicle finance",
      parameters: {
        type: "object",
        properties: {
          vehiclePrice: { type: "number", description: "Vehicle price in Rands" },
          deposit: { type: "number", description: "Deposit amount in Rands" },
          interestRate: { type: "number", description: "Annual interest rate (default 12.5)" },
          termMonths: { type: "number", description: "Term in months (default 72)" },
          residualValue: { type: "number", description: "Residual/balloon value in Rands" },
        },
        required: ["vehiclePrice"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getInventoryStats",
      description: "Get inventory statistics - total stock, total value, count by status",
      parameters: { type: "object", properties: {} },
    },
  },
]

const functionMap: Record<string, Function> = {
  searchInventory: async (args: any, orgId: string) => {
    const conditions = [eq(vehicles.orgId, orgId)]
    if (args.make) conditions.push(like(vehicles.make, `%${args.make}%`))
    if (args.model) conditions.push(like(vehicles.model, `%${args.model}%`))
    if (args.minPrice) conditions.push(sql`${vehicles.price} >= ${args.minPrice}`)
    if (args.maxPrice) conditions.push(sql`${vehicles.price} <= ${args.maxPrice}`)
    if (args.minYear) conditions.push(sql`${vehicles.year} >= ${args.minYear}`)
    if (args.maxYear) conditions.push(sql`${vehicles.year} <= ${args.maxYear}`)
    if (args.colour) conditions.push(like(vehicles.colour, `%${args.colour}%`))
    if (args.status) conditions.push(eq(vehicles.status, args.status))

    const results = await db
      .select()
      .from(vehicles)
      .where(and(...conditions))
      .orderBy(desc(vehicles.createdAt))
      .limit(args.limit || 10)

    return results.map((v) => ({
      stockNo: v.stockNo,
      vehicle: `${v.make} ${v.model} ${v.variant || ""}`,
      year: v.year,
      colour: v.colour,
      odometer: `${v.odometer.toLocaleString()} km`,
      price: `R ${v.price.toLocaleString()}`,
      status: v.status,
    }))
  },

  getVehicleDetails: async (args: any, orgId: string) => {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.orgId, orgId), eq(vehicles.stockNo, args.stockNo)))

    if (!vehicle) return { error: `Vehicle ${args.stockNo} not found` }
    return vehicle
  },

  searchLeads: async (args: any, orgId: string) => {
    const conditions = [eq(leads.orgId, orgId)]
    if (args.query) {
      conditions.push(
        sql`(${leads.firstName} ILIKE ${`%${args.query}%`} OR ${leads.lastName} ILIKE ${`%${args.query}%`} OR ${leads.phone} ILIKE ${`%${args.query}%`})`
      )
    }
    if (args.status) conditions.push(eq(leads.status, args.status as any))

    const results = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt))
      .limit(args.limit || 10)

    return results.map((l) => ({
      name: `${l.firstName} ${l.lastName || ""}`,
      phone: l.phone,
      interest: l.interestedIn || "—",
      source: l.source,
      status: l.status,
      date: l.createdAt,
    }))
  },

  calculateFinance: async (args: any) => {
    const principal = args.vehiclePrice - (args.deposit || 0)
    const residual = args.residualValue || 0
    const rate = (args.interestRate || 12.5) / 100 / 12
    const term = args.termMonths || 72
    const amount = principal - residual

    if (rate === 0) {
      const monthly = Math.round(amount / term)
      return {
        monthlyInstalment: `R ${monthly.toLocaleString()}`,
        totalRepayment: `R ${(monthly * term).toLocaleString()}`,
        totalInterest: "R 0",
        term: `${term} months`,
      }
    }

    const factor = (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
    const monthlyInstalment = Math.round(amount * factor)
    const totalRepayment = monthlyInstalment * term
    const totalInterest = totalRepayment - amount

    return {
      monthlyInstalment: `R ${monthlyInstalment.toLocaleString()}`,
      totalRepayment: `R ${totalRepayment.toLocaleString()}`,
      totalInterest: `R ${totalInterest.toLocaleString()}`,
      term: `${term} months`,
      deposit: `R ${(args.deposit || 0).toLocaleString()}`,
      interestRate: `${args.interestRate || 12.5}%`,
    }
  },

  getInventoryStats: async (_args: any, orgId: string) => {
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.orgId, orgId))
      .then((r) => Number(r[0].count))

    const inStock = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(eq(vehicles.orgId, orgId), eq(vehicles.status, "in_stock")))
      .then((r) => Number(r[0].count))

    const totalValue = await db
      .select({ total: sql<number>`coalesce(sum(price), 0)` })
      .from(vehicles)
      .where(eq(vehicles.orgId, orgId))
      .then((r) => Number(r[0].total))

    return {
      totalVehicles: total,
      inStock,
      totalValue: `R ${totalValue.toLocaleString()}`,
    }
  },
}

export async function POST(request: NextRequest) {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages: clientMessages }: { messages: Array<{ role: string; content: string }> } = await request.json()
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) return NextResponse.json({ error: "LLM_API_KEY required" }, { status: 500 })

  // Build message array
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...clientMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ]

  // Call DeepSeek with tools
  const response = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `DeepSeek error: ${err}` }, { status: 500 })
  }

  const data = await response.json()
  const choice = data.choices[0]
  const finishReason = choice.finish_reason

  // If the model wants to call tools
  if (finishReason === "tool_calls" && choice.message.tool_calls) {
    const toolCalls = choice.message.tool_calls
    const toolResults: any[] = []

    for (const tc of toolCalls) {
      const fnName = tc.function.name
      const fnArgs = JSON.parse(tc.function.arguments)
      const fn = functionMap[fnName]

      if (fn) {
        try {
          const result = await fn(fnArgs, orgId)
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          })
        } catch (error) {
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ error: String(error) }),
          })
        }
      }
    }

    // Send tool results back to the model for a final response
    const finalMessages = [
      ...messages,
      { role: "assistant" as const, content: choice.message.content || "", tool_calls: toolCalls },
      ...toolResults,
    ]

    const finalResponse = await fetch(DEEPSEEK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: finalMessages,
        max_tokens: 2000,
      }),
    })

    const finalData = await finalResponse.json()
    return NextResponse.json({
      message: finalData.choices[0].message,
      finishReason: finalData.choices[0].finish_reason,
    })
  }

  // No tool calls — just return the response
  return NextResponse.json({
    message: choice.message,
    finishReason,
  })
}
