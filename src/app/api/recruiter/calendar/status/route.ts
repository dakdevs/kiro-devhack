import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter profile to check Google Calendar connection
    const recruiterProfile = await db
      .select({
        googleCalendarId: recruiterProfiles.googleCalendarId,
        googleAccessToken: recruiterProfiles.googleAccessToken,
        updatedAt: recruiterProfiles.updatedAt,
      })
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0) {
      return NextResponse.json({
        isConnected: false,
        error: 'Recruiter profile not found'
      });
    }

    const profile = recruiterProfile[0];
    const isConnected = !!(profile.googleCalendarId && profile.googleAccessToken);

    return NextResponse.json({
      isConnected,
      calendarId: profile.googleCalendarId || undefined,
      lastSync: profile.updatedAt?.toISOString(),
    });

  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json(
      { 
        isConnected: false,
        error: 'Failed to check calendar status' 
      },
      { status: 500 }
    );
  }
}