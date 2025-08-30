import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { recruiterProfileService } from '~/services/recruiter-profile';
import { 
  CreateRecruiterProfileRequest, 
  UpdateRecruiterProfileRequest,
  RecruiterProfileResponse,
  ApiResponse
} from '~/types/interview-management';

/**
 * GET /api/recruiter/profile
 * Retrieve the current user's recruiter profile
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[RECRUITER-PROFILE-API-GET] Starting profile retrieval');
    
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      console.log('[RECRUITER-PROFILE-API-GET] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[RECRUITER-PROFILE-API-GET] Authenticated user:', session.user.id);

    // Get recruiter profile
    console.log('[RECRUITER-PROFILE-API-GET] Fetching profile for user:', session.user.id);
    const profile = await recruiterProfileService.getProfileByUserId(session.user.id);

    if (!profile) {
      console.log('[RECRUITER-PROFILE-API-GET] Profile not found for user:', session.user.id);
      return NextResponse.json(
        { success: false, error: 'Recruiter profile not found' },
        { status: 404 }
      );
    }
    console.log('[RECRUITER-PROFILE-API-GET] Profile found:', profile.id, 'for organization:', profile.organizationName);

    const response: RecruiterProfileResponse = {
      success: true,
      data: profile,
    };

    console.log('[RECRUITER-PROFILE-API-GET] Returning profile data');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving recruiter profile:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/recruiter/profile
 * Create a new recruiter profile for the current user
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RECRUITER-PROFILE-API-POST] Starting profile creation');
    
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      console.log('[RECRUITER-PROFILE-API-POST] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[RECRUITER-PROFILE-API-POST] Authenticated user:', session.user.id);

    // Parse request body
    let requestData: CreateRecruiterProfileRequest;
    try {
      console.log('[RECRUITER-PROFILE-API-POST] Parsing request body');
      requestData = await request.json();
      console.log('[RECRUITER-PROFILE-API-POST] Request data:', { organizationName: requestData.organizationName, recruitingFor: requestData.recruitingFor });
    } catch (error) {
      console.log('[RECRUITER-PROFILE-API-POST] ERROR: Invalid JSON in request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Create recruiter profile
    console.log('[RECRUITER-PROFILE-API-POST] Creating profile via service');
    const profile = await recruiterProfileService.createProfile(
      session.user.id,
      requestData
    );
    console.log('[RECRUITER-PROFILE-API-POST] Profile created successfully:', profile.id);

    const response: RecruiterProfileResponse = {
      success: true,
      data: profile,
      message: 'Recruiter profile created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating recruiter profile:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'Recruiter profile already exists for this user') {
        return NextResponse.json(
          { success: false, error: 'Recruiter profile already exists' },
          { status: 409 }
        );
      }
      
      // Handle validation errors (from Zod)
      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/recruiter/profile
 * Update the current user's recruiter profile
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    let requestData: UpdateRecruiterProfileRequest;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Update recruiter profile
    const profile = await recruiterProfileService.updateProfile(
      session.user.id,
      requestData
    );

    const response: RecruiterProfileResponse = {
      success: true,
      data: profile,
      message: 'Recruiter profile updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating recruiter profile:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Recruiter profile not found') {
        return NextResponse.json(
          { success: false, error: 'Recruiter profile not found' },
          { status: 404 }
        );
      }
      
      // Handle validation errors (from Zod)
      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/recruiter/profile
 * Delete the current user's recruiter profile
 */
export async function DELETE(request: NextRequest) {
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

    // Delete recruiter profile
    const deleted = await recruiterProfileService.deleteProfile(session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Recruiter profile not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Recruiter profile deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting recruiter profile:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}