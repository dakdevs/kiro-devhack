import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { jobPostingService } from '~/services/job-posting';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { 
  UpdateJobPostingRequest,
  JobPostingResponse,
  ApiResponse
} from '~/types/interview-management';
import { jobPostingUpdateSchema } from '~/lib/validation';

/**
 * GET /api/recruiter/jobs/[id]
 * Retrieve a specific job posting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get job posting
    const result = await jobPostingService.getJobPosting(params.id, recruiterProfile.id);

    if (!result.success) {
      const statusCode = result.error === 'Job posting not found' ? 404 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error retrieving job posting:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/recruiter/jobs/[id]
 * Update a specific job posting
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Parse and validate request body
    let requestData: UpdateJobPostingRequest;
    try {
      const rawData = await request.json();
      requestData = jobPostingUpdateSchema.parse(rawData);
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

    // Update job posting
    const result = await jobPostingService.updateJobPosting(
      params.id,
      recruiterProfile.id,
      requestData
    );

    if (!result.success) {
      const statusCode = result.error === 'Job posting not found' ? 404 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating job posting:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/recruiter/jobs/[id]
 * Delete a specific job posting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete job posting
    const result = await jobPostingService.deleteJobPosting(params.id, recruiterProfile.id);

    if (!result.success) {
      const statusCode = result.error === 'Job posting not found' ? 404 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Job posting deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting job posting:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}