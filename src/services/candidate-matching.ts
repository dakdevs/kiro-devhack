import { db } from '~/db';
import { userSkills, user, jobPostings, candidateJobMatches } from '~/db/schema';
import { eq, and, gte, sql, desc, asc } from 'drizzle-orm';
import { 
  CandidateWithMatch, 
  CandidateFilters, 
  Skill, 
  OverallFit,
  JobPosting,
  CandidateJobMatch
} from '~/types/interview-management';
import { nanoid } from 'nanoid';
import { cache, cacheKeys, cacheTTL, cacheUtils } from '~/lib/cache';
import { rateLimiters, rateLimit } from '~/lib/rate-limiter';
import { paginationHelpers, PaginationParams, PaginationResult } from '~/lib/pagination';
import { logger, withLogging } from '~/lib/logger';

export interface CandidateWithSkills {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
  experienceLevel?: string;
  location?: string;
}

export interface SkillMatchResult {
  matchingSkills: Skill[];
  skillGaps: Skill[];
  matchScore: number;
  overallFit: OverallFit;
}

export class CandidateMatchingService {
  /**
   * Find and rank candidates matching a job posting with pagination
   */
  async findMatchingCandidates(
    jobPosting: JobPosting,
    filters?: CandidateFilters,
    pagination?: PaginationParams
  ): Promise<PaginationResult<CandidateWithMatch>> {
    // Apply rate limiting
    const identifier = jobPosting.recruiterId || 'default';
    const limitInfo = await rateLimiters.candidateMatching.checkLimit(identifier);
    
    if (limitInfo.isBlocked) {
      throw new Error(`Rate limit exceeded for candidate matching. Try again in ${Math.ceil(limitInfo.msBeforeNext / 1000)} seconds.`);
    }
    return withLogging('candidate-matching.find', async () => {
      // Check cache first
      const cacheKey = cacheKeys.jobCandidates(
        jobPosting.id, 
        pagination?.page || 1
      );
      
      const cachedResult = await cache.get<PaginationResult<CandidateWithMatch>>(cacheKey);
      if (cachedResult && !filters) {
        logger.debug('Candidate matching cache hit', {
          operation: 'candidate-matching.find',
          metadata: { jobId: jobPosting.id, fromCache: true },
        });
        return cachedResult;
      }

      try {
        // Get paginated candidates with their skills
        const candidatesResult = await this.getCandidatesWithSkillsPaginated(filters, pagination);
        
        if (candidatesResult.data.length === 0) {
          const emptyResult = paginationHelpers.candidates.createResult([], 0, 1, 20);
          return emptyResult;
        }

        // Calculate match scores for each candidate
        const matches = await Promise.all(
          candidatesResult.data.map(candidate => this.calculateCandidateMatch(candidate, jobPosting))
        );

        // Filter by minimum match score if specified
        const minScore = filters?.minMatchScore || 10; // Default 10% minimum (lowered to catch more candidates)
        
        // Debug logging
        console.log(`🔍 Debug: Found ${matches.length} candidates before filtering`);
        matches.forEach(match => {
          console.log(`   - ${match.candidate.name}: ${match.match.score}% (${match.match.matchingSkills.length} matching skills)`);
        });
        console.log(`🔍 Debug: Applying minimum score filter: ${minScore}%`);
        
        const filteredMatches = matches.filter(match => match.match.score >= minScore);
        
        console.log(`🔍 Debug: ${filteredMatches.length} candidates after filtering`);

        // Sort by match score (highest first)
        const sortedMatches = filteredMatches.sort((a, b) => b.match.score - a.match.score);

        // Create paginated result
        const result = paginationHelpers.candidates.createResult(
          sortedMatches,
          candidatesResult.pagination.total,
          candidatesResult.pagination.page,
          candidatesResult.pagination.limit
        );

        // Cache the result if no filters applied
        if (!filters) {
          await cache.set(cacheKey, result, cacheTTL.medium);
        }

        logger.debug('Candidate matching completed', {
          operation: 'candidate-matching.find',
          metadata: { 
            jobId: jobPosting.id, 
            totalCandidates: candidatesResult.pagination.total,
            matchedCandidates: sortedMatches.length,
            cached: !filters
          },
        });

        // Record successful rate limit usage
        await rateLimiters.candidateMatching.recordRequest(identifier, true);

        return result;
      } catch (error) {
        logger.error('Error finding matching candidates', {
          operation: 'candidate-matching.find',
          metadata: { jobId: jobPosting.id },
        }, error as Error);
        
        // Record failed rate limit usage
        await rateLimiters.candidateMatching.recordRequest(identifier, false);
        
        throw new Error('Failed to find matching candidates');
      }
    });
  }

