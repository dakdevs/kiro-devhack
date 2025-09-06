import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const calUsername = searchParams.get('username');
  
  if (!calUsername) {
    return NextResponse.json({ error: 'Cal.com username is required' }, { status: 400 });
  }
  
  const CAL_API_KEY = process.env.CAL_API_KEY;
  
  if (!CAL_API_KEY) {
    return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
  }
  
  try {
    const response = await fetch(`https://api.cal.com/v1/event-types?apiKey=${CAL_API_KEY}&username=${calUsername}`);
    
    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data.event_types || []);
  } catch (error: any) {
    console.error('Cal.com API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}