import { NextResponse } from 'next/server';
import { db } from '~/db';

export async function GET() {
  try {
    // Test database connection
    const dbTest = await db.execute('SELECT 1 as test');
    
    // Check if our main tables exist
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'job_applications', 'interviews', 'user_profiles')
    `);

    const apiRoutes = [
      '/api/job-matches',
      '/api/recruiter-availability',
      '/api/auth/session',
      '/api/test-db'
    ];

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tablesFound: tables.rows.length,
        tables: tables.rows.map((row: any) => row.table_name)
      },
      apiRoutes: apiRoutes,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasAuthSecret: !!process.env.BETTER_AUTH_SECRET
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false
      }
    }, { status: 500 });
  }
}