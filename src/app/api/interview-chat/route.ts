import { NextRequest, NextResponse } from 'next/server';
import { 
  createChatSession, 
  saveChatMessage, 
  getUserChatSessions, 
  getSessionMessages,
  updateSessionStats,
  deleteChatSession,
  getUserChatStats,
  type ChatMessage 
} from '~/lib/interview-chat-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, ...data } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create_session': {
        const sessionId = await createChatSession(userId, data.sessionName);
        return NextResponse.json({ sessionId });
      }

      case 'save_message': {
        const { sessionId, message } = data;
        if (!sessionId || !message) {
          return NextResponse.json(
            { error: 'Session ID and message are required' },
            { status: 400 }
          );
        }

        await saveChatMessage(sessionId, userId, message as ChatMessage);
        return NextResponse.json({ success: true });
      }

      case 'update_session_stats': {
        const { sessionId, stats } = data;
        if (!sessionId || !stats) {
          return NextResponse.json(
            { error: 'Session ID and stats are required' },
            { status: 400 }
          );
        }

        await updateSessionStats(sessionId, stats);
        return NextResponse.json({ success: true });
      }

      case 'delete_session': {
        const { sessionId } = data;
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          );
        }

        await deleteChatSession(sessionId, userId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Interview chat API error:', error);
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
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'get_sessions': {
        const sessions = await getUserChatSessions(userId);
        return NextResponse.json({ sessions });
      }

      case 'get_session_messages': {
        const sessionId = searchParams.get('sessionId');
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          );
        }

        const messages = await getSessionMessages(sessionId);
        return NextResponse.json({ messages });
      }

      case 'get_stats': {
        const stats = await getUserChatStats(userId);
        return NextResponse.json({ stats });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Interview chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}