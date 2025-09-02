import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { user, userSkills } from '~/db/schema';
import { inArray } from 'drizzle-orm';

/**
 * POST /api/debug/clear-mock-candidates
 * Remove all mock candidates from the database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CLEAR-MOCK-CANDIDATES] Starting mock candidate cleanup');

    // List of mock candidate emails to remove
    const mockEmails = [
      'sarah.chen@email.com',
      'marcus.johnson@email.com',
      'elena.rodriguez@email.com',
      'david.kim@email.com',
      'priya.patel@email.com',
      'alex.thompson@email.com',
      'maria.santos@email.com',
      'james.wilson@email.com',
      'aisha.okafor@email.com',
      'chen.wei@email.com',
      'isabella.garcia@email.com',
      'robert.anderson@email.com',
      'fatima.alzahra@email.com',
      'michael.brown@email.com',
      'yuki.tanaka@email.com',
      'sophie.martin@email.com',
      'ahmed.hassan@email.com',
      'emma.davis@email.com',
      'luis.mendoza@email.com',
      'zara.ali@email.com',
      'oliver.smith@email.com',
      'nadia.volkov@email.com',
      'carlos.ruiz@email.com',
      'amara.okonkwo@email.com',
      'kai.nakamura@email.com'
    ];

    // Find mock users
    const mockUsers = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(inArray(user.email, mockEmails));

    console.log('[CLEAR-MOCK-CANDIDATES] Found', mockUsers.length, 'mock users to remove');

    if (mockUsers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          removedUsers: 0,
          removedSkills: 0,
        },
        message: 'No mock candidates found to remove'
      });
    }

    const mockUserIds = mockUsers.map(u => u.id);

    // Remove skills first (due to foreign key constraints)
    const deletedSkills = await db
      .delete(userSkills)
      .where(inArray(userSkills.userId, mockUserIds));

    console.log('[CLEAR-MOCK-CANDIDATES] Removed skills for mock users');

    // Remove users
    const deletedUsers = await db
      .delete(user)
      .where(inArray(user.id, mockUserIds));

    console.log('[CLEAR-MOCK-CANDIDATES] Removed mock users');

    console.log('[CLEAR-MOCK-CANDIDATES] Mock candidate cleanup completed');

    return NextResponse.json({
      success: true,
      data: {
        removedUsers: mockUsers.length,
        removedSkills: 'All associated skills',
        removedCandidates: mockUsers.map(u => ({ name: u.name, email: u.email })),
      },
      message: `Successfully removed ${mockUsers.length} mock candidates and their associated skills`
    });

  } catch (error) {
    console.error('[CLEAR-MOCK-CANDIDATES] Error:', error);
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