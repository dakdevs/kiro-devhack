import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { user } from '~/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/debug/user-session
 * Debug endpoint to check user session and database state
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-USER-SESSION] Starting debug check');
    
    // Get authenticated user from session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log('[DEBUG-USER-SESSION] Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    });

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        debug: {
          session: null,
          userInDb: null,
        }
      });
    }

    // Check if user exists in database
    console.log('[DEBUG-USER-SESSION] Checking user in database:', session.user.id);
    const dbUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    console.log('[DEBUG-USER-SESSION] Database query result:', {
      found: dbUsers.length > 0,
      userCount: dbUsers.length,
      dbUser: dbUsers[0] || null,
    });

    // Also get all users to see what's in the database
    const allUsers = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      })
      .from(user)
      .limit(10);

    console.log('[DEBUG-USER-SESSION] All users in database:', allUsers);

    return NextResponse.json({
      success: true,
      debug: {
        session: {
          userId: session.user.id,
          userEmail: session.user.email,
          userName: session.user.name,
        },
        userInDb: dbUsers[0] || null,
        userExists: dbUsers.length > 0,
        allUsers: allUsers,
        totalUsers: allUsers.length,
      }
    });

  } catch (error) {
    console.error('[DEBUG-USER-SESSION] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error?.constructor?.name,
        errorStack: error instanceof Error ? error.stack : null,
      }
    }, { status: 500 });
  }
}