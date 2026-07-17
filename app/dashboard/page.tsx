import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Car, Users, Calculator, FileBarChart } from "lucide-react"

import { db } from "@/lib/db"
import { vehicles, leads, financeApplications } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/choose-organization")

  let vehicleCount = 0
  let leadCount = 0
  let financeCount = 0
  let recentVehicles: any[] = []
  let recentLeads: any[] = []
  let dbError = false

  // Helper to execute all queries in a single block sequentially to prevent connection contention
  const runQueries = async () => {
    const vc = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.orgId, orgId)).then((r) => Number(r[0].count))
    const lc = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.orgId, orgId)).then((r) => Number(r[0].count))
    const fc = await db.select({ count: sql<number>`count(*)` }).from(financeApplications).where(and(eq(financeApplications.orgId, orgId), eq(financeApplications.status, "pending_review"))).then((r) => Number(r[0].count))
    const rVehicles = await db.select().from(vehicles).where(eq(vehicles.orgId, orgId)).orderBy(desc(vehicles.createdAt)).limit(4)
    const rLeads = await db.select().from(leads).where(eq(leads.orgId, orgId)).orderBy(desc(leads.createdAt)).limit(5)
    return { vc, lc, fc, rVehicles, rLeads }
  }

  // Attempt database queries with up to 3 retries (to handle Neon cold starts)
  let retries = 3
  while (retries > 0) {
    try {
      const data = await runQueries()
      vehicleCount = data.vc
      leadCount = data.lc
      financeCount = data.fc
      recentVehicles = data.rVehicles
      recentLeads = data.rLeads
      dbError = false
      break
    } catch (error) {
      retries--
      console.warn(`Database connection failed on Dashboard. Retrying... (${retries} retries left). Error:`, error)
      if (retries === 0) {
        console.error("Database connection failed permanently on Dashboard:", error)
        dbError = true
      } else {
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  const formatPrice = (price: number) => `R ${price.toLocaleString("en-ZA")}`

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border/60 px-6 py-6 bg-card/20 backdrop-blur-md">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dealer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Automated workflow controls & inventory overview</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {dbError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-destructive-foreground">
              ⚠️ Database Connection Timeout. Please check your network/database connection or try again later.
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-panel glow-border bg-card/30 hover:bg-card/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Vehicles</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Car className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-foreground">{vehicleCount}</div>
              <Button variant="link" className="px-0 text-primary text-xs font-semibold mt-2 hover:no-underline hover:opacity-80" asChild>
                <Link href="/dashboard/inventory">View inventory <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="glass-panel glow-border bg-card/30 hover:bg-card/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Leads</CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-foreground">{leadCount}</div>
              <Button variant="link" className="px-0 text-accent text-xs font-semibold mt-2 hover:no-underline hover:opacity-80" asChild>
                <Link href="/dashboard/leads">View leads <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="glass-panel glow-border bg-card/30 hover:bg-card/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Finance</CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <Calculator className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-destructive">{financeCount}</div>
              <Button variant="link" className="px-0 text-destructive text-xs font-semibold mt-2 hover:no-underline hover:opacity-80" asChild>
                <Link href="/dashboard/finance-apps">Review <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-panel bg-card/20 border-border/40">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Automation Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">Trigger and configure background AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-28 flex-col gap-2 border-border/60 text-foreground bg-card/40 hover:bg-card/80 transition-all duration-200" asChild>
                <Link href="/dashboard/inventory/new">
                  <Car className="h-6 w-6 text-primary" />
                  <span className="text-xs font-bold">Add Vehicle</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-28 flex-col gap-2 border-border/60 text-foreground bg-card/40 hover:bg-card/80 transition-all duration-200" asChild>
                <Link href="/dashboard/finance-apps/new">
                  <Calculator className="h-6 w-6 text-primary" />
                  <span className="text-xs font-bold">Finance App</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-28 flex-col gap-2 border-border/60 text-foreground bg-card/40 hover:bg-card/80 transition-all duration-200" asChild>
                <Link href="/dashboard/analytics">
                  <FileBarChart className="h-6 w-6 text-accent" />
                  <span className="text-xs font-bold">Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-28 flex-col gap-2 border-border/60 text-foreground bg-card/40 hover:bg-card/80 transition-all duration-200" asChild>
                <Link href="/pricing">
                  <FileBarChart className="h-6 w-6 text-accent" />
                  <span className="text-xs font-bold">Pricing</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Inventory & Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inventory */}
          <Card className="glass-panel bg-card/20 border-border/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground text-lg">Recent Inventory</CardTitle>
                <CardDescription className="text-muted-foreground">Latest vehicles added</CardDescription>
              </div>
              <Button variant="link" className="text-primary text-xs font-semibold hover:no-underline" asChild>
                <Link href="/dashboard/inventory">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentVehicles.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No vehicles added yet</p>
              ) : (
                <div className="space-y-4">
                  {recentVehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 last:pb-0">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{v.make} {v.model} {v.variant || ""}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{v.stockNo} · {v.year} · {v.colour}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{formatPrice(v.price)}</div>
                        <div className="text-xs text-primary font-medium capitalize mt-0.5">{v.status.replace("_", " ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="glass-panel bg-card/20 border-border/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground text-lg">Recent Leads</CardTitle>
                <CardDescription className="text-muted-foreground">Latest inbound inquiries</CardDescription>
              </div>
              <Button variant="link" className="text-accent text-xs font-semibold hover:no-underline" asChild>
                <Link href="/dashboard/leads">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No leads yet</p>
              ) : (
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 last:pb-0">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{lead.firstName} {lead.lastName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{lead.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-foreground font-semibold capitalize">{lead.source}</div>
                        <div className="text-xs text-accent font-medium capitalize mt-0.5">{lead.status.replace("_", " ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
