import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { user, userSkills } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('[CANDIDATE-QUERY-TEST] Testing direct database queries for candidates');

    // Test 1: Get all users
    const allUsers = await db.select().from(user);
    console.log(`[CANDIDATE-QUERY-TEST] Found ${allUsers.length} total users`);

    // Test 2: Get all user skills
    const allUserSkills = await db.select().from(userSkills);
    console.log(`[CANDIDATE-QUERY-TEST] Found ${allUserSkills.length} total user skills`);

    // Test 3: Get users with skills (the query used by candidate matching)
    const candidatesWithSkills = await db
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
      .innerJoin(userSkills, eq(user.id, userSkills.userId));

    console.log(`[CANDIDATE-QUERY-TEST] Found ${candidatesWithSkills.length} user-skill combinations`);

    // Test 4: Group by user (like the service does)
    const candidateMap = new Map();
    candidatesWithSkills.forEach(row => {
      if (!candidateMap.has(row.userId)) {
        candidateMap.set(row.userId, {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
          skills: [],
        });
      }
      
      candidateMap.get(row.userId).skills.push({
        name: row.skillName,
        proficiencyScore: parseFloat(row.proficiencyScore),
        category: 'technical',
      });
    });

    const candidates = Array.from(candidateMap.values());
    console.log(`[CANDIDATE-QUERY-TEST] Grouped into ${candidates.length} unique candidates`);

    // Test 5: Check for specific skills
    const skillCounts = new Map();
    candidatesWithSkills.forEach(row => {
      const skill = row.skillName.toLowerCase();
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    });

    const skillsArray = Array.from(skillCounts.entries()).sort((a, b) => b[1] - a[1]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers: allUsers.length,
          totalUserSkills: allUserSkills.length,
          userSkillCombinations: candidatesWithSkills.length,
          uniqueCandidates: candidates.length,
        },
        candidates: candidates.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          skillCount: c.skills.length,
          skills: c.skills.map(s => `${s.name} (${s.proficiencyScore}%)`),
        })),
        skillDistribution: skillsArray.slice(0, 20).map(([skill, count]) => ({
          skill,
          userCount: count,
        })),
        rawUserSkills: candidatesWithSkills.slice(0, 10).map(row => ({
          user: row.userName,
          email: row.userEmail,
          skill: row.skillName,
          proficiency: row.proficiencyScore,
          mentions: row.mentionCount,
        })),
      },
    });

  } catch (error) {
    console.error('[CANDIDATE-QUERY-TEST] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test candidate queries',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}