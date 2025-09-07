import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { recruiterProfiles, recruiterAvailability } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  hidden: boolean;
  userId: number;
  scheduleId: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get recruiter profile
    const recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0 || !recruiterProfile[0].calComConnected || !recruiterProfile[0].calComApiKey) {
      return new NextResponse('Cal.com not connected', { status: 400 });
    }

    const profile = recruiterProfile[0];
    const apiKey = profile.calComApiKey!;

    // Fetch event types from Cal.com
    const eventTypesResponse = await fetch(`https://api.cal.com/v1/event-types?apiKey=${apiKey}`);
    if (!eventTypesResponse.ok) {
      throw new Error('Failed to fetch event types from Cal.com');
    }

    const eventTypesData: { event_types: CalComEventType[] } = await eventTypesResponse.json();
    const eventTypes = eventTypesData.event_types.filter(et => !et.hidden);

    // Clear existing availability records for this recruiter
    await db
      .delete(recruiterAvailability)
      .where(eq(recruiterAvailability.recruiterId, profile.id));

    // Insert new availability records
    const availabilityRecords = eventTypes.map(eventType => ({
      id: nanoid(),
      recruiterId: profile.id,
      calComEventTypeId: eventType.id,
      eventTypeName: eventType.title,
      eventTypeSlug: eventType.slug,
      duration: eventType.length,
      isActive: true,
      calComData: eventType,
      lastSyncedAt: new Date(),
    }));

    if (availabilityRecords.length > 0) {
      await db.insert(recruiterAvailability).values(availabilityRecords);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${eventTypes.length} event types`,
      eventTypes: eventTypes.map(et => ({
        id: et.id,
        title: et.title,
        slug: et.slug,
        duration: et.length,
      })),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[SYNC_EVENT_TYPES_ERROR]', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}