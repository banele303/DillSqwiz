import type { Stagehand } from "@browserbasehq/stagehand"

type Platform = "autotrader" | "cars_co_za" | "changecars" | "facebook"

type VehicleData = {
  stockNo: string
  make: string
  model: string
  variant?: string
  year: number
  odometer: number
  colour: string
  transmission: string
  fuelType: string
  bodyType?: string
  engineSize?: string
  doors?: number
  price: number
  features: string[]
  serviceHistory?: string
  warranty?: string
  registration?: string
  vin?: string
  images: string[]
  location?: string
  province?: string
  description?: string
}

type PlatformCredentials = {
  email: string
  password: string
}

// ── Platform-specific login & publish logic ──

async function publishToAutoTrader(
  stagehand: Stagehand,
  creds: PlatformCredentials,
  vehicle: VehicleData
) {
  const page = stagehand.context.pages()[0]

  // Navigate to AutoTrader SA dealer login
  await page.goto("https://www.autotrader.co.za/dealer/login", {
    waitUntil: "load",
    timeoutMs: 30_000,
  })

  // Login
  await stagehand.act(`Type "${creds.email}" into the email field`)
  await stagehand.act(`Type "${creds.password}" into the password field`)
  await stagehand.act("Click the sign in button")
  await page.waitForTimeout(3000)

  // Navigate to add listing
  await stagehand.act('Click "Add Listing" or "New Listing" button')

  // Fill vehicle details
  await stagehand.act(`Set make to "${vehicle.make}"`)
  await stagehand.act(`Set model to "${vehicle.model}"`)
  if (vehicle.variant) {
    await stagehand.act(`Set variant to "${vehicle.variant}"`)
  }
  await stagehand.act(`Set year to ${vehicle.year}`)
  await stagehand.act(`Set odometer to ${vehicle.odometer} km`)
  await stagehand.act(`Set colour to "${vehicle.colour}"`)
  await stagehand.act(`Set transmission to "${vehicle.transmission}"`)
  await stagehand.act(`Set fuel type to "${vehicle.fuelType}"`)
  await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
  await stagehand.act(`Set body type to "${vehicle.bodyType || "SUV"}"`)

  // Description
  const description =
    vehicle.description ||
    `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""} for sale.\nOdometer: ${vehicle.odometer.toLocaleString()} km\nColour: ${vehicle.colour}\nTransmission: ${vehicle.transmission}\nFuel: ${vehicle.fuelType}\n\nFeatures:\n${vehicle.features.map((f) => `• ${f}`).join("\n")}`
  await stagehand.act(`Fill in description with: ${description.substring(0, 500)}`)

  // Upload images
  if (vehicle.images.length > 0) {
    await stagehand.act("Click the upload photos button")
    // Stagehand handles file input via the OS file picker
    for (const image of vehicle.images.slice(0, 20)) {
      await stagehand.act(`Select file: ${image}`)
    }
  }

  // Submit
  await stagehand.act("Click the submit or publish button")

  return { platform: "autotrader", status: "published" }
}

async function publishToCarsCoZa(
  stagehand: Stagehand,
  creds: PlatformCredentials,
  vehicle: VehicleData
) {
  const page = stagehand.context.pages()[0]

  // Navigate to Cars.co.za dealer portal
  await page.goto("https://www.cars.co.za/dealer/", {
    waitUntil: "load",
    timeoutMs: 30_000,
  })

  // Login
  await stagehand.act(`Type "${creds.email}" into the email or username field`)
  await stagehand.act(`Type "${creds.password}" into the password field`)
  await stagehand.act("Click the login or sign in button")
  await page.waitForTimeout(3000)

  // Navigate to add stock
  await stagehand.act('Click "Add Vehicle" or "Add Stock" button')

  // Fill details
  await stagehand.act(`Set stock number to "${vehicle.stockNo}"`)
  await stagehand.act(`Set make to "${vehicle.make}"`)
  await stagehand.act(`Set model to "${vehicle.model}"`)
  await stagehand.act(`Set year to ${vehicle.year}`)
  await stagehand.act(`Set odometer to ${vehicle.odometer} km`)
  await stagehand.act(`Set colour to "${vehicle.colour}"`)
  await stagehand.act(`Set transmission to "${vehicle.transmission}"`)
  await stagehand.act(`Set fuel type to "${vehicle.fuelType}"`)
  await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
  if (vehicle.vin) {
    await stagehand.act(`Set VIN to "${vehicle.vin}"`)
  }

  // Submit
  await stagehand.act("Click save or publish")

  return { platform: "cars_co_za", status: "published" }
}

