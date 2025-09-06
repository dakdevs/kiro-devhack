import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { interviewSessionsScheduled, recruiterProfiles, jobPostings, user } from '~/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'upcoming';

    // Get recruiter profile
    const recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Recruiter profile not found'
      }, { status: 404 });
    }

    const recruiterId = recruiterProfile[0].id;

    // Build query based on filter
    let whereConditions = [eq(interviewSessionsScheduled.recruiterId, recruiterId)];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'upcoming':
        whereConditions.push(gte(interviewSessionsScheduled.scheduledStart, now));
        whereConditions.push(eq(interviewSessionsScheduled.status, 'scheduled'));
        break;
      case 'today':
        whereConditions.push(gte(interviewSessionsScheduled.scheduledStart, today));
        whereConditions.push(gte(tomorrow, interviewSessionsScheduled.scheduledStart));
        break;
      case 'completed':
        whereConditions.push(eq(interviewSessionsScheduled.status, 'completed'));
        break;
      // 'all' case - no additional filters
    }

    // Fetch interviews with job and candidate details
    const interviews = await db
      .select({
        id: interviewSessionsScheduled.id,
        scheduledStart: interviewSessionsScheduled.scheduledStart,
        scheduledEnd: interviewSessionsScheduled.scheduledEnd,
        status: interviewSessionsScheduled.status,
        meetingLink: interviewSessionsScheduled.meetingLink,
        notes: interviewSessionsScheduled.notes,
        candidateName: interviewSessionsScheduled.candidateName,
        candidateEmail: interviewSessionsScheduled.candidateEmail,
        calComBookingId: interviewSessionsScheduled.calComBookingId,
        jobTitle: jobPostings.title,
        candidateId: interviewSessionsScheduled.candidateId,
        jobPostingId: interviewSessionsScheduled.jobPostingId,
      })
      .from(interviewSessionsScheduled)
      .leftJoin(jobPostings, eq(interviewSessionsScheduled.jobPostingId, jobPostings.id))
      .where(and(...whereConditions))
      .orderBy(desc(interviewSessionsScheduled.scheduledStart))
      .limit(50);

    return NextResponse.json({
      success: true,
      interviews: interviews.map(interview => ({
        ...interview,
        scheduledStart: interview.scheduledStart.toISOString(),
        scheduledEnd: interview.scheduledEnd.toISOString(),
      }))
    });

  } catch (error) {
    console.error('Error fetching recruiter interviews:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch interviews'
    }, { status: 500 });
  }
}