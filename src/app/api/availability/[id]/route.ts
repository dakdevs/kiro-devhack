import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { availabilityService } from '~/services/availability';
import { 
  updateAvailabilitySchema,
  type UpdateAvailabilityRequest,
  type AvailabilityResponse,
  type DeleteAvailabilityResponse 
} from '~/types/interview-management';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/availability/[id] - Get specific availability slot
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const availability = await availabilityService.getAvailabilityById(params.id);
    
    if (!availability) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }

    // Check if the availability belongs to the current user
    if (availability.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const response: AvailabilityResponse = {
      success: true,
      data: availability
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

// PUT /api/availability/[id] - Update availability slot
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const validatedData = updateAvailabilitySchema.parse(body);
    
    const availability = await availabilityService.updateAvailability(
      session.user.id,
      params.id,
      validatedData as UpdateAvailabilityRequest
    );

    const response: AvailabilityResponse = {
      success: true,
      data: availability
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating availability:', error);
    
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
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/availability/[id] - Delete availability slot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await availabilityService.deleteAvailability(
      session.user.id,
      params.id
    );

    if (!result.deleted && result.conflictingInterviews.length > 0) {
      const response: DeleteAvailabilityResponse = {
        success: false,
        error: 'Cannot delete availability slot with scheduled interviews',
        message: `This availability slot has ${result.conflictingInterviews.length} scheduled interview(s). Please reschedule or cancel the interviews first.`,
        data: {
          deleted: false,
          conflictingInterviews: result.conflictingInterviews
        }
      };
      
      return NextResponse.json(response, { status: 409 });
    }

    const response: DeleteAvailabilityResponse = {
      success: true,
      message: 'Availability slot deleted successfully',
      data: {
        deleted: true,
        conflictingInterviews: []
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting availability:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}