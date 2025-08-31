import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { user, userSkills } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('[CHECK-REAL-USERS] Checking real users and skills in database');

    // Get all users
    const allUsers = await db.select().from(user).limit(20);
    console.log(`[CHECK-REAL-USERS] Found ${allUsers.length} users in database`);

    // Get all user skills
    const allUserSkills = await db.select().from(userSkills).limit(50);
    console.log(`[CHECK-REAL-USERS] Found ${allUserSkills.length} user skills in database`);

    // Get users with their skills
    const usersWithSkills = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        skillName: userSkills.skillName,
        proficiencyScore: userSkills.proficiencyScore,
        mentionCount: userSkills.mentionCount,
        averageConfidence: userSkills.averageConfidence,
      })
      .from(user)
      .innerJoin(userSkills, eq(user.id, userSkills.userId))
      .limit(100);

    console.log(`[CHECK-REAL-USERS] Found ${usersWithSkills.length} user-skill combinations`);

    // Group by user
    const userSkillMap = new Map();
    usersWithSkills.forEach(row => {
      if (!userSkillMap.has(row.userId)) {
        userSkillMap.set(row.userId, {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
          skills: [],
        });
      }
      
      userSkillMap.get(row.userId).skills.push({
        name: row.skillName,
        proficiencyScore: parseFloat(row.proficiencyScore),
        mentionCount: row.mentionCount,
        averageConfidence: parseFloat(row.averageConfidence),
      });
    });

    const usersWithSkillsArray = Array.from(userSkillMap.values());

    // Get skill statistics
    const skillStats = new Map();
    usersWithSkills.forEach(row => {
      const skill = row.skillName;
      if (!skillStats.has(skill)) {
        skillStats.set(skill, {
          skillName: skill,
          userCount: 0,
          totalProficiency: 0,
          avgProficiency: 0,
        });
      }
      
      const stat = skillStats.get(skill);
      stat.userCount += 1;
      stat.totalProficiency += parseFloat(row.proficiencyScore);
      stat.avgProficiency = Math.round(stat.totalProficiency / stat.userCount);
    });

    const topSkills = Array.from(skillStats.values())
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers: allUsers.length,
          totalUserSkills: allUserSkills.length,
          usersWithSkills: usersWithSkillsArray.length,
          uniqueSkills: skillStats.size,
        },
        users: allUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
        })),
        usersWithSkills: usersWithSkillsArray.slice(0, 10), // First 10 users with skills
        topSkills,
        sampleUserSkills: usersWithSkills.slice(0, 20), // First 20 user-skill records
      },
    });

  } catch (error) {
    console.error('[CHECK-REAL-USERS] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check real users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}