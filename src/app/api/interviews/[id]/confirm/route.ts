import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { interviewSchedulingService } from '~/services/interview-scheduling';
import { 
  confirmInterviewSchema,
  ConfirmInterviewRequest,
  ConfirmInterviewResponse
} from '~/types/interview-management';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/interviews/[id]/confirm - Confirm or decline an interview
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[INTERVIEWS-CONFIRM-API] Starting interview confirmation');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[INTERVIEWS-CONFIRM-API] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('[INTERVIEWS-CONFIRM-API] Authenticated user:', session.user.id);

    const { id: interviewId } = params;
    const body = await request.json();
    
    // Validate request body
    const validationResult = confirmInterviewSchema.safeParse(body);
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

    const confirmRequest: ConfirmInterviewRequest = validationResult.data;

    // Determine user type based on whether they have a recruiter profile
    const [recruiterProfile] = await db.select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    const userType: 'candidate' | 'recruiter' = recruiterProfile ? 'recruiter' : 'candidate';

    // Confirm the interview
    const updatedInterview = await interviewSchedulingService.confirmInterview(
      session.user.id,
      interviewId,
      userType,
      confirmRequest
    );

    const response: ConfirmInterviewResponse = {
      success: true,
      data: updatedInterview
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error confirming interview:', error);
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                      error instanceof Error && error.message.includes('Access denied') ? 403 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to confirm interview' 
      },
      { status: statusCode }
    );
  }
}