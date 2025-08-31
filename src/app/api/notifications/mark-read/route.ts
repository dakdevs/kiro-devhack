import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { notificationService } from '~/services/notification';
import { markNotificationReadSchema } from '~/types/interview-management';

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    console.log('[NOTIFICATIONS-MARK-READ-API] Starting mark as read operation');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[NOTIFICATIONS-MARK-READ-API] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[NOTIFICATIONS-MARK-READ-API] Authenticated user:', session.user.id);

    const body = await request.json();
    
    // Validate request body
    const validation = markNotificationReadSchema.safeParse(body);
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

    const { notificationIds } = validation.data;

    // Mark notifications as read
    await notificationService.markNotificationsRead(session.user.id, notificationIds);

    return NextResponse.json({
      success: true,
      message: `Marked ${notificationIds.length} notification(s) as read`
    });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}