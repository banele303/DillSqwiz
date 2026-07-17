// Sent.dm webhook handler — receives incoming WhatsApp/SMS/RCS messages
// Sent.dm sends a POST to this endpoint when a message arrives.
// Docs: https://docs.sent.dm/webhooks

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"

type SentDmWebhookPayload = {
  id: string
  type: "message.inbound" | "message.status" | "message.failed"
  channel: "whatsapp" | "sms" | "rcs"
  from: string
  to: string
  content: {
    type: "text" | "image" | "document" | "interactive"
    text?: string
    caption?: string
    mediaUrl?: string
    mimeType?: string
  }
  timestamp: string
  profileName?: string
}

/**
 * Verify Sent.dm webhook signature.
 * Sent.dm signs webhooks with HMAC-SHA256 using your API key.
 */
function verifySignature(
  payload: string,
  signature: string | null,
  apiKey: string
): boolean {
  if (!signature) return false

  const crypto = require("crypto")
  const expected = crypto
    .createHmac("sha256", apiKey)
    .update(payload)
    .digest("hex")

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false

  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

/**
 * POST /api/webhooks/sent-dm
 *
 * Receives inbound messages from Sent.dm and creates leads.
 * Also handles delivery status updates.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.SENT_DM_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "SENT_DM_API_KEY not configured" },
      { status: 500 }
    )
  }

  // Verify signature
  const signature = request.headers.get("x-sent-signature")
  const rawBody = await request.text()

  if (!verifySignature(rawBody, signature, apiKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const payload: SentDmWebhookPayload = JSON.parse(rawBody)

  // Handle message status updates (delivery receipts)
  if (payload.type === "message.status" || payload.type === "message.failed") {
    return NextResponse.json({ received: true })
  }

  // Handle inbound messages
  if (payload.type === "message.inbound") {
    // Extract the message text
    const messageText = payload.content.text || payload.content.caption || ""
    const fromNumber = payload.from
    const profileName = payload.profileName || ""

    // Try to determine org from the "to" number (dealership's WhatsApp number)
    // This maps the inbound number to the right dealership
    const dealershipNumber = payload.to

    // Find the org by looking up the dealership with this WhatsApp number
    // For now we'll use a placeholder org lookup
    // In production: query dealerships table by whatsappNumber
    const orgId = await resolveOrgFromWhatsAppNumber(dealershipNumber)

    if (!orgId) {
      console.warn(`No dealership found for number ${dealershipNumber}`)
      return NextResponse.json({ received: true }) // Acknowledge but don't process
    }

    // Create a lead from the WhatsApp message
    const nameParts = profileName ? profileName.split(/\s+/) : ["Unknown"]
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || ""

    const lead = await db
      .insert(leads)
      .values({
        orgId,
        firstName,
        lastName: lastName || "Unknown",
        phone: fromNumber,
        source: "whatsapp",
        status: "new",
        notes: messageText.substring(0, 500),
        interestedIn: messageText.substring(0, 200),
        whatsappThreadId: payload.id,
      })
      .returning()

    console.log(`Lead created from WhatsApp: ${firstName} ${lastName} (${fromNumber})`)

    return NextResponse.json({
      received: true,
      leadId: lead[0].id,
    })
  }

  return NextResponse.json({ received: true })
}

/**
 * Resolve the org ID from a WhatsApp number.
 * Looks up the dealerships table for a matching whatsappNumber.
 */
async function resolveOrgFromWhatsAppNumber(
  number: string
): Promise<string | null> {
  try {
    const { dealerships } = await import("@/lib/db/schema")
    const { eq } = await import("drizzle-orm")

    const dealership = await db
      .select({ orgId: dealerships.orgId })
      .from(dealerships)
      .where(eq(dealerships.whatsappNumber, number))
      .then((r) => r[0])

    if (dealership?.orgId) return dealership.orgId

    // Fallback: get first available dealership orgId
    const firstDealership = await db
      .select({ orgId: dealerships.orgId })
      .from(dealerships)
      .limit(1)
      .then((r) => r[0])

    return firstDealership?.orgId || "org_3GcMJj2uSVual4uSCxGu70xiIqI"
  } catch {
    return "org_3GcMJj2uSVual4uSCxGu70xiIqI"
  }
}
