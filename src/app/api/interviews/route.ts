import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { interviewSessionsScheduled, jobPostings, recruiterProfiles, user } from '~/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { auth } from '~/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType'); // 'candidate' or 'recruiter'

    let whereCondition;
    if (userType === 'recruiter') {
      // Get interviews where user is the recruiter
      const recruiterProfile = await db
        .select({ id: recruiterProfiles.id })
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.userId, session.user.id))
        .limit(1);
      
      if (!recruiterProfile.length) {
        return NextResponse.json([]);
      }
      
      whereCondition = eq(interviewSessionsScheduled.recruiterId, recruiterProfile[0].id);
    } else {
      // Get interviews where user is the candidate
      whereCondition = eq(interviewSessionsScheduled.candidateId, session.user.id);
    }

    const interviews = await db
      .select({
        id: interviewSessionsScheduled.id,
        scheduledStart: interviewSessionsScheduled.scheduledStart,
        scheduledEnd: interviewSessionsScheduled.scheduledEnd,
        timezone: interviewSessionsScheduled.timezone,
        status: interviewSessionsScheduled.status,
        interviewType: interviewSessionsScheduled.interviewType,
        meetingLink: interviewSessionsScheduled.meetingLink,
        candidateName: interviewSessionsScheduled.candidateName,
        candidateEmail: interviewSessionsScheduled.candidateEmail,
        notes: interviewSessionsScheduled.notes,
        calComBookingId: interviewSessionsScheduled.calComBookingId,
        createdAt: interviewSessionsScheduled.createdAt,
        job: {
          id: jobPostings.id,
          title: jobPostings.title,
          location: jobPostings.location,
        },
        recruiter: {
          organizationName: recruiterProfiles.organizationName,
          contactEmail: recruiterProfiles.contactEmail,
        },
        recruiterUser: {
          name: user.name,
          email: user.email,
        }
      })
      .from(interviewSessionsScheduled)
      .leftJoin(jobPostings, eq(interviewSessionsScheduled.jobPostingId, jobPostings.id))
      .leftJoin(recruiterProfiles, eq(interviewSessionsScheduled.recruiterId, recruiterProfiles.id))
      .leftJoin(user, eq(recruiterProfiles.userId, user.id))
      .where(whereCondition)
      .orderBy(desc(interviewSessionsScheduled.scheduledStart));

    return NextResponse.json(interviews);
  } catch (error: any) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}