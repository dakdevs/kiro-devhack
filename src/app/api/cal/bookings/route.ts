import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  const CAL_API_KEY = process.env.CAL_API_KEY;
  
  if (!CAL_API_KEY) {
    return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
  }
  
  try {
    let url = `https://api.cal.com/v1/bookings?apiKey=${CAL_API_KEY}`;
    if (userId) {
      url += `&userId=${userId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data.bookings || []);
  } catch (error: any) {
    console.error('Cal.com API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const CAL_API_KEY = process.env.CAL_API_KEY;
  
  if (!CAL_API_KEY) {
    return NextResponse.json({ error: 'Cal.com API key not configured' }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    
    const response = await fetch(`https://api.cal.com/v1/bookings?apiKey=${CAL_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Cal.com API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}