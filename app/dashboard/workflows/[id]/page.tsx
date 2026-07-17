import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { notFound, redirect } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"

import { liveblocks } from "@/lib/liveblocks"
import { getWorkflow } from "@/features/workflows/data"
import { Room } from "@/features/workflows/components/room"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId, orgId } = await auth()
  if (!userId) redirect(`/sign-in?redirectUrl=${encodeURIComponent(`/dashboard/workflows/${id}`)}`)
  if (!orgId) redirect(`/choose-organization?redirectUrl=${encodeURIComponent(`/dashboard/workflows/${id}`)}`)

  const workflow = await getWorkflow(orgId, id)
  if (!workflow) notFound()

  // Rooms are private by default under ID-token auth. Grant write access to the
  // owning org, matching the `groupIds: [orgId]` issued by the auth endpoint.
  try {
    await liveblocks.getOrCreateRoom(id, {
      organizationId: orgId,
      defaultAccesses: [],
      groupsAccesses: {
        [orgId]: ["room:write"],
      },
      metadata: {
        title: workflow.name,
      },
    })
  } catch (error) {
    console.warn("Liveblocks room creation failed, falling back to local session:", error)
  }

  // A read-only token scoped to this workflow's run tag, so the client can
  // subscribe to its runs in realtime. Good for ~an hour of an open canvas.
  let runsToken = ""
  try {
    runsToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          tags: [`workflow:${id}`],
        },
      },
      expirationTime: "1hr",
    })
  } catch (error) {
    console.warn("Trigger.dev public token creation failed:", error)
  }

  // The canvas and the sidebar's node palette live in separate components, so a
  // single ReactFlowProvider wraps both to give them one shared React Flow store.
  return (
    <Room roomId={id}>
      <ReactFlowProvider>
        {runsToken ? (
          <WorkflowRunsProvider workflowId={id} accessToken={runsToken}>
            <WorkflowShell workflowId={id} />
          </WorkflowRunsProvider>
        ) : (
          <WorkflowShell workflowId={id} />
        )}
      </ReactFlowProvider>
    </Room>
  )
}
