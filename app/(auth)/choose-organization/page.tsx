import { TaskChooseOrganization } from "@clerk/nextjs"

export default async function ChooseOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string }>
}) {
  const { redirectUrl } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center">
      <TaskChooseOrganization redirectUrlComplete={redirectUrl || "/dashboard"} />
    </div>
  )
}
