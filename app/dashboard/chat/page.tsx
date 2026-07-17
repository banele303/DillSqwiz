"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Globe, Car, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

type PublishStatus = "idle" | "parsing" | "saving" | "publishing_cars" | "publishing_autotrader" | "done" | "failed"

export default function ChatPage() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<PublishStatus>("idle")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [assistantMsg, setAssistantMsg] = useState(
    "👋 Describe the car you want to publish and I'll list it on Cars.co.za, AutoTrader, and your website.\n\nExample: *2024 Toyota Fortuner 2.8 GD-6, White, 15000km, R689000*"
  )

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setInput("")
    setLoading(true)
    setStatus("parsing")
    setResults([])
    setVehicle(null)
    setAssistantMsg("")

    try {
      // 1. AI extracts vehicle details
      const aiRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Extract vehicle details from the user's message. Return ONLY valid JSON with fields: make, model, variant, year, odometer, colour, transmission, fuelType, price, stockNo, features. If any field is missing, use null." },
            { role: "user", content: text },
          ],
        }),
      })

      if (!aiRes.ok) {
        setAssistantMsg("❌ Couldn't parse that. Try: *2024 Toyota Fortuner, White, 15000km, R689000*")
        setLoading(false)
        setStatus("idle")
        return
      }

      const aiData = await aiRes.json()
      let parsed = aiData.message?.content ? JSON.parse(aiData.message.content) : aiData

      // Fill missing fields
      if (!parsed.stockNo) parsed.stockNo = `ST${Date.now().toString(36).toUpperCase()}`
      if (!parsed.transmission) parsed.transmission = "automatic"
      if (!parsed.fuelType) parsed.fuelType = "petrol"
      if (!parsed.odometer) parsed.odometer = 0
      if (!parsed.colour) parsed.colour = "Not specified"

      setVehicle(parsed)
      setStatus("saving")
      setAssistantMsg(`📋 Got it — **${parsed.make} ${parsed.model}** (${parsed.year}, ${parsed.colour}, ${parsed.odometer?.toLocaleString()}km, R ${parsed.price?.toLocaleString()}). Publishing now...`)

      // 2. Save and publish
      const pubRes = await fetch("/api/chat/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })

      const pubData = await pubRes.json()
      setResults(pubData.results || [])
      setStatus(pubData.error ? "failed" : "done")

      if (pubData.error) {
        setAssistantMsg(`❌ ${pubData.error}`)
      } else {
        const pubCount = pubData.results?.filter((r: any) => r.status === "published").length || 0
        const failCount = pubData.results?.filter((r: any) => r.status === "failed").length || 0
        const savedCount = pubData.results?.filter((r: any) => r.status === "saved").length || 0

        let msg = `✅ **Published!** ${parsed.make} ${parsed.model} saved as **${parsed.stockNo}**.\n`
        if (pubCount > 0) msg += `\nAutomatically published to ${pubCount} platform(s).`
        if (savedCount > 0) msg += `\n📝 Saved to ${savedCount} platform(s) — manual publish needed.`
        if (failCount > 0) msg += `\n⚠️ ${failCount} platform(s) failed.`
        msg += `\n\n[View in Inventory →](/dashboard/inventory)`
        setAssistantMsg(msg)
      }
    } catch (err) {
      setStatus("failed")
      setAssistantMsg("❌ Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [assistantMsg, status])

  return (
    <div className="flex h-full bg-[#030712]">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#030712]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Globe className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white">Post a Car</h1>
              <p className="text-xs text-white/40">Describe a car → AI lists it everywhere</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Assistant message */}
            {assistantMsg && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <Globe className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl rounded-tl-sm px-4 py-3 text-sm text-white/85 whitespace-pre-wrap">
                  {assistantMsg}
                </div>
              </div>
            )}

            {/* Publish progress card */}
            {status !== "idle" && vehicle && (
              <div className="ml-11 border border-white/[0.08] bg-white/[0.02] rounded-xl overflow-hidden">
                {/* Vehicle summary */}
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <Car className="h-4 w-4 text-white/30" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-xs text-white/50">{vehicle.year} · {vehicle.colour} · {vehicle.odometer?.toLocaleString()}km · R {vehicle.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Platform results */}
                <div className="p-3 space-y-1">
                  {[
                    { id: "database", label: "Database", done: status !== "parsing" && status !== "idle" },
                    { id: "cars_co_za", label: "Cars.co.za", done: results.some(r => r.platform === "cars_co_za" && (r.status === "published" || r.status === "saved")) },
                    { id: "autotrader", label: "AutoTrader", done: results.some(r => r.platform === "autotrader" && (r.status === "published" || r.status === "saved")) },
                    { id: "website", label: "Website", done: results.some(r => r.platform === "website" || r.platform === "your-website") },
                  ].map((p) => {
                    const isRunning = !p.done && (status === "saving" || status === "publishing_cars" || status === "publishing_autotrader")
                    const isError = results.some(r => r.platform === p.id && r.status === "failed")
                    return (
                      <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03]">
                        <span className="text-sm text-white/70">{p.label}</span>
                        <span className={`text-xs font-medium ${
                          p.done ? "text-emerald-400" : isError ? "text-red-400" : isRunning ? "text-orange-400" : "text-white/30"
                        }`}>
                          {p.done ? "✓" : isError ? "✗" : isRunning ? "⟳" : "○"}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Overall status */}
                <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      status === "done" ? "bg-emerald-400" :
                      status === "failed" ? "bg-red-400" :
                      status === "parsing" ? "bg-orange-400 animate-pulse" :
                      "bg-orange-400 animate-pulse"
                    }`} />
                    <span className="text-xs text-white/50">
                      {status === "parsing" ? "Extracting vehicle details..." :
                       status === "saving" ? "Saving & publishing..." :
                       status === "done" ? "Complete" :
                       status === "failed" ? "Failed" : ""}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {!assistantMsg.includes("Published") && (
          <div className="px-6 pb-3 max-w-2xl mx-auto w-full">
            <div className="flex flex-wrap gap-1.5">
              {[
                "2024 Toyota Fortuner, White, 15000km, R689000",
                "2023 BMW X3 xDrive20d, Black, 28000km, R599000",
                "2024 Mercedes GLC 300d, Silver, 12000km, R849000",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#030712]">
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste car details here..."
                className="flex-1 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-lg text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-11 w-11 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
