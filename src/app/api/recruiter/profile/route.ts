import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if recruiter profile exists
    const [profile] = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No recruiter profile found' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: profile 
    });
  } catch (error) {
    console.error('Error getting recruiter profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationName, recruitingFor, timezone } = await request.json();

    // Check if recruiter profile already exists
    const [existingProfile] = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (existingProfile) {
      return NextResponse.json({ 
        success: true, 
        data: existingProfile,
        message: 'Profile already exists' 
      });
    }

    // Create new recruiter profile
    const profileId = nanoid();
    const newProfile = {
      id: profileId,
      userId: session.user.id,
      organizationName: organizationName || 'Default Organization',
      recruitingFor: recruitingFor || 'Software Engineering',
      timezone: timezone || 'UTC',
      calComUsername: null,
      calComConnected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(recruiterProfiles).values(newProfile);

    return NextResponse.json({ 
      success: true, 
      data: newProfile,
      message: 'Profile created successfully' 
    });
  } catch (error) {
    console.error('Error creating recruiter profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}