  /**
   * Calculate match score and details for a specific candidate and job
   */
  async calculateCandidateMatch(
    candidate: CandidateWithSkills,
    jobPosting: JobPosting
  ): Promise<CandidateWithMatch> {
    // Check cache first
    const cacheKey = cacheKeys.candidateMatching(jobPosting.id, candidate.id);
    const cachedMatch = await cache.get<CandidateWithMatch>(cacheKey);
    
    if (cachedMatch) {
      return cachedMatch;
    }
    const requiredSkills = (jobPosting.requiredSkills as Skill[]) || [];
    const preferredSkills = (jobPosting.preferredSkills as Skill[]) || [];
    
    // Calculate skill matches
    const matchResult = this.calculateSkillMatch(
      candidate.skills,
      requiredSkills,
      preferredSkills
    );

    // Get candidate availability (placeholder for now)
    const availability = await this.getCandidateAvailability(candidate.id);

    const result = {
      candidate,
      match: {
        score: matchResult.matchScore,
        matchingSkills: matchResult.matchingSkills,
        skillGaps: matchResult.skillGaps,
        overallFit: matchResult.overallFit,
        availability,
      },
    };

    // Cache the result
    await cache.set(cacheKey, result, cacheTTL.medium);

    return result;
  }

  /**
   * Calculate skill-based matching between candidate and job requirements
   */
  private calculateSkillMatch(
    candidateSkills: Skill[],
    requiredSkills: Skill[],
    preferredSkills: Skill[]
  ): SkillMatchResult {
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

    // Create maps with the actual matching candidate skills for proficiency weighting
    const matchingRequiredCandidateMap = new Map(
      matchingRequiredCandidateSkills.map(skill => [skill.name.toLowerCase().trim(), skill])
    );
    const matchingPreferredCandidateMap = new Map(
      matchingPreferredCandidateSkills.map(skill => [skill.name.toLowerCase().trim(), skill])
    );

    // Apply proficiency weighting for matching skills
    const proficiencyWeightedScore = this.applyProficiencyWeightingWithCandidateSkills(
      matchingRequired,
      matchingPreferred,
      matchingRequiredCandidateSkills,
      matchingPreferredCandidateSkills,
      requiredScore,
      preferredScore
    );

    // Final weighted score: 70% required, 30% preferred
    const finalScore = Math.round((proficiencyWeightedScore.required * 0.7) + (proficiencyWeightedScore.preferred * 0.3));

    return {
      matchingSkills: [...matchingRequired, ...matchingPreferred],
      skillGaps,
      matchScore: Math.min(100, Math.max(0, finalScore)),
      overallFit: this.determineOverallFit(finalScore),
    };
  }

