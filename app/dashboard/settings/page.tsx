import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { dealerships, platformCredentials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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
import { Badge } from "@/components/ui/badge"

export default async function SettingsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/choose-organization")

  const dealership = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.orgId, orgId))
    .then((r) => r[0])

  const creds = await db
    .select()
    .from(platformCredentials)
    .where(eq(platformCredentials.orgId, orgId))

  const platformLabels: Record<string, string> = {
    autotrader: "AutoTrader SA",
    cars_co_za: "Cars.co.za",
    changecars: "CHANGECARS",
    facebook: "Facebook Marketplace",
  }

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="border-b border-white/[0.08] px-6 py-4">
        <h1 className="text-lg font-semibold text-white">Settings</h1>
        <p className="text-sm text-white/60">Dealership profile and integrations</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-3xl">
        {/* Dealership Profile */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white">Dealership Profile</CardTitle>
            <CardDescription className="text-white/60">
              Your dealership&apos;s details used in quotes, invoices, and listings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dealership ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Name</label>
                    <p className="text-white font-medium">{dealership.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Phone</label>
                    <p className="text-white">{dealership.phone || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
                    <p className="text-white">{dealership.email || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Website</label>
                    <p className="text-white">{dealership.website || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider">Address</label>
                    <p className="text-white">{dealership.address || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Finance Email</label>
                    <p className="text-white">{dealership.financeEmail || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Default Bank</label>
                    <p className="text-white capitalize">{dealership.defaultCreditProvider || "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm">
                No dealership profile set up. Configure your details to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Platform Credentials */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white">Platform Credentials</CardTitle>
            <CardDescription className="text-white/60">
              Login details for auto-publishing to car listing platforms.
              Credentials are encrypted at rest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creds.length === 0 ? (
              <p className="text-white/40 text-sm">
                No platforms configured. Add credentials to enable one-click publishing.
              </p>
            ) : (
              <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-transparent">
                      <TableHead className="text-white/60">Platform</TableHead>
                      <TableHead className="text-white/60">Email</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                      <TableHead className="text-white/60">Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creds.map((cred) => (
                      <TableRow
                        key={cred.id}
                        className="border-white/[0.08] hover:bg-white/[0.02]"
                      >
                        <TableCell className="font-medium text-white">
                          {platformLabels[cred.platform] || cred.platform}
                        </TableCell>
                        <TableCell className="text-white/80">{cred.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              cred.isActive
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            } text-xs`}
                          >
                            {cred.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {cred.lastUsedAt
                            ? new Date(cred.lastUsedAt).toLocaleDateString("en-ZA")
                            : "Never"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp / Sent.dm */}
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white">WhatsApp Integration</CardTitle>
            <CardDescription className="text-white/60">
              Connect your WhatsApp Business number via Sent.dm for automated
              messaging, lead capture, and finance application processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider">WhatsApp Number</label>
                <p className="text-white">{dealership?.whatsappNumber || "Not configured"}</p>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm text-orange-300">
                  To set up WhatsApp integration, configure your Sent.dm API key and
                  WhatsApp Business number in your environment variables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
