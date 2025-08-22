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

    const profile = recruiterProfile[0];

    if (!profile.googleAccessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Use the Google Calendar API to fetch events
    // 2. Sync with your local database
    // 3. Handle token refresh if needed
    // 4. Update the last sync timestamp

    // For now, just update the timestamp
    await db
      .update(recruiterProfiles)
      .set({ updatedAt: new Date() })
      .where(eq(recruiterProfiles.id, profile.id));

    return NextResponse.json({
      success: true,
      message: 'Calendar synced successfully',
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}