import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { user, userSkills, skillMentions } from '~/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('[CLEAR-TEST-DATA] Starting test data cleanup');

    // List of test candidate emails to remove
    const testEmails = [
      'alice.johnson@example.com',
      'bob.smith@example.com',
      'carol.davis@example.com',
      'david.wilson@example.com',
      'eva.martinez@example.com'
    ];

    // Get test user IDs
    const testUsers = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(inArray(user.email, testEmails));

    if (testUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test candidates found to remove',
        data: {
          removedUsers: 0,
          removedSkills: 0,
          removedMentions: 0,
        }
      });
    }

    const testUserIds = testUsers.map(u => u.id);
    console.log(`[CLEAR-TEST-DATA] Found ${testUsers.length} test users to remove:`, testUsers.map(u => u.email));

    // Delete skill mentions first (foreign key constraint)
    const deletedMentions = await db
      .delete(skillMentions)
      .where(inArray(skillMentions.userId, testUserIds));

    // Delete user skills
    const deletedSkills = await db
      .delete(userSkills)
      .where(inArray(userSkills.userId, testUserIds));

    // Delete users
    const deletedUsers = await db
      .delete(user)
      .where(inArray(user.id, testUserIds));

    console.log('[CLEAR-TEST-DATA] Cleanup completed:', {
      users: testUsers.length,
      skills: deletedSkills.rowCount || 0,
      mentions: deletedMentions.rowCount || 0
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${testUsers.length} test candidates and their data`,
      data: {
        removedUsers: testUsers.length,
        removedSkills: deletedSkills.rowCount || 0,
        removedMentions: deletedMentions.rowCount || 0,
        removedEmails: testUsers.map(u => u.email),
      }
    });

  } catch (error) {
    console.error('[CLEAR-TEST-DATA] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear test data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}