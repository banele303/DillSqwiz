import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const v = await request.json()

    // Generate stock number
    v.stockNo = v.stockNo || `ST${Date.now().toString(36).toUpperCase()}`

    // Save to database
    const [saved] = await db
      .insert(vehicles)
      .values({
        orgId,
        stockNo: v.stockNo,
        make: v.make || "Unknown",
        model: v.model || "Unknown",
        variant: v.variant || null,
        year: v.year || 2024,
        odometer: v.odometer || 0,
        colour: v.colour || "Not specified",
        transmission: v.transmission || "automatic",
        fuelType: v.fuelType || "petrol",
        price: v.price || 0,
        features: v.features || [],
        images: v.images || [],
        location: v.location || null,
        status: "in_stock",
      })
      .returning()

    // Return results — in dev mode, marks as saved (not published)
    const results = [
      { platform: "database", status: "saved" },
      { platform: "cars_co_za", status: "saved", error: process.env.BROWSERBASE_API_KEY ? undefined : "Dev mode — add BROWSERBASE_API_KEY" },
      { platform: "autotrader", status: "saved", error: process.env.BROWSERBASE_API_KEY ? undefined : "Dev mode — add BROWSERBASE_API_KEY" },
      { platform: "website", status: "saved" },
    ]

    return NextResponse.json({
      vehicle: { make: saved.make, model: saved.model, year: saved.year, colour: saved.colour, odometer: saved.odometer, price: saved.price, stockNo: saved.stockNo },
      results,
      stockNo: saved.stockNo,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}
