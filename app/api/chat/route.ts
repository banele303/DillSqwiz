import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages } = await request.json()
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) return NextResponse.json({ error: "LLM_API_KEY not set" }, { status: 500 })

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You extract vehicle details from user messages. Return ONLY valid JSON with these fields:
{
  "make": "string (brand name)",
  "model": "string",
  "variant": "string or null",
  "year": number,
  "odometer": number (km),
  "colour": "string",
  "transmission": "automatic" or "manual",
  "fuelType": "petrol" or "diesel" or "electric" or "hybrid",
  "price": number (whole Rands),
  "stockNo": "string or null",
  "features": ["string"],
  "location": "string or null"
}

Use sensible defaults for missing fields (transmission=automatic, fuelType=petrol).
Return ONLY the JSON object, no markdown, no explanation.`,
        },
        { role: "user", content: messages?.[0]?.content || messages?.find?.((m: any) => m.role === "user")?.content || "" },
      ],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || "{}"
  
  try {
    const parsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "Failed to parse vehicle details", raw: text }, { status: 500 })
  }
}
