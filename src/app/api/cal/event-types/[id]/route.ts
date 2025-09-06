import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '~/config/server-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, length, description, locations } = body;
    const eventTypeId = params.id;

    const CAL_API_KEY = serverConfig.cal.apiKey;
    if (!CAL_API_KEY) {
      return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
    }

    const updateData = {
      title,
      length,
      description,
      locations: locations || [{ type: 'integrations:zoom' }],
    };

    const response = await fetch(`https://api.cal.com/v1/event-types/${eventTypeId}?apiKey=${CAL_API_KEY}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cal.com API error:', errorData);
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating event type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventTypeId = params.id;

    const CAL_API_KEY = serverConfig.cal.apiKey;
    if (!CAL_API_KEY) {
      return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.cal.com/v1/event-types/${eventTypeId}?apiKey=${CAL_API_KEY}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cal.com API error:', errorData);
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting event type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}