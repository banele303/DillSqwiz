import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"
import { and, eq, desc } from "drizzle-orm"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusColors: Record<string, string> = {
  in_stock: "bg-green-500/10 text-green-400 border-green-500/20",
  sold: "bg-red-500/10 text-red-400 border-red-500/20",
  reserved: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  pending_listing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  listed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const platformIcons: Record<string, string> = {
  listedOnAutotrader: "AT",
  listedOnCarsCoZa: "CC",
  listedOnChangecars: "CH",
  listedOnFacebook: "FB",
  listedOnWebsite: "WB",
}

export default async function InventoryPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/choose-organization")

  const stock = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.orgId, orgId))
    .orderBy(desc(vehicles.createdAt))
    .limit(50)

  const formatPrice = (price: number) =>
    `R ${price.toLocaleString("en-ZA")}`

  const formatOdometer = (km: number) =>
    `${km.toLocaleString("en-ZA")} km`

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Inventory</h1>
          <p className="text-sm text-white/60">{stock.length} vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.05]" asChild>
            <Link href="/dashboard/inventory/import">Import CSV</Link>
          </Button>
          <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
            <Link href="/dashboard/inventory/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {stock.length === 0 ? (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white">No vehicles yet</CardTitle>
              <CardDescription className="text-white/60">
                Add your first vehicle to start managing inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
                <Link href="/dashboard/inventory/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-white/[0.08] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/60">Stock No</TableHead>
                  <TableHead className="text-white/60">Vehicle</TableHead>
                  <TableHead className="text-white/60">Year</TableHead>
                  <TableHead className="text-white/60">Odometer</TableHead>
                  <TableHead className="text-white/60">Colour</TableHead>
                  <TableHead className="text-white/60 text-right">Price</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Listed On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((v) => (
                  <TableRow
                    key={v.id}
                    className="border-white/[0.08] hover:bg-white/[0.02] cursor-pointer"
                  >
                    <TableCell className="font-medium text-white">{v.stockNo}</TableCell>
                    <TableCell>
                      <div className="text-white">{v.make} {v.model}</div>
                      {v.variant && (
                        <div className="text-xs text-white/40">{v.variant}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-white/80">{v.year}</TableCell>
                    <TableCell className="text-white/80">{formatOdometer(v.odometer)}</TableCell>
                    <TableCell className="text-white/80">{v.colour}</TableCell>
                    <TableCell className="text-right font-medium text-white">
                      {formatPrice(v.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[v.status] || "bg-white/5 text-white/60 border-white/10"} text-xs`}
                      >
                        {v.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {[
                          v.listedOnAutotrader && "AT",
                          v.listedOnCarsCoZa && "CC",
                          v.listedOnChangecars && "CH",
                          v.listedOnFacebook && "FB",
                          v.listedOnWebsite && "WB",
                        ]
                          .filter(Boolean)
                          .map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400"
                            >
                              {p}
                            </span>
                          ))}
                        {!v.listedOnAutotrader &&
                          !v.listedOnCarsCoZa &&
                          !v.listedOnChangecars &&
                          !v.listedOnFacebook &&
                          !v.listedOnWebsite && (
                            <span className="text-xs text-white/30">Not listed</span>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
