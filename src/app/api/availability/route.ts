import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { availabilityService } from '~/services/availability';
import { 
  createAvailabilitySchema,
  type CreateAvailabilityRequest,
  type AvailabilityListResponse 
} from '~/types/interview-management';
import { ZodError } from 'zod';

// GET /api/availability - Get candidate availability
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const includeRecurring = searchParams.get('includeRecurring');

    const options: any = {};
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    if (status) {
      options.status = status;
    }
    
    if (includeRecurring !== null) {
      options.includeRecurring = includeRecurring === 'true';
    }

    const availability = await availabilityService.getCandidateAvailability(
      session.user.id,
      options
    );

    // Get upcoming interviews (simplified for now)
    const upcomingInterviews: any[] = []; // TODO: Implement when interview service is ready

    const response: AvailabilityListResponse = {
      success: true,
      data: {
        availability,
        upcomingInterviews
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/availability - Create new availability slot
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createAvailabilitySchema.parse(body);
    
    const availability = await availabilityService.createAvailability(
      session.user.id,
      validatedData as CreateAvailabilityRequest
    );

    return NextResponse.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error creating availability:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}