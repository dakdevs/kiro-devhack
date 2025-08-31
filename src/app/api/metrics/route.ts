/**
 * Metrics endpoint for debugging and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '~/lib/monitoring';
import { withErrorHandling } from '~/lib/error-handler';
import { AuthenticationError, AuthorizationError } from '~/lib/errors';
import { auth } from '~/lib/auth';

/**
 * GET /api/metrics - Get system metrics (admin only)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Only allow in development or for admin users
  if (process.env.NODE_ENV === 'production') {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      throw new AuthenticationError('Authentication required');
    }
    
    // In a real app, you'd check if the user is an admin
    // For now, we'll restrict this endpoint in production
    throw new AuthorizationError('Access denied');
  }
  
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
  const type = searchParams.get('type'); // 'metrics', 'performance', 'errors', 'business'
  
  const recentMetrics = monitoring.getRecentMetrics(limit);
  const healthMetrics = monitoring.getHealthMetrics();
  
  let response: any = {
    timestamp: new Date().toISOString(),
    health: healthMetrics,
  };
  
  if (!type || type === 'all') {
    response = {
      ...response,
      ...recentMetrics,
    };
  } else if (type === 'metrics') {
    response.metrics = recentMetrics.metrics;
  } else if (type === 'performance') {
    response.performance = recentMetrics.performance;
  } else if (type === 'errors') {
    response.errors = recentMetrics.errors;
  } else if (type === 'business') {
    response.business = recentMetrics.business;
  }
  
  return NextResponse.json(response);
});