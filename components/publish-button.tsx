"use client"

import { useTransition } from "react"
import { RefreshCw, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { publishVehicleAction, type PublishResult } from "@/features/workflows/actions/publish-actions"
import { toast } from "sonner"

export function PublishButton({
  stockNo,
  platforms,
}: {
  stockNo: string
  platforms?: string[]
}) {
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    startTransition(async () => {
      toast.loading(`Publishing ${stockNo}...`, { id: `pub-${stockNo}` })
      try {
        const result: PublishResult = await publishVehicleAction(
          stockNo,
          platforms || ["autotrader", "cars_co_za", "changecars", "facebook"]
        )
        if (result.success) {
          toast.success(`Published ${stockNo} to ${result.platforms.length} platforms`, {
            id: `pub-${stockNo}`,
          })
        } else {
          toast.error(result.message, { id: `pub-${stockNo}` })
        }
      } catch (error) {
        toast.error(String(error), { id: `pub-${stockNo}` })
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handlePublish}
      disabled={isPending}
      className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
    >
      {isPending ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Globe className="h-3.5 w-3.5" />
      )}
      <span className="ml-1.5 text-xs">{isPending ? "..." : "Publish"}</span>
    </Button>
  )
}
