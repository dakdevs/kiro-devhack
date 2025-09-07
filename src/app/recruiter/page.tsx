import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { RecruiterDashboard } from './_modules/recruiter-dashboard'
import { InterviewManagementPanel } from './_modules/interview-management-panel'
import { db } from '~/db'
import { recruiterProfiles } from '~/db/schema'
import { eq } from 'drizzle-orm'

export default async function RecruiterDashboardPage() {
  console.log('[RECRUITER-PAGE] Loading recruiter dashboard page');
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    console.log('[RECRUITER-PAGE] No session found, redirecting to home');
    redirect('/')
  }

  // Get recruiter profile to pass recruiter ID to interview management
  const recruiterProfile = await db
    .select({ id: recruiterProfiles.id })
    .from(recruiterProfiles)
    .where(eq(recruiterProfiles.userId, session.user.id))
    .limit(1);

  const recruiterId = recruiterProfile.length > 0 ? recruiterProfile[0].id : null;

  console.log('[RECRUITER-PAGE] Session found for user:', session.user.id, 'loading dashboard');
  
  return (
    <div className="space-y-8">
      <RecruiterDashboard userId={session.user.id} />
      {recruiterId && (
        <InterviewManagementPanel recruiterId={recruiterId} />
      )}
    </div>
  );
}