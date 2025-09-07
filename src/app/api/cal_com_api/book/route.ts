
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

    // Validate required fields
    if (!eventTypeId || !start || !name || !email || !timeZone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: eventTypeId, start, name, email, timeZone'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Get recruiter profile to get their API key
    let apiKey = serverConfig.cal.apiKey;
    let recruiterProfile = null;

    if (recruiterId) {
      recruiterProfile = await db
        .select()
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.id, recruiterId))
        .limit(1);

      if (recruiterProfile.length > 0 && recruiterProfile[0].calComApiKey) {
        apiKey = recruiterProfile[0].calComApiKey;
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Cal.com API key not configured'
      }, { status: 500 });
    }

    const startTime = new Date(start);
    const endTime = new Date(startTime.getTime() + (eventLengthInMinutes || 45) * 60000);

    // Validate that the start time is in the future
    if (startTime <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Interview time must be in the future'
      }, { status: 400 });
    }

    // Create booking in Cal.com
    const bookingPayload = {
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
        source: 'recruiter-platform'
      },
      status: "ACCEPTED",
    };

    console.log('[CAL_COM_BOOKING] Creating booking with payload:', bookingPayload);

    const bookingResponse = await fetch(`https://api.cal.com/v1/bookings?apiKey=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'RecruiterPlatform/1.0'
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!bookingResponse.ok) {
      const errorText = await bookingResponse.text();
      console.error('[CAL_COM_BOOKING] Booking failed:', errorText);
      throw new Error(`Failed to create booking: ${errorText}`);
    }

    const bookingData = await bookingResponse.json();
    const booking = bookingData.booking;

    if (!booking) {
      throw new Error('No booking data returned from Cal.com');
    }

    console.log('[CAL_COM_BOOKING] Booking created successfully:', booking.id);

    // Store the booking in our database
    const interviewId = nanoid();
    await db.insert(interviewSessionsScheduled).values({
      id: interviewId,
      jobPostingId: jobPostingId || null,
      candidateId: session.user.id,
      recruiterId: recruiterId || null,
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

    console.log('[CAL_COM_BOOKING] Interview stored in database:', interviewId);

    return NextResponse.json({ 
      success: true,
      message: 'Interview scheduled successfully!',
      interview: {
        id: interviewId,
        scheduledStart: startTime.toISOString(),
        scheduledEnd: endTime.toISOString(),
        meetingLink: booking.location,
        status: 'scheduled'
      },
      booking: {
        id: booking.id,
        uid: booking.uid,
        title: booking.title,
        location: booking.location
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[SCHEDULING_BOOK_ERROR]', errorMessage, error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}