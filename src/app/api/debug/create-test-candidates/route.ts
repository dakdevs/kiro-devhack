import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { user, userSkills } from '~/db/schema';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE-TEST-CANDIDATES] Starting test candidate creation');

    // Create test candidates with skills
    const testCandidates = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        skills: [
          { name: 'JavaScript', proficiency: 85 },
          { name: 'React', proficiency: 90 },
          { name: 'Node.js', proficiency: 75 },
          { name: 'TypeScript', proficiency: 80 },
          { name: 'Python', proficiency: 70 },
        ]
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        skills: [
          { name: 'Python', proficiency: 95 },
          { name: 'Django', proficiency: 85 },
          { name: 'PostgreSQL', proficiency: 80 },
          { name: 'Docker', proficiency: 75 },
          { name: 'AWS', proficiency: 70 },
        ]
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@example.com',
        skills: [
          { name: 'Java', proficiency: 90 },
          { name: 'Spring Boot', proficiency: 85 },
          { name: 'MySQL', proficiency: 80 },
          { name: 'Kubernetes', proficiency: 75 },
          { name: 'Jenkins', proficiency: 70 },
        ]
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        skills: [
          { name: 'React', proficiency: 88 },
          { name: 'Vue.js', proficiency: 82 },
          { name: 'JavaScript', proficiency: 90 },
          { name: 'CSS', proficiency: 85 },
          { name: 'HTML', proficiency: 95 },
        ]
      },
      {
        name: 'Eva Martinez',
        email: 'eva.martinez@example.com',
        skills: [
          { name: 'Python', proficiency: 85 },
          { name: 'Machine Learning', proficiency: 80 },
          { name: 'TensorFlow', proficiency: 75 },
          { name: 'Data Analysis', proficiency: 90 },
          { name: 'SQL', proficiency: 85 },
        ]
      }
    ];

    const createdCandidates = [];

    for (const candidate of testCandidates) {
      // Check if user already exists
      const existingUser = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.email, candidate.email)
      });

      let userId;
      if (existingUser) {
        userId = existingUser.id;
        console.log(`[CREATE-TEST-CANDIDATES] User ${candidate.email} already exists`);
      } else {
        // Create user
        userId = nanoid();
        await db.insert(user).values({
          id: userId,
          name: candidate.name,
          email: candidate.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[CREATE-TEST-CANDIDATES] Created user ${candidate.email}`);
      }

      // Create or update skills
      for (const skill of candidate.skills) {
        const skillId = nanoid();
        
        // Check if skill already exists for this user
        const existingSkill = await db.query.userSkills.findFirst({
          where: (skills, { eq, and }) => and(
            eq(skills.userId, userId),
            eq(skills.skillName, skill.name)
          )
        });

        if (existingSkill) {
          // Update existing skill
          await db.update(userSkills)
            .set({
              proficiencyScore: skill.proficiency.toString(),
              mentionCount: existingSkill.mentionCount + 1,
              lastMentioned: new Date(),
              updatedAt: new Date(),
            })
            .where((skills, { eq }) => eq(skills.id, existingSkill.id));
        } else {
          // Create new skill
          await db.insert(userSkills).values({
            id: skillId,
            userId: userId,
            skillName: skill.name,
            proficiencyScore: skill.proficiency.toString(),
            averageConfidence: '0.8',
            averageEngagement: 'high',
            topicDepthAverage: '0.7',
            mentionCount: 1,
            firstMentioned: new Date(),
            lastMentioned: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      createdCandidates.push({
        id: userId,
        name: candidate.name,
        email: candidate.email,
        skillsCount: candidate.skills.length
      });
    }

    console.log(`[CREATE-TEST-CANDIDATES] Created/updated ${createdCandidates.length} candidates`);

    // Invalidate candidate matching caches so new candidates appear immediately
    try {
      const { candidateMatchingService } = await import('~/services/candidate-matching');
      await candidateMatchingService.invalidateAllCandidateCaches();
      console.log('[CREATE-TEST-CANDIDATES] Invalidated candidate matching caches');
    } catch (cacheError) {
      console.warn('[CREATE-TEST-CANDIDATES] Failed to invalidate caches:', cacheError);
    }

    return NextResponse.json({
      success: true,
      data: {
        candidates: createdCandidates,
        message: `Successfully created/updated ${createdCandidates.length} test candidates with skills`
      }
    });

  } catch (error) {
    console.error('[CREATE-TEST-CANDIDATES] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test candidates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}