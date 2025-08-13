import { NextRequest, NextResponse } from 'next/server';
import { searchChatMessages, getSimilarMessages } from '~/lib/interview-chat-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, query, limit = 10, sessionId, messageId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Search query is required' },
            { status: 400 }
          );
        }

        const results = await searchChatMessages(userId, query, limit, sessionId);
        return NextResponse.json({ 
          results,
          query,
          totalResults: results.length 
        });
      }

      case 'similar': {
        if (!messageId) {
          return NextResponse.json(
            { error: 'Message ID is required' },
            { status: 400 }
          );
        }

        const results = await getSimilarMessages(messageId, userId, limit);
        return NextResponse.json({ 
          results,
          messageId,
          totalResults: results.length 
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "search" or "similar"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Interview chat search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sessionId = searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await searchChatMessages(userId, query, limit, sessionId || undefined);
    return NextResponse.json({ 
      results,
      query,
      totalResults: results.length 
    });
  } catch (error) {
    console.error('❌ Interview chat search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}