import type { Edge } from "@xyflow/react"
import { jsonb, pgTable, text, timestamp, uuid, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core"

import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

// ──────────────────────────────────────────────
// Existing workflow schema (unchanged)
// ──────────────────────────────────────────────

export type WorkflowGraph = { nodes: StepNodeType[]; edges: Edge[] }

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  graph: jsonb("graph").$type<WorkflowGraph>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Workflow = typeof workflows.$inferSelect

// ──────────────────────────────────────────────
// Car Dealership Schema
// ──────────────────────────────────────────────

export const vehicleStatus = pgEnum("vehicle_status", [
  "in_stock",
  "sold",
  "reserved",
  "pending_listing",
  "listed",
])

export const transmissionType = pgEnum("transmission_type", [
  "automatic",
  "manual",
])

export const fuelType = pgEnum("fuel_type", [
  "petrol",
  "diesel",
  "electric",
  "hybrid",
])

export const bodyType = pgEnum("body_type", [
  "sedan",
  "suv",
  "hatchback",
  "bakkie",
  "coupe",
  "convertible",
  "wagon",
  "mpv",
  "van",
])

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "test_drive",
  "negotiating",
  "finance_pending",
  "sold",
  "lost",
])

export const financeAppStatus = pgEnum("finance_app_status", [
  "draft",
  "pending_review",
  "submitted",
  "approved",
  "declined",
  "cancelled",
])

export const creditProvider = pgEnum("credit_provider", [
  "wesbank",
  "absa",
  "mfc",
  "standard_bank",
  "nedbank",
  "sa_vehicle_finance",
  "other",
])

// ── Vehicles / Inventory ──
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  // Core details
  stockNo: text("stock_no").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant"),
  year: integer("year").notNull(),
  odometer: integer("odometer").notNull(),
  colour: text("colour").notNull(),
  transmission: transmissionType("transmission").notNull().default("automatic"),
  fuelType: fuelType("fuel_type").notNull().default("petrol"),
  bodyType: bodyType("body_type").default("suv"),
  engineSize: text("engine_size"),
  doors: integer("doors"),
  // Pricing
  price: integer("price").notNull(),
  costPrice: integer("cost_price"),
  // Status
  status: vehicleStatus("status").notNull().default("in_stock"),
  // Features
  features: jsonb("features").$type<string[]>().default([]),
  serviceHistory: text("service_history"),
  warranty: text("warranty"),
  servicePlan: text("service_plan"),
  registration: text("registration"),
  vin: text("vin").unique(),
  // Media
  images: jsonb("images").$type<string[]>().default([]),
  // Location
  location: text("location"),
  province: text("province"),
  // Platform listing status
  listedOnAutotrader: boolean("listed_on_autotrader").default(false),
  listedOnCarsCoZa: boolean("listed_on_cars_co_za").default(false),
  listedOnChangecars: boolean("listed_on_changecars").default(false),
  listedOnFacebook: boolean("listed_on_facebook").default(false),
  listedOnWebsite: boolean("listed_on_website").default(false),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert

// ── Platform Credentials (encrypted vault for dealer logins) ──
export const platformCredentials = pgTable("platform_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  platform: text("platform").notNull(), // 'autotrader' | 'cars_co_za' | 'changecars' | 'facebook'
  label: text("label"), // e.g. "Main AutoTrader Account"
  email: text("email").notNull(),
  // Encrypted at rest — we store an encrypted blob
  encryptedPassword: text("encrypted_password").notNull(),
  // Cookie session data for re-use (encrypted)
  encryptedSession: text("encrypted_session"),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type PlatformCredential = typeof platformCredentials.$inferSelect

// ── Leads ──
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  phone: text("phone").notNull(),
  email: text("email"),
  // Interest
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  interestedIn: text("interested_in"), // free text if no specific vehicle
  budget: integer("budget"),
  // Source
  source: text("source").default("direct"), // 'whatsapp' | 'telegram' | 'website' | 'facebook' | 'referral'
  // Status
  status: leadStatus("status").notNull().default("new"),
  // Notes
  notes: text("notes"),
  // WhatsApp thread ID for Sent.dm
  whatsappThreadId: text("whatsapp_thread_id"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Lead = typeof leads.$inferSelect

// ── Finance Applications ──
export const financeApplications = pgTable("finance_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  leadId: uuid("lead_id").references(() => leads.id),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),

  // Status
  status: financeAppStatus("status").notNull().default("draft"),

  // Applicant
  title: text("title"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  idNumber: text("id_number").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  maritalStatus: text("marital_status"),
  dependants: integer("dependants").default(0),

  // Employment
  employer: text("employer"),
  position: text("position"),
  employmentType: text("employment_type"), // 'permanent' | 'contract' | 'self_employed'
  employedSince: text("employed_since"),
  workPhone: text("work_phone"),

  // Income
  grossMonthlyIncome: integer("gross_monthly_income"),
  netMonthlyIncome: integer("net_monthly_income"),
  otherIncome: integer("other_income"),
  totalHouseholdIncome: integer("total_household_income"),

  // Expenses
  rentBond: integer("rent_bond"),
  livingExpenses: integer("living_expenses"),
  transport: integer("transport"),
  otherLoans: integer("other_loans"),
  totalMonthlyExpenses: integer("total_monthly_expenses"),

  // Vehicle finance
  creditProvider: creditProvider("credit_provider").default("wesbank"),
  vehiclePrice: integer("vehicle_price").notNull(),
  deposit: integer("deposit").default(0),
  tradeInValue: integer("trade_in_value"),
  termMonths: integer("term_months").default(72),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  residualValue: integer("residual_value"),
  monthlyInstalment: integer("monthly_instalment"),

  // Banking
  bankName: text("bank_name"),
  branchCode: text("branch_code"),
  accountNumber: text("account_number"),
  accountType: text("account_type"),

  // Documents
  documents: jsonb("documents").$type<string[]>().default([]),

  // Spouse (optional)
  spouseName: text("spouse_name"),
  spouseIdNumber: text("spouse_id_number"),
  spouseIncome: integer("spouse_income"),

  // Raw extracted data (the WhatsApp/Telegram text that was parsed)
  rawInput: text("raw_input"),

  // Review
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  declineReason: text("decline_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type FinanceApplication = typeof financeApplications.$inferSelect

// ── Dealership Profile ──
export const dealerships = pgTable("dealerships", {
  // One per orgId — linked to Clerk org
  orgId: text("org_id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logo: text("logo"), // URL to logo image
  // Sent.dm WhatsApp number
  whatsappNumber: text("whatsapp_number"),
  sentDmApiKey: text("sent_dm_api_key"), // encrypted
  // Bank email for finance submissions
  financeEmail: text("finance_email"),
  // Default bank
  defaultCreditProvider: creditProvider("default_credit_provider").default("wesbank"),
  // Branding
  primaryColour: text("primary_colour").default("#000000"),
  // Settings
  autoPublishEnabled: boolean("auto_publish_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Dealership = typeof dealerships.$inferSelect

// ── Blog Posts (SEO) ──
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: text("category").notNull(), // 'buying_guide' | 'brand_spotlight' | 'maintenance' | 'industry_news' | 'dealership_focused' | 'lifestyle'
  tags: jsonb("tags").$type<string[]>().default([]),
  metaDescription: text("meta_description"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  author: text("author"),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type BlogPost = typeof blogPosts.$inferSelect
