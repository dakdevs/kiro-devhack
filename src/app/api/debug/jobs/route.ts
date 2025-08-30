import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { jobPostings, recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

/**
 * DEBUG endpoint to check job postings in database
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-JOBS] Starting debug check');

    // Get all job postings
    const allJobs = await db.select().from(jobPostings).limit(10);
    console.log('[DEBUG-JOBS] All jobs in database:', allJobs.length);

    // Get all recruiter profiles
    const allRecruiters = await db.select().from(recruiterProfiles).limit(10);
    console.log('[DEBUG-JOBS] All recruiter profiles:', allRecruiters.length);

    const result = {
      totalJobs: allJobs.length,
      totalRecruiters: allRecruiters.length,
      jobs: allJobs.map(job => ({
        id: job.id,
        title: job.title,
        recruiterId: job.recruiterId,
        status: job.status,
        createdAt: job.createdAt
      })),
      recruiters: allRecruiters.map(recruiter => ({
        id: recruiter.id,
        userId: recruiter.userId,
        companyName: recruiter.companyName,
        createdAt: recruiter.createdAt
      }))
    };

    console.log('[DEBUG-JOBS] Debug result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[DEBUG-JOBS] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 });
  }
}