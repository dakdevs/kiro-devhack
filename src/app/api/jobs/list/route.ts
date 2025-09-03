import { NextResponse } from 'next/server';
import { db } from '~/db';
import { jobListings } from '~/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const jobs = await db
      .select({
        id: jobListings.id,
        title: jobListings.title,
        company: jobListings.company,
        location: jobListings.location,
        experienceLevel: jobListings.experienceLevel,
        status: jobListings.status,
        createdAt: jobListings.createdAt,
      })
      .from(jobListings)
      .orderBy(desc(jobListings.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Error fetching job listings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch job listings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}