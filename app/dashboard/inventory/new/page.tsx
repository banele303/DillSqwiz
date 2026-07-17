"use client";


import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

// Server action to add a vehicle
async function addVehicleAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  "use server"

  const { auth } = await import("@clerk/nextjs/server")
  const { orgId } = await auth()
  if (!orgId) return { error: "Not authenticated" }

  const { db } = await import("@/lib/db")
  const { vehicles } = await import("@/lib/db/schema")

  try {
    const featuresRaw = formData.get("features") as string
    const imagesRaw = formData.get("images") as string

    await db.insert(vehicles).values({
      orgId,
      stockNo: formData.get("stockNo") as string,
      make: formData.get("make") as string,
      model: formData.get("model") as string,
      variant: formData.get("variant") as string || null,
      year: parseInt(formData.get("year") as string),
      odometer: parseInt(formData.get("odometer") as string),
      colour: formData.get("colour") as string,
      transmission: (formData.get("transmission") as "automatic" | "manual") || "automatic",
      fuelType: (formData.get("fuelType") as "petrol" | "diesel" | "electric" | "hybrid") || "petrol",
      bodyType: (formData.get("bodyType") as "sedan" | "suv" | "hatchback" | "bakkie" | string) || "suv",
      engineSize: formData.get("engineSize") as string || null,
      doors: parseInt(formData.get("doors") as string) || null,
      price: parseInt(formData.get("price") as string),
      status: "in_stock",
      features: featuresRaw ? featuresRaw.split("\n").map((f: string) => f.trim()).filter(Boolean) : [],
      images: imagesRaw ? imagesRaw.split("\n").map((i: string) => i.trim()).filter(Boolean) : [],
      location: formData.get("location") as string || null,
      province: formData.get("province") as string || null,
      description: formData.get("description") as string || null,
      vin: formData.get("vin") as string || null,
      registration: formData.get("registration") as string || null,
      serviceHistory: formData.get("serviceHistory") as string || null,
      warranty: formData.get("warranty") as string || null,
    } as any)

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to add vehicle" }
  }
}

export default function AddVehiclePage() {
  const router = useRouter()
  const [state, setState] = useState<{ error?: string; success?: boolean } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      router.push("/inventory")
    }
  }, [state, router])

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center gap-4 border-b border-white/[0.08] px-6 py-4">
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-white">Add Vehicle</h1>
          <p className="text-sm text-white/60">Add a new vehicle to inventory</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          {state?.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          {/* Basic Details */}
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white text-base">Basic Details</CardTitle>
              <CardDescription className="text-white/60">Vehicle identification and specs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockNo" className="text-white/80 text-xs">Stock No *</Label>
                  <Input id="stockNo" name="stockNo" required placeholder="ST24001" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-white/80 text-xs">VIN</Label>
                  <Input id="vin" name="vin" placeholder="AHTFB3CD309123456" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration" className="text-white/80 text-xs">Registration</Label>
                  <Input id="registration" name="registration" placeholder="CF 123-45" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make" className="text-white/80 text-xs">Make *</Label>
                  <Input id="make" name="make" required placeholder="Toyota" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-white/80 text-xs">Model *</Label>
                  <Input id="model" name="model" required placeholder="Fortuner" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant" className="text-white/80 text-xs">Variant</Label>
                  <Input id="variant" name="variant" placeholder="2.8 GD-6 4x4" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-white/80 text-xs">Year *</Label>
                  <Input id="year" name="year" type="number" required placeholder="2024" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer" className="text-white/80 text-xs">Odometer (km) *</Label>
                  <Input id="odometer" name="odometer" type="number" required placeholder="15000" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colour" className="text-white/80 text-xs">Colour *</Label>
                  <Input id="colour" name="colour" required placeholder="Glacier White" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white/80 text-xs">Price (R) *</Label>
                  <Input id="price" name="price" type="number" required placeholder="689000" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specs */}
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white text-base">Specifications</CardTitle>
              <CardDescription className="text-white/60">Technical details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transmission" className="text-white/80 text-xs">Transmission</Label>
                  <Select name="transmission" defaultValue="automatic">
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelType" className="text-white/80 text-xs">Fuel Type</Label>
                  <Select name="fuelType" defaultValue="petrol">
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType" className="text-white/80 text-xs">Body Type</Label>
                  <Select name="bodyType" defaultValue="suv">
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="hatchback">Hatchback</SelectItem>
                      <SelectItem value="bakkie">Bakkie</SelectItem>
                      <SelectItem value="coupe">Coupe</SelectItem>
                      <SelectItem value="convertible">Convertible</SelectItem>
                      <SelectItem value="wagon">Wagon</SelectItem>
                      <SelectItem value="mpv">MPV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doors" className="text-white/80 text-xs">Doors</Label>
                  <Input id="doors" name="doors" type="number" placeholder="5" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="engineSize" className="text-white/80 text-xs">Engine Size</Label>
                  <Input id="engineSize" name="engineSize" placeholder="2.8L" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white/80 text-xs">Location</Label>
                  <Input id="location" name="location" placeholder="Sandton, Johannesburg" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features & Images */}
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white text-base">Features & Media</CardTitle>
              <CardDescription className="text-white/60">List features and photo URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="features" className="text-white/80 text-xs">Features (one per line)</Label>
                <Textarea
                  id="features"
                  name="features"
                  placeholder="Leather seats&#10;Sunroof&#10;Navigation&#10;360° Camera"
                  className="min-h-[120px] bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="images" className="text-white/80 text-xs">Image URLs (one per line)</Label>
                <Textarea
                  id="images"
                  name="images"
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                  className="min-h-[80px] bg-white/[0.05] border-white/[0.08] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceHistory" className="text-white/80 text-xs">Service History</Label>
                  <Input id="serviceHistory" name="serviceHistory" placeholder="Full Service History" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty" className="text-white/80 text-xs">Warranty</Label>
                  <Input id="warranty" name="warranty" placeholder="3-year / 100,000 km" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.05]" asChild>
              <Link href="/dashboard/inventory">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-orange-500 text-white hover:bg-orange-600 min-w-[140px]"
            >
              {isPending ? "Adding..." : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
