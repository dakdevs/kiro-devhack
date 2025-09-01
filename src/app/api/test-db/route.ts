import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { candidateAvailability } from '~/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic database connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Basic query result:', result);
    
    // Test if candidate_availability table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'candidate_availability'
      );
    `);
    console.log('Table exists check:', tableExists);
    
    // Test table structure
    const tableStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'candidate_availability'
      ORDER BY ordinal_position;
    `);
    console.log('Table structure:', tableStructure);
    
    // Count existing records
    const count = await db.execute(sql`SELECT COUNT(*) as count FROM candidate_availability`);
    console.log('Record count:', count);
    
    return NextResponse.json({
      success: true,
      data: {
        connection: 'OK',
        basicQuery: result,
        tableExists: tableExists.rows[0],
        tableStructure: tableStructure.rows,
        recordCount: count.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}