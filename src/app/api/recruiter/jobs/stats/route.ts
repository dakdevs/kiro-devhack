import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { jobPostingService } from '~/services/job-posting';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { ApiResponse } from '~/types/interview-management';

/**
 * GET /api/recruiter/jobs/stats
 * Get job posting statistics for the current recruiter
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get recruiter profile
    const recruiterProfile = await recruiterProfileService.getProfileByUserId(session.user.id);
    if (!recruiterProfile) {
      return NextResponse.json(
        { success: false, error: 'Recruiter profile not found' },
        { status: 404 }
      );
    }

    // Get job posting statistics
    const result = await jobPostingService.getJobPostingStats(recruiterProfile.id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error retrieving job posting statistics:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}