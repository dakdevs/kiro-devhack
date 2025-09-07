import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { jobPostings, recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Fetch job posting with recruiter info
    const job = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        status: jobPostings.status,
        recruiterId: jobPostings.recruiterId,
        calComConnected: recruiterProfiles.calComConnected,
        calComEventTypeId: recruiterProfiles.calComEventTypeId,
        organizationName: recruiterProfiles.organizationName,
      })
      .from(jobPostings)
      .leftJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
      .where(eq(jobPostings.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Job posting not found'
      }, { status: 404 });
    }

    const jobData = job[0];

    if (jobData.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Job posting is not active'
      }, { status: 400 });
    }

    const baseUrl = request.nextUrl.origin;
    const scheduleUrl = `${baseUrl}/schedule-interview/${jobId}`;

    return NextResponse.json({
      success: true,
      job: {
        id: jobData.id,
        title: jobData.title,
        organizationName: jobData.organizationName,
      },
      scheduling: {
        available: jobData.calComConnected && jobData.calComEventTypeId,
        scheduleUrl: jobData.calComConnected && jobData.calComEventTypeId ? scheduleUrl : null,
        eventTypeId: jobData.calComEventTypeId,
      }
    });

  } catch (error) {
    console.error('Error generating schedule link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate schedule link'
    }, { status: 500 });
  }
}