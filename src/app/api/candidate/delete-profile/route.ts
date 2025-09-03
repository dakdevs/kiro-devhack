import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { userSkills, interviewSessions, skillMentions, embeddings } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
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

    const userId = session.user.id;

    console.log(`🗑️ Deleting candidate profile data for user ${userId}...`);

    // Delete all candidate-related data in the correct order (respecting foreign keys)
    
    // 1. Delete skill mentions (references user_skills)
    const deletedMentions = await db.delete(skillMentions).where(eq(skillMentions.userId, userId));
    
    // 2. Delete embeddings
    const deletedEmbeddings = await db.delete(embeddings).where(eq(embeddings.userId, userId));
    
    // 3. Delete user skills
    const deletedSkills = await db.delete(userSkills).where(eq(userSkills.userId, userId));
    
    // 4. Delete interview sessions
    const deletedSessions = await db.delete(interviewSessions).where(eq(interviewSessions.userId, userId));

    console.log(`✅ Successfully deleted candidate profile data:
    - Skills: ${deletedSkills.rowCount || 0} records
    - Sessions: ${deletedSessions.rowCount || 0} records  
    - Mentions: ${deletedMentions.rowCount || 0} records
    - Embeddings: ${deletedEmbeddings.rowCount || 0} records`);

    return NextResponse.json({
      success: true,
      message: 'Successfully deleted candidate profile data',
      deletedRecords: {
        skills: deletedSkills.rowCount || 0,
        sessions: deletedSessions.rowCount || 0,
        mentions: deletedMentions.rowCount || 0,
        embeddings: deletedEmbeddings.rowCount || 0,
      }
    });

  } catch (error) {
    console.error('❌ Error deleting candidate profile:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete candidate profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}