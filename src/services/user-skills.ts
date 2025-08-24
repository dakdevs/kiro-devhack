import { db } from '~/db';
import { userSkills, skillMentions, interviewSessions } from '~/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface UserSkillSummary {
  id: string;
  skillName: string;
  mentionCount: number;
  proficiencyScore: number;
  averageConfidence: number;
  averageEngagement: string;
  topicDepthAverage: number;
  firstMentioned: Date;
  lastMentioned: Date;
  recentMentions?: SkillMentionDetail[];
}

export interface SkillMentionDetail {
  id: number;
  mentionText: string | null;
  confidence: number;
  engagementLevel: string | null;
  topicDepth: number;
  conversationContext: string | null;
  createdAt: Date;
}

/**
 * Get all skills for a specific user, ordered by proficiency score
 */
export async function getUserSkills(userId: string): Promise<UserSkillSummary[]> {
  try {
    const skills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
      orderBy: [desc(userSkills.proficiencyScore), desc(userSkills.mentionCount)],
    });

    return skills.map(skill => ({
      id: skill.id,
      skillName: skill.skillName,
      mentionCount: skill.mentionCount,
      proficiencyScore: parseInt(skill.proficiencyScore),
      averageConfidence: parseFloat(skill.averageConfidence),
      averageEngagement: skill.averageEngagement,
      topicDepthAverage: parseFloat(skill.topicDepthAverage),
      firstMentioned: skill.firstMentioned,
      lastMentioned: skill.lastMentioned,
    }));
  } catch (error) {
    console.error('Failed to get user skills:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific user skill including recent mentions
 */
export async function getUserSkillDetails(userId: string, skillName: string): Promise<UserSkillSummary | null> {
  try {
    const skill = await db.query.userSkills.findFirst({
      where: and(
        eq(userSkills.userId, userId),
        eq(userSkills.skillName, skillName)
      ),
    });

    if (!skill) return null;

    // Get recent mentions for this skill
    const mentions = await db.query.skillMentions.findMany({
      where: eq(skillMentions.userSkillId, skill.id),
      orderBy: [desc(skillMentions.createdAt)],
      limit: 10,
    });

    const recentMentions: SkillMentionDetail[] = mentions.map(mention => ({
      id: mention.id,
      mentionText: mention.mentionText,
      confidence: parseFloat(mention.confidence || '0'),
      engagementLevel: mention.engagementLevel,
      topicDepth: parseFloat(mention.topicDepth || '0'),
      conversationContext: mention.conversationContext,
      createdAt: mention.createdAt,
    }));

    return {
      id: skill.id,
      skillName: skill.skillName,
      mentionCount: skill.mentionCount,
      proficiencyScore: parseInt(skill.proficiencyScore),
      averageConfidence: parseFloat(skill.averageConfidence),
      averageEngagement: skill.averageEngagement,
      topicDepthAverage: parseFloat(skill.topicDepthAverage),
      firstMentioned: skill.firstMentioned,
      lastMentioned: skill.lastMentioned,
      recentMentions,
    };
  } catch (error) {
    console.error('Failed to get user skill details:', error);
    throw error;
  }
}

/**
 * Get top skills across all users (for analytics)
 */
export async function getTopSkills(limit: number = 20): Promise<Array<{
  skillName: string;
  userCount: number;
  totalMentions: number;
  averageProficiency: number;
}>> {
  try {
    // This would require a more complex query in a real scenario
    // For now, we'll get all skills and aggregate in memory
    const allSkills = await db.query.userSkills.findMany({
      orderBy: [desc(userSkills.proficiencyScore)],
    });

    const skillMap = new Map<string, {
      userCount: number;
      totalMentions: number;
      totalProficiency: number;
    }>();

    allSkills.forEach(skill => {
      const existing = skillMap.get(skill.skillName) || {
        userCount: 0,
        totalMentions: 0,
        totalProficiency: 0,
      };

      existing.userCount += 1;
      existing.totalMentions += skill.mentionCount;
      existing.totalProficiency += parseInt(skill.proficiencyScore);

      skillMap.set(skill.skillName, existing);
    });

    return Array.from(skillMap.entries())
      .map(([skillName, data]) => ({
        skillName,
        userCount: data.userCount,
        totalMentions: data.totalMentions,
        averageProficiency: Math.round(data.totalProficiency / data.userCount),
      }))
      .sort((a, b) => b.totalMentions - a.totalMentions)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get top skills:', error);
    throw error;
  }
}

/**
 * Get user skill statistics
 */
export async function getUserSkillStats(userId: string): Promise<{
  totalSkills: number;
  averageProficiency: number;
  topSkill: string | null;
  totalMentions: number;
  skillsAbove80: number;
}> {
  try {
    const skills = await getUserSkills(userId);

    if (skills.length === 0) {
      return {
        totalSkills: 0,
        averageProficiency: 0,
        topSkill: null,
        totalMentions: 0,
        skillsAbove80: 0,
      };
    }

    const totalMentions = skills.reduce((sum, skill) => sum + skill.mentionCount, 0);
    const averageProficiency = Math.round(
      skills.reduce((sum, skill) => sum + skill.proficiencyScore, 0) / skills.length
    );
    const skillsAbove80 = skills.filter(skill => skill.proficiencyScore >= 80).length;

    return {
      totalSkills: skills.length,
      averageProficiency,
      topSkill: skills[0]?.skillName || null,
      totalMentions,
      skillsAbove80,
    };
  } catch (error) {
    console.error('Failed to get user skill stats:', error);
    throw error;
  }
}