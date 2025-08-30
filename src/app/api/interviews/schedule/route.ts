import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { interviewSchedulingService } from '~/services/interview-scheduling';
import { ScheduleInterviewRequest } from '~/types/interview-management';
import { scheduleInterviewSchema, validateAndSanitize } from '~/lib/validation';
import { withErrorHandling } from '~/lib/error-handler';
import { ValidationError, AuthenticationError, AuthorizationError } from '~/lib/errors';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/interviews/schedule - Schedule a new interview
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  console.log('[INTERVIEWS-SCHEDULE-API] Starting interview scheduling');
  
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session?.user?.id) {
    console.log('[INTERVIEWS-SCHEDULE-API] ERROR: No authenticated user');
    throw new AuthenticationError('Authentication required');
  }
  console.log('[INTERVIEWS-SCHEDULE-API] Authenticated user:', session.user.id);

  const body = await request.json();
  
  // Validate and sanitize request body
  const scheduleRequest = validateAndSanitize(
    scheduleInterviewSchema,
    body,
    'schedule interview request'
  );

  // Get recruiter profile to get the recruiter ID
  const [recruiterProfile] = await db.select()
    .from(recruiterProfiles)
    .where(eq(recruiterProfiles.userId, session.user.id))
    .limit(1);

  if (!recruiterProfile) {
    throw new AuthorizationError(
      'Recruiter profile not found. Please complete your profile first.'
    );
  }

  // Schedule the interview
  const result = await interviewSchedulingService.scheduleInterview(
    recruiterProfile.id,
    scheduleRequest
  );

  return NextResponse.json(result, { status: 200 });
});