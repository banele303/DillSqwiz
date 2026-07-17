import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { financeApplications } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusIcon } from "lucide-react"
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
  draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  pending_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-white/10 text-white/40 border-white/10",
}

const formatPrice = (price: number | null) =>
  price ? `R ${price.toLocaleString("en-ZA")}` : "-"

export default async function FinanceAppsPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/choose-organization")

  const apps = await db
    .select()
    .from(financeApplications)
    .where(eq(financeApplications.orgId, orgId))
    .orderBy(desc(financeApplications.createdAt))
    .limit(50)

  const pending = apps.filter((a) => a.status === "pending_review").length

  return (
    <div className="flex flex-col h-full bg-[#030712]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Finance Applications</h1>
          <p className="text-sm text-white/60">
            {apps.length} total
            {pending > 0 && (
              <span className="ml-2 text-orange-400">
                · {pending} pending review
              </span>
            )}
          </p>
        </div>
        <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
          <Link href="/dashboard/finance-apps/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Application
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {apps.length === 0 ? (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-white">No finance applications</CardTitle>
              <CardDescription className="text-white/60">
                Finance applications from WhatsApp or manual entry will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
                <Link href="/finance-apps/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Application
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-white/[0.08] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/60">Applicant</TableHead>
                  <TableHead className="text-white/60">ID Number</TableHead>
                  <TableHead className="text-white/60">Vehicle Price</TableHead>
                  <TableHead className="text-white/60">Deposit</TableHead>
                  <TableHead className="text-white/60">Instalment</TableHead>
                  <TableHead className="text-white/60">Provider</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow
                    key={app.id}
                    className="border-white/[0.08] hover:bg-white/[0.02] cursor-pointer"
                  >
                    <TableCell className="font-medium text-white">
                      {app.firstName} {app.lastName}
                    </TableCell>
                    <TableCell className="text-white/70 text-sm font-mono">
                      {app.idNumber}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatPrice(app.vehiclePrice)}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {formatPrice(app.deposit)}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {app.monthlyInstalment
                        ? formatPrice(app.monthlyInstalment) + "/mo"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-white/[0.08] text-white/60 text-xs uppercase"
                      >
                        {app.creditProvider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[app.status]} text-xs`}
                      >
                        {app.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {new Date(app.createdAt).toLocaleDateString("en-ZA")}
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
