import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CalComUser {
  id: number;
  username: string;
  name: string;
  email: string;
  timeZone: string;
}

interface CalComSchedule {
  id: number;
  userId: number;
  name: string;
  timeZone: string;
  availability: Array<{
    id: number;
    days: number[];
    startTime: string;
    endTime: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { calComApiKey } = await request.json();
    
    if (!calComApiKey) {
      return new NextResponse('Cal.com API key is required', { status: 400 });
    }

    // Test the API key by fetching user info
    const userResponse = await fetch(`https://api.cal.com/v1/me?apiKey=${calComApiKey}`);
    if (!userResponse.ok) {
      return new NextResponse('Invalid Cal.com API key', { status: 400 });
    }

    const userData: { user: CalComUser } = await userResponse.json();
    const calComUser = userData.user;

    // Fetch user's schedules
    const schedulesResponse = await fetch(`https://api.cal.com/v1/schedules?apiKey=${calComApiKey}`);
    if (!schedulesResponse.ok) {
      throw new Error('Failed to fetch schedules from Cal.com');
    }

    const schedulesData: { schedules: CalComSchedule[] } = await schedulesResponse.json();
    const defaultSchedule = schedulesData.schedules[0];

    if (!defaultSchedule) {
      return new NextResponse('No schedules found in your Cal.com account', { status: 400 });
    }

    // Check if recruiter profile exists
    const existingProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create recruiter profile if it doesn't exist
      await db.insert(recruiterProfiles).values({
        id: nanoid(),
        userId: session.user.id,
        organizationName: 'Not specified',
        recruitingFor: 'Not specified',
        calComUsername: calComUser.username,
        calComConnected: true,
        calComApiKey: calComApiKey, // In production, encrypt this
        calComUserId: calComUser.id,
        calComScheduleId: defaultSchedule.id,
        timezone: calComUser.timeZone,
      });
    } else {
      // Update existing profile
      await db
        .update(recruiterProfiles)
        .set({
          calComUsername: calComUser.username,
          calComConnected: true,
          calComApiKey: calComApiKey, // In production, encrypt this
          calComUserId: calComUser.id,
          calComScheduleId: defaultSchedule.id,
          timezone: calComUser.timeZone,
          updatedAt: new Date(),
        })
        .where(eq(recruiterProfiles.userId, session.user.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Cal.com account connected successfully',
      user: {
        username: calComUser.username,
        name: calComUser.name,
        email: calComUser.email,
        timeZone: calComUser.timeZone,
      },
      schedule: {
        id: defaultSchedule.id,
        name: defaultSchedule.name,
        timeZone: defaultSchedule.timeZone,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[CAL_COM_CONNECT_ERROR]', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}