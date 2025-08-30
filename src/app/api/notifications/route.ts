import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { notificationService } from '~/services/notification';
import { 
  NotificationListResponse,
  NotificationType
} from '~/types/interview-management';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    console.log('[NOTIFICATIONS-API-GET] Starting notifications retrieval');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[NOTIFICATIONS-API-GET] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[NOTIFICATIONS-API-GET] Authenticated user:', session.user.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const typesParam = searchParams.get('types');
    
    // Parse notification types filter
    let types: NotificationType[] | undefined;
    if (typesParam) {
      try {
        types = typesParam.split(',') as NotificationType[];
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid types parameter' },
          { status: 400 }
        );
      }
    }

    const offset = (page - 1) * limit;
    
    const { notifications, total } = await notificationService.getUserNotifications(
      session.user.id,
      {
        limit,
        offset,
        unreadOnly,
        types
      }
    );

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: NotificationListResponse = {
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}