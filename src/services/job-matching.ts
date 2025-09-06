import { eq, desc, and, sql, gte } from 'drizzle-orm';
import { db } from '~/db';
import { 
  jobPostings, 
  recruiterProfiles, 
  userSkills, 
  candidateJobMatches,
  recruiterAvailability 
} from '~/db/schema';
import { nanoid } from 'nanoid';

export interface JobMatch {
  id: string;
  jobPosting: {
    id: string;
    title: string;
    rawDescription: string;
    requiredSkills: any[];
    preferredSkills: any[];
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    location?: string;
    remoteAllowed: boolean;
    employmentType: string;
    createdAt: Date;
  };
  recruiter: {
    id: string;
    organizationName: string;
    contactEmail?: string;
    calComUsername?: string;
    calComConnected: boolean;
  };
  matchScore: number;
  matchingSkills: string[];
  skillGaps: string[];
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  hasAvailability: boolean;
  createdAt: Date;
}

export interface MatchingCriteria {
  minMatchScore?: number;
  experienceLevel?: string;
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  requiresAvailability?: boolean;
}

class JobMatchingService {
  /**
   * Find job matches for a candidate based on their skills
   */
  async findJobMatches(
    candidateId: string, 
    criteria: MatchingCriteria = {}
  ): Promise<{
    success: boolean;
    data?: JobMatch[];
    error?: string;
  }> {
    try {
      console.log('[JOB-MATCHING] Finding matches for candidate:', candidateId);
      
      // Get candidate's skills
      const candidateSkills = await db
        .select({
          skillName: userSkills.skillName,
          proficiencyScore: userSkills.proficiencyScore,
          mentionCount: userSkills.mentionCount,
        })
        .from(userSkills)
        .where(eq(userSkills.userId, candidateId))
        .orderBy(desc(userSkills.proficiencyScore));

      console.log('[JOB-MATCHING] Candidate skills:', candidateSkills.length);

      if (candidateSkills.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // Get active job postings with recruiter info
      const activeJobs = await db
        .select({
          job: jobPostings,
          recruiter: recruiterProfiles,
        })
        .from(jobPostings)
        .innerJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
        .where(eq(jobPostings.status, 'active'));

      console.log('[JOB-MATCHING] Active jobs found:', activeJobs.length);

      // Calculate matches
      const matches: JobMatch[] = [];

      for (const { job, recruiter } of activeJobs) {
        const match = await this.calculateJobMatch(candidateId, candidateSkills, job, recruiter);
        
        // Apply filtering criteria
        if (criteria.minMatchScore && match.matchScore < criteria.minMatchScore) {
          continue;
        }

        if (criteria.experienceLevel && job.experienceLevel !== criteria.experienceLevel) {
          continue;
        }

        if (criteria.location && !job.remoteAllowed && job.location !== criteria.location) {
          continue;
        }

        if (criteria.remoteOnly && !job.remoteAllowed) {
          continue;
        }

        if (criteria.salaryMin && job.salaryMax && job.salaryMax < criteria.salaryMin) {
          continue;
        }

        if (criteria.requiresAvailability && !match.hasAvailability) {
          continue;
        }

        matches.push(match);
      }

      // Sort by match score (highest first)
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Store matches in database for tracking
      await this.storeJobMatches(candidateId, matches);

      console.log('[JOB-MATCHING] Final matches:', matches.length);

      return {
        success: true,
        data: matches,
      };
    } catch (error) {
      console.error('[JOB-MATCHING] Error finding job matches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find job matches',
      };
    }
  }

  /**
   * Calculate match score between candidate and job
   */
  private async calculateJobMatch(
    candidateId: string,
    candidateSkills: any[],
    job: any,
    recruiter: any
  ): Promise<JobMatch> {
    const candidateSkillNames = candidateSkills.map(s => s.skillName.toLowerCase());
    
    // Extract required and preferred skills from job
    const requiredSkills = (job.requiredSkills || []).map((s: any) => 
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    ).filter(Boolean);
    
    const preferredSkills = (job.preferredSkills || []).map((s: any) => 
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    ).filter(Boolean);

    const allJobSkills = [...requiredSkills, ...preferredSkills];

    // Calculate matching skills
    const matchingSkills = candidateSkillNames.filter(skill => 
      allJobSkills.some(jobSkill => 
        jobSkill.includes(skill) || skill.includes(jobSkill)
      )
    );

    // Calculate skill gaps (required skills not possessed)
    const skillGaps = requiredSkills.filter(skill => 
      !candidateSkillNames.some(candidateSkill => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    );

    // Calculate match score (0-100)
    let matchScore = 0;
    
    // Base score from matching skills
    const skillMatchRatio = matchingSkills.length / Math.max(allJobSkills.length, 1);
    matchScore += skillMatchRatio * 60; // 60% weight for skill matching

    // Penalty for skill gaps in required skills
    const requiredSkillGapRatio = skillGaps.length / Math.max(requiredSkills.length, 1);
    matchScore -= requiredSkillGapRatio * 30; // 30% penalty for missing required skills

    // Bonus for high proficiency in matching skills
    const matchingSkillProficiencies = candidateSkills
      .filter(s => matchingSkills.includes(s.skillName.toLowerCase()))
      .map(s => parseFloat(s.proficiencyScore) || 0);
    
    const avgProficiency = matchingSkillProficiencies.length > 0 
      ? matchingSkillProficiencies.reduce((a, b) => a + b, 0) / matchingSkillProficiencies.length 
      : 0;
    
    matchScore += (avgProficiency / 100) * 20; // 20% weight for proficiency

    // Bonus for experience with skills (mention count)
    const avgMentionCount = candidateSkills
      .filter(s => matchingSkills.includes(s.skillName.toLowerCase()))
      .reduce((sum, s) => sum + (s.mentionCount || 0), 0) / Math.max(matchingSkills.length, 1);
    
    const mentionBonus = Math.min(avgMentionCount * 2, 10); // Max 10 points bonus
    matchScore += mentionBonus;

    // Ensure score is between 0 and 100
    matchScore = Math.max(0, Math.min(100, matchScore));

    // Determine overall fit
    let overallFit: 'excellent' | 'good' | 'fair' | 'poor';
    if (matchScore >= 80) overallFit = 'excellent';
    else if (matchScore >= 60) overallFit = 'good';
    else if (matchScore >= 40) overallFit = 'fair';
    else overallFit = 'poor';

    // Check if recruiter has availability
    const hasAvailability = await this.checkRecruiterAvailability(recruiter.id);

    return {
      id: nanoid(),
      jobPosting: {
        id: job.id,
        title: job.title,
        rawDescription: job.rawDescription,
        requiredSkills: job.requiredSkills || [],
        preferredSkills: job.preferredSkills || [],
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        location: job.location,
        remoteAllowed: job.remoteAllowed,
        employmentType: job.employmentType,
        createdAt: job.createdAt,
      },
      recruiter: {
        id: recruiter.id,
        organizationName: recruiter.organizationName,
        contactEmail: recruiter.contactEmail,
        calComUsername: recruiter.calComUsername,
        calComConnected: recruiter.calComConnected || false,
      },
      matchScore: Math.round(matchScore),
      matchingSkills,
      skillGaps,
      overallFit,
      hasAvailability,
      createdAt: new Date(),
    };
  }

  /**
   * Check if recruiter has availability set up
   */
  private async checkRecruiterAvailability(recruiterId: string): Promise<boolean> {
    try {
      const availability = await db
        .select({ id: recruiterAvailability.id })
        .from(recruiterAvailability)
        .where(and(
          eq(recruiterAvailability.recruiterId, recruiterId),
          eq(recruiterAvailability.isActive, true)
        ))
        .limit(1);

      return availability.length > 0;
    } catch (error) {
      console.warn('[JOB-MATCHING] Error checking recruiter availability:', error);
      return false;
    }
  }

  /**
   * Store job matches in database for tracking and analytics
   */
  private async storeJobMatches(candidateId: string, matches: JobMatch[]): Promise<void> {
    try {
      // Delete existing matches for this candidate to avoid duplicates
      await db
        .delete(candidateJobMatches)
        .where(eq(candidateJobMatches.candidateId, candidateId));

      // Insert new matches
      if (matches.length > 0) {
        const matchData = matches.map(match => ({
          id: match.id,
          jobPostingId: match.jobPosting.id,
          candidateId,
          matchScore: match.matchScore.toString(),
          matchingSkills: match.matchingSkills,
          skillGaps: match.skillGaps,
          overallFit: match.overallFit,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(candidateJobMatches).values(matchData);
      }
    } catch (error) {
      console.warn('[JOB-MATCHING] Error storing job matches:', error);
      // Don't throw error as this is not critical for the matching process
    }
  }

  /**
   * Get stored job matches for a candidate
   */
  async getStoredJobMatches(candidateId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const matches = await db
        .select({
          match: candidateJobMatches,
          job: jobPostings,
          recruiter: recruiterProfiles,
        })
        .from(candidateJobMatches)
        .innerJoin(jobPostings, eq(candidateJobMatches.jobPostingId, jobPostings.id))
        .innerJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
        .where(eq(candidateJobMatches.candidateId, candidateId))
        .orderBy(desc(candidateJobMatches.matchScore));

      return {
        success: true,
        data: matches,
      };
    } catch (error) {
      console.error('[JOB-MATCHING] Error getting stored matches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stored matches',
      };
    }
  }

  /**
   * Refresh matches for a candidate (recalculate based on current skills and jobs)
   */
  async refreshMatches(candidateId: string): Promise<{
    success: boolean;
    data?: JobMatch[];
    error?: string;
  }> {
    return this.findJobMatches(candidateId, { minMatchScore: 30 }); // Only show decent matches
  }
}

export const jobMatchingService = new JobMatchingService();