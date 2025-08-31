import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { jobPostingService } from '~/services/job-posting';

/**
 * DEBUG endpoint to test the complete job posting flow
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG-TEST-FLOW] Starting test flow');

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    console.log('[DEBUG-TEST-FLOW] User ID:', session.user.id);

    // Get recruiter profile
    const recruiterProfile = await recruiterProfileService.getProfileByUserId(session.user.id);
    if (!recruiterProfile) {
      return NextResponse.json({
        success: false,
        error: 'No recruiter profile found'
      });
    }

    console.log('[DEBUG-TEST-FLOW] Recruiter profile:', {
      id: recruiterProfile.id,
      userId: recruiterProfile.userId,
      companyName: recruiterProfile.companyName
    });

    // Create a test job
    const testJobData = {
      title: 'Test Job - Debug Flow',
      description: 'This is a test job posting created by the debug flow to verify the job creation and retrieval process works correctly.',
      remoteAllowed: true,
      employmentType: 'full-time' as const,
    };

    console.log('[DEBUG-TEST-FLOW] Creating test job with data:', testJobData);
    const createResult = await jobPostingService.createJobPosting(recruiterProfile.id, testJobData);
    console.log('[DEBUG-TEST-FLOW] Create result:', createResult);

    if (!createResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create test job',
        details: createResult
      });
    }

    // Now try to retrieve jobs for this recruiter
    console.log('[DEBUG-TEST-FLOW] Retrieving jobs for recruiter:', recruiterProfile.id);
    const getResult = await jobPostingService.getJobPostings(recruiterProfile.id, { limit: 10 });
    console.log('[DEBUG-TEST-FLOW] Get result:', getResult);

    return NextResponse.json({
      success: true,
      data: {
        userId: session.user.id,
        recruiterProfile: {
          id: recruiterProfile.id,
          userId: recruiterProfile.userId,
          companyName: recruiterProfile.companyName
        },
        createResult,
        getResult,
        summary: {
          jobCreated: createResult.success,
          jobsRetrieved: getResult.success,
          totalJobsFound: getResult.data?.length || 0,
          createdJobId: createResult.data?.job?.id,
          retrievedJobIds: getResult.data?.map(job => job.id) || []
        }
      }
    });
  } catch (error) {
    console.error('[DEBUG-TEST-FLOW] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test flow failed'
    }, { status: 500 });
  }
}