// AI-powered financial info parser: takes raw WhatsApp/Telegram text
// and extracts structured financial application data

export type ParsedFinanceInfo = {
  // Applicant
  title?: string
  firstName?: string
  lastName?: string
  idNumber?: string
  phone?: string
  email?: string
  address?: string
  maritalStatus?: string
  dependants?: number

  // Employment
  employer?: string
  position?: string
  employmentType?: string
  employedSince?: string

  // Income
  grossMonthlyIncome?: number
  netMonthlyIncome?: number
  otherIncome?: number

  // Expenses
  rentBond?: number
  livingExpenses?: number
  transport?: number
  otherLoans?: number

  // Vehicle
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: number
  vehiclePrice?: number
  vin?: string

  // Finance
  creditProvider?: string
  deposit?: number
  tradeInValue?: number
  termMonths?: number

  // Banking
  bankName?: string
  branchCode?: string
  accountNumber?: string
  accountType?: string

  // Spouse
  spouseName?: string
  spouseIdNumber?: string
  spouseIncome?: number

  // Confidence
  confidence: number // 0-1 how confident the parser is
  missingFields: string[] // fields that seem needed but weren't found
}

/**
 * AI-powered parser that extracts structured finance info from natural language text.
 * Uses clear regex patterns first, then falls back to LLM for complex extraction.
 */
