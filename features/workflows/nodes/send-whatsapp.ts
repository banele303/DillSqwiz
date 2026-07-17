// Send WhatsApp message via Sent.dm unified messaging API (v3)
// Docs: https://docs.sent.dm

const SENT_DM_API_BASE = process.env.SENT_DM_BASE_URL || "https://api.sent.dm"

export async function sendWhatsApp({
  to,
  message,
  apiKey,
}: {
  to: string
  message: string
  apiKey: string
}) {
  // Format phone number to E.164
  let formattedTo = to.trim()
  if (!formattedTo.startsWith("+")) {
    if (formattedTo.startsWith("0")) {
      formattedTo = "+27" + formattedTo.substring(1)
    } else {
      formattedTo = "+" + formattedTo
    }
  }

  const response = await fetch(`${SENT_DM_API_BASE}/v3/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      to: [formattedTo],
      channel: ["whatsapp"],
      text: message,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sent.dm v3 error: ${response.status} — ${errorText}`)
  }

  const data = await response.json()
  const successData = data.data || {}
  const recipient = (successData.recipients || [])[0] || {}

  return {
    messageId: recipient.message_id || data.id,
    status: successData.status || "QUEUED",
    channel: recipient.channel || "whatsapp",
    to: recipient.to || formattedTo,
  }
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  parameters,
  apiKey,
}: {
  to: string
  templateName: string
  parameters: Record<string, string>
  apiKey: string
}) {
  let formattedTo = to.trim()
  if (!formattedTo.startsWith("+")) {
    if (formattedTo.startsWith("0")) {
      formattedTo = "+27" + formattedTo.substring(1)
    } else {
      formattedTo = "+" + formattedTo
    }
  }

  const response = await fetch(`${SENT_DM_API_BASE}/v3/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      to: [formattedTo],
      channel: ["whatsapp"],
      template: {
        name: templateName,
        parameters,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sent.dm v3 template error: ${response.status} — ${errorText}`)
  }

  const data = await response.json()
  const successData = data.data || {}
  const recipient = (successData.recipients || [])[0] || {}

  return { 
    messageId: recipient.message_id || data.id, 
    status: successData.status || "QUEUED" 
  }
}
