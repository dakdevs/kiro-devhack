
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { interviewSessionsScheduled } from '~/db/schema';
import { nanoid } from 'nanoid';
import { serverConfig } from '~/config/server-config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { 
      recruiterId, 
      eventTypeId, 
      start, 
      name, 
      email, 
      timeZone, 
      eventLengthInMinutes,
      jobPostingId 
    } = await request.json();

    if (!eventTypeId || !start || !name || !email || !timeZone || !eventLengthInMinutes) {
      return new NextResponse('Missing required fields in request body.', { status: 400 });
    }

    // Use Cal.com API key from environment variables
    const apiKey = serverConfig.cal.apiKey;
    if (!apiKey) {
      return new NextResponse('Cal.com API key not configured', { status: 500 });
    }
    const startTime = new Date(start);
    const endTime = new Date(startTime.getTime() + eventLengthInMinutes * 60000);

    // Create booking in Cal.com
    const bookingResponse = await fetch(`https://api.cal.com/v1/bookings?apiKey=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: Number(eventTypeId),
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        timeZone: timeZone,
        language: "en",
        responses: {
          name: name,
          email: email,
        },
        metadata: {
          candidateId: session.user.id,
          jobPostingId: jobPostingId || null,
        },
        status: "ACCEPTED", 
      }),
    });

    if (!bookingResponse.ok) {
      throw new Error(`Failed to create booking: ${await bookingResponse.text()}`);
    }

    const bookingData = await bookingResponse.json();
    const booking = bookingData.booking;

    // Store the booking in our database
    const interviewId = nanoid();
    await db.insert(interviewSessionsScheduled).values({
      id: interviewId,
      jobPostingId: jobPostingId || null,
      candidateId: session.user.id,
      recruiterId: recruiterId || null, // Optional since we're using global Cal.com account
      calComBookingId: booking.id,
      calComEventTypeId: Number(eventTypeId),
      scheduledStart: startTime,
      scheduledEnd: endTime,
      timezone: timeZone,
      status: 'scheduled',
      candidateName: name,
      candidateEmail: email,
      meetingLink: booking.location || null,
      calComData: booking,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Interview scheduled successfully!',
      interview: {
        id: interviewId,
        scheduledStart: startTime,
        scheduledEnd: endTime,
        meetingLink: booking.location,
      },
      booking: booking
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[SCHEDULING_BOOK_ERROR]', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}