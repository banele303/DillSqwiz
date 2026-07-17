"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"

export async function importVehiclesAction(formData: FormData) {
  const { orgId } = await auth()
  if (!orgId) throw new Error("Not authenticated")

  const csv = formData.get("csv") as string
  if (!csv) throw new Error("No CSV data")

  const lines = csv.trim().split("\n").filter(Boolean)
  if (lines.length < 2) throw new Error("Need header + at least 1 row")

  const results: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const v = lines[i].split(",").map((s) => s.trim())
    if (v.length < 7) continue
    results.push({
      orgId, stockNo: v[0], make: v[1], model: v[2],
      year: parseInt(v[3]) || 2024, odometer: parseInt(v[4]) || 0,
      colour: v[5], price: parseInt(v[6]) || 0,
      transmission: (v[7] as any) || "automatic",
      fuelType: (v[8] as any) || "petrol",
      status: "in_stock",
    })
  }
  if (!results.length) throw new Error("No valid rows")

  await db.insert(vehicles).values(results)
  revalidatePath("/dashboard/inventory")
  redirect("/dashboard/inventory")
}
