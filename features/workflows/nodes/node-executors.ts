import type { Stagehand } from "@browserbasehq/stagehand"

import type {
  ActionNodeType,
  NodeType,
} from "@/features/workflows/nodes/node-registry"
import { act } from "./act"
import { agent } from "./agent"
import { extract } from "./extract"
import { observe } from "./observe"
import { openUrl } from "./open-url"
import { sendEmail } from "./send-email"
import { sendWhatsApp } from "./send-whatsapp"
import { publishToPlatforms } from "./publish-to-platform"
import { parseFinancialInfo } from "./parse-financial-info"
import { generateDocumentHtml, calculateAmortization } from "./generate-pdf"

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  // ── Existing browser nodes ──
  "open-url": async ({ values, getStagehand }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ values, getStagehand }) =>
    act({ stagehand: await getStagehand(), instruction: values.instruction }),
  extract: async ({ values, getStagehand }) =>
    extract({ stagehand: await getStagehand(), instruction: values.instruction }),
  observe: async ({ values, getStagehand }) =>
    observe({ stagehand: await getStagehand(), instruction: values.instruction }),
  agent: async ({ values, getStagehand }) =>
    agent({ stagehand: await getStagehand(), instruction: values.instruction }),

  // ── Communication ──
  "send-email": async ({ values }) =>
    sendEmail({ to: values.to, subject: values.subject, body: values.body }),
  "send-whatsapp": async ({ values }) => {
    const apiKey = process.env.SENT_DM_API_KEY
    if (!apiKey) throw new Error("SENT_DM_API_KEY not configured")
    return sendWhatsApp({ to: values.to, message: values.message, apiKey })
  },

  // ── Car Dealership ──
  "publish-to-platform": async ({ values, getStagehand }) => {
    const stagehand = await getStagehand()
    const platforms: Array<"autotrader" | "cars_co_za" | "changecars" | "facebook"> =
      values.platforms.split(",").map((p) => p.trim().toLowerCase() as any)

    // Load vehicle data from DB by stock number
    // For now, this is a placeholder — the full implementation will look up
    // the vehicle from the database and load credentials from the vault.
    const vehicle = {
      stockNo: values.stockNo,
      make: values.make || "Toyota",
      model: values.model || "Fortuner",
      year: parseInt(values.year) || 2024,
      odometer: parseInt(values.odometer) || 15000,
      colour: values.colour || "White",
      transmission: values.transmission || "Automatic",
      fuelType: values.fuelType || "Diesel",
      price: parseInt(values.price) || 0,
      features: (values.features || "").split(",").map((f: string) => f.trim()).filter(Boolean),
      images: [],
    }

    // Placeholder credentials — real impl loads from platformCredentials table
    const credentials = {
      autotrader: { email: "", password: "" },
      cars_co_za: { email: "", password: "" },
      changecars: { email: "", password: "" },
      facebook: { email: "", password: "" },
    } as any

    return publishToPlatforms({ stagehand, vehicle, credentials, platforms })
  },

  "parse-financial-info": async ({ values }) => {
    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) throw new Error("LLM_API_KEY not configured")
    return parseFinancialInfo({ text: values.text, llmApiKey: apiKey })
  },

  "generate-pdf": async ({ values }) => {
    const docType = values.type as "quote" | "invoice" | "otp"
    // Build quote data from context/upstream outputs
    const quoteData = {
      quoteNumber: `Q-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString("en-ZA"),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-ZA"),
      dealership: {
        name: values.dealershipName || "Your Dealership",
        address: values.dealershipAddress,
        phone: values.dealershipPhone,
        email: values.dealershipEmail,
      },
      customer: {
        name: values.customerName || "Customer",
        phone: values.customerPhone,
        email: values.customerEmail,
      },
      vehicle: {
        stockNo: values.stockNo || "",
        make: values.make || "",
        model: values.model || "",
        year: parseInt(values.year) || 2024,
        odometer: parseInt(values.odometer) || 0,
        colour: values.colour || "",
        transmission: values.transmission || "",
        fuelType: values.fuelType || "",
        features: (values.features || "").split(",").filter(Boolean),
      },
      pricing: {
        price: parseInt(values.price) || 0,
        netPrice: parseInt(values.price) || 0,
      },
    }

    const html = generateDocumentHtml(quoteData, docType)
    return { html, title: `${docType.toUpperCase()} - ${quoteData.quoteNumber}` }
  },

  "fill-finance-form": async ({ values }) => {
    const principal = parseInt(values.vehiclePrice) || 0
    const deposit = parseInt(values.deposit) || 0
    const rate = parseFloat(values.interestRate) || 12.5
    const term = parseInt(values.termMonths) || 72

    const amortization = calculateAmortization(principal - deposit, rate, term)

    const formData = {
      firstName: values.firstName,
      lastName: values.lastName,
      idNumber: values.idNumber,
      phone: values.phone,
      email: values.email,
      vehiclePrice: principal,
      deposit,
      interestRate: rate,
      termMonths: term,
      monthlyInstalment: amortization.monthlyInstalment,
      totalRepayment: amortization.totalRepayment,
      creditProvider: "WesBank",
      submitted: false, // set to true after sending
    }

    return {
      formData,
      monthlyInstalment: amortization.monthlyInstalment,
      submitted: false,
    }
  },
} satisfies Record<ActionNodeType, NodeExecutor>
