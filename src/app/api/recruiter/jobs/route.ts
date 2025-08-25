import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { jobPostingService } from '~/services/job-posting';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { 
  CreateJobPostingRequest, 
  CreateJobPostingResponse,
  JobPostingsResponse,
  ApiResponse,
  JobPostingStatus,
  createJobPostingSchema
} from '~/types/interview-management';

/**
 * GET /api/recruiter/jobs
 * Retrieve job postings for the current recruiter with pagination and filtering
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
        { success: false, error: 'Recruiter profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 per page
    const status = searchParams.get('status') as JobPostingStatus | null;
    const search = searchParams.get('search') || undefined;

    // Validate status parameter
    if (status && !['active', 'paused', 'closed', 'draft'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    // Get job postings
    const result = await jobPostingService.getJobPostings(recruiterProfile.id, {
      page,
      limit,
      status: status || undefined,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error retrieving job postings:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/recruiter/jobs
 * Create a new job posting with AI analysis
 */
export async function POST(request: NextRequest) {
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
        { success: false, error: 'Recruiter profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    let requestData: CreateJobPostingRequest;
    try {
      const rawData = await request.json();
      requestData = createJobPostingSchema.parse(rawData);
    } catch (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Invalid request data' 
        },
        { status: 400 }
      );
    }

    // Create job posting with AI analysis
    const result = await jobPostingService.createJobPosting(
      recruiterProfile.id,
      requestData
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating job posting:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}