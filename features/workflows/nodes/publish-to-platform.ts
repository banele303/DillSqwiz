import type { Stagehand } from "@browserbasehq/stagehand"
import { db } from "@/lib/db"
import { vehicles, platformCredentials } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

type Platform = "autotrader" | "cars_co_za" | "changecars" | "facebook"

type PlatformPublishResult = {
  platform: string
  status: "published" | "skipped" | "failed"
  error?: string
}

// ── Platform Login URLs ──
const PLATFORM_URLS: Record<Platform, string> = {
  autotrader: "https://www.autotrader.co.za/dealer/login",
  cars_co_za: "https://www.cars.co.za/dealer/",
  changecars: "https://www.changecars.co.za/login",
  facebook: "https://www.facebook.com/marketplace",
}

// ── Main publish function — called by the workflow executor ──
export async function publishToPlatforms({
  orgId,
  stockNo,
  stagehand,
  platforms,
  onProgress,
}: {
  orgId: string
  stockNo: string
  stagehand: Stagehand
  platforms: Platform[]
  onProgress?: (msg: string) => void
}): Promise<{
  results: PlatformPublishResult[]
  allPublished: boolean
  published: string[]
  failed: Array<{ platform: string; error?: string }>
}> {
  const results: PlatformPublishResult[] = []

  // ── 1. Load vehicle from DB ──
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.stockNo, stockNo)))

  if (!vehicle) {
    return {
      results: [{ platform: "all", status: "failed", error: `Vehicle ${stockNo} not found` }],
      allPublished: false,
      published: [],
      failed: [{ platform: "all", error: `Vehicle ${stockNo} not found` }],
    }
  }

  const vehicleData = {
    stockNo: vehicle.stockNo,
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant || undefined,
    year: vehicle.year,
    odometer: vehicle.odometer,
    colour: vehicle.colour,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    bodyType: vehicle.bodyType || undefined,
    engineSize: vehicle.engineSize || undefined,
    doors: vehicle.doors || undefined,
    price: vehicle.price,
    features: (vehicle.features as string[]) || [],
    serviceHistory: vehicle.serviceHistory || undefined,
    warranty: vehicle.warranty || undefined,
    registration: vehicle.registration || undefined,
    vin: vehicle.vin || undefined,
    images: (vehicle.images as string[]) || [],
    location: vehicle.location || undefined,
    province: vehicle.province || undefined,
  }

  // ── 2. For each platform, load credentials and publish ──
  for (const platform of platforms) {
    const [creds] = await db
      .select()
      .from(platformCredentials)
      .where(
        and(
          eq(platformCredentials.orgId, orgId),
          eq(platformCredentials.platform, platform),
          eq(platformCredentials.isActive, true)
        )
      )
      .limit(1)

    if (!creds) {
      results.push({ platform, status: "skipped", error: "No credentials configured" })
      continue
    }

    const progress = (msg: string) => onProgress?.(`[${platform}] ${msg}`)

    try {
      progress(`Logging into ${platform}...`)
      const publisher = platformPublishers[platform]
      await publisher(stagehand, {
        email: creds.email,
        password: creds.encryptedPassword,
      }, vehicleData, progress)

      // ── 5. Update vehicle listing status in DB ──
      const fieldMap: Record<Platform, any> = {
        autotrader: { listedOnAutotrader: true },
        cars_co_za: { listedOnCarsCoZa: true },
        changecars: { listedOnChangecars: true },
        facebook: { listedOnFacebook: true },
      }
      await db
        .update(vehicles)
        .set(fieldMap[platform])
        .where(eq(vehicles.id, vehicle.id))

      results.push({ platform, status: "published" })
      progress(`✅ Published successfully`)
    } catch (error) {
      results.push({
        platform,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    results,
    allPublished: results.every((r) => r.status === "published"),
    published: results.filter((r) => r.status === "published").map((r) => r.platform),
    failed: results.filter((r) => r.status === "failed").map((r) => ({ platform: r.platform, error: r.error })),
  }
}

// ── Platform-specific publishers ──
type Creds = { email: string; password: string }
type VData = ReturnType<typeof formatVehicle>
type ProgressFn = (msg: string) => void

function formatVehicle(v: any) {
  return {
    stockNo: v.stockNo,
    make: v.make,
    model: v.model,
    variant: v.variant,
    year: v.year,
    odometer: v.odometer,
    colour: v.colour,
    transmission: v.transmission,
    fuelType: v.fuelType,
    bodyType: v.bodyType,
    price: v.price,
    features: v.features,
    images: v.images,
    vin: v.vin,
    registration: v.registration,
    location: v.location,
  }
}

const platformPublishers: Record<Platform, (s: Stagehand, c: Creds, v: VData, p: ProgressFn) => Promise<void>> = {
  // ── AutoTrader SA ──
  autotrader: async (stagehand, creds, vehicle, progress) => {
    const page = stagehand.context.pages()[0]
    await page.goto(PLATFORM_URLS.autotrader, { waitUntil: "load", timeoutMs: 30000 })
    progress("Logging in...")
    await stagehand.act(`Type "${creds.email}" into the email field`)
    await stagehand.act(`Type "${creds.password}" into the password field`)
    await stagehand.act("Click the sign in button")
    await page.waitForTimeout(3000)
    progress("Adding listing...")
    await stagehand.act('Click "Add Listing" or "New Listing"')
    await stagehand.act(`Set make to "${vehicle.make}"`)
    await stagehand.act(`Set model to "${vehicle.model}"`)
    if (vehicle.variant) await stagehand.act(`Set variant to "${vehicle.variant}"`)
    await stagehand.act(`Set year to ${vehicle.year}`)
    await stagehand.act(`Set odometer to ${vehicle.odometer}`)
    await stagehand.act(`Set colour to "${vehicle.colour}"`)
    await stagehand.act(`Set transmission to "${vehicle.transmission}"`)
    await stagehand.act(`Set fuel type to "${vehicle.fuelType}"`)
    await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
    if (vehicle.images.length > 0) {
      progress("Uploading images...")
      for (const img of vehicle.images.slice(0, 20)) {
        await stagehand.act(`Upload image: ${img}`)
      }
    }
    progress("Submitting...")
    await stagehand.act("Click submit or publish")
  },

  // ── Cars.co.za ──
  cars_co_za: async (stagehand, creds, vehicle, progress) => {
    const page = stagehand.context.pages()[0]
    await page.goto(PLATFORM_URLS.cars_co_za, { waitUntil: "load", timeoutMs: 30000 })
    progress("Logging in...")
    await stagehand.act(`Type "${creds.email}" into the email or username field`)
    await stagehand.act(`Type "${creds.password}" into the password field`)
    await stagehand.act("Click the login or sign in button")
    await page.waitForTimeout(3000)
    progress("Adding vehicle...")
    await stagehand.act('Click "Add Vehicle" or "Add Stock"')
    await stagehand.act(`Set stock number to "${vehicle.stockNo}"`)
    await stagehand.act(`Set make to "${vehicle.make}"`)
    await stagehand.act(`Set model to "${vehicle.model}"`)
    await stagehand.act(`Set year to ${vehicle.year}`)
    await stagehand.act(`Set odometer to ${vehicle.odometer}`)
    await stagehand.act(`Set colour to "${vehicle.colour}"`)
    await stagehand.act(`Set transmission to "${vehicle.transmission}"`)
    await stagehand.act(`Set fuel type to "${vehicle.fuelType}"`)
    await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
    if (vehicle.vin) await stagehand.act(`Set VIN to "${vehicle.vin}"`)
    if (vehicle.images.length > 0) {
      progress("Uploading images...")
      for (const img of vehicle.images.slice(0, 30)) {
        await stagehand.act(`Upload photo: ${img}`)
      }
    }
    progress("Saving...")
    await stagehand.act("Click save or publish")
  },

  // ── CHANGECARS ──
  changecars: async (stagehand, creds, vehicle, progress) => {
    const page = stagehand.context.pages()[0]
    await page.goto(PLATFORM_URLS.changecars, { waitUntil: "load", timeoutMs: 30000 })
    progress("Logging in...")
    await stagehand.act(`Type "${creds.email}" into the email field`)
    await stagehand.act(`Type "${creds.password}" into the password field`)
    await stagehand.act("Click login")
    await page.waitForTimeout(3000)
    progress("Adding listing...")
    await stagehand.act('Click "Add Listing" or "Sell Car"')
    await stagehand.act(`Set make to "${vehicle.make}"`)
    await stagehand.act(`Set model to "${vehicle.model}"`)
    await stagehand.act(`Set year to ${vehicle.year}`)
    await stagehand.act(`Set odometer to ${vehicle.odometer}`)
    await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
    progress("Publishing...")
    await stagehand.act("Click submit or publish")
  },

  // ── Facebook Marketplace ──
  facebook: async (stagehand, creds, vehicle, progress) => {
    const page = stagehand.context.pages()[0]
    await page.goto(PLATFORM_URLS.facebook, { waitUntil: "load", timeoutMs: 30000 })
    if (page.url().includes("login")) {
      progress("Logging in...")
      await stagehand.act(`Type "${creds.email}" into the email field`)
      await stagehand.act(`Type "${creds.password}" into the password field`)
      await stagehand.act("Click log in")
      await page.waitForTimeout(5000)
      await page.goto(PLATFORM_URLS.facebook, { waitUntil: "load", timeoutMs: 30000 })
    }
    progress("Creating listing...")
    await stagehand.act('Click "Create New Listing"')
    await stagehand.act('Select "Vehicle" as category')
    await stagehand.act(`Set make to "${vehicle.make}"`)
    await stagehand.act(`Set model to "${vehicle.model}"`)
    await stagehand.act(`Set year to ${vehicle.year}`)
    await stagehand.act(`Set odometer to ${vehicle.odometer}`)
    await stagehand.act(`Set fuel type to "${vehicle.fuelType}"`)
    await stagehand.act(`Set transmission to "${vehicle.transmission}"`)
    await stagehand.act(`Set colour to "${vehicle.colour}"`)
    await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
    await stagehand.act(`Set location to "${vehicle.location || "Johannesburg, Gauteng"}"`)
    if (vehicle.images.length > 0) {
      progress("Adding photos...")
      await stagehand.act("Click add photos and select the first photo")
    }
    const desc = `${vehicle.year} ${vehicle.make} ${vehicle.model}\n💰 R ${vehicle.price.toLocaleString()}\n📏 ${vehicle.odometer} km\n⚙ ${vehicle.transmission}\n\nFeatures:\n${vehicle.features.map((f: string) => `✅ ${f}`).join("\n")}`
    await stagehand.act(`Type in the description: ${desc.substring(0, 1000)}`)
    progress("Publishing...")
    await stagehand.act('Click "Publish" or "Next"')
  },
}
