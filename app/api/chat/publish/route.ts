// Executes the actual vehicle publishing — saves to DB, triggers Stagehand
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vehicle = await request.json()

  try {
    // 1. Save vehicle to database
    const [saved] = await db
      .insert(vehicles)
      .values({
        orgId,
        stockNo: vehicle.stockNo || `ST${Date.now().toString(36).toUpperCase()}`,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant || null,
        year: vehicle.year,
        odometer: vehicle.odometer || 0,
        colour: vehicle.colour || "Not specified",
        transmission: vehicle.transmission || "automatic",
        fuelType: vehicle.fuelType || "petrol",
        price: vehicle.price,
        features: vehicle.features || [],
        images: vehicle.images || [],
        location: vehicle.location || null,
        status: "in_stock",
      })
      .returning()

    // 2. Attempt Stagehand publishing to platforms
    const results: Array<{ platform: string; status: string; error?: string }> = []

    // Try browser automation
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY
    const publishEnabled = !!browserbaseApiKey && process.env.NODE_ENV !== "development"

    if (publishEnabled) {
      try {
        const { Stagehand } = await import("@browserbasehq/stagehand")
        const stagehand = new Stagehand({
          env: "BROWSERBASE",
          apiKey: browserbaseApiKey,
          model: "google/gemini-2.5-flash",
          disablePino: true,
        })
        await stagehand.init()

        const { publishToPlatforms } = await import(
          "@/features/workflows/nodes/publish-to-platform"
        )

        const result = await publishToPlatforms({
          orgId,
          stockNo: saved.stockNo,
          stagehand,
          platforms: ["cars_co_za", "autotrader"],
        })

        results.push(...result.results)
        await stagehand.close()
      } catch (err) {
        // Browser automation failed — mark as manual
        results.push(
          { platform: "cars.co.za", status: "pending", error: String(err) },
          { platform: "autotrader.co.za", status: "pending", error: String(err) }
        )
      }
    } else {
      // Dev mode — no browser automation, just mark as saved
      results.push(
        { platform: "cars.co.za", status: "saved", error: "Dev mode — manual publish needed" },
        { platform: "autotrader.co.za", status: "saved", error: "Dev mode — manual publish needed" },
        { platform: "your-website", status: "saved", error: "Dev mode" }
      )
    }

    return NextResponse.json({
      vehicle: {
        make: saved.make,
        model: saved.model,
        year: saved.year,
        colour: saved.colour,
        odometer: saved.odometer,
        price: saved.price,
        stockNo: saved.stockNo,
      },
      results,
      saved: true,
      stockNo: saved.stockNo,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to save vehicle",
      results: [],
    }, { status: 500 })
  }
}