async function publishToChangecars(
  stagehand: Stagehand,
  creds: PlatformCredentials,
  vehicle: VehicleData
) {
  const page = stagehand.context.pages()[0]

  await page.goto("https://www.changecars.co.za/login", {
    waitUntil: "load",
    timeoutMs: 30_000,
  })

  // Login
  await stagehand.act(`Type "${creds.email}" into the email field`)
  await stagehand.act(`Type "${creds.password}" into the password field`)
  await stagehand.act("Click the login button")
  await page.waitForTimeout(3000)

  // Add listing
  await stagehand.act('Click "Add Listing" or "Sell Car"')
  await stagehand.act(`Set make to "${vehicle.make}"`)
  await stagehand.act(`Set model to "${vehicle.model}"`)
  await stagehand.act(`Set year to ${vehicle.year}`)
  await stagehand.act(`Set odometer to ${vehicle.odometer} km`)
  await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
  await stagehand.act("Click submit or publish")

  return { platform: "changecars", status: "published" }
}

async function publishToFacebook(
  stagehand: Stagehand,
  creds: PlatformCredentials,
  vehicle: VehicleData
) {
  const page = stagehand.context.pages()[0]

  // Navigate to Facebook Marketplace
  await page.goto("https://www.facebook.com/marketplace", {
    waitUntil: "load",
    timeoutMs: 30_000,
  })

  // Check if logged in, if not, login
  const currentUrl = page.url()
  if (currentUrl.includes("login")) {
    await stagehand.act(`Type "${creds.email}" into the email field`)
    await stagehand.act(`Type "${creds.password}" into the password field`)
    await stagehand.act("Click the log in button")
    await page.waitForTimeout(5000)
    await page.goto("https://www.facebook.com/marketplace", {
      waitUntil: "load",
      timeoutMs: 30_000,
    })
  }

  // Create new listing
  await stagehand.act('Click "Create New Listing" button')

  // Vehicle listing form
  await stagehand.act('Select "Vehicle" as the listing category')
  await stagehand.act(`Set make to "${vehicle.make}"`)
  await stagehand.act(`Set model to "${vehicle.model}"`)
  await stagehand.act(`Set year to ${vehicle.year}`)
  await stagehand.act(`Set odometer to ${vehicle.odometer} km`)
  await stagehand.act(`Set fuel type to "${vehicle.fuelType}"`)
  await stagehand.act(`Set transmission to "${vehicle.transmission}"`)
  await stagehand.act(`Set colour to "${vehicle.colour}"`)
  await stagehand.act(`Set price to R ${vehicle.price.toLocaleString()}`)
  await stagehand.act(`Set location to "${vehicle.location || "Johannesburg, Gauteng"}"`)

  // Description
  const fbDescription = `🚗 ${vehicle.year} ${vehicle.make} ${vehicle.model}\n📍 ${vehicle.location || "Johannesburg"}\n💰 R ${vehicle.price.toLocaleString()}\n📏 ${vehicle.odometer.toLocaleString()} km\n⛽ ${vehicle.fuelType}\n⚙ ${vehicle.transmission}\n\nFeatures:\n${vehicle.features.map((f) => `✅ ${f}`).join("\n")}`
  await stagehand.act(`Type in the description: ${fbDescription.substring(0, 1000)}`)

  // Photos
  if (vehicle.images.length > 0) {
    await stagehand.act("Click add photos and select the first photo")
  }

  // Publish
  await stagehand.act('Click "Publish" or "Next" button')

  return { platform: "facebook", status: "published" }
}

// ── Main publish function ──

const platformPublishers: Record<
  Platform,
  (s: Stagehand, c: PlatformCredentials, v: VehicleData) => Promise<{ platform: string; status: string }>
> = {
  autotrader: publishToAutoTrader,
  cars_co_za: publishToCarsCoZa,
  changecars: publishToChangecars,
  facebook: publishToFacebook,
}

export async function publishToPlatforms({
  stagehand,
  vehicle,
  credentials,
  platforms,
}: {
  stagehand: Stagehand
  vehicle: VehicleData
  credentials: Record<Platform, PlatformCredentials>
  platforms: Platform[]
}) {
  const results: Array<{ platform: string; status: string; error?: string }> = []

  for (const platform of platforms) {
    const creds = credentials[platform]
    if (!creds) {
      results.push({ platform, status: "skipped", error: "No credentials" })
      continue
    }

    try {
      const publisher = platformPublishers[platform]
      const result = await publisher(stagehand, creds, vehicle)
      results.push(result)
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
