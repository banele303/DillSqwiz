"use client";


import { useActionState, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Download } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

async function importVehiclesAction(
  _prev: { error?: string; count?: number } | null,
  formData: FormData
): Promise<{ error?: string; count?: number } | null> {
  "use server"

  const { auth } = await import("@clerk/nextjs/server")
  const { orgId } = await auth()
  if (!orgId) return { error: "Not authenticated" }

  const csvData = formData.get("csv") as string
  if (!csvData) return { error: "No CSV data provided" }

  const { db } = await import("@/lib/db")
  const { vehicles } = await import("@/lib/db/schema")

  try {
    // Parse CSV (simple format: stockNo,make,model,year,odometer,colour,price,transmission,fuelType)
    const lines = csvData.trim().split("\n")
    const header = lines[0].split(",")
    
    const results: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim())
      if (vals.length < 7) continue

      results.push({
        orgId,
        stockNo: vals[0],
        make: vals[1],
        model: vals[2],
        year: parseInt(vals[3]) || 2024,
        odometer: parseInt(vals[4]) || 0,
        colour: vals[5] || "Unknown",
        price: parseInt(vals[6]) || 0,
        transmission: (vals[7]?.toLowerCase() as any) || "automatic",
        fuelType: (vals[8]?.toLowerCase() as any) || "petrol",
        status: "in_stock",
      })
    }

    if (results.length === 0) return { error: "No valid rows found" }

    await db.insert(vehicles).values(results)

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/inventory")
    return { count: results.length }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import failed" }
  }
}

const CSV_TEMPLATE = `stockNo,make,model,year,odometer,colour,price,transmission,fuelType
ST24001,Toyota,Fortuner 2.8 GD-6,2024,15000,White,689000,automatic,diesel
ST24002,BMW,X3 xDrive20d,2023,28000,Black,599000,automatic,diesel`

export default function ImportPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(importVehiclesAction, null)

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center gap-4 border-b border-white/[0.08] px-6 py-4">
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-white">Import Vehicles</h1>
          <p className="text-sm text-white/60">Bulk import from CSV</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto space-y-6">
        {state?.count ? (
          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-400">Import Successful</CardTitle>
              <CardDescription className="text-green-400/60">
                {state.count} vehicles imported
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
                <Link href="/dashboard/inventory">View Inventory</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-white/[0.03] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white text-base">CSV Template</CardTitle>
                <CardDescription className="text-white/60">
                  Paste CSV data below. First row must be headers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.08] p-4 mb-4">
                  <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap">{CSV_TEMPLATE}</pre>
                </div>
                <Button
                  variant="outline"
                  className="border-white/[0.08] text-white hover:bg-white/[0.05]"
                  onClick={() => {
                    navigator.clipboard.writeText(CSV_TEMPLATE)
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Copy Template
                </Button>
              </CardContent>
            </Card>

            <form action={formAction} className="space-y-4">
              <Card className="bg-white/[0.03] border-white/[0.08]">
                <CardHeader>
                  <CardTitle className="text-white text-base">Paste CSV Data</CardTitle>
                  <CardDescription className="text-white/60">
                    Columns: stockNo, make, model, year, odometer, colour, price, transmission, fuelType
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    name="csv"
                    rows={12}
                    placeholder={CSV_TEMPLATE}
                    className="font-mono text-sm bg-white/[0.05] border-white/[0.08] text-white"
                    required
                  />

                  {state?.error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {state.error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.05]" asChild>
                      <Link href="/dashboard/inventory">Cancel</Link>
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      {isPending ? "Importing..." : "Import Vehicles"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
