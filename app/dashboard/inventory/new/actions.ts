"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"

export async function addVehicleAction(formData: FormData) {
  const { orgId } = await auth()
  if (!orgId) throw new Error("Not authenticated")

  const featuresRaw = formData.get("features") as string
  const imagesRaw = formData.get("images") as string

  await db.insert(vehicles).values({
    orgId,
    stockNo: (formData.get("stockNo") as string) || "",
    make: (formData.get("make") as string) || "",
    model: (formData.get("model") as string) || "",
    variant: (formData.get("variant") as string) || null,
    year: parseInt((formData.get("year") as string) || "2024"),
    odometer: parseInt((formData.get("odometer") as string) || "0"),
    colour: (formData.get("colour") as string) || "",
    transmission: ((formData.get("transmission") as string) || "automatic") as any,
    fuelType: ((formData.get("fuelType") as string) || "petrol") as any,
    bodyType: ((formData.get("bodyType") as string) || "suv") as any,
    engineSize: (formData.get("engineSize") as string) || null,
    doors: parseInt((formData.get("doors") as string) || "0") || null,
    price: parseInt((formData.get("price") as string) || "0"),
    status: "in_stock",
    features: featuresRaw ? featuresRaw.split("\n").filter(Boolean) : [],
    images: imagesRaw ? imagesRaw.split("\n").filter(Boolean) : [],
    location: (formData.get("location") as string) || null,
    serviceHistory: (formData.get("serviceHistory") as string) || null,
    warranty: (formData.get("warranty") as string) || null,
    registration: (formData.get("registration") as string) || null,
    vin: (formData.get("vin") as string) || null,
  } as any)

  revalidatePath("/dashboard/inventory")
  redirect("/dashboard/inventory")
}
