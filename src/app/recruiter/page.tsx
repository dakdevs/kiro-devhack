import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { RecruiterDashboard } from './_modules/recruiter-dashboard'

export default async function RecruiterDashboardPage() {
  console.log('[RECRUITER-PAGE] Loading recruiter dashboard page');
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    console.log('[RECRUITER-PAGE] No session found, redirecting to home');
    redirect('/')
  }

  console.log('[RECRUITER-PAGE] Session found for user:', session.user.id, 'loading dashboard');
  return <RecruiterDashboard userId={session.user.id} />
}