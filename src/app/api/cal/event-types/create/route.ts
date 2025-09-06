import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '~/config/server-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, length, description, locations } = body;

    if (!title || !length) {
      return NextResponse.json({ error: 'Title and length are required' }, { status: 400 });
    }

    const CAL_API_KEY = serverConfig.cal.apiKey;
    if (!CAL_API_KEY) {
      return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
    }

    const eventTypeData = {
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      length,
      description: description || '',
      locations: locations || [{ type: 'integrations:zoom' }],
      hidden: false,
      position: 0,
      eventName: null,
      timeZone: null,
      periodType: 'UNLIMITED',
      periodStartDate: null,
      periodEndDate: null,
      periodDays: null,
      periodCountCalendarDays: null,
      requiresConfirmation: false,
      recurringEvent: null,
      disableGuests: true,
      hideCalendarNotes: false,
      minimumBookingNotice: 120,
      beforeEventBuffer: 0,
      afterEventBuffer: 0,
      schedulingType: null,
      price: 0,
      currency: 'usd',
      slotInterval: null,
      metadata: {},
      successRedirectUrl: null
    };

    const response = await fetch(`https://api.cal.com/v1/event-types?apiKey=${CAL_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventTypeData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cal.com API error:', errorData);
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating event type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}