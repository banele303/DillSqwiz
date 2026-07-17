import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background gap-3">
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute size-12 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground tracking-wider animate-pulse">
        LOADING DATA...
      </p>
    </div>
  )
}
