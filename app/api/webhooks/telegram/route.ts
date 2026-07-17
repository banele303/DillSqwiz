// Telegram Bot Webhook — receives messages and processes finance applications
// Set webhook URL: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/webhooks/telegram

import { NextRequest, NextResponse } from "next/server"
import {
  parseFinanceFromMessage,
  createDraftFinanceApp,
  buildFinanceSummary,
} from "@/lib/finance-handler"

type TelegramUpdate = {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number; first_name?: string; last_name?: string; username?: string }
    chat: { id: number; type: string }
    text?: string
    date: number
  }
}

const TELEGRAM_API = "https://api.telegram.org/bot"

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null
}

async function sendTelegramMessage(chatId: number, text: string, botToken: string) {
  await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  })
}

/**
 * POST /api/webhooks/telegram
 * Receives Telegram updates when someone messages the bot.
 */
export async function POST(request: NextRequest) {
  const botToken = getBotToken()
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 })
  }

  const update: TelegramUpdate = await request.json()

  // Only process text messages
  if (!update.message?.text) {
    return NextResponse.json({ ok: true })
  }

  const chatId = update.message.chat.id
  const text = update.message.text
  const senderName = update.message.from?.first_name || "User"

  // Handle commands
  if (text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      `👋 Hi ${senderName}! Send me a customer's financial info and I'll create a finance application.\n\nExample:\n\`\`\`\nName: Thabo Dlamini\nID: 8505285345089\nPhone: 0825551234\nVehicle Price: R 689000\nDeposit: R 70000\nEmployer: Standard Bank\nIncome: R 52000\n\`\`\``,
      botToken
    )
    return NextResponse.json({ ok: true })
  }

  // Check if it looks like financial info
  const hasFinanceKeywords = /\b(?:name|id|price|deposit|income|employer|salary|phone|vehicle)\b/i.test(text)

  if (!hasFinanceKeywords) {
    await sendTelegramMessage(
      chatId,
      "Not sure what to do with that. Send financial info or type /help",
      botToken
    )
    return NextResponse.json({ ok: true })
  }

  // Parse the finance info
  const llmKey = process.env.LLM_API_KEY
  const parsed = await parseFinanceFromMessage(text, llmKey)

  // Need an org — for Telegram we associate by chat ID
  // In production, link Telegram chat IDs to dealership orgs
  // For now, use the chat ID as a placeholder
  const orgId = `telegram:${chatId}`

  // Create draft finance app
  try {
    const app = await createDraftFinanceApp(orgId, parsed)

    const summary = buildFinanceSummary(parsed)
    await sendTelegramMessage(
      chatId,
      `✅ *Finance Application Created!*\nID: ${app.id.slice(0, 8)}...\n\n${summary}`,
      botToken
    )
  } catch (error) {
    await sendTelegramMessage(
      chatId,
      `❌ Failed to create application: ${error instanceof Error ? error.message : "Unknown error"}`,
      botToken
    )
  }

  return NextResponse.json({ ok: true })
}
