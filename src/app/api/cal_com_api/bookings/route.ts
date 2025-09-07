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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Get recruiter profile
    const recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, session.user.id))
      .limit(1);

    if (recruiterProfile.length === 0 || !recruiterProfile[0].calComConnected) {
      return NextResponse.json({
        success: true,
        bookings: [], // Return empty array if not connected
        message: 'Cal.com not connected'
      });
    }

    const profile = recruiterProfile[0];
    const apiKey = profile.calComApiKey || serverConfig.cal.apiKey;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        bookings: [],
        message: 'Cal.com API key not available'
      });
    }

    // Build date filters if provided
    let dateFilters = '';
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
      dateFilters = `&from=${startDate.toISOString()}&to=${endDate.toISOString()}`;
    }

    // Fetch bookings from Cal.com
    const response = await fetch(`https://api.cal.com/v1/bookings?apiKey=${apiKey}${dateFilters}`, {
      headers: {
        'User-Agent': 'RecruiterPlatform/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('Cal.com API error:', response.status, await response.text());
      return NextResponse.json({
        success: true,
        bookings: [],
        message: `Cal.com API error: ${response.status}`
      });
    }

    const data = await response.json();
    const bookings = data.bookings || [];

    // Transform bookings to include additional metadata
    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      uid: booking.uid,
      title: booking.title,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      location: booking.location,
      attendees: booking.attendees || [],
      eventType: booking.eventType,
      metadata: booking.metadata,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      count: transformedBookings.length,
      filters: {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null
      }
    });

  } catch (error) {
    console.error('Error fetching Cal.com bookings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bookings'
    }, { status: 500 });
  }
}