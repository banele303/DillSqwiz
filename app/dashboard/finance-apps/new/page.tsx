"use client"

import { useActionState, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wand2, Eye } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Server action to create finance application
async function createFinanceAppAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  "use server"

  const { auth } = await import("@clerk/nextjs/server")
  const { orgId } = await auth()
  if (!orgId) return { error: "Not authenticated" }

  const { db } = await import("@/lib/db")
  const { financeApplications } = await import("@/lib/db/schema")

  try {
    const data: any = {
      orgId,
      status: "draft",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      idNumber: formData.get("idNumber") as string,
      phone: formData.get("phone") as string,
      vehiclePrice: parseInt(formData.get("vehiclePrice") as string),
      deposit: parseInt(formData.get("deposit") as string) || 0,
      termMonths: parseInt(formData.get("termMonths") as string) || 72,
      creditProvider: (formData.get("creditProvider") as string) || "wesbank",
    }

    // Optional fields
    const optional = [
      "title", "email", "address", "maritalStatus", "dependants",
      "employer", "position", "employmentType", "employedSince",
      "grossMonthlyIncome", "netMonthlyIncome",
      "employer", "position",
      "bankName", "accountType",
    ]
    for (const key of optional) {
      const val = formData.get(key)
      if (val) {
        if (["dependants", "grossMonthlyIncome", "netMonthlyIncome"].includes(key)) {
          data[key] = parseInt(val as string)
        } else {
          data[key] = val
        }
      }
    }

    await db.insert(financeApplications).values(data)

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/finance-apps")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create application" }
  }
}

export default function NewFinanceAppPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createFinanceAppAction, null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (state?.success) {
      router.push("/finance-apps")
    }
  }, [state, router])

  const formatCurrency = (val: string) => {
    const num = parseInt(val) || 0
    return `R ${num.toLocaleString("en-ZA")}`
  }

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" asChild>
            <Link href="/dashboard/finance-apps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">New Finance Application</h1>
            <p className="text-sm text-white/60">Create a finance application or paste WhatsApp info</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.05]">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#030712] border-white/[0.08] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Application Preview</DialogTitle>
                <DialogDescription className="text-white/60">Review before submitting</DialogDescription>
              </DialogHeader>
              <FinanceAppPreviewForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form action={formAction} className="max-w-4xl mx-auto space-y-8">
          {state?.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          {/* Applicant Info */}
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white text-base">Applicant Information</CardTitle>
              <CardDescription className="text-white/60">Customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white/80 text-xs">Title</Label>
                  <Select name="title">
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white/80 text-xs">First Name *</Label>
                  <Input id="firstName" name="firstName" required placeholder="Thabo" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white/80 text-xs">Last Name *</Label>
                  <Input id="lastName" name="lastName" required placeholder="Dlamini" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-white/80 text-xs">ID Number *</Label>
                  <Input id="idNumber" name="idNumber" required placeholder="8505285345089" className="bg-white/[0.05] border-white/[0.08] text-white font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/80 text-xs">Phone *</Label>
                  <Input id="phone" name="phone" required placeholder="082 555 1234" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80 text-xs">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="thabo@email.com" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus" className="text-white/80 text-xs">Marital Status</Label>
                  <Select name="maritalStatus">
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-white/80 text-xs">Address</Label>
                <Input id="address" name="address" placeholder="123 Main St, Sandton" className="bg-white/[0.05] border-white/[0.08] text-white" />
              </div>
            </CardContent>
          </Card>

          {/* Employment & Income */}
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white text-base">Employment & Income</CardTitle>
              <CardDescription className="text-white/60">Work and financial details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employer" className="text-white/80 text-xs">Employer</Label>
                  <Input id="employer" name="employer" placeholder="Standard Bank" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-white/80 text-xs">Position</Label>
                  <Input id="position" name="position" placeholder="Branch Manager" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossMonthlyIncome" className="text-white/80 text-xs">Gross Monthly Income (R)</Label>
                  <Input id="grossMonthlyIncome" name="grossMonthlyIncome" type="number" placeholder="52000" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netMonthlyIncome" className="text-white/80 text-xs">Net Monthly Income (R)</Label>
                  <Input id="netMonthlyIncome" name="netMonthlyIncome" type="number" placeholder="42000" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dependants" className="text-white/80 text-xs">Dependants</Label>
                  <Input id="dependants" name="dependants" type="number" placeholder="2" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finance Details */}
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white text-base">Finance Details</CardTitle>
              <CardDescription className="text-white/60">Vehicle and loan information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditProvider" className="text-white/80 text-xs">Credit Provider</Label>
                  <Select name="creditProvider" defaultValue="wesbank">
                    <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
                      <SelectItem value="wesbank">WesBank</SelectItem>
                      <SelectItem value="absa">Absa</SelectItem>
                      <SelectItem value="mfc">MFC</SelectItem>
                      <SelectItem value="standard_bank">Standard Bank</SelectItem>
                      <SelectItem value="nedbank">Nedbank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiclePrice" className="text-white/80 text-xs">Vehicle Price (R) *</Label>
                  <Input id="vehiclePrice" name="vehiclePrice" type="number" required placeholder="689000" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit" className="text-white/80 text-xs">Deposit (R)</Label>
                  <Input id="deposit" name="deposit" type="number" placeholder="70000" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termMonths" className="text-white/80 text-xs">Term (months)</Label>
                  <Input id="termMonths" name="termMonths" type="number" placeholder="72" className="bg-white/[0.05] border-white/[0.08] text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.05]" asChild>
              <Link href="/dashboard/finance-apps">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 text-white hover:bg-orange-600 min-w-[180px]"
            >
              {isPending ? "Saving..." : "Save Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Preview component showing a formatted view of the finance app
 * Reads from the same form fields
 */
function FinanceAppPreviewForm() {
  if (typeof document === "undefined") return null

  const getVal = (id: string) =>
    (document.getElementById(id) as HTMLInputElement)?.value || "—"

  const formatCurrency = (val: string) => {
    const num = parseInt(val) || 0
    return num ? `R ${num.toLocaleString("en-ZA")}` : "—"
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-white/40">Name:</span>
          <span className="ml-2 text-white">{getVal("title")} {getVal("firstName")} {getVal("lastName")}</span>
        </div>
        <div>
          <span className="text-white/40">ID:</span>
          <span className="ml-2 text-white font-mono">{getVal("idNumber")}</span>
        </div>
        <div>
          <span className="text-white/40">Phone:</span>
          <span className="ml-2 text-white">{getVal("phone")}</span>
        </div>
        <div>
          <span className="text-white/40">Email:</span>
          <span className="ml-2 text-white">{getVal("email") || "—"}</span>
        </div>
        <div>
          <span className="text-white/40">Employer:</span>
          <span className="ml-2 text-white">{getVal("employer") || "—"}</span>
        </div>
        <div>
          <span className="text-white/40">Income:</span>
          <span className="ml-2 text-white">{formatCurrency(getVal("grossMonthlyIncome"))}/mo</span>
        </div>
      </div>

      <Separator className="bg-white/[0.08]" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-white/40">Vehicle Price:</span>
          <span className="ml-2 text-white font-semibold">{formatCurrency(getVal("vehiclePrice"))}</span>
        </div>
        <div>
          <span className="text-white/40">Deposit:</span>
          <span className="ml-2 text-white">{formatCurrency(getVal("deposit"))}</span>
        </div>
        <div>
          <span className="text-white/40">Term:</span>
          <span className="ml-2 text-white">{getVal("termMonths") || "72"} months</span>
        </div>
        <div>
          <span className="text-white/40">Provider:</span>
          <span className="ml-2 text-white uppercase">{getVal("creditProvider") || "WesBank"}</span>
        </div>
      </div>
    </div>
  )
}
