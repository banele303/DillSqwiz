import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { vehicles, leads, financeApplications } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AnalyticsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/choose-organization")

  // ── Aggregates ──
  const totalVehicles = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(eq(vehicles.orgId, orgId))
    .then((r) => Number(r[0].count))

  const inStock = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.status, "in_stock")))
    .then((r) => Number(r[0].count))

  const sold = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.status, "sold")))
    .then((r) => Number(r[0].count))

  const totalLeads = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .then((r) => Number(r[0].count))

  const pendingFinance = await db
    .select({ count: sql<number>`count(*)` })
    .from(financeApplications)
    .where(
      and(
        eq(financeApplications.orgId, orgId),
        eq(financeApplications.status, "pending_review")
      )
    )
    .then((r) => Number(r[0].count))

  // ── Stock value ──
  const stockValue = await db
    .select({ total: sql<number>`coalesce(sum(price), 0)` })
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.status, "in_stock")))
    .then((r) => Number(r[0].total))

  // ── Platform publish stats ──
  const listedOnAutotrader = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.listedOnAutotrader, true)))
    .then((r) => Number(r[0].count))

  const listedOnCarsCoZa = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.listedOnCarsCoZa, true)))
    .then((r) => Number(r[0].count))

  const listedOnFacebook = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(eq(vehicles.orgId, orgId), eq(vehicles.listedOnFacebook, true)))
    .then((r) => Number(r[0].count))

  const formatPrice = (price: number) =>
    `R ${price.toLocaleString("en-ZA")}`

  // ── Recent leads ──
  const recentLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .orderBy(desc(leads.createdAt))
    .limit(5)

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="border-b border-white/[0.08] px-6 py-4">
        <h1 className="text-lg font-semibold text-white">Analytics</h1>
        <p className="text-sm text-white/60">Dealership performance overview</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60 text-xs uppercase tracking-wider">
                Total Stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalVehicles}</div>
              <p className="text-xs text-white/40 mt-1">
                {inStock} in stock · {sold} sold
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60 text-xs uppercase tracking-wider">
                Stock Value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {formatPrice(stockValue)}
              </div>
              <p className="text-xs text-white/40 mt-1">
                Current inventory value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60 text-xs uppercase tracking-wider">
                Leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalLeads}</div>
              <p className="text-xs text-white/40 mt-1">
                Total leads captured
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader className="pb-2">
              <CardDescription className="text-white/60 text-xs uppercase tracking-wider">
                Pending Finance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">
                {pendingFinance}
              </div>
              <p className="text-xs text-white/40 mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Publishing */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white text-base">Platform Publishing</CardTitle>
            <CardDescription className="text-white/60">
              Vehicles listed across platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: "AutoTrader", count: listedOnAutotrader, icon: "AT" },
                { name: "Cars.co.za", count: listedOnCarsCoZa, icon: "CC" },
                { name: "Facebook", count: listedOnFacebook, icon: "FB" },
                { name: "Not Listed", count: totalVehicles - listedOnAutotrader - listedOnCarsCoZa - listedOnFacebook, icon: "—" },
              ].map((p) => (
                <div key={p.name} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 text-sm font-bold mb-2">
                    {p.icon}
                  </div>
                  <div className="text-lg font-bold text-white">{p.count}</div>
                  <div className="text-xs text-white/40">{p.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white text-base">Recent Leads</CardTitle>
            <CardDescription className="text-white/60">
              Latest inbound leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-white/40 text-sm">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-xs text-white/40">{lead.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/60 capitalize">
                        {lead.source}
                      </div>
                      <div className="text-xs text-white/40">
                        {new Date(lead.createdAt).toLocaleDateString("en-ZA")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper because we used `and` above
import { and } from "drizzle-orm"
