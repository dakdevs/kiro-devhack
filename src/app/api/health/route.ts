import { NextResponse } from 'next/server';
import { healthMonitor, errorTracker, logger } from '~/lib/logger';
import { testEmbeddingClient } from '~/embeddings';
import { db } from '~/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/health
 * 
 * Returns system health status and metrics
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    logger.info('Health check requested');
    
    // Test database connection
    let databaseStatus: 'up' | 'down' | 'degraded' = 'up';
    let databaseError: string | undefined;
    
    try {
      await db.execute(sql`SELECT 1`);
      logger.debug('Database health check passed');
    } catch (error) {
      databaseStatus = 'down';
      databaseError = error instanceof Error ? error.message : 'Unknown database error';
      logger.error('Database health check failed', {}, error instanceof Error ? error : new Error('Unknown error'));
    }
    
    // Test embedding service
    let embeddingStatus: 'up' | 'down' | 'degraded' = 'up';
    let embeddingError: string | undefined;
    
    try {
      const embeddingTest = await testEmbeddingClient();
      if (!embeddingTest.success) {
        embeddingStatus = 'down';
        embeddingError = embeddingTest.error;
      }
      logger.debug('Embedding service health check passed');
    } catch (error) {
      embeddingStatus = 'down';
      embeddingError = error instanceof Error ? error.message : 'Unknown embedding error';
      logger.error('Embedding service health check failed', {}, error instanceof Error ? error : new Error('Unknown error'));
    }
    
    // Get system metrics
    const systemHealth = healthMonitor.getStatus();
    const topErrors = errorTracker.getTopErrors(5);
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseStatus === 'down' || embeddingStatus === 'down') {
      overallStatus = 'unhealthy';
    } else if (databaseStatus === 'degraded' || embeddingStatus === 'degraded' || systemHealth.status !== 'healthy') {
      overallStatus = 'degraded';
    }
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: databaseStatus,
          error: databaseError,
        },
        embeddings: {
          status: embeddingStatus,
          error: embeddingError,
        },
      },
      metrics: {
        uptime: systemHealth.metrics.uptime,
        errorRate: systemHealth.metrics.errorRate,
        averageResponseTime: systemHealth.metrics.responseTime,
        checkDuration: Date.now() - startTime,
      },
      errors: {
        recent: topErrors,
        totalTracked: Object.keys(errorTracker.getMetrics()).length,
      },
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    logger.info('Health check completed', {
      status: overallStatus,
      duration: Date.now() - startTime,
      databaseStatus,
      embeddingStatus,
    });
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    logger.error('Health check failed', {}, error instanceof Error ? error : new Error('Unknown error'));
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}