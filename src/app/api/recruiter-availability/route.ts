import { NextRequest, NextResponse } from 'next/server';
import { recruiterAvailabilityService } from '~/services/recruiter-availability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get('recruiterId');

    if (!recruiterId) {
      return NextResponse.json({ error: 'Recruiter ID is required' }, { status: 400 });
    }

    const result = await recruiterAvailabilityService.getRecruiterAvailability(recruiterId);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in recruiter availability API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, recruiterId, calUsername, calApiKey } = await request.json();

    if (!recruiterId) {
      return NextResponse.json({ error: 'Recruiter ID is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'connect':
        // Support both username and API key for different integration methods
        const calIdentifier = calUsername || calApiKey;
        if (!calIdentifier) {
          return NextResponse.json({ error: 'Cal.com username or API key is required' }, { status: 400 });
        }
        result = await recruiterAvailabilityService.connectRecruiterToCal(recruiterId, calIdentifier);
        break;

      case 'sync':
        result = await recruiterAvailabilityService.syncRecruiterAvailability(recruiterId);
        break;

      case 'disconnect':
        result = await recruiterAvailabilityService.disconnectRecruiterFromCal(recruiterId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in recruiter availability API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}