import { redirect } from "next/navigation"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  redirect(`/dashboard/workflows/${id}`)
}
