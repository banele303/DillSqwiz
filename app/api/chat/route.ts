import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions"

const SYSTEM = `You are a vehicle publishing AI agent for a car dealership platform called DealX.

Your job: Extract vehicle details from the user's message and publish them to listing platforms.

When a user describes a car they want to publish:
1. Extract: make, model, variant, year, odometer, colour, transmission, fuelType, price, stockNo (if provided), features, images
2. IF you have at least: make, model, year, price — return a publish_vehicle function call
3. IF details are missing, ask the user for the missing info

CRITICAL RULES:
- ALWAYS call publish_vehicle if you have make + model + year + price
- NEVER ask for more details if you have those 4 minimum fields
- For missing optional fields, use sensible defaults (transmission=automatic, fuelType=petrol)
- Price must be in Rands (whole number, no decimals)
- Use South African English
- Be direct and professional`

export async function POST(request: NextRequest) {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages } = await request.json()
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) return NextResponse.json({ error: "LLM_API_KEY not set" }, { status: 500 })

  const response = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM },
        ...messages.slice(-10),
      ],
      tools: [{
        type: "function",
        function: {
          name: "publish_vehicle",
          description: "Publish a vehicle to Cars.co.za, AutoTrader, and the dealership website",
          parameters: {
            type: "object",
            properties: {
              make: { type: "string", description: "Vehicle make e.g. Toyota, BMW" },
              model: { type: "string", description: "Vehicle model e.g. Fortuner, X3" },
              variant: { type: "string", description: "Variant e.g. 2.8 GD-6 4x4" },
              year: { type: "number", description: "Manufacturing year" },
              odometer: { type: "number", description: "Odometer in kilometers" },
              colour: { type: "string", description: "Exterior colour" },
              transmission: { type: "string", enum: ["automatic", "manual"] },
              fuelType: { type: "string", enum: ["petrol", "diesel", "electric", "hybrid"] },
              price: { type: "number", description: "Selling price in South African Rands" },
              stockNo: { type: "string", description: "Dealership stock number" },
              features: { type: "array", items: { type: "string" }, description: "Key features" },
              images: { type: "array", items: { type: "string" }, description: "Image URLs" },
              location: { type: "string", description: "Dealership location" },
            },
            required: ["make", "model", "year", "price"],
          },
        },
      }],
      tool_choice: "auto",
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `DeepSeek: ${err}` }, { status: 500 })
  }

  const data = await response.json()
  const choice = data.choices[0]

  // Tool call detected
  if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.[0]) {
    const tc = choice.message.tool_calls[0]
    const args = JSON.parse(tc.function.arguments)

    // Generate stock number if missing
    if (!args.stockNo) args.stockNo = `ST${Date.now().toString(36).toUpperCase()}`

    return NextResponse.json({ toolCall: "publish_vehicle", data: args })
  }

  // Regular message
  return NextResponse.json({ message: choice.message })
}
