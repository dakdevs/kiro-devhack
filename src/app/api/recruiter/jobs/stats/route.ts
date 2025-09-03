import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { jobPostingService } from '~/services/job-posting';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { ApiResponse } from '~/types/interview-management';
import { cache, cacheKeys, cacheTTL } from '~/lib/cache';

/**
 * GET /api/recruiter/jobs/stats
 * Get job posting statistics for the current recruiter
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[RECRUITER-JOBS-STATS-API] Starting stats retrieval');
    
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      console.log('[RECRUITER-JOBS-STATS-API] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[RECRUITER-JOBS-STATS-API] Authenticated user:', session.user.id);

    // Get recruiter profile
    console.log('[RECRUITER-JOBS-STATS-API] Fetching recruiter profile');
    const recruiterProfile = await recruiterProfileService.getProfileByUserId(session.user.id);
    if (!recruiterProfile) {
      console.log('[RECRUITER-JOBS-STATS-API] ERROR: Recruiter profile not found');
      return NextResponse.json(
        { success: false, error: 'Recruiter profile required. Please create a profile first.' },
        { status: 403 }
      );
    }
    console.log('[RECRUITER-JOBS-STATS-API] Found recruiter profile:', recruiterProfile.id);

    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    console.log('[RECRUITER-JOBS-STATS-API] Force refresh:', forceRefresh);

    // Check cache first (unless force refresh is requested)
    const cacheKey = `${cacheKeys.jobStats(recruiterProfile.id)}:stats`;
    let cachedResult = null;
    
    if (!forceRefresh) {
      console.log('[RECRUITER-JOBS-STATS-API] Checking cache');
      cachedResult = await cache.get(cacheKey);
    } else {
      console.log('[RECRUITER-JOBS-STATS-API] Force refresh requested, skipping cache');
    }

    if (cachedResult && !forceRefresh) {
      console.log('[RECRUITER-JOBS-STATS-API] Cache hit, returning cached result');
      return NextResponse.json(cachedResult);
    }

    // Get job posting statistics
    console.log('[RECRUITER-JOBS-STATS-API] Fetching job posting statistics from database');
    const result = await jobPostingService.getJobPostingStats(recruiterProfile.id);
    console.log('[RECRUITER-JOBS-STATS-API] Stats result:', result);

    // Cache the result if successful
    if (result.success) {
      console.log('[RECRUITER-JOBS-STATS-API] Caching stats result');
      await cache.set(cacheKey, result, cacheTTL.medium);
    }

    if (!result.success) {
      console.log('[RECRUITER-JOBS-STATS-API] Stats service returned error:', result.error);
      return NextResponse.json(result, { status: 400 });
    }

    console.log('[RECRUITER-JOBS-STATS-API] Returning stats data');
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