import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { recruiterProfiles, interviewSessionsScheduled } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { serverConfig } from '~/config/server-config';

export async function POST(request: NextRequest) {
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

    // Fetch bookings from Cal.com
    const bookingsResponse = await fetch(`https://api.cal.com/v1/bookings?apiKey=${apiKey}`);
    
    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${await bookingsResponse.text()}`);
    }

    const bookingsData = await bookingsResponse.json();
    const calComBookings = bookingsData.bookings || [];

    // Get existing interviews from our database
    const existingInterviews = await db
      .select()
      .from(interviewSessionsScheduled)
      .where(eq(interviewSessionsScheduled.recruiterId, profile.id));

    const existingBookingIds = new Set(
      existingInterviews
        .filter(interview => interview.calComBookingId)
        .map(interview => interview.calComBookingId)
    );

    let syncedCount = 0;
    let updatedCount = 0;

    // Process each Cal.com booking
    for (const booking of calComBookings) {
      try {
        const bookingId = booking.id;
        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);
        
        // Extract candidate info from booking
        const candidateName = booking.attendees?.[0]?.name || 'Unknown';
        const candidateEmail = booking.attendees?.[0]?.email || '';

        if (existingBookingIds.has(bookingId)) {
          // Update existing interview
          await db
            .update(interviewSessionsScheduled)
            .set({
              status: mapCalComStatusToOurStatus(booking.status),
              meetingLink: booking.location || null,
              calComData: booking,
              updatedAt: new Date(),
            })
            .where(and(
              eq(interviewSessionsScheduled.calComBookingId, bookingId),
              eq(interviewSessionsScheduled.recruiterId, profile.id)
            ));
          
          updatedCount++;
        } else {
          // Create new interview record
          const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await db.insert(interviewSessionsScheduled).values({
            id: interviewId,
            jobPostingId: null, // We don't have job posting info from Cal.com
            candidateId: booking.metadata?.candidateId || null,
            recruiterId: profile.id,
            scheduledStart: startTime,
            scheduledEnd: endTime,
            timezone: booking.timeZone || 'UTC',
            status: mapCalComStatusToOurStatus(booking.status),
            candidateName,
            candidateEmail,
            meetingLink: booking.location || null,
            calComBookingId: bookingId,
            calComEventTypeId: booking.eventTypeId,
            calComData: booking,
          });
          
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
        // Continue with other bookings
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${syncedCount} new interviews, ${updatedCount} updated`,
      stats: {
        totalCalComBookings: calComBookings.length,
        newInterviews: syncedCount,
        updatedInterviews: updatedCount,
        existingInterviews: existingInterviews.length
      }
    });

  } catch (error) {
    console.error('Error syncing Cal.com bookings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync bookings'
    }, { status: 500 });
  }
}

function mapCalComStatusToOurStatus(calComStatus: string): string {
  switch (calComStatus?.toLowerCase()) {
    case 'accepted':
    case 'confirmed':
      return 'confirmed';
    case 'pending':
      return 'scheduled';
    case 'cancelled':
    case 'rejected':
      return 'cancelled';
    case 'rescheduled':
      return 'rescheduled';
    default:
      return 'scheduled';
  }
}