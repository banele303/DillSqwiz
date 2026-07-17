import type { Stagehand } from "@browserbasehq/stagehand"
import type { ActionNodeType, NodeType } from "@/features/workflows/nodes/node-registry"
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
  orgId?: string
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
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

  "send-email": async ({ values }) =>
    sendEmail({ to: values.to, subject: values.subject, body: values.body }),
  "send-whatsapp": async ({ values }) => {
    const apiKey = process.env.SENT_DM_API_KEY
    if (!apiKey) throw new Error("SENT_DM_API_KEY not configured")
    return sendWhatsApp({ to: values.to, message: values.message, apiKey })
  },

  "publish-to-platform": async ({ values, getStagehand, orgId }) => {
    if (!orgId) throw new Error("orgId required")
    const stagehand = await getStagehand()
    const platforms: Array<"autotrader" | "cars_co_za" | "changecars" | "facebook"> =
      values.platforms.split(",").map((p) => p.trim().toLowerCase() as any)
    return publishToPlatforms({ orgId, stockNo: values.stockNo, stagehand, platforms })
  },

  "parse-financial-info": async ({ values }) => {
    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) throw new Error("LLM_API_KEY not configured")
    return parseFinancialInfo({ text: values.text, llmApiKey: apiKey })
  },

  "generate-pdf": async ({ values }) => {
    const docType = values.type as "quote" | "invoice" | "otp"
    const quoteData = {
      quoteNumber: `Q-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString("en-ZA"),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-ZA"),
      dealership: { name: values.dealershipName || "Dealership" },
      customer: { name: values.customerName || "Customer" },
      vehicle: {
        stockNo: values.stockNo || "", make: values.make || "", model: values.model || "",
        year: parseInt(values.year) || 2024, odometer: parseInt(values.odometer) || 0,
        colour: values.colour || "", transmission: values.transmission || "",
        fuelType: values.fuelType || "", features: (values.features || "").split(",").filter(Boolean),
      },
      pricing: { price: parseInt(values.price) || 0, netPrice: parseInt(values.price) || 0 },
    }
    const html = generateDocumentHtml(quoteData, docType)
    return { html, title: `${docType.toUpperCase()} - ${quoteData.quoteNumber}` }
  },

  "fill-finance-form": async ({ values }) => {
    const p = parseInt(values.vehiclePrice) || 0
    const d = parseInt(values.deposit) || 0
    const r = parseFloat(values.interestRate) || 12.5
    const t = parseInt(values.termMonths) || 72
    const am = calculateAmortization(p - d, r, t)
    return { formData: { firstName: values.firstName, lastName: values.lastName, idNumber: values.idNumber, phone: values.phone, vehiclePrice: p, deposit: d, monthlyInstalment: am.monthlyInstalment }, monthlyInstalment: am.monthlyInstalment, submitted: false }
  },
} satisfies Record<ActionNodeType, NodeExecutor>
