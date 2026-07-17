// Shared finance message handler for WhatsApp, Telegram, and Discord
// Takes a message from any chat → parses → creates draft finance app → returns preview link

import { db } from "@/lib/db"
import { financeApplications, leads } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server"

export type ParsedFinanceResult = {
  firstName?: string
  lastName?: string
  idNumber?: string
  phone?: string
  email?: string
  employer?: string
  grossMonthlyIncome?: number
  vehicleMake?: string
  vehicleModel?: string
  vehiclePrice?: number
  deposit?: number
  termMonths?: number
  confidence: number
  missingFields: string[]
  rawText: string
}

/**
 * Parse financial info from chat message text.
 * Uses regex patterns first, then falls back to LLM (DeepSeek).
 */
export async function parseFinanceFromMessage(
  text: string,
  llmApiKey?: string
): Promise<ParsedFinanceResult> {
  const result: ParsedFinanceResult = {
    confidence: 0,
    missingFields: [],
    rawText: text,
  }

  // ── Name ──
  const nameMatch =
    text.match(/(?:Name|Applicant|Client|Customer)[:\s]+([A-Za-z]+(?:\s+[A-Za-z]+)+)/) ||
    text.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)+)/m)
  if (nameMatch) {
    const parts = nameMatch[1].trim().split(/\s+/)
    result.firstName = parts[0]
    if (parts.length > 1) result.lastName = parts.slice(1).join(" ")
  }

  // ── ID ──
  const idMatch = text.match(/\b(\d{2}[01]\d[0-3]\d\s?\d{4}\s?\d{3}[0-9])\b/) || text.match(/\b(\d{13})\b/)
  if (idMatch) result.idNumber = idMatch[1].replace(/\s/g, "")

  // ── Phone ──
  const phoneMatch = text.match(/Phone[:\s]*([+\d\s-]{10,15})/i) ||
    text.match(/Cell[:\s]*([+\d\s-]{10,15})/i) ||
    text.match(/WhatsApp[:\s]*([+\d\s-]{10,15})/i) ||
    text.match(/(?:\+27|0)[-\s]?\d[-\s]?\d[-\s]?\d[-\s]?\d[-\s]?\d[-\s]?\d[-\s]?\d[-\s]?\d[-\s]?\d/)
  if (phoneMatch) result.phone = (phoneMatch[1] || phoneMatch[0]).trim()

  // ── Email ──
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0]

  // ── Price ──
  const priceMatch = text.match(/(?:Price|Vehicle Price|Selling Price|Cost)[:\s]*R?\s*([\d,]+)/i)
  if (priceMatch) result.vehiclePrice = parseInt(priceMatch[1].replace(/,/g, ""))

  // ── Deposit ──
  const depositMatch = text.match(/Deposit[:\s]*R?\s*([\d,]+)/i)
  if (depositMatch) result.deposit = parseInt(depositMatch[1].replace(/,/g, ""))

  // ── Income ──
  const incomeMatch = text.match(/(?:Gross|Monthly Income|Salary)[:\s]*R?\s*([\d,]+)/i)
  if (incomeMatch) result.grossMonthlyIncome = parseInt(incomeMatch[1].replace(/,/g, ""))

  // ── Employer ──
  const employerMatch = text.match(/(?:Employer|Company|Works at)[:\s]*(.+)/i)
  if (employerMatch) result.employer = employerMatch[1].trim()

  // ── Vehicle make/model ──
  const makeMatch = text.match(/(?:Make|Brand)[:\s]*(\w+)/i)
  if (makeMatch) result.vehicleMake = makeMatch[1]
  const modelMatch = text.match(/(?:Model)[:\s]*(.+)/i)
  if (modelMatch) result.vehicleModel = modelMatch[1].trim()

  // ── Term ──
  const termMatch = text.match(/(?:Term|Months)[:\s]*(\d+)\s*m/i) || text.match(/(\d+)\s*months/i)
  if (termMatch) result.termMonths = parseInt(termMatch[1])

  // ── LLM fallback ──
  if (llmApiKey && (!result.idNumber || !result.grossMonthlyIncome)) {
    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${llmApiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: `Extract car finance application fields from this text. Return JSON with: firstName, lastName, idNumber, phone, email, employer, grossMonthlyIncome, vehicleMake, vehicleModel, vehiclePrice, deposit, termMonths. Use null for missing fields.\n\nTEXT:\n${text.substring(0, 2000)}`,
          }],
          response_format: { type: "json_object" },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const parsed = JSON.parse(data.choices[0].message.content)
        Object.assign(result, { ...parsed, ...result }) // regex wins
      }
    } catch {}
  }

  // ── Confidence ──
  const required = ["firstName", "idNumber", "phone", "vehiclePrice"]
  const found = required.filter((f) => result[f as keyof ParsedFinanceResult])
  result.confidence = found.length / required.length
  result.missingFields = required.filter((f) => !result[f as keyof ParsedFinanceResult])

  return result
}

/**
 * Create a draft finance application from parsed data.
 */
export async function createDraftFinanceApp(
  orgId: string,
  parsed: ParsedFinanceResult
) {
  const [app] = await db
    .insert(financeApplications)
    .values({
      orgId,
      status: "draft",
      firstName: parsed.firstName || "",
      lastName: parsed.lastName || "",
      idNumber: parsed.idNumber || "",
      phone: parsed.phone || "",
      email: parsed.email,
      employer: parsed.employer,
      grossMonthlyIncome: parsed.grossMonthlyIncome,
      vehiclePrice: parsed.vehiclePrice || 0,
      deposit: parsed.deposit || 0,
      termMonths: parsed.termMonths || 72,
      rawInput: parsed.rawText.substring(0, 5000),
    })
    .returning()

  return app
}

/**
 * Build a summary message from parsed data (for chat reply).
 */
export function buildFinanceSummary(parsed: ParsedFinanceResult): string {
  const lines = [
    "📋 *Finance Application Summary*",
    "",
    `👤 Name: ${parsed.firstName || "?"} ${parsed.lastName || ""}`,
    `🆔 ID: ${parsed.idNumber || "?"}`,
    `📞 Phone: ${parsed.phone || "?"}`,
    `💰 Vehicle Price: ${parsed.vehiclePrice ? `R ${parsed.vehiclePrice.toLocaleString()}` : "?"}`,
  ]

  if (parsed.deposit) lines.push(`💵 Deposit: R ${parsed.deposit.toLocaleString()}`)
  if (parsed.employer) lines.push(`🏢 Employer: ${parsed.employer}`)
  if (parsed.grossMonthlyIncome) lines.push(`💳 Income: R ${parsed.grossMonthlyIncome.toLocaleString()}/mo`)
  if (parsed.vehicleMake) lines.push(`🚗 Vehicle: ${parsed.vehicleMake} ${parsed.vehicleModel || ""}`)

  lines.push("")
  lines.push(`✅ Confidence: ${Math.round(parsed.confidence * 100)}%`)

  if (parsed.missingFields.length > 0) {
    lines.push(`⚠️  Missing: ${parsed.missingFields.join(", ")}`)
  }

  lines.push("")
  lines.push("🔗 Review & approve: https://dealx.app/dashboard/finance-apps")

  return lines.join("\n")
}
