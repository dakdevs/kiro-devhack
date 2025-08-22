import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { jobPostings, recruiterAvailability, recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobData, availability } = await request.json();

    // First, ensure the user has a recruiter profile
    let recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0) {
      // Create a basic recruiter profile if it doesn't exist
      const newProfile = {
        id: nanoid(),
        userId: session.user.id,
        companyName: 'Your Company', // This should be updated by the user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(recruiterProfiles).values(newProfile);
      recruiterProfile = [newProfile];
    }

    // Create the job posting
    const jobId = nanoid();
    const newJob = {
      id: jobId,
      recruiterId: recruiterProfile[0].id,
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements || null,
      responsibilities: jobData.responsibilities || null,
      salaryMin: jobData.salaryMin || null,
      salaryMax: jobData.salaryMax || null,
      location: jobData.location,
      jobType: jobData.jobType,
      experienceLevel: jobData.experienceLevel || null,
      skills: JSON.stringify(jobData.skills || []),
      benefits: jobData.benefits || null,
      applicationDeadline: jobData.applicationDeadline ? new Date(jobData.applicationDeadline) : null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(jobPostings).values(newJob);

    // Create availability slots
    if (availability && availability.length > 0) {
      const availabilitySlots = availability.map((slot: any) => ({
        id: nanoid(),
        recruiterId: recruiterProfile[0].id,
        jobPostingId: jobId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: slot.timezone,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(recruiterAvailability).values(availabilitySlots);
    }

    return NextResponse.json({ 
      success: true, 
      jobId,
      message: 'Job posted successfully' 
    });

  } catch (error) {
    console.error('Error creating job posting:', error);
    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter profile
    const recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // Get all job postings for this recruiter
    const jobs = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.recruiterId, recruiterProfile[0].id));

    return NextResponse.json({ jobs });

  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    );
  }
}