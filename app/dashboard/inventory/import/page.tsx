import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { importVehiclesAction } from "./actions"

export default function ImportPage() {
  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center gap-4 border-b border-white/[0.08] px-6 py-4">
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" asChild>
          <Link href="/dashboard/inventory"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div><h1 className="text-lg font-semibold text-white">Import Vehicles</h1><p className="text-sm text-white/60">Bulk import from CSV</p></div>
      </div>
      <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto space-y-6">
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader><CardTitle className="text-white text-base">CSV Format</CardTitle><CardDescription className="text-white/60">stockNo,make,model,year,odometer,colour,price,transmission,fuelType</CardDescription></CardHeader>
          <CardContent>
            <pre className="text-xs text-white/60 font-mono p-3 bg-white/[0.02] rounded whitespace-pre-wrap">ST24001,Toyota,Fortuner,2024,15000,White,689000,automatic,diesel{"\n"}ST24002,BMW,X3,2023,28000,Black,599000,automatic,diesel</pre>
          </CardContent>
        </Card>
        <form action={importVehiclesAction} className="space-y-4">
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader><CardTitle className="text-white text-base">Paste CSV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea name="csv" rows={12} className="font-mono text-sm bg-white/[0.05] border-white/[0.08] text-white" required />
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="border-white/[0.08] text-white" asChild><Link href="/dashboard/inventory">Cancel</Link></Button>
                <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600">Import</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
