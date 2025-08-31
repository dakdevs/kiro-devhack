import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { notificationService } from '~/services/notification';

// GET /api/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    console.log('[NOTIFICATIONS-UNREAD-COUNT-API] Starting unread count retrieval');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[NOTIFICATIONS-UNREAD-COUNT-API] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[NOTIFICATIONS-UNREAD-COUNT-API] Authenticated user:', session.user.id);

    console.log('[NOTIFICATIONS-UNREAD-COUNT-API] Getting unread count for user');
    const count = await notificationService.getUnreadCount(session.user.id);
    console.log('[NOTIFICATIONS-UNREAD-COUNT-API] Unread count:', count);

    return NextResponse.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
}