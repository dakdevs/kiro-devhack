import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { interviewSchedulingService } from '~/services/interview-scheduling';
import { 
  rescheduleInterviewSchema,
  RescheduleInterviewRequest
} from '~/types/interview-management';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/interviews/[id] - Get interview details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[INTERVIEWS-ID-API-GET] Starting interview retrieval');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[INTERVIEWS-ID-API-GET] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('[INTERVIEWS-ID-API-GET] Authenticated user:', session.user.id);

    const { id: interviewId } = params;

    // Get the interview
    const interview = await interviewSchedulingService.getInterviewById(interviewId);
    
    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this interview
    const [recruiterProfile] = await db.select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    const isRecruiter = !!recruiterProfile;
    const hasAccess = isRecruiter 
      ? recruiterProfile.id === interview.recruiterId
      : interview.candidateId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: interview
    });

  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch interview' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/interviews/[id] - Reschedule an interview
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[INTERVIEWS-ID-API-PUT] Starting interview update');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[INTERVIEWS-ID-API-PUT] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('[INTERVIEWS-ID-API-PUT] Authenticated user:', session.user.id);

    const { id: interviewId } = params;
    const body = await request.json();
    
    // Validate request body
    const validationResult = rescheduleInterviewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const rescheduleRequest: RescheduleInterviewRequest = validationResult.data;

    // Determine user type based on whether they have a recruiter profile
    const [recruiterProfile] = await db.select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    const userType: 'candidate' | 'recruiter' = recruiterProfile ? 'recruiter' : 'candidate';

    // Reschedule the interview
    const updatedInterview = await interviewSchedulingService.rescheduleInterview(
      session.user.id,
      interviewId,
      userType,
      rescheduleRequest
    );

    return NextResponse.json({
      success: true,
      data: updatedInterview
    });

  } catch (error) {
    console.error('Error rescheduling interview:', error);
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Access denied') ? 403 :
                      error instanceof Error && error.message.includes('conflicts') ? 409 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reschedule interview' 
      },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/interviews/[id] - Cancel an interview
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[INTERVIEWS-ID-API-DELETE] Starting interview cancellation');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[INTERVIEWS-ID-API-DELETE] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('[INTERVIEWS-ID-API-DELETE] Authenticated user:', session.user.id);

    const { id: interviewId } = params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || undefined;

    // Determine user type based on whether they have a recruiter profile
    const [recruiterProfile] = await db.select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    const userType: 'candidate' | 'recruiter' = recruiterProfile ? 'recruiter' : 'candidate';

    // Cancel the interview
    const cancelledInterview = await interviewSchedulingService.cancelInterview(
      session.user.id,
      interviewId,
      userType,
      reason
    );

    return NextResponse.json({
      success: true,
      data: cancelledInterview,
      message: 'Interview cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling interview:', error);
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Access denied') ? 403 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel interview' 
      },
      { status: statusCode }
    );
  }
}