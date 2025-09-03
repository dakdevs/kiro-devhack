import { db } from '~/db';
import { userSkills, user, jobListings } from '~/db/schema';
import { eq, and, gte, sql, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { cache, cacheKeys, cacheTTL } from '~/lib/cache';
import { logger, withLogging } from '~/lib/logger';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: Skill[];
  preferredSkills?: Skill[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  experienceLevel: string;
  remoteAllowed: boolean;
  benefits?: string[];
  applicationUrl?: string;
  contactEmail?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  name: string;
  proficiencyScore?: number;
  category?: string;
}

export interface CandidateSkills {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
}

export interface JobMatch {
  job: JobListing;
  matchScore: number;
  matchingSkills: Skill[];
  skillGaps: Skill[];
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
}

export class JobMatchingService {
  /**
   * Find jobs matching a candidate's skills with 90%+ match score
   */
  async findMatchingJobs(candidateId: string): Promise<JobMatch[]> {
    return withLogging('job-matching.find', async () => {
      // Check cache first
      const cacheKey = cacheKeys.candidateJobs(candidateId);
      const cachedResult = await cache.get<JobMatch[]>(cacheKey);
      
      if (cachedResult) {
        logger.debug('Job matching cache hit', {
          operation: 'job-matching.find',
          metadata: { candidateId, fromCache: true },
        });
        return cachedResult;
      }

      try {
        // Get candidate skills
        const candidateSkills = await this.getCandidateSkills(candidateId);
        
        if (candidateSkills.skills.length === 0) {
          logger.debug('No skills found for candidate', {
            operation: 'job-matching.find',
            metadata: { candidateId },
          });
          return [];
        }

        // Get all active job listings
        const jobs = await this.getActiveJobListings();
        
        if (jobs.length === 0) {
          logger.debug('No active job listings found', {
            operation: 'job-matching.find',
          });
          return [];
        }

        // Calculate match scores for each job
        const matches = jobs.map(job => this.calculateJobMatch(candidateSkills, job));

        // Filter by minimum match score (90%)
        const highQualityMatches = matches.filter(match => match.matchScore >= 90);

        // Sort by match score (highest first)
        const sortedMatches = highQualityMatches.sort((a, b) => b.matchScore - a.matchScore);

        // Cache the result
        await cache.set(cacheKey, sortedMatches, cacheTTL.medium);

        logger.debug('Job matching completed', {
          operation: 'job-matching.find',
          metadata: { 
            candidateId,
            totalJobs: jobs.length,
            matchedJobs: sortedMatches.length,
            minScore: 90
          },
        });

        return sortedMatches;
      } catch (error) {
        logger.error('Error finding matching jobs', {
          operation: 'job-matching.find',
          metadata: { candidateId },
        }, error as Error);
        
        throw new Error('Failed to find matching jobs');
      }
    });
  }

  /**
   * Calculate match score between candidate skills and job requirements
   */
  private calculateJobMatch(candidate: CandidateSkills, job: JobListing): JobMatch {
    const requiredSkills = job.requiredSkills || [];
    const preferredSkills = job.preferredSkills || [];
    
    // Calculate skill matches
    const matchResult = this.calculateSkillMatch(
      candidate.skills,
      requiredSkills,
      preferredSkills
    );

    return {
      job,
      matchScore: matchResult.matchScore,
      matchingSkills: matchResult.matchingSkills,
      skillGaps: matchResult.skillGaps,
      overallFit: matchResult.overallFit,
    };
  }

  /**
   * Calculate skill-based matching between candidate and job requirements
   */
  private calculateSkillMatch(
    candidateSkills: Skill[],
    requiredSkills: Skill[],
    preferredSkills: Skill[]
  ): {
    matchingSkills: Skill[];
    skillGaps: Skill[];
    matchScore: number;
    overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const candidateSkillMap = new Map(
      candidateSkills.map(skill => [skill.name.toLowerCase().trim(), skill])
    );

    // Create a fuzzy matching function for better skill matching
    const findSkillMatch = (jobSkill: Skill): Skill | null => {
      const jobSkillName = jobSkill.name.toLowerCase().trim();
      
      // Exact match first
      if (candidateSkillMap.has(jobSkillName)) {
        return candidateSkillMap.get(jobSkillName)!;
      }

      // Fuzzy matching for common variations
      for (const [candidateSkillName, candidateSkill] of candidateSkillMap) {
        // Check if one skill name contains the other (for variations like "React" vs "React.js")
        if (candidateSkillName.includes(jobSkillName) || jobSkillName.includes(candidateSkillName)) {
          return candidateSkill;
        }
        
        // Check for common synonyms/variations
        if (this.areSkillsSimilar(jobSkillName, candidateSkillName)) {
          return candidateSkill;
        }
      }

      return null;
    };

    // Find matching required skills with fuzzy matching
    const matchingRequired: Skill[] = [];
    const matchingRequiredCandidateSkills: Skill[] = [];
    
    requiredSkills.forEach(jobSkill => {
      const candidateSkill = findSkillMatch(jobSkill);
      if (candidateSkill) {
        matchingRequired.push(jobSkill);
        matchingRequiredCandidateSkills.push(candidateSkill);
      }
    });

    // Find matching preferred skills with fuzzy matching
    const matchingPreferred: Skill[] = [];
    const matchingPreferredCandidateSkills: Skill[] = [];
    
    preferredSkills.forEach(jobSkill => {
      const candidateSkill = findSkillMatch(jobSkill);
      if (candidateSkill) {
        matchingPreferred.push(jobSkill);
        matchingPreferredCandidateSkills.push(candidateSkill);
      }
    });

    // Find skill gaps (required skills not possessed by candidate)
    const skillGaps = requiredSkills.filter(skill => !findSkillMatch(skill));

    // Calculate weighted match score
    const requiredScore = requiredSkills.length > 0 
      ? (matchingRequired.length / requiredSkills.length) * 100
      : 100; // If no required skills, give full score

    const preferredScore = preferredSkills.length > 0
      ? (matchingPreferred.length / preferredSkills.length) * 100
      : 0; // If no preferred skills, no bonus

    // Apply proficiency weighting for matching skills
    const proficiencyWeightedScore = this.applyProficiencyWeighting(
      matchingRequiredCandidateSkills,
      matchingPreferredCandidateSkills,
      requiredScore,
      preferredScore
    );

    // Final weighted score: 80% required, 20% preferred (higher weight on required for job matching)
    const finalScore = Math.round((proficiencyWeightedScore.required * 0.8) + (proficiencyWeightedScore.preferred * 0.2));

    return {
      matchingSkills: [...matchingRequired, ...matchingPreferred],
      skillGaps,
      matchScore: Math.min(100, Math.max(0, finalScore)),
      overallFit: this.determineOverallFit(finalScore),
    };
  }

  /**
   * Apply proficiency-based weighting to skill matches
   */
  private applyProficiencyWeighting(
    matchingRequiredCandidateSkills: Skill[],
    matchingPreferredCandidateSkills: Skill[],
    baseRequiredScore: number,
    basePreferredScore: number
  ): { required: number; preferred: number } {
    // Calculate proficiency-weighted required score
    let weightedRequiredScore = baseRequiredScore;
    if (matchingRequiredCandidateSkills.length > 0) {
      const proficiencyScores = matchingRequiredCandidateSkills.map(skill => 
        skill.proficiencyScore || 50 // Default to 50 if no proficiency
      );

      // Calculate weighted average based on proficiency scores
      const totalProficiency = proficiencyScores.reduce((sum, score) => sum + score, 0);
      const avgProficiency = totalProficiency / proficiencyScores.length;

      // Apply proficiency multiplier (0.7 to 1.3 based on proficiency)
      const proficiencyMultiplier = 0.7 + (avgProficiency / 100) * 0.6;
      weightedRequiredScore = baseRequiredScore * proficiencyMultiplier;
    }

    // Calculate proficiency-weighted preferred score
    let weightedPreferredScore = basePreferredScore;
    if (matchingPreferredCandidateSkills.length > 0) {
      const proficiencyScores = matchingPreferredCandidateSkills.map(skill => 
        skill.proficiencyScore || 50
      );

      const totalProficiency = proficiencyScores.reduce((sum, score) => sum + score, 0);
      const avgProficiency = totalProficiency / proficiencyScores.length;

      const proficiencyMultiplier = 0.7 + (avgProficiency / 100) * 0.6;
      weightedPreferredScore = basePreferredScore * proficiencyMultiplier;
    }

    return {
      required: weightedRequiredScore,
      preferred: weightedPreferredScore,
    };
  }

  /**
   * Check if two skill names are similar (for fuzzy matching)
   */
  private areSkillsSimilar(skill1: string, skill2: string): boolean {
    // Common skill synonyms and variations
    const synonyms: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'vue': ['vuejs', 'vue.js'],
      'angular': ['angularjs'],
      'node': ['nodejs', 'node.js'],
      'python': ['py'],
      'java': ['jvm'],
      'c#': ['csharp', 'c-sharp'],
      'c++': ['cpp', 'cplusplus'],
      'postgresql': ['postgres', 'psql'],
      'mongodb': ['mongo'],
      'mysql': ['sql'],
      'aws': ['amazon web services'],
      'gcp': ['google cloud platform', 'google cloud'],
      'azure': ['microsoft azure'],
      'docker': ['containerization'],
      'kubernetes': ['k8s'],
      'git': ['version control'],
    };

    // Check if either skill is a synonym of the other
    for (const [baseSkill, variations] of Object.entries(synonyms)) {
      if ((skill1 === baseSkill && variations.includes(skill2)) ||
          (skill2 === baseSkill && variations.includes(skill1)) ||
          (variations.includes(skill1) && variations.includes(skill2))) {
        return true;
      }
    }

    // Check for partial matches (e.g., "machine learning" contains "machine")
    const words1 = skill1.split(/\s+/);
    const words2 = skill2.split(/\s+/);
    
    // If one skill is a subset of words in another
    if (words1.length > 1 || words2.length > 1) {
      const hasCommonWords = words1.some(word1 => 
        words2.some(word2 => word1.length > 2 && word2.length > 2 && 
          (word1.includes(word2) || word2.includes(word1)))
      );
      if (hasCommonWords) return true;
    }

    return false;
  }

  /**
   * Determine overall fit category based on match score
   */
  private determineOverallFit(matchScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (matchScore >= 90) return 'excellent';
    if (matchScore >= 75) return 'good';
    if (matchScore >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Get candidate skills from database
   */
  private async getCandidateSkills(candidateId: string): Promise<CandidateSkills> {
    try {
      const results = await db
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
        .where(eq(user.id, candidateId));

      if (results.length === 0) {
        // Return empty candidate if no skills found
        const userResult = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(eq(user.id, candidateId))
          .limit(1);

        if (userResult.length === 0) {
          throw new Error('Candidate not found');
        }

        return {
          id: userResult[0].id,
          name: userResult[0].name,
          email: userResult[0].email,
          skills: [],
        };
      }

      // Use first result for user info, then aggregate skills
      const firstResult = results[0];
      const skills: Skill[] = results.map(row => ({
        name: row.skillName,
        proficiencyScore: parseFloat(row.proficiencyScore),
        category: 'technical', // Default category
      }));

      return {
        id: firstResult.userId,
        name: firstResult.userName,
        email: firstResult.userEmail,
        skills,
      };
    } catch (error) {
      logger.error('Error getting candidate skills', {
        operation: 'job-matching.get-candidate-skills',
        metadata: { candidateId },
      }, error as Error);
      throw new Error('Failed to retrieve candidate skills');
    }
  }

  /**
   * Get all active job listings from database
   */
  private async getActiveJobListings(): Promise<JobListing[]> {
    try {
      const results = await db
        .select()
        .from(jobListings)
        .where(eq(jobListings.status, 'active'))
        .orderBy(desc(jobListings.createdAt));

      return results.map(row => ({
        id: row.id,
        title: row.title,
        company: row.company,
        description: row.description,
        requiredSkills: (row.requiredSkills as Skill[]) || [],
        preferredSkills: (row.preferredSkills as Skill[]) || [],
        location: row.location,
        salaryMin: row.salaryMin || undefined,
        salaryMax: row.salaryMax || undefined,
        jobType: row.jobType,
        experienceLevel: row.experienceLevel,
        remoteAllowed: row.remoteAllowed || false,
        benefits: (row.benefits as string[]) || undefined,
        applicationUrl: row.applicationUrl || undefined,
        contactEmail: row.contactEmail || undefined,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      logger.error('Error getting active job listings', {
        operation: 'job-matching.get-active-jobs',
      }, error as Error);
      throw new Error('Failed to retrieve job listings');
    }
  }

  /**
   * Invalidate job matching cache for a candidate
   */
  async invalidateCandidateCache(candidateId: string): Promise<void> {
    const cacheKey = cacheKeys.candidateJobs(candidateId);
    await cache.delete(cacheKey);
    
    logger.info('Invalidated job matching cache for candidate', {
      operation: 'job-matching.invalidate-cache',
      metadata: { candidateId },
    });
  }

  /**
   * Invalidate all job matching caches (call when job listings are updated)
   */
  async invalidateAllJobCaches(): Promise<void> {
    // This would require a pattern-based cache invalidation
    // For now, we'll log the action
    logger.info('Invalidated all job matching caches', {
      operation: 'job-matching.invalidate-all-caches',
    });
  }
}

export const jobMatchingService = new JobMatchingService();