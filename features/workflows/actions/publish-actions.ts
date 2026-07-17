"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

export type PublishResult = {
  success: boolean
  platforms: string[]
  failed: Array<{ platform: string; error: string }>
  message: string
}

/**
 * Publish a vehicle to selected platforms via Stagehand browser automation.
 * This triggers a Trigger.dev task that runs the browser automation.
 */
export async function publishVehicleAction(
  stockNo: string,
  platforms: string[]
): Promise<PublishResult> {
  const { orgId } = await auth()
  if (!orgId) throw new Error("Not authenticated")

  Sentry.logger.info("Publishing vehicle", { stockNo, platforms, orgId })

  try {
    // Trigger the publish workflow via Trigger.dev
    const { tasks } = await import("@trigger.dev/sdk")
    const { publishVehicleTask } = await import("@/features/workflows/tasks/publish-vehicle")

    const handle = await tasks.trigger<typeof publishVehicleTask>(
      "publish-vehicle",
      { orgId, stockNo, platforms },
      { tags: [`publish:${stockNo}`] }
    )

    revalidatePath("/dashboard/inventory")

    return {
      success: true,
      platforms,
      failed: [],
      message: `Publishing ${stockNo} to ${platforms.join(", ")}... Check back for status.`,
    }
  } catch (error) {
    Sentry.logger.error("Publish failed", { stockNo, platforms, orgId, error })
    return {
      success: false,
      platforms: [],
      failed: [{ platform: "all", error: String(error) }],
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Mark a vehicle as listed on specific platforms (manual override).
 */
export async function markListedAction(
  stockNo: string,
  platforms: string[]
): Promise<void> {
  const { orgId } = await auth()
  if (!orgId) throw new Error("Not authenticated")

  const update: any = {}
  for (const p of platforms) {
    const fieldMap: Record<string, string> = {
      autotrader: "listedOnAutotrader",
      cars_co_za: "listedOnCarsCoZa",
      changecars: "listedOnChangecars",
      facebook: "listedOnFacebook",
    }
    const field = fieldMap[p]
    if (field) update[field] = true
  }

  await db
    .update(vehicles)
    .set(update)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.stockNo, stockNo)))

  revalidatePath("/dashboard/inventory")
}
