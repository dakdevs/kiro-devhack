import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
    }

    // Clear Google Calendar credentials
    await db
      .update(recruiterProfiles)
      .set({
        googleCalendarId: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        updatedAt: new Date()
      })
      .where(eq(recruiterProfiles.id, recruiterProfile[0].id));

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });

  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}