import { logger, task } from "@trigger.dev/sdk"
import { Stagehand } from "@browserbasehq/stagehand"
import { publishToPlatforms } from "@/features/workflows/nodes/publish-to-platform"

export const publishVehicleTask = task({
  id: "publish-vehicle",
  run: async ({
    orgId,
    stockNo,
    platforms,
  }: {
    orgId: string
    stockNo: string
    platforms: string[]
  }) => {
    logger.log(`Publishing ${stockNo} to ${platforms.join(", ")}`)

    // Open browser session
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY!,
      model: "google/gemini-2.5-flash",
      disablePino: true,
    })
    await stagehand.init()

    try {
      const result = await publishToPlatforms({
        orgId,
        stockNo,
        stagehand,
        platforms: platforms as any,
      })

      logger.log("Publish complete", {
        published: result.published,
        failed: result.failed,
      })

      return result
    } finally {
      await stagehand.close()
    }
  },
})
