import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

import { Badge } from "@/components/ui/badge"
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
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  test_drive: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  negotiating: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  finance_pending: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  sold: "bg-green-500/10 text-green-400 border-green-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
}

export default async function LeadsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/choose-organization")

  const allLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .orderBy(desc(leads.createdAt))
    .limit(50)

  const pipelineCounts = {
    new: allLeads.filter((l) => l.status === "new").length,
    contacted: allLeads.filter((l) => l.status === "contacted").length,
    test_drive: allLeads.filter((l) => l.status === "test_drive").length,
    negotiating: allLeads.filter((l) => l.status === "negotiating").length,
    sold: allLeads.filter((l) => l.status === "sold").length,
  }

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="border-b border-white/[0.08] px-6 py-4">
        <h1 className="text-lg font-semibold text-white">Leads</h1>
        <p className="text-sm text-white/60">{allLeads.length} total leads</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Pipeline Summary */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "New", count: pipelineCounts.new, color: "bg-blue-500" },
            { label: "Contacted", count: pipelineCounts.contacted, color: "bg-yellow-500" },
            { label: "Test Drive", count: pipelineCounts.test_drive, color: "bg-purple-500" },
            { label: "Negotiating", count: pipelineCounts.negotiating, color: "bg-orange-500" },
            { label: "Sold", count: pipelineCounts.sold, color: "bg-green-500" },
          ].map((stage) => (
            <Card key={stage.label} className="bg-white/[0.03] border-white/[0.08]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white/60">{stage.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-white`}>{stage.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leads Table */}
        {allLeads.length === 0 ? (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white">No leads yet</CardTitle>
              <CardDescription className="text-white/60">
                Leads from WhatsApp, website, and other sources will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="rounded-lg border border-white/[0.08] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/60">Name</TableHead>
                  <TableHead className="text-white/60">Phone</TableHead>
                  <TableHead className="text-white/60">Interest</TableHead>
                  <TableHead className="text-white/60">Source</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="border-white/[0.08] hover:bg-white/[0.02]"
                  >
                    <TableCell className="font-medium text-white">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell className="text-white/80">{lead.phone}</TableCell>
                    <TableCell className="text-white/80">
                      {lead.interestedIn || (lead.vehicleId ? "Vehicle #" + lead.vehicleId.slice(0, 8) : "-")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/[0.08] text-white/60 text-xs">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[lead.status]} text-xs`}
                      >
                        {lead.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {new Date(lead.createdAt).toLocaleDateString("en-ZA")}
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
