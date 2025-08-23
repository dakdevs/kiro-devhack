import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // For now, return mock data
    // In a real implementation, you would:
    // 1. Fetch events from Google Calendar API
    // 2. Fetch scheduled interviews from your database
    // 3. Combine and return the events

    const mockEvents = [
      {
        id: '1',
        title: 'Interview with John Doe',
        start: `${year}-${String(Number(month) + 1).padStart(2, '0')}-15T10:00:00`,
        end: `${year}-${String(Number(month) + 1).padStart(2, '0')}-15T11:00:00`,
        type: 'interview',
        candidateName: 'John Doe',
        jobTitle: 'Senior Software Engineer'
      },
      {
        id: '2',
        title: 'Team Meeting',
        start: `${year}-${String(Number(month) + 1).padStart(2, '0')}-20T14:00:00`,
        end: `${year}-${String(Number(month) + 1).padStart(2, '0')}-20T15:00:00`,
        type: 'meeting'
      },
      {
        id: '3',
        title: 'Interview with Jane Smith',
        start: `${year}-${String(Number(month) + 1).padStart(2, '0')}-25T16:00:00`,
        end: `${year}-${String(Number(month) + 1).padStart(2, '0')}-25T17:00:00`,
        type: 'interview',
        candidateName: 'Jane Smith',
        jobTitle: 'Product Manager'
      }
    ];

    return NextResponse.json({ events: mockEvents });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}