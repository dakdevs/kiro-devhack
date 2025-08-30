import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { interviewSchedulingService } from '~/services/interview-scheduling';
import { 
  InterviewListResponse,
  InterviewStatus
} from '~/types/interview-management';

/**
 * GET /api/interviews - Get scheduled interviews for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[INTERVIEWS-API-GET] Starting interview retrieval');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      console.log('[INTERVIEWS-API-GET] ERROR: No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.log('[INTERVIEWS-API-GET] Authenticated user:', session.user.id);

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const userType = searchParams.get('userType') as 'candidate' | 'recruiter' || 'candidate';
    const statusParam = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Parse status filter
    let statusFilter: InterviewStatus[] | undefined;
    if (statusParam) {
      statusFilter = statusParam.split(',') as InterviewStatus[];
    }

    // Parse date filters
    const options: any = {
      limit: Math.min(limit, 100), // Cap at 100
      offset: Math.max(offset, 0)
    };

    if (statusFilter) {
      options.status = statusFilter;
    }

    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Get interviews
    const interviews = await interviewSchedulingService.getScheduledInterviews(
      session.user.id,
      userType,
      options
    );

    const response: InterviewListResponse = {
      success: true,
      data: interviews,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: interviews.length, // This is approximate - in production you'd do a separate count query
        totalPages: Math.ceil(interviews.length / limit),
        hasNext: interviews.length === limit,
        hasPrev: offset > 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch interviews' 
      },
      { status: 500 }
    );
  }
}