  /**
   * Apply proficiency-based weighting to skill matches using actual candidate skills
   */
  private applyProficiencyWeightingWithCandidateSkills(
    matchingRequiredJobSkills: Skill[],
    matchingPreferredJobSkills: Skill[],
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

      // Apply proficiency multiplier (0.7 to 1.3 based on proficiency for more range)
      const proficiencyMultiplier = 0.7 + (avgProficiency / 100) * 0.6;
      weightedRequiredScore = baseRequiredScore * proficiencyMultiplier;

      logger.debug('Required skills proficiency weighting', {
        operation: 'candidate-matching.proficiency-weighting',
        metadata: {
          matchingSkills: matchingRequiredCandidateSkills.length,
          avgProficiency,
          multiplier: proficiencyMultiplier,
          baseScore: baseRequiredScore,
          weightedScore: weightedRequiredScore,
          skillDetails: matchingRequiredCandidateSkills.map(s => ({ name: s.name, proficiency: s.proficiencyScore }))
        }
      });
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

      logger.debug('Preferred skills proficiency weighting', {
        operation: 'candidate-matching.proficiency-weighting',
        metadata: {
          matchingSkills: matchingPreferredCandidateSkills.length,
          avgProficiency,
          multiplier: proficiencyMultiplier,
          baseScore: basePreferredScore,
          weightedScore: weightedPreferredScore,
          skillDetails: matchingPreferredCandidateSkills.map(s => ({ name: s.name, proficiency: s.proficiencyScore }))
        }
      });
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
  private determineOverallFit(matchScore: number): OverallFit {
    if (matchScore >= 80) return 'excellent';
    if (matchScore >= 60) return 'good';
    if (matchScore >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Get candidates with their skills with pagination
   */
  private async getCandidatesWithSkillsPaginated(
    filters?: CandidateFilters,
    pagination?: PaginationParams
  ): Promise<PaginationResult<CandidateWithSkills>> {
    const helper = paginationHelpers.candidates;
    const params = helper.validateParams(pagination || {});
    const offset = helper.getOffset(params.page, params.limit);

    try {
      // Build base query for users with skills
      let query = db
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

      // Apply skill filters if specified
      if (filters?.skills && filters.skills.length > 0) {
        const skillConditions = filters.skills.map(skill =>
          sql`LOWER(${userSkills.skillName}) = LOWER(${skill})`
        );
        query = query.where(sql`(${sql.join(skillConditions, sql` OR `)})`);
      }

      // Get total count for pagination
      const countQuery = db
        .select({ count: sql<number>`count(distinct ${user.id})` })
        .from(user)
        .innerJoin(userSkills, eq(user.id, userSkills.userId));

      if (filters?.skills && filters.skills.length > 0) {
        const skillConditions = filters.skills.map(skill =>
          sql`LOWER(${userSkills.skillName}) = LOWER(${skill})`
        );
        countQuery.where(sql`(${sql.join(skillConditions, sql` OR `)})`);
      }

      // First get distinct users with pagination
      const usersQuery = db
        .select({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        })
        .from(user)
        .innerJoin(userSkills, eq(user.id, userSkills.userId))
        .groupBy(user.id, user.name, user.email)
        .limit(params.limit)
        .offset(offset);

      // Apply skill filters to user selection if specified
      if (filters?.skills && filters.skills.length > 0) {
        const skillConditions = filters.skills.map(skill =>
          sql`LOWER(${userSkills.skillName}) = LOWER(${skill})`
        );
        usersQuery.where(sql`(${sql.join(skillConditions, sql` OR `)})`);
      }

      const [users, countResult] = await Promise.all([
        usersQuery,
        countQuery
      ]);

      // Now get all skills for these users
      const userIds = users.map(u => u.userId);
      const results = userIds.length > 0 ? await db
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
        .where(sql`${user.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`) : [];

      const total = countResult[0]?.count || 0;

      // Group results by user and aggregate skills
      const candidateMap = new Map<string, CandidateWithSkills>();

      for (const row of results) {
        const candidateId = row.userId;
        
        if (!candidateMap.has(candidateId)) {
          candidateMap.set(candidateId, {
            id: candidateId,
            name: row.userName,
            email: row.userEmail,
            skills: [],
          });
        }

        const candidate = candidateMap.get(candidateId)!;
        candidate.skills.push({
          name: row.skillName,
          proficiencyScore: parseFloat(row.proficiencyScore),
          category: 'technical', // Default category, could be enhanced
        });
      }

      const candidates = Array.from(candidateMap.values());
      return helper.createResult(candidates, total, params.page, params.limit);
    } catch (error) {
      logger.error('Error getting paginated candidates with skills', {
        operation: 'candidate-matching.get-paginated',
      }, error as Error);
      throw new Error('Failed to retrieve candidates');
    }
  }

  /**
   * Get candidates with their skills, applying filters
   */
  private async getCandidatesWithSkills(filters?: CandidateFilters): Promise<CandidateWithSkills[]> {
    try {
      // Build base query for users with skills
      let query = db
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

      // Apply skill filters if specified
      if (filters?.skills && filters.skills.length > 0) {
        const skillConditions = filters.skills.map(skill =>
          sql`LOWER(${userSkills.skillName}) = LOWER(${skill})`
        );
        query = query.where(sql`(${sql.join(skillConditions, sql` OR `)})`);
      }

      const results = await query;

      // Group results by user and aggregate skills
      const candidateMap = new Map<string, CandidateWithSkills>();

      for (const row of results) {
        const candidateId = row.userId;
        
        if (!candidateMap.has(candidateId)) {
          candidateMap.set(candidateId, {
            id: candidateId,
            name: row.userName,
            email: row.userEmail,
            skills: [],
          });
        }

        const candidate = candidateMap.get(candidateId)!;
        candidate.skills.push({
          name: row.skillName,
          proficiencyScore: parseFloat(row.proficiencyScore),
          category: 'technical', // Default category, could be enhanced
        });
      }

      return Array.from(candidateMap.values());
    } catch (error) {
      console.error('Error getting candidates with skills:', error);
      throw new Error('Failed to retrieve candidates');
    }
  }

  /**
   * Get candidate availability (placeholder implementation)
   */
  private async getCandidateAvailability(candidateId: string) {
    // This will be implemented when availability system is integrated
    // For now, return empty array
    return [];
  }

  /**
   * Store or update candidate job match in database
   */
  async storeCandidateMatch(
    jobPostingId: string,
    candidateId: string,
    matchResult: SkillMatchResult
  ): Promise<CandidateJobMatch> {
    try {
      const matchId = nanoid();
      
      const matchData = {
        id: matchId,
        jobPostingId,
        candidateId,
        matchScore: matchResult.matchScore.toString(),
        matchingSkills: JSON.stringify(matchResult.matchingSkills),
        skillGaps: JSON.stringify(matchResult.skillGaps),
        overallFit: matchResult.overallFit,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Check if match already exists
      const existingMatch = await db
        .select()
        .from(candidateJobMatches)
        .where(
          and(
            eq(candidateJobMatches.jobPostingId, jobPostingId),
            eq(candidateJobMatches.candidateId, candidateId)
          )
        )
        .limit(1);

      if (existingMatch.length > 0) {
        // Update existing match
        await db
          .update(candidateJobMatches)
          .set({
            matchScore: matchData.matchScore,
            matchingSkills: matchData.matchingSkills,
            skillGaps: matchData.skillGaps,
            overallFit: matchData.overallFit,
            updatedAt: matchData.updatedAt,
          })
          .where(eq(candidateJobMatches.id, existingMatch[0].id));

        return {
          ...existingMatch[0],
          matchScore: matchResult.matchScore,
          matchingSkills: matchResult.matchingSkills,
          skillGaps: matchResult.skillGaps,
          overallFit: matchResult.overallFit,
          updatedAt: matchData.updatedAt,
        };
      } else {
        // Insert new match
        await db.insert(candidateJobMatches).values(matchData);

        return {
          id: matchId,
          jobPostingId,
          candidateId,
          matchScore: matchResult.matchScore,
          matchingSkills: matchResult.matchingSkills,
          skillGaps: matchResult.skillGaps,
          overallFit: matchResult.overallFit,
          createdAt: matchData.createdAt,
          updatedAt: matchData.updatedAt,
        };
      }
    } catch (error) {
      console.error('Error storing candidate match:', error);
      throw new Error('Failed to store candidate match');
    }
  }

  /**
   * Get stored matches for a job posting
   */
  async getStoredMatches(jobPostingId: string): Promise<CandidateJobMatch[]> {
    try {
      const matches = await db
        .select()
        .from(candidateJobMatches)
        .where(eq(candidateJobMatches.jobPostingId, jobPostingId))
        .orderBy(desc(candidateJobMatches.matchScore));

      return matches.map(match => ({
        ...match,
        matchScore: parseFloat(match.matchScore),
        matchingSkills: match.matchingSkills ? JSON.parse(match.matchingSkills as string) : [],
        skillGaps: match.skillGaps ? JSON.parse(match.skillGaps as string) : [],
      }));
    } catch (error) {
      console.error('Error getting stored matches:', error);
      throw new Error('Failed to retrieve stored matches');
    }
  }

  /**
   * Perform skill gap analysis for a candidate against job requirements
   */
  async analyzeSkillGaps(
    candidateId: string,
    jobPostingId: string
  ): Promise<{
    criticalGaps: Skill[];
    minorGaps: Skill[];
    strengths: Skill[];
    recommendations: string[];
  }> {
    try {
      // Get job posting
      const job = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, jobPostingId))
        .limit(1);

      if (job.length === 0) {
        throw new Error('Job posting not found');
      }

      // Get candidate skills
      const candidateSkills = await db
        .select()
        .from(userSkills)
        .where(eq(userSkills.userId, candidateId));

      const requiredSkills = (job[0].requiredSkills as Skill[]) || [];
      const preferredSkills = (job[0].preferredSkills as Skill[]) || [];
      
      const candidateSkillMap = new Map(
        candidateSkills.map(skill => [
          skill.skillName.toLowerCase(),
          {
            name: skill.skillName,
            proficiencyScore: parseFloat(skill.proficiencyScore),
          }
        ])
      );

      // Identify critical gaps (missing required skills)
      const criticalGaps = requiredSkills.filter(skill =>
        !candidateSkillMap.has(skill.name.toLowerCase())
      );

      // Identify minor gaps (missing preferred skills)
      const minorGaps = preferredSkills.filter(skill =>
        !candidateSkillMap.has(skill.name.toLowerCase())
      );

      // Identify strengths (skills with high proficiency)
      const strengths = Array.from(candidateSkillMap.values())
        .filter(skill => skill.proficiencyScore >= 70)
        .map(skill => ({ name: skill.name, proficiencyScore: skill.proficiencyScore }));

      // Generate recommendations
      const recommendations = this.generateSkillRecommendations(
        criticalGaps,
        minorGaps,
        strengths
      );

      return {
        criticalGaps,
        minorGaps,
        strengths,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      throw new Error('Failed to analyze skill gaps');
    }
  }

  /**
   * Generate skill development recommendations
   */
  private generateSkillRecommendations(
    criticalGaps: Skill[],
    minorGaps: Skill[],
    strengths: Skill[]
  ): string[] {
    const recommendations: string[] = [];

    if (criticalGaps.length > 0) {
      recommendations.push(
        `Focus on developing these critical skills: ${criticalGaps.map(s => s.name).join(', ')}`
      );
    }

    if (minorGaps.length > 0 && minorGaps.length <= 3) {
      recommendations.push(
        `Consider learning these preferred skills to stand out: ${minorGaps.map(s => s.name).join(', ')}`
      );
    }

    if (strengths.length > 0) {
      recommendations.push(
        `Highlight your strong skills: ${strengths.slice(0, 3).map(s => s.name).join(', ')}`
      );
    }

    if (criticalGaps.length === 0 && minorGaps.length === 0) {
      recommendations.push('Excellent match! You meet all the requirements for this position.');
    }

    return recommendations;
  }

  /**
   * Batch calculate matches for multiple candidates
   */
  async batchCalculateMatches(
    candidates: CandidateWithSkills[],
    jobPosting: JobPosting
  ): Promise<CandidateWithMatch[]> {
    return withLogging('candidate-matching.batch-calculate', async () => {
      // Process in chunks to avoid overwhelming the system
      const chunkSize = 10;
      const results: CandidateWithMatch[] = [];

      for (let i = 0; i < candidates.length; i += chunkSize) {
        const chunk = candidates.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(candidate => this.calculateCandidateMatch(candidate, jobPosting))
        );
        results.push(...chunkResults);
      }

      return results;
    });
  }

  /**
   * Precompute and cache matches for a job posting
   */
  async precomputeMatches(jobPosting: JobPosting): Promise<void> {
    return withLogging('candidate-matching.precompute', async () => {
      const candidates = await this.getCandidatesWithSkills();
      
      // Process in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        await this.batchCalculateMatches(batch, jobPosting);
      }

      logger.info('Precomputed matches for job posting', {
        operation: 'candidate-matching.precompute',
        metadata: { 
          jobId: jobPosting.id,
          candidateCount: candidates.length
        },
      });
    });
  }

  /**
   * Invalidate caches for a job posting
   */
  async invalidateJobCaches(jobId: string): Promise<void> {
    await cacheUtils.invalidateJobCaches(jobId);
    
    // Also invalidate individual candidate match caches
    // This would require knowing all candidate IDs, so we'll implement a pattern-based invalidation
    logger.info('Invalidated caches for job posting', {
      operation: 'candidate-matching.invalidate-cache',
      metadata: { jobId },
    });
  }

  /**
   * Invalidate all candidate matching caches (call when new candidates/skills are added)
   */
  async invalidateAllCandidateCaches(): Promise<void> {
    try {
      // This would ideally use a pattern-based cache invalidation
      // For now, we'll clear specific cache patterns
      logger.info('Invalidating all candidate matching caches', {
        operation: 'candidate-matching.invalidate-all-caches',
      });
      
      // In a production system, you'd want to implement pattern-based cache clearing
      // For now, this serves as a placeholder for when new candidates are added
    } catch (error) {
      logger.error('Error invalidating candidate caches', {
        operation: 'candidate-matching.invalidate-all-caches',
      }, error as Error);
    }
  }

  /**
   * Get matching statistics for monitoring
   */
  async getMatchingStats(): Promise<{
    totalMatches: number;
    averageMatchScore: number;
    cacheHitRate: number;
  }> {
    // This would be implemented with proper metrics collection
    return {
      totalMatches: 1000,
      averageMatchScore: 65.5,
      cacheHitRate: 0.80,
    };
  }
}

// Export singleton instance
export const candidateMatchingService = new CandidateMatchingService();