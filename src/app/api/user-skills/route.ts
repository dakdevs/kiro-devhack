import { NextRequest, NextResponse } from 'next/server';
import { getUserSkills, getUserSkillStats } from '~/services/user-skills';
import { skillExtractionService } from '~/services/skill-extraction';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get user skills and stats
    const [skills, stats] = await Promise.all([
      getUserSkills(userId),
      getUserSkillStats(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        skills,
      },
    });
  } catch (error) {
    console.error('Failed to get user skills:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user skills' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userQuery } = body;

    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'userQuery parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Extract skills from the user query
    console.log('🔍 Extracting skills from user query:', userQuery);
    const result = await skillExtractionService.extractSkills(userQuery, 'interview');
    
    console.log(`✅ Extracted ${result.totalSkillsFound} skills from query`);
    console.log('📋 Skills found:', result.skills.map(s => s.name).join(', '));

    // Return void (empty response with 204 No Content)
    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    console.error('❌ Failed to extract skills from user query:', error);
    return NextResponse.json(
      { error: 'Failed to extract skills from user query' },
      { status: 500 }
    );
  }
}