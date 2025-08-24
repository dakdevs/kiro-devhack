import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { userSkills, skillMentions, interviewSessions } from '~/db/schema';
import { eq, desc } from 'drizzle-orm';
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

    // Get user basic info
    const user = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user skills and stats
    const [skills, skillStats] = await Promise.all([
      getUserSkills(userId),
      getUserSkillStats(userId),
    ]);

    // Get user interview sessions
    const sessions = await db.query.interviewSessions.findMany({
      where: eq(interviewSessions.userId, userId),
      orderBy: [desc(interviewSessions.startedAt)],
    });

    // Format sessions data
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      sessionType: session.sessionType,
      title: session.title,
      description: session.description,
      duration: session.duration,
      messageCount: session.messageCount,
      averageEngagement: session.averageEngagement,
      overallScore: parseInt(session.overallScore || '0'),
      topicsExplored: session.topicsExplored,
      skillsIdentified: session.skillsIdentified,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
    }));

    // Calculate session statistics
    const sessionStats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      averageScore: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + parseInt(s.overallScore || '0'), 0) / sessions.length)
        : 0,
      totalMessages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
      averageDuration: sessions.filter(s => s.duration).length > 0
        ? Math.round(sessions.filter(s => s.duration).reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.filter(s => s.duration).length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
        },
        skills: {
          stats: skillStats,
          list: skills,
        },
        sessions: {
          stats: sessionStats,
          list: formattedSessions,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}

// Get detailed session information
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId and sessionId are required' },
        { status: 400 }
      );
    }

    // Get session details
    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Get skill mentions from this session
    const skillMentionsInSession = await db.query.skillMentions.findMany({
      where: eq(skillMentions.sessionId, sessionId),
      orderBy: [desc(skillMentions.createdAt)],
    });

    // Get the user skills referenced in this session
    const userSkillIds = [...new Set(skillMentionsInSession.map(m => m.userSkillId))];
    const sessionSkills = await Promise.all(
      userSkillIds.map(async (skillId) => {
        const skill = await db.query.userSkills.findFirst({
          where: eq(userSkills.id, skillId),
        });
        return skill;
      })
    );

    const formattedSkillMentions = skillMentionsInSession.map(mention => ({
      id: mention.id,
      skillName: sessionSkills.find(s => s?.id === mention.userSkillId)?.skillName || 'Unknown',
      mentionText: mention.mentionText,
      confidence: parseFloat(mention.confidence || '0'),
      engagementLevel: mention.engagementLevel,
      topicDepth: parseFloat(mention.topicDepth || '0'),
      conversationContext: mention.conversationContext,
      messageIndex: mention.messageIndex,
      createdAt: mention.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          sessionType: session.sessionType,
          title: session.title,
          description: session.description,
          duration: session.duration,
          messageCount: session.messageCount,
          averageEngagement: session.averageEngagement,
          overallScore: parseInt(session.overallScore || '0'),
          topicsExplored: session.topicsExplored,
          skillsIdentified: session.skillsIdentified,
          finalAnalysis: session.finalAnalysis,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        },
        skillMentions: formattedSkillMentions,
        sessionSkills: sessionSkills.filter(Boolean).map(skill => ({
          id: skill!.id,
          skillName: skill!.skillName,
          mentionCount: skill!.mentionCount,
          proficiencyScore: parseInt(skill!.proficiencyScore),
          averageConfidence: parseFloat(skill!.averageConfidence),
          averageEngagement: skill!.averageEngagement,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to get session details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session details' },
      { status: 500 }
    );
  }
}