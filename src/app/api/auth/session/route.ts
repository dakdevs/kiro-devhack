import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    return NextResponse.json({
      user: session?.user || null,
      session: session || null,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { user: null, session: null, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}