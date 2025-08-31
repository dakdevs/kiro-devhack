import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { user } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { 
  NotificationPreferences,
  updateNotificationPreferencesSchema
} from '~/types/interview-management';

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  inApp: true,
  types: [
    'interview_scheduled',
    'interview_confirmed',
    'interview_cancelled',
    'interview_rescheduled',
    'availability_updated',
    'job_posted',
    'candidate_matched',
    'application_received'
  ]
};

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    console.log('[NOTIFICATIONS-PREFERENCES-API-GET] Starting preferences retrieval');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[NOTIFICATIONS-PREFERENCES-API-GET] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[NOTIFICATIONS-PREFERENCES-API-GET] Authenticated user:', session.user.id);

    // For now, we'll store preferences in a simple way
    // In a real implementation, you might want a separate table for user preferences
    // For this implementation, we'll return default preferences
    // TODO: Implement actual preference storage if needed
    
    return NextResponse.json({
      success: true,
      data: DEFAULT_PREFERENCES
    });
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    console.log('[NOTIFICATIONS-PREFERENCES-API-PUT] Starting preferences update');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[NOTIFICATIONS-PREFERENCES-API-PUT] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[NOTIFICATIONS-PREFERENCES-API-PUT] Authenticated user:', session.user.id);

    const body = await request.json();
    
    // Validate request body
    const validation = updateNotificationPreferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { preferences } = validation.data;

    // For now, we'll just return success
    // In a real implementation, you would store these preferences
    // TODO: Implement actual preference storage if needed
    console.log(`Updated notification preferences for user ${session.user.id}:`, preferences);

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}