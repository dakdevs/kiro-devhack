import { NextRequest, NextResponse } from 'next/server';
import { getUserSkills, getUserSkillStats } from '~/services/user-skills';

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