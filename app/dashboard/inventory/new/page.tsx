import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { addVehicleAction } from "./actions"
import { SelectWrapper } from "@/components/select-wrapper"

export default function AddVehiclePage() {
  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center gap-4 border-b border-white/[0.08] px-6 py-4">
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" asChild>
          <Link href="/dashboard/inventory"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div><h1 className="text-lg font-semibold text-white">Add Vehicle</h1><p className="text-sm text-white/60">Add a new vehicle to inventory</p></div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <form action={addVehicleAction} className="max-w-3xl mx-auto space-y-8">
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader><CardTitle className="text-white text-base">Basic Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><Label htmlFor="stockNo" className="text-white/80 text-xs">Stock No *</Label><Input id="stockNo" name="stockNo" required placeholder="ST24001" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="vin" className="text-white/80 text-xs">VIN</Label><Input id="vin" name="vin" placeholder="AHTFB3CD309123456" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="registration" className="text-white/80 text-xs">Registration</Label><Input id="registration" name="registration" placeholder="CF 123-45" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label htmlFor="make" className="text-white/80 text-xs">Make *</Label><Input id="make" name="make" required placeholder="Toyota" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="model" className="text-white/80 text-xs">Model *</Label><Input id="model" name="model" required placeholder="Fortuner" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="variant" className="text-white/80 text-xs">Variant</Label><Input id="variant" name="variant" placeholder="2.8 GD-6" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><Label htmlFor="year" className="text-white/80 text-xs">Year *</Label><Input id="year" name="year" type="number" required placeholder="2024" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="odometer" className="text-white/80 text-xs">Odometer (km) *</Label><Input id="odometer" name="odometer" type="number" required placeholder="15000" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="colour" className="text-white/80 text-xs">Colour *</Label><Input id="colour" name="colour" required placeholder="White" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="price" className="text-white/80 text-xs">Price (R) *</Label><Input id="price" name="price" type="number" required placeholder="689000" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader><CardTitle className="text-white text-base">Specs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label htmlFor="transmission" className="text-white/80 text-xs">Transmission</Label><SelectWrapper name="transmission" options={[{v:"automatic",l:"Auto"},{v:"manual",l:"Manual"}]} /></div>
                <div><Label htmlFor="fuelType" className="text-white/80 text-xs">Fuel</Label><SelectWrapper name="fuelType" options={[{v:"petrol",l:"Petrol"},{v:"diesel",l:"Diesel"},{v:"electric",l:"Electric"},{v:"hybrid",l:"Hybrid"}]} /></div>
                <div><Label htmlFor="bodyType" className="text-white/80 text-xs">Body</Label><SelectWrapper name="bodyType" options={[{v:"suv",l:"SUV"},{v:"sedan",l:"Sedan"},{v:"hatchback",l:"Hatchback"},{v:"bakkie",l:"Bakkie"}]} /></div>
                <div><Label htmlFor="doors" className="text-white/80 text-xs">Doors</Label><Input id="doors" name="doors" type="number" placeholder="5" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="engineSize" className="text-white/80 text-xs">Engine</Label><Input id="engineSize" name="engineSize" placeholder="2.8L" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="location" className="text-white/80 text-xs">Location</Label><Input id="location" name="location" placeholder="Sandton" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader><CardTitle className="text-white text-base">Features & Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="features" className="text-white/80 text-xs">Features (one per line)</Label><Textarea id="features" name="features" placeholder="Leather seats\nSunroof" className="min-h-[100px] bg-white/[0.05] border-white/[0.08] text-white" /></div>
              <div><Label htmlFor="images" className="text-white/80 text-xs">Image URLs</Label><Textarea id="images" name="images" placeholder="https://..." className="min-h-[60px] bg-white/[0.05] border-white/[0.08] text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="serviceHistory" className="text-white/80 text-xs">Service History</Label><Input id="serviceHistory" name="serviceHistory" placeholder="Full Service History" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
                <div><Label htmlFor="warranty" className="text-white/80 text-xs">Warranty</Label><Input id="warranty" name="warranty" placeholder="3-year" className="bg-white/[0.05] border-white/[0.08] text-white" /></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" className="border-white/[0.08] text-white" asChild><Link href="/dashboard/inventory">Cancel</Link></Button>
            <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600 min-w-[140px]">Add Vehicle</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
