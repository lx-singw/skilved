import { redirect } from "next/navigation"
export default async function ApplyPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await params
  redirect(`/opportunity/${opportunityId}`)
}