export async function parseFinancialInfo({
  text,
  llmApiKey,
  llmModel = "google/gemini-2.5-flash",
}: {
  text: string
  llmApiKey: string
  llmModel?: string
}): Promise<ParsedFinanceInfo> {
  // ── Phase 1: Regex-based extraction for well-structured fields ──
  const result: ParsedFinanceInfo = {
    confidence: 0,
    missingFields: [],
  }

  // Name patterns
  const titleMatch = text.match(/\b(Mr|Mrs|Ms|Miss|Dr|Prof)\b/i)
  if (titleMatch) result.title = titleMatch[1]

  // Try to extract name patterns
  // "Name: Thabo Dlamini" or "Applicant: Thabo Dlamini" or "I am Thabo Dlamini"
  const nameMatch =
    text.match(/(?:Name|Applicant|Client|Customer|Full Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/) ||
    text.match(/I['']?[a]?m\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/) ||
    text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m)
  if (nameMatch) {
    const parts = nameMatch[1].trim().split(/\s+/)
    result.firstName = parts[0]
    if (parts.length > 1) result.lastName = parts.slice(1).join(" ")
  }

  // ID number (SA format: YYMMDD SSSS CCC or just 13 digits)
  const idMatch = text.match(/\b(\d{2}[01]\d[0-3]\d\s?\d{4}\s?\d{3}[0-9])\b/) || text.match(/\b(\d{13})\b/)
  if (idMatch) result.idNumber = idMatch[1].replace(/\s/g, "")

  // Phone (SA formats: 082 555 1234, +27 82 555 1234, 0825551234)
  const phoneMatch =
    text.match(/(?:(?:\+27|0)[-\s]?)(?:\d[-\s]?){9}\b/) ||
    text.match(/Phone[:\s]*([+\d\s-]{10,15})/i) ||
    text.match(/Cell[:\s]*([+\d\s-]{10,15})/i) ||
    text.match(/WhatsApp[:\s]*([+\d\s-]{10,15})/i)
  if (phoneMatch) result.phone = phoneMatch[1]?.trim() || phoneMatch[0].trim()

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0]

  // ID pattern can also help us derive a name if we have "ID: 850101..."

  // Price and amount patterns
  const priceMatch =
    text.match(/(?:Price|Vehicle Price|Selling Price|Cost)[:\s]*R?\s*([\d,]+)/i) ||
    text.match(/R\s*([\d,]+)\s*(?:price|cost)/i)
  if (priceMatch) result.vehiclePrice = parseInt(priceMatch[1].replace(/,/g, ""))

  const depositMatch = text.match(/(?:Deposit)[:\s]*R?\s*([\d,]+)/i)
  if (depositMatch) result.deposit = parseInt(depositMatch[1].replace(/,/g, ""))

  const incomeMatch =
    text.match(/(?:Gross|Monthly Income|Salary)[:\s]*R?\s*([\d,]+)/i) ||
    text.match(/I earn\s*R?\s*([\d,]+)/i)
  if (incomeMatch) result.grossMonthlyIncome = parseInt(incomeMatch[1].replace(/,/g, ""))

  // Vehicle make/model
  const vehicleMakeMatch = text.match(/(?:Make|Brand)[:\s]*(\w+)/i)
  if (vehicleMakeMatch) result.vehicleMake = vehicleMakeMatch[1]

  const vehicleModelMatch = text.match(/(?:Model)[:\s]*(.+)/i)
  if (vehicleModelMatch) result.vehicleModel = vehicleModelMatch[1].trim()

  const yearMatch = text.match(/\b(20\d{2})\b/)
  if (yearMatch) result.vehicleYear = parseInt(yearMatch[1])

  // Employer
  const employerMatch =
    text.match(/(?:Employer|Company|Works at|Employed by)[:\s]*(.+)/i) ||
    text.match(/I work at\s+(.+)/i) ||
    text.match(/I['']m (?:a|an)\s+(?:\w+\s+){0,3}(?:at|for)\s+(.+)/i)
  if (employerMatch) result.employer = employerMatch[1].trim()

  // Position
  const positionMatch = text.match(/(?:Position|Job Title|Role)[:\s]*(.+)/i)
  if (positionMatch) result.position = positionMatch[1].trim()

  // Credit provider / bank
  const providerMatch =
    text.match(/(?:Credit Provider|Finance|Bank)[:\s]*(WesBank|Absa|MFC|Standard Bank|Nedbank)/i) ||
    text.match(/\b(WesBank|Absa|MFC)\b/i)
  if (providerMatch) result.creditProvider = providerMatch[1]

  // Term
  const termMatch = text.match(/(?:Term|Months|Period)[:\s]*(\d+)\s*(?:months|month)?/i) || text.match(/(\d+)\s*months/i)
  if (termMatch) result.termMonths = parseInt(termMatch[1])

  // Trade-in
  const tradeInMatch = text.match(/(?:Trade[-\s]?in|Trade)[:\s]*R?\s*([\d,]+)/i)
  if (tradeInMatch) result.tradeInValue = parseInt(tradeInMatch[1].replace(/,/g, ""))

  // Address (multi-line after "Address:" label)
  const addressMatch = text.match(/(?:Address|Physical Address|Postal Address)[:\s]*([\s\S]+?)(?:\n\s*\n|$)/i)
  if (addressMatch) result.address = addressMatch[1].trim()

  // Marital status
  const maritalMatch = text.match(/(?:Marital Status|Single|Married|Divorced|Widowed)/i)
  if (maritalMatch) {
    const statuses = ["single", "married", "divorced", "widowed", "separated"]
    for (const s of statuses) {
      if (maritalMatch[0].toLowerCase().includes(s)) {
        result.maritalStatus = s.charAt(0).toUpperCase() + s.slice(1)
        break
      }
    }
  }

  // ── Phase 2: LLM fallback for complex extraction ──
  // Use the LLM to extract harder-to-find fields from the raw text
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${llmModel}:generateContent?key=${llmApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Extract car finance application details from this text. Return ONLY a JSON object with these fields (null if not found):
title, firstName, lastName, idNumber, phone, email, address, maritalStatus, dependants,
employer, position, employmentType, employedSince,
grossMonthlyIncome, netMonthlyIncome, otherIncome,
rentBond, livingExpenses, transport, otherLoans,
vehicleMake, vehicleModel, vehicleYear, vehiclePrice, vin,
creditProvider, deposit, tradeInValue, termMonths,
bankName, branchCode, accountNumber, accountType,
spouseName, spouseIdNumber, spouseIncome,
missingFields (array of important fields missing)

TEXT:
"""${text.substring(0, 3000)}"""`,
                },
              ],
            },
          ],
        }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        // Merge LLM extraction with regex extraction (regex wins for overlap)
        Object.assign(result, { ...parsed, ...result })
      }
    }
  } catch {
    // LLM fallback failed silently — regex results are still valid
  }

  // ── Phase 3: Determine confidence and missing fields ──
  const requiredFields = ["firstName", "lastName", "idNumber", "phone", "vehiclePrice"]
  const foundFields = requiredFields.filter((f) => result[f as keyof ParsedFinanceInfo])
  result.confidence = foundFields.length / requiredFields.length
  result.missingFields = requiredFields.filter((f) => !result[f as keyof ParsedFinanceInfo])

  return result
}
