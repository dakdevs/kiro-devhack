import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { interviewSessionsScheduled, recruiterAvailability, recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '~/lib/auth';
import { randomUUID } from 'crypto';
import { serverConfig } from '~/config/server-config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      jobPostingId, 
      recruiterId, 
      eventTypeId, 
      scheduledStart, 
      scheduledEnd, 
      timezone,
      candidateName,
      candidateEmail,
      notes 
    } = body;

    if (!jobPostingId || !recruiterId || !eventTypeId || !scheduledStart || !scheduledEnd) {
      return NextResponse.json({ 
        error: 'Missing required fields: jobPostingId, recruiterId, eventTypeId, scheduledStart, scheduledEnd' 
      }, { status: 400 });
    }

    // Get recruiter info and event type details
    const recruiterInfo = await db
      .select({
        calComUsername: recruiterProfiles.calComUsername,
        eventType: {
          calComEventTypeId: recruiterAvailability.calComEventTypeId,
          eventTypeName: recruiterAvailability.eventTypeName,
          eventTypeSlug: recruiterAvailability.eventTypeSlug,
          duration: recruiterAvailability.duration,
        }
      })
      .from(recruiterProfiles)
      .innerJoin(recruiterAvailability, eq(recruiterProfiles.id, recruiterAvailability.recruiterId))
      .where(eq(recruiterAvailability.calComEventTypeId, parseInt(eventTypeId)))
      .limit(1);

    if (!recruiterInfo.length) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    const { calComUsername, eventType } = recruiterInfo[0];

    // Create booking via Cal.com API
    const CAL_API_KEY = serverConfig.cal.apiKey;
    if (!CAL_API_KEY) {
      return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
    }

    const bookingData = {
      eventTypeId: parseInt(eventTypeId),
      start: scheduledStart,
      end: scheduledEnd,
      responses: {
        name: candidateName || session.user.name,
        email: candidateEmail || session.user.email,
        notes: notes || '',
      },
      timeZone: timezone || 'UTC',
      language: 'en',
      metadata: {
        jobPostingId,
        candidateId: session.user.id,
        source: 'job-match-platform'
      }
    };

    const calResponse = await fetch(`https://api.cal.com/v1/bookings?apiKey=${CAL_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    let calComBookingId = null;
    let calComData = null;
    let meetingLink = null;

    if (calResponse.ok) {
      const calData = await calResponse.json();
      calComBookingId = calData.id;
      calComData = calData;
      meetingLink = calData.meetingUrl || calData.location?.link;
    } else {
      console.warn('Cal.com booking failed, creating local record only:', await calResponse.text());
    }

    // Create local interview session record
    const interviewId = randomUUID();
    const interviewSession = {
      id: interviewId,
      jobPostingId,
      candidateId: session.user.id,
      recruiterId,
      calComBookingId,
      calComEventTypeId: parseInt(eventTypeId),
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      timezone: timezone || 'UTC',
      status: 'scheduled',
      interviewType: 'video',
      meetingLink,
      candidateName: candidateName || session.user.name || '',
      candidateEmail: candidateEmail || session.user.email || '',
      notes: notes || null,
      calComData,
    };

    await db.insert(interviewSessionsScheduled).values(interviewSession);

    return NextResponse.json({
      success: true,
      interviewId,
      calComBookingId,
      meetingLink,
      message: 'Interview scheduled successfully'
    });

  } catch (error: any) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}