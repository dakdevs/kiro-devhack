import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { userSkills } from '~/db/schema';
import { nanoid } from 'nanoid';

// Sample skills that match our mock jobs
const testSkills = [
  { name: 'JavaScript', proficiencyScore: 85 },
  { name: 'React', proficiencyScore: 80 },
  { name: 'Node.js', proficiencyScore: 75 },
  { name: 'TypeScript', proficiencyScore: 70 },
  { name: 'PostgreSQL', proficiencyScore: 65 },
  { name: 'HTML', proficiencyScore: 90 },
  { name: 'CSS', proficiencyScore: 85 },
  { name: 'Git', proficiencyScore: 80 },
  { name: 'Python', proficiencyScore: 60 },
  { name: 'AWS', proficiencyScore: 55 },
];

export async function POST(request: NextRequest) {
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

    console.log('🔧 Adding test skills for candidate:', session.user.id);

    // Create skill records
    const skillsToInsert = testSkills.map(skill => ({
      id: nanoid(),
      userId: session.user.id,
      skillName: skill.name,
      mentionCount: 3,
      lastMentioned: new Date(),
      proficiencyScore: skill.proficiencyScore.toString(),
      averageConfidence: '0.85',
      averageEngagement: 'high',
      topicDepthAverage: '0.7',
      firstMentioned: new Date(),
      synonyms: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert skills into database
    await db.insert(userSkills).values(skillsToInsert);

    console.log(`✅ Successfully added ${skillsToInsert.length} test skills for candidate`);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${skillsToInsert.length} test skills`,
      skillsAdded: skillsToInsert.length,
      skills: testSkills.map(s => ({ name: s.name, proficiency: s.proficiencyScore })),
      candidateId: session.user.id,
    });

  } catch (error) {
    console.error('❌ Error adding test skills:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add test skills',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}