import type { Node } from "@xyflow/react"
import {
  Bot,
  Eye,
  Globe,
  Mail,
  MousePointerClick,
  Pointer,
  ScanText,
  MessageSquare,
  Printer,
  Calculator,
  FileText,
  type LucideIcon,
} from "lucide-react"

export type StepNodeKind = "trigger" | "action"

export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
}

export type NodeOutput = {
  path: string
  label: string
}

export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string
  fields: NodeField[]
  outputs: NodeOutput[]
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Start",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [],
    outputs: [],
  },
  "open-url": {
    type: "open-url", kind: "action", label: "Open URL", icon: Globe,
    accent: "bg-emerald-500 text-white",
    fields: [{ key: "url", label: "URL", placeholder: "https://example.com", required: true }],
    outputs: [{ path: "url", label: "URL" }, { path: "title", label: "Title" }],
  },
  act: {
    type: "act", kind: "action", label: "Act", icon: Pointer,
    accent: "bg-violet-500 text-white",
    fields: [{ key: "instruction", label: "Instruction", placeholder: "Click the button", multiline: true, required: true }],
    outputs: [{ path: "success", label: "Success" }, { path: "message", label: "Message" }, { path: "url", label: "URL" }],
  },
  extract: {
    type: "extract", kind: "action", label: "Extract", icon: ScanText,
    accent: "bg-amber-500 text-white",
    fields: [{ key: "instruction", label: "Instruction", placeholder: "Extract the price", multiline: true, required: true }],
    outputs: [{ path: "extraction", label: "Extraction" }],
  },
  observe: {
    type: "observe", kind: "action", label: "Observe", icon: Eye,
    accent: "bg-sky-500 text-white",
    fields: [{ key: "instruction", label: "Instruction", placeholder: "Find the button", multiline: true, required: true }],
    outputs: [{ path: "matches", label: "Matches" }, { path: "matches[0].selector", label: "Selector" }, { path: "matches[0].description", label: "Description" }],
  },
  agent: {
    type: "agent", kind: "action", label: "Agent", icon: Bot,
    accent: "bg-rose-500 text-white",
    fields: [{ key: "instruction", label: "Instruction", placeholder: "Search for stock price", multiline: true, required: true }],
    outputs: [{ path: "success", label: "Success" }, { path: "message", label: "Message" }, { path: "completed", label: "Completed" }],
  },
  "send-email": {
    type: "send-email", kind: "action", label: "Send Email", icon: Mail,
    accent: "bg-teal-500 text-white",
    fields: [
      { key: "to", label: "To", placeholder: "person@example.com", required: true },
      { key: "subject", label: "Subject", placeholder: "Hello", required: true },
      { key: "body", label: "Body", placeholder: "Write your message...", multiline: true, required: true },
    ],
    outputs: [{ path: "id", label: "Email ID" }],
  },
  "send-whatsapp": {
    type: "send-whatsapp", kind: "action", label: "Send WhatsApp", icon: MessageSquare,
    accent: "bg-green-500 text-white",
    fields: [
      { key: "to", label: "Phone Number", placeholder: "+27825551234", required: true },
      { key: "message", label: "Message", placeholder: "Type your message...", multiline: true, required: true },
    ],
    outputs: [{ path: "messageId", label: "Message ID" }, { path: "status", label: "Status" }],
  },
  "publish-to-platform": {
    type: "publish-to-platform", kind: "action", label: "Publish to Platforms", icon: Globe,
    accent: "bg-orange-500 text-white",
    fields: [
      { key: "platforms", label: "Platforms", placeholder: "autotrader, cars_co_za, changecars, facebook", required: true },
      { key: "stockNo", label: "Stock No", placeholder: "ST24001", required: true },
    ],
    outputs: [
      { path: "results", label: "Results" },
      { path: "allPublished", label: "All Published?" },
      { path: "failed", label: "Failed Platforms" },
    ],
  },
  "parse-financial-info": {
    type: "parse-financial-info", kind: "action", label: "Parse Financial Info", icon: FileText,
    accent: "bg-purple-500 text-white",
    fields: [
      { key: "text", label: "WhatsApp / Text Input", placeholder: "Paste the customer's financial info...", multiline: true, required: true },
    ],
    outputs: [
      { path: "firstName", label: "First Name" },
      { path: "lastName", label: "Last Name" },
      { path: "idNumber", label: "ID Number" },
      { path: "phone", label: "Phone" },
      { path: "grossMonthlyIncome", label: "Gross Monthly Income" },
      { path: "vehiclePrice", label: "Vehicle Price" },
      { path: "confidence", label: "Confidence" },
      { path: "missingFields", label: "Missing Fields" },
    ],
  },
  "generate-pdf": {
    type: "generate-pdf", kind: "action", label: "Generate Document", icon: Printer,
    accent: "bg-indigo-500 text-white",
    fields: [
      { key: "type", label: "Document Type", placeholder: "quote, invoice, or otp", required: true },
    ],
    outputs: [
      { path: "html", label: "Document HTML" },
      { path: "title", label: "Document Title" },
    ],
  },
  "fill-finance-form": {
    type: "fill-finance-form", kind: "action", label: "Fill Finance Form", icon: Calculator,
    accent: "bg-cyan-500 text-white",
    fields: [
      { key: "firstName", label: "First Name", required: true },
      { key: "lastName", label: "Last Name", required: true },
      { key: "idNumber", label: "ID Number", required: true },
      { key: "phone", label: "Phone", required: true },
      { key: "vehiclePrice", label: "Vehicle Price", required: true },
    ],
    outputs: [
      { path: "formData", label: "Form Data (JSON)" },
      { path: "monthlyInstalment", label: "Monthly Instalment" },
      { path: "submitted", label: "Submitted" },
    ],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]["kind"] extends "action" ? K : never
}[NodeType]
