import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { userSkills, user } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user info
    const userInfo = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    // Get user skills
    const skills = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, session.user.id));

    return NextResponse.json({
      success: true,
      user: userInfo[0] || null,
      skills: skills || [],
      skillCount: skills.length,
      candidateId: session.user.id,
    });

  } catch (error) {
    console.error('❌ Error fetching candidate skills:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch candidate skills',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}