/**
 * Health check endpoint for monitoring system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, monitoring } from '~/lib/monitoring';
import { withErrorHandling } from '~/lib/error-handler';

/**
 * GET /api/health - Basic health check
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    const health = await healthCheck.getSystemHealth();
    const duration = Date.now() - startTime;
    
    // Record health check metrics
    monitoring.recordMetric({
      name: 'health.check.duration',
      value: duration,
      unit: 'milliseconds',
      tags: {
        healthy: health.healthy.toString(),
      },
    });
    
    const statusCode = health.healthy ? 200 : 503;
    
    return NextResponse.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      duration,
      services: health.services,
      system: health.system,
    }, { status: statusCode });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    monitoring.recordError({
      operation: 'health.check',
      errorType: 'system_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      duration,
      error: error instanceof Error ? error.message : 'Health check failed',
    }, { status: 503 });
  }
});