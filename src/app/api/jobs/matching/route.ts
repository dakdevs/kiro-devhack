import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { jobMatchingService } from '~/services/job-matching';
import { logger } from '~/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    logger.info('Job matching request received', {
      operation: 'jobs-matching.get',
      metadata: {
        candidateId: session.user.id,
        candidateName: session.user.name,
        candidateEmail: session.user.email,
      },
    });

    // Find matching jobs for the candidate
    const matches = await jobMatchingService.findMatchingJobs(session.user.id);

    logger.info('Job matching completed', {
      operation: 'jobs-matching.get',
      metadata: {
        candidateId: session.user.id,
        matchCount: matches.length,
      },
    });

    return NextResponse.json({
      success: true,
      matches,
      candidateId: session.user.id,
      matchCount: matches.length,
    });

  } catch (error) {
    logger.error('Error in job matching API', {
      operation: 'jobs-matching.get',
    }, error as Error);

    console.error('❌ Error in job matching:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to find matching jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}