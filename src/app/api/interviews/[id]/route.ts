import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { interviewSessionsScheduled, jobPostings, recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const interviewId = params.id;

    // Fetch interview details with job and recruiter information
    const interview = await db
      .select({
        id: interviewSessionsScheduled.id,
        candidateName: interviewSessionsScheduled.candidateName,
        candidateEmail: interviewSessionsScheduled.candidateEmail,
        scheduledStart: interviewSessionsScheduled.scheduledStart,
        scheduledEnd: interviewSessionsScheduled.scheduledEnd,
        status: interviewSessionsScheduled.status,
        meetingLink: interviewSessionsScheduled.meetingLink,
        notes: interviewSessionsScheduled.notes,
        candidateId: interviewSessionsScheduled.candidateId,
        jobTitle: jobPostings.title,
        organizationName: recruiterProfiles.organizationName,
      })
      .from(interviewSessionsScheduled)
      .leftJoin(jobPostings, eq(interviewSessionsScheduled.jobPostingId, jobPostings.id))
      .leftJoin(recruiterProfiles, eq(interviewSessionsScheduled.recruiterId, recruiterProfiles.id))
      .where(eq(interviewSessionsScheduled.id, interviewId))
      .limit(1);

    if (interview.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Interview not found'
      }, { status: 404 });
    }

    const interviewData = interview[0];

    // Check if the user has permission to view this interview
    // Either they are the candidate or the recruiter
    const isCandidate = interviewData.candidateId === session.user.id;
    
    // Check if user is the recruiter
    const recruiterProfile = await db
      .select({ id: recruiterProfiles.id })
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);
    
    const isRecruiter = recruiterProfile.length > 0 && 
      interviewData.candidateId !== session.user.id; // Not the candidate

    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      interview: {
        ...interviewData,
        scheduledStart: interviewData.scheduledStart.toISOString(),
        scheduledEnd: interviewData.scheduledEnd.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching interview details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch interview details'
    }, { status: 500 });
  }
}