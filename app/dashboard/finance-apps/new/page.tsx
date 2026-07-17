import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectWrapper } from "@/components/select-wrapper"
import { createFinanceAppAction } from "./actions"

export default function NewFinanceAppPage() {
  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" asChild>
            <Link href="/dashboard/finance-apps"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div><h1 className="text-lg font-semibold text-white">New Finance Application</h1><p className="text-sm text-white/60">Create a finance application manually</p></div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <form action={createFinanceAppAction} className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader><CardTitle className="text-white text-base">Applicant</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label htmlFor="title" className="text-white/80 text-xs">Title</Label><SelectWrapper name="title" options={[{v:"Mr",l:"Mr"},{v:"Mrs",l:"Mrs"},{v:"Ms",l:"Ms"}]} /></div>
                <div><Label htmlFor="firstName" className="text-white/80 text-xs">First Name *</Label><Input id="firstName" name="firstName" required placeholder="Thabo" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="lastName" className="text-white/80 text-xs">Last Name *</Label><Input id="lastName" name="lastName" required placeholder="Dlamini" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="idNumber" className="text-white/80 text-xs">ID Number *</Label><Input id="idNumber" name="idNumber" required placeholder="8505285345089" className="bg-white/[0.05] border-white/[0.08] text-white font-mono" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label htmlFor="phone" className="text-white/80 text-xs">Phone *</Label><Input id="phone" name="phone" required placeholder="0825551234" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="email" className="text-white/80 text-xs">Email</Label><Input id="email" name="email" type="email" placeholder="thabo@email.com" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="employer" className="text-white/80 text-xs">Employer</Label><Input id="employer" name="employer" placeholder="Standard Bank" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="grossMonthlyIncome" className="text-white/80 text-xs">Gross Income (R)</Label><Input id="grossMonthlyIncome" name="grossMonthlyIncome" type="number" placeholder="52000" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="address" className="text-white/80 text-xs">Address</Label><Input id="address" name="address" placeholder="123 Main St, Sandton" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader><CardTitle className="text-white text-base">Finance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label htmlFor="creditProvider" className="text-white/80 text-xs">Provider</Label><SelectWrapper name="creditProvider" options={[{v:"wesbank",l:"WesBank"},{v:"absa",l:"Absa"},{v:"mfc",l:"MFC"},{v:"standard_bank",l:"Standard Bank"},{v:"nedbank",l:"Nedbank"}]} /></div>
                <div><Label htmlFor="vehiclePrice" className="text-white/80 text-xs">Vehicle Price (R) *</Label><Input id="vehiclePrice" name="vehiclePrice" type="number" required placeholder="689000" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="deposit" className="text-white/80 text-xs">Deposit (R)</Label><Input id="deposit" name="deposit" type="number" placeholder="70000" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="termMonths" className="text-white/80 text-xs">Term (months)</Label><Input id="termMonths" name="termMonths" type="number" placeholder="72" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" className="border-white/[0.08] text-white" asChild><Link href="/dashboard/finance-apps">Cancel</Link></Button>
            <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600 min-w-[180px]">Save Application</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
