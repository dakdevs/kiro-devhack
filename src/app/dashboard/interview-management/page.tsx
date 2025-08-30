import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { InterviewDashboard } from '../_modules/interview-dashboard'

export default async function InterviewManagementPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/')
  }

  return <InterviewDashboard userId={session.user.id} />
}