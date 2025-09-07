import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { serverConfig } from '~/config/server-config';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
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

    if (recruiterProfile.length === 0 || !recruiterProfile[0].calComConnected) {
      return NextResponse.json({
        success: false,
        error: 'Cal.com not connected'
      }, { status: 400 });
    }

    const profile = recruiterProfile[0];
    const apiKey = profile.calComApiKey || serverConfig.cal.apiKey;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Cal.com API key not available'
      }, { status: 400 });
    }

    // Fetch event types from Cal.com
    const response = await fetch(`https://api.cal.com/v1/event-types?apiKey=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch event types: ${await response.text()}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      eventTypes: data.event_types || []
    });

  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch event types'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, length, description, scheduleId } = await request.json();

    if (!title || !length) {
      return NextResponse.json({
        success: false,
        error: 'Title and length are required'
      }, { status: 400 });
    }

    // Get recruiter profile
    const recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0 || !recruiterProfile[0].calComConnected) {
      return NextResponse.json({
        success: false,
        error: 'Cal.com not connected'
      }, { status: 400 });
    }

    const profile = recruiterProfile[0];
    const apiKey = profile.calComApiKey || serverConfig.cal.apiKey;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Cal.com API key not available'
      }, { status: 400 });
    }

    // Create event type in Cal.com
    const eventTypeData = {
      title,
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      length: parseInt(length),
      description: description || `Interview for ${title}`,
      scheduleId: scheduleId || profile.calComScheduleId,
      hidden: false,
      metadata: {
        createdBy: 'recruiter-platform',
        recruiterId: profile.id,
        userId: session.user.id
      }
    };

    const response = await fetch(`https://api.cal.com/v1/event-types?apiKey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventTypeData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create event type: ${errorText}`);
    }

    const data = await response.json();
    const eventType = data.event_type;

    // Update recruiter profile with the new event type ID if this is their first one
    if (!profile.calComEventTypeId) {
      await db
        .update(recruiterProfiles)
        .set({
          calComEventTypeId: eventType.id,
          updatedAt: new Date(),
        })
        .where(eq(recruiterProfiles.id, profile.id));
    }

    return NextResponse.json({
      success: true,
      eventType: {
        id: eventType.id,
        title: eventType.title,
        slug: eventType.slug,
        length: eventType.length,
        description: eventType.description,
        hidden: eventType.hidden,
      }
    });

  } catch (error) {
    console.error('Error creating event type:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event type'
    }, { status: 500 });
  }
}