// Discord Interactions Webhook — handles slash commands for finance apps
// Set up in Discord Developer Portal: Interactions Endpoint URL
// https://discord.com/developers/applications/<APP_ID>/information

import { NextRequest, NextResponse } from "next/server"
import {
  parseFinanceFromMessage,
  createDraftFinanceApp,
  buildFinanceSummary,
} from "@/lib/finance-handler"

type DiscordInteraction = {
  type: number
  token: string
  member?: { user?: { id: string; username: string } }
  channel_id?: string
  guild_id?: string
  data?: {
    name: string
    options?: Array<{ name: string; value: string }>
  }
}

/**
 * Verify Discord's request signature.
 * In production, verify the ed25519 signature using the public key.
 */
function verifyDiscordRequest(signature: string | null, timestamp: string | null, body: string): boolean {
  // For dev, skip verification. Production must verify.
  return true
}

/**
 * POST /api/webhooks/discord
 * Receives Discord slash command interactions.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature-ed25519")
  const timestamp = request.headers.get("x-signature-timestamp")
  const rawBody = await request.text()

  const interaction: DiscordInteraction = JSON.parse(rawBody)

  // ── PING (type 1) — respond with PONG ──
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 }) // PONG
  }

  // ── APPLICATION_COMMAND (type 2) ──
  if (interaction.type === 2) {
    const commandName = interaction.data?.name

    if (commandName === "finance" || commandName === "apply") {
      const options = interaction.data?.options || []
      const textOption = options.find((o) => o.name === "info" || o.name === "text")
      const text = textOption?.value || ""

      if (!text) {
        return NextResponse.json({
          type: 4,
          data: {
            content:
              "📋 **Usage:** `/finance info:Customer financial details`\n\nExample:\n```Name: Thabo Dlamini\nID: 8505285345089\nPhone: 0825551234\nPrice: R 689000\nDeposit: R 70000\nIncome: R 52000```",
          },
        })
      }

      // Parse and create (deferred response since parsing takes time)
      // First acknowledge
      const llmKey = process.env.LLM_API_KEY
      const parsed = await parseFinanceFromMessage(text, llmKey)
      const orgId = `discord:${interaction.guild_id || interaction.channel_id || "unknown"}`

      try {
        const app = await createDraftFinanceApp(orgId, parsed)
        const summary = buildFinanceSummary(parsed)

        return NextResponse.json({
          type: 4,
          data: {
            content: `✅ **Finance Application Created!**\nID: \`${app.id.slice(0, 8)}...\`\n\n${summary}`,
          },
        })
      } catch (error) {
        return NextResponse.json({
          type: 4,
          data: {
            content: `❌ Error: ${error instanceof Error ? error.message : "Unknown"}`,
          },
        })
      }
    }

    if (commandName === "help") {
      return NextResponse.json({
        type: 4,
        data: {
          content:
            "🤖 **DealX Bot Commands**\n\n" +
            "`/finance info:<text>` — Process a finance application\n" +
            "`/help` — Show this message\n\n" +
            "Send customer financial details and I'll create a draft finance app for review.",
        },
      })
    }

    return NextResponse.json({
      type: 4,
      data: { content: "Unknown command. Try `/help`" },
    })
  }

  return NextResponse.json({ type: 1 })
}

/**
 * GET — Register slash commands (run once on deploy)
 * Call this endpoint or run via CLI to register commands with Discord.
 */
export async function GET() {
  const appId = process.env.DISCORD_APP_ID
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!appId || !botToken) {
    return NextResponse.json(
      { error: "DISCORD_APP_ID and DISCORD_BOT_TOKEN required" },
      { status: 400 }
    )
  }

  const commands = [
    {
      name: "finance",
      description: "Process a vehicle finance application",
      options: [
        {
          name: "info",
          description: "Customer financial details (name, ID, income, vehicle, etc.)",
          type: 3, // STRING
          required: true,
        },
      ],
    },
    {
      name: "help",
      description: "Show available commands",
    },
  ]

  const response = await fetch(
    `https://discord.com/api/v10/applications/${appId}/commands`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify(commands),
    }
  )

  const data = await response.json()
  return NextResponse.json({ registered: response.ok, commands: data })
}
