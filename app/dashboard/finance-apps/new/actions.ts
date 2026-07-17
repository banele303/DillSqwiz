"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { financeApplications } from "@/lib/db/schema"

export async function createFinanceAppAction(
  _prev: any,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const { orgId } = await auth()
  if (!orgId) return { error: "Not authenticated" }

  try {
    await db.insert(financeApplications).values({
      orgId,
      status: "draft",
      title: (formData.get("title") as string) || null,
      firstName: (formData.get("firstName") as string) || "",
      lastName: (formData.get("lastName") as string) || "",
      idNumber: (formData.get("idNumber") as string) || "",
      phone: (formData.get("phone") as string) || "",
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      employer: (formData.get("employer") as string) || null,
      grossMonthlyIncome: parseInt((formData.get("grossMonthlyIncome") as string) || "0") || null,
      vehiclePrice: parseInt((formData.get("vehiclePrice") as string) || "0"),
      deposit: parseInt((formData.get("deposit") as string) || "0"),
      termMonths: parseInt((formData.get("termMonths") as string) || "72"),
      creditProvider: ((formData.get("creditProvider") as string) || "wesbank") as any,
    })

    revalidatePath("/dashboard/finance-apps")
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed" }
  }

  redirect("/dashboard/finance-apps")
}
