import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { 
  recruiterProfiles, 
  jobPostings, 
  candidateAvailability, 
  interviewSessions,
  interviewNotifications 
} from '~/db/schema';
import { count, eq, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'unknown', responseTime: 0 },
        interviewSystem: { status: 'unknown', responseTime: 0 },
        aiService: { status: 'unknown', responseTime: 0 },
        notifications: { status: 'unknown', responseTime: 0 },
      },
      metrics: {
        totalRecruiters: 0,
        activeJobs: 0,
        totalAvailabilitySlots: 0,
        scheduledInterviews: 0,
        pendingNotifications: 0,
      },
      uptime: process.uptime(),
    };

    // Database health check
    const dbStartTime = Date.now();
    try {
      await db.select({ count: count() }).from(recruiterProfiles).limit(1);
      healthChecks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
      };
    } catch (error) {
      healthChecks.checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
      healthChecks.status = 'degraded';
    }

    // Interview system health check
    const systemStartTime = Date.now();
    try {
      // Check if we can query interview-related tables
      const [
        recruiterCount,
        activeJobsCount,
        availabilityCount,
        interviewCount,
        notificationCount,
      ] = await Promise.all([
        db.select({ count: count() }).from(recruiterProfiles),
        db.select({ count: count() }).from(jobPostings).where(eq(jobPostings.status, 'active')),
        db.select({ count: count() }).from(candidateAvailability).where(eq(candidateAvailability.status, 'available')),
        db.select({ count: count() }).from(interviewSessions).where(eq(interviewSessions.status, 'scheduled')),
        db.select({ count: count() }).from(interviewNotifications).where(eq(interviewNotifications.read, false)),
      ]);

      healthChecks.metrics = {
        totalRecruiters: recruiterCount[0]?.count || 0,
        activeJobs: activeJobsCount[0]?.count || 0,
        totalAvailabilitySlots: availabilityCount[0]?.count || 0,
        scheduledInterviews: interviewCount[0]?.count || 0,
        pendingNotifications: notificationCount[0]?.count || 0,
      };

      healthChecks.checks.interviewSystem = {
        status: 'healthy',
        responseTime: Date.now() - systemStartTime,
      };
    } catch (error) {
      healthChecks.checks.interviewSystem = {
        status: 'unhealthy',
        responseTime: Date.now() - systemStartTime,
        error: error instanceof Error ? error.message : 'Unknown system error',
      };
      healthChecks.status = 'degraded';
    }

    // AI Service health check
    const aiStartTime = Date.now();
    try {
      if (process.env.OPENROUTER_API_KEY) {
        // Simple check to see if we can make a request to the AI service
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          healthChecks.checks.aiService = {
            status: 'healthy',
            responseTime: Date.now() - aiStartTime,
          };
        } else {
          healthChecks.checks.aiService = {
            status: 'degraded',
            responseTime: Date.now() - aiStartTime,
            error: `AI service returned ${response.status}`,
          };
        }
      } else {
        healthChecks.checks.aiService = {
          status: 'degraded',
          responseTime: Date.now() - aiStartTime,
          error: 'AI service API key not configured',
        };
      }
    } catch (error) {
      healthChecks.checks.aiService = {
        status: 'unhealthy',
        responseTime: Date.now() - aiStartTime,
        error: error instanceof Error ? error.message : 'Unknown AI service error',
      };
    }

    // Notification system health check
    const notifStartTime = Date.now();
    try {
      // Check if we can query notifications
      const recentNotifications = await db
        .select({ count: count() })
        .from(interviewNotifications)
        .where(gte(interviewNotifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))); // Last 24 hours

      healthChecks.checks.notifications = {
        status: 'healthy',
        responseTime: Date.now() - notifStartTime,
        recentNotifications: recentNotifications[0]?.count || 0,
      };
    } catch (error) {
      healthChecks.checks.notifications = {
        status: 'unhealthy',
        responseTime: Date.now() - notifStartTime,
        error: error instanceof Error ? error.message : 'Unknown notification error',
      };
      healthChecks.status = 'degraded';
    }

    // Overall health determination
    const unhealthyChecks = Object.values(healthChecks.checks).filter(
      check => check.status === 'unhealthy'
    );

    if (unhealthyChecks.length > 0) {
      healthChecks.status = 'unhealthy';
    } else if (Object.values(healthChecks.checks).some(check => check.status === 'degraded')) {
      healthChecks.status = 'degraded';
    }

    // Add total response time
    healthChecks.totalResponseTime = Date.now() - startTime;

    // Return appropriate HTTP status
    const httpStatus = healthChecks.status === 'healthy' ? 200 : 
                      healthChecks.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthChecks, { status: httpStatus });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      totalResponseTime: Date.now() - startTime,
    }, { status: 503 });
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD(req: NextRequest) {
  try {
    // Simple database connectivity check
    await db.select({ count: count() }).from(recruiterProfiles).limit(1);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}