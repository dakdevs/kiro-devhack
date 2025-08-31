import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { jobPostingService } from '~/services/job-posting';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { 
  CreateJobPostingRequest, 
  CreateJobPostingResponse,
  JobPostingsResponse,
  ApiResponse,
  JobPostingStatus
} from '~/types/interview-management';
import { 
  jobPostingCreateSchema, 
  validateAndSanitize,
  sanitizeHtml 
} from '~/lib/validation';
import { withErrorHandling } from '~/lib/error-handler';
import { 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError 
} from '~/lib/errors';
import { rateLimiters, createRateLimitMiddleware, rateLimitUtils } from '~/lib/rate-limiter';
import { cache, cacheKeys, cacheTTL, cacheUtils } from '~/lib/cache';
import { createSecureAPIRoute, parseSecureRequestBody, createSecureAPIResponse, createSecureErrorResponse } from '~/lib/api-security';
import { InputSanitizer } from '~/lib/security';

/**
 * GET /api/recruiter/jobs
 * Retrieve job postings for the current recruiter with pagination and filtering
 */
export const GET = createSecureAPIRoute(
  async (request: NextRequest, { user }) => {
    console.log('[RECRUITER-JOBS-GET] Starting job retrieval for user:', user.userId);
    
    // Get recruiter profile
    console.log('[RECRUITER-JOBS-GET] Fetching recruiter profile for user:', user.userId);
    const recruiterProfile = await recruiterProfileService.getProfileByUserId(user.userId);
    if (!recruiterProfile) {
      console.log('[RECRUITER-JOBS-GET] ERROR: Recruiter profile not found for user:', user.userId);
      throw new AuthorizationError('Recruiter profile not found. Please create a profile first.');
    }
    console.log('[RECRUITER-JOBS-GET] Found recruiter profile:', {
      id: recruiterProfile.id,
      userId: recruiterProfile.userId,
      companyName: recruiterProfile.companyName,
      createdAt: recruiterProfile.createdAt
    });

    // Parse and sanitize query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') as JobPostingStatus | undefined;
    const search = searchParams.get('search') ? InputSanitizer.sanitizeString(searchParams.get('search')!) : undefined;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log('[RECRUITER-JOBS-GET] Query params - page:', page, 'limit:', limit, 'status:', status, 'search:', search, 'forceRefresh:', forceRefresh);
    
    // Check cache first (unless force refresh is requested)
    const cacheKey = `${cacheKeys.jobStats(recruiterProfile.id)}:page:${page}:limit:${limit}:status:${status || 'all'}:search:${search || 'none'}`;
    console.log('[RECRUITER-JOBS-GET] Cache key:', cacheKey);
    console.log('[RECRUITER-JOBS-GET] Force refresh requested:', forceRefresh);
    
    let cachedResult = null;
    if (!forceRefresh) {
      console.log('[RECRUITER-JOBS-GET] Checking cache');
      cachedResult = await cache.get<JobPostingsResponse>(cacheKey);
    } else {
      console.log('[RECRUITER-JOBS-GET] Force refresh requested, skipping cache');
    }
    
    if (cachedResult && !forceRefresh) {
      console.log('[RECRUITER-JOBS-GET] Cache hit, returning cached result:', JSON.stringify(cachedResult, null, 2));
      return createSecureAPIResponse(cachedResult);
    }
    console.log('[RECRUITER-JOBS-GET] Cache miss or force refresh, fetching from database');

    // Validate status parameter
    if (status && !['active', 'paused', 'closed', 'draft'].includes(status)) {
      throw new ValidationError('Invalid status parameter', 'status', status);
    }

    // Get job postings
    console.log('[RECRUITER-JOBS-GET] Fetching job postings from service for recruiter:', recruiterProfile.id);
    const result = await jobPostingService.getJobPostings(recruiterProfile.id, {
      page,
      limit,
      status: status || undefined,
      search,
    });
    console.log('[RECRUITER-JOBS-GET] Service result:', JSON.stringify(result, null, 2));
    console.log('[RECRUITER-JOBS-GET] Retrieved', result.data?.length || 0, 'jobs, total:', result.pagination?.total || 0);
    
    if (result.success && result.data && result.data.length > 0) {
      console.log('[RECRUITER-JOBS-GET] First job details:', JSON.stringify(result.data[0], null, 2));
    } else {
      console.log('[RECRUITER-JOBS-GET] No jobs found or service failed');
    }

    // Cache the result
    console.log('[RECRUITER-JOBS-GET] Caching result');
    await cache.set(cacheKey, result, cacheTTL.medium);

    console.log('[RECRUITER-JOBS-GET] Returning response');
    return createSecureAPIResponse(result);
  },
  {
    requireAuth: true,
    requireRole: 'recruiter',
    rateLimit: 'general',
    allowedMethods: ['GET'],
    allowedContentTypes: ['none'],
  }
);

/**
 * POST /api/recruiter/jobs
 * Create a new job posting with AI analysis
 */
export const POST = createSecureAPIRoute(
  async (request: NextRequest, { user }) => {
    console.log('[RECRUITER-JOBS-POST] Starting job creation for user:', user.userId);
    
    // Get recruiter profile
    console.log('[RECRUITER-JOBS-POST] Fetching recruiter profile for user:', user.userId);
    const recruiterProfile = await recruiterProfileService.getProfileByUserId(user.userId);
    if (!recruiterProfile) {
      console.log('[RECRUITER-JOBS-POST] ERROR: Recruiter profile not found for user:', user.userId);
      throw new AuthorizationError('Recruiter profile not found. Please create a profile first.');
    }
    console.log('[RECRUITER-JOBS-POST] Found recruiter profile:', {
      id: recruiterProfile.id,
      userId: recruiterProfile.userId,
      companyName: recruiterProfile.companyName,
      createdAt: recruiterProfile.createdAt
    });

    // Parse and validate request body
    console.log('[RECRUITER-JOBS-POST] Parsing and validating request body');
    const jobData = await parseSecureRequestBody(request, jobPostingCreateSchema);
    console.log('[RECRUITER-JOBS-POST] Job data validated:', { 
      title: jobData.title, 
      location: jobData.location,
      requiredSkills: jobData.requiredSkills?.length || 0,
      preferredSkills: jobData.preferredSkills?.length || 0
    });

    // Create job posting with AI analysis
    console.log('[RECRUITER-JOBS-POST] Creating job posting with AI analysis');
    let result;
    try {
      result = await jobPostingService.createJobPosting(recruiterProfile.id, jobData);
    } catch (serviceError) {
      console.error('[RECRUITER-JOBS-POST] Job posting service threw error:', serviceError);
      console.error('[RECRUITER-JOBS-POST] Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
      return createSecureErrorResponse(
        serviceError instanceof Error ? serviceError.message : 'Job posting service error', 
        500
      );
    }
    
    if (!result.success) {
      console.log('[RECRUITER-JOBS-POST] Job posting creation failed:', result.error);
      return createSecureErrorResponse(result.error || 'Failed to create job posting', 400);
    }
    
    console.log('[RECRUITER-JOBS-POST] Job posting created with ID:', result.data?.job.id);

    // Invalidate related caches (this is also done in the service, but double-check here)
    console.log('[RECRUITER-JOBS-POST] Invalidating caches');
    try {
      await cacheUtils.invalidateRecruiterDashboardCaches(recruiterProfile.id);
    } catch (cacheError) {
      console.warn('[RECRUITER-JOBS-POST] Cache invalidation failed:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

    console.log('[RECRUITER-JOBS-POST] Returning success response');
    return createSecureAPIResponse(result, { status: 201 });
  },
  {
    requireAuth: true,
    requireRole: 'recruiter',
    requireCSRF: true,
    rateLimit: 'jobPosting',
    allowedMethods: ['POST'],
    allowedContentTypes: ['application/json'],
    maxRequestSize: 50 * 1024, // 50KB for job postings
  }
);