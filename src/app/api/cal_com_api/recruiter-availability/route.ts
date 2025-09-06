import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { recruiterProfiles, recruiterAvailability } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get('recruiterId');

    if (!recruiterId) {
      return new NextResponse('Recruiter ID is required', { status: 400 });
    }

    // Get recruiter profile
    const recruiterProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.id, recruiterId))
      .limit(1);

    if (recruiterProfile.length === 0) {
      return new NextResponse('Recruiter not found', { status: 404 });
    }

    const profile = recruiterProfile[0];

    if (!profile.calComConnected) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'Recruiter has not connected their Cal.com account',
      });
    }

    // Get recruiter's event types
    const eventTypes = await db
      .select()
      .from(recruiterAvailability)
      .where(eq(recruiterAvailability.recruiterId, recruiterId));

    return NextResponse.json({
      success: true,
      connected: true,
      recruiter: {
        id: profile.id,
        name: profile.organizationName,
        calComUsername: profile.calComUsername,
        timezone: profile.timezone,
      },
      eventTypes: eventTypes.map(et => ({
        id: et.calComEventTypeId,
        name: et.eventTypeName,
        slug: et.eventTypeSlug,
        duration: et.duration,
        isActive: et.isActive,
      })),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[RECRUITER_AVAILABILITY_ERROR]', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}