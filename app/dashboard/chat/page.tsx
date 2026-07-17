"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Globe, Car, ImageIcon, CheckCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "tool"; name: "publish_vehicle"; data: any; status: "running" | "done" | "failed" }

const QUICK_START = [
  "Publish: 2024 Toyota Fortuner 2.8 GD-6, White, 15000km, R689000, auto, diesel, ST24001",
  "List car: BMW X3 xDrive20d, 2023, Black, 28000km, R599000, ST24002",
  "Publish: Mercedes GLC 300d, 2024, Silver, 12000km, R849000, ST24003",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 I'm your DealX publishing agent. Describe the car you want to list and I'll publish it to Cars.co.za, AutoTrader, and more — instantly.\n\n Just tell me the details or paste them from your notes:",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text }
    setMessages((p) => [...p, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.role === "tool" ? JSON.stringify(m.data) : m.content })) }),
      })

      const data = await res.json()

      if (data.toolCall === "publish_vehicle" && data.data) {
        // Tool call — show publish card
        setMessages((p) => [...p, {
          role: "tool", name: "publish_vehicle", data: data.data, status: "running",
        }])
        // Execute publish
        try {
          const pubRes = await fetch("/api/chat/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.data),
          })
          const pubData = await pubRes.json()
          setMessages((p) => p.map((m) =>
            "status" in m ? { ...m, status: pubData.error ? "failed" as const : "done" as const, data: pubData } : m
          ))
        } catch {
          setMessages((p) => p.map((m) =>
            "status" in m ? { ...m, status: "failed" as const } : m
          ))
        }
      } else if (data.message) {
        setMessages((p) => [...p, { role: "assistant", content: data.message.content || "Done!" }])
      }
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "❌ Couldn't reach AI. Is DeepSeek running?" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full bg-[#0a0a0b]">
      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0a0a0b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">Publishing Agent</h1>
              <p className="text-xs text-white/40">Describe a car → AI lists it everywhere</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4" ref={scrollRef}>
            {messages.map((msg, i) => {
              if ("status" in msg) {
                // Tool card
                return (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-orange-500/20">
                      <Globe className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          msg.status === "running" ? "bg-orange-400 animate-pulse" :
                          msg.status === "done" ? "bg-emerald-400" : "bg-red-400"
                        )} />
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                          {msg.status === "running" ? "Publishing..." :
                           msg.status === "done" ? "Published ✓" : "Failed"}
                        </span>
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        {msg.data?.vehicle && (
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-16 h-12 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                              <Car className="h-5 w-5 text-white/30" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-white">
                                {msg.data.vehicle.make} {msg.data.vehicle.model}
                              </h3>
                              <p className="text-xs text-white/50 mt-0.5">
                                {msg.data.vehicle.year} · {msg.data.vehicle.colour} · {msg.data.vehicle.odometer?.toLocaleString()}km · R {msg.data.vehicle.price?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Platform status */}
                        {msg.data?.results && (
                          <div className="space-y-2">
                            {msg.data.results.map((r: any) => (
                              <div key={r.platform} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.04]">
                                <span className="text-sm text-white/70">{r.platform}</span>
                                <span className={cn(
                                  "text-xs font-medium",
                                  r.status === "published" ? "text-emerald-400" :
                                  r.status === "failed" ? "text-red-400" : "text-white/40"
                                )}>
                                  {r.status === "published" ? "✓ Published" :
                                   r.status === "failed" ? "✗ Failed" : "⏳ Pending"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.status === "failed" && msg.data?.error && (
                          <p className="text-xs text-red-400 mt-2">{msg.data.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              // Regular messages
              const isUser = msg.role === "user"
              return (
                <div key={i} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isUser ? "bg-white/[0.06] border border-white/[0.08]" : "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
                  )}>
                    {isUser ? (
                      <User className="h-3.5 w-3.5 text-white/40" />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isUser
                      ? "bg-white/[0.06] text-white/90 border border-white/[0.08]"
                      : "bg-white/[0.03] text-white/85 border border-white/[0.06]"
                  )}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                  <Globe className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-bounce [animation-delay:0.1s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick start */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 max-w-3xl mx-auto w-full">
            <p className="text-[11px] text-white/30 mb-2 uppercase tracking-wider font-medium">Quick publish</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_START.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.05] hover:border-orange-500/20 transition-all text-left max-w-[400px] truncate"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0a0a0b]">
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the car — make, model, year, colour, km, price..."
                className="flex-1 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-11 w-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shrink-0"
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
