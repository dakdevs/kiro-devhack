import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { db } from '~/db';
import { jobPostings, recruiterProfiles } from '~/db/schema';
import { jobAnalysisService } from './job-analysis';
import { 
  JobPosting, 
  CreateJobPostingRequest, 
  UpdateJobPostingRequest,
  JobAnalysisResult,
  JobPostingStatus,
  CreateJobPostingResponse,
  JobPostingResponse,
  JobPostingsResponse,
  PaginatedResponse
} from '~/types/interview-management';
import { generateId } from '~/lib/utils';
import { cacheUtils } from '~/lib/cache';

/**
 * Service for managing job postings with AI analysis integration
 */
export class JobPostingService {
  
  /**
   * Create a new job posting with AI analysis
   */
  async createJobPosting(
    recruiterId: string, 
    data: CreateJobPostingRequest
  ): Promise<CreateJobPostingResponse> {

    
    try {
      // Verify recruiter exists

      const recruiter = await db
        .select()
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.id, recruiterId))
        .limit(1);

      if (recruiter.length === 0) {

        return {
          success: false,
          error: 'Recruiter profile not found',
        };
      }


      // Analyze the job posting with AI
      console.log('[JOB-POSTING-SERVICE] Starting AI analysis for job posting');
      let analysis;
      try {
        analysis = await jobAnalysisService.analyzeJobPosting(
          data.description, 
          data.title
        );
        console.log('[JOB-POSTING-SERVICE] AI analysis completed successfully:', analysis);
      } catch (analysisError) {
        console.error('[JOB-POSTING-SERVICE] AI analysis failed:', analysisError);
        console.error('[JOB-POSTING-SERVICE] Error type:', analysisError?.constructor?.name);
        console.error('[JOB-POSTING-SERVICE] Error has fallbackData:', !!(analysisError as any)?.fallbackData);
        
        // Check if the error has fallback data
        if ((analysisError as any)?.fallbackData) {
          console.log('[JOB-POSTING-SERVICE] Using fallback data from error');
          analysis = (analysisError as any).fallbackData;
        } else {
          console.log('[JOB-POSTING-SERVICE] Creating basic fallback analysis');
          // Create a basic fallback analysis
          analysis = {
            extractedSkills: [],
            requiredSkills: data.requiredSkills ? 
              data.requiredSkills.map(skill => ({ name: skill, required: true, category: 'technical' as const })) : [],
            preferredSkills: data.preferredSkills ?
              data.preferredSkills.map(skill => ({ name: skill, required: false, category: 'technical' as const })) : [],
            experienceLevel: data.experienceLevel || 'mid',
            salaryRange: data.salaryMin && data.salaryMax ? { min: data.salaryMin, max: data.salaryMax } : undefined,
            keyTerms: [],
            confidence: 0.3,
            summary: 'Job posting created without AI analysis due to service unavailability.'
          };
        }
      }

      // Ensure analysis is never null
      if (!analysis) {
        console.log('[JOB-POSTING-SERVICE] Analysis is null, creating emergency fallback');
        analysis = {
          extractedSkills: [],
          requiredSkills: [],
          preferredSkills: [],
          experienceLevel: 'mid',
          salaryRange: undefined,
          keyTerms: [],
          confidence: 0.1,
          summary: 'Emergency fallback: Job posting created without analysis.'
        };
      }

      console.log('[JOB-POSTING-SERVICE] Final analysis object:', analysis);

      // Generate unique ID for the job posting
      const jobId = generateId();
      console.log('[JOB-POSTING-SERVICE] Generated job ID:', jobId);

      // Prepare job posting data
      console.log('[JOB-POSTING-SERVICE] Preparing job data for database insertion');
      const jobData = {
        id: jobId,
        recruiterId,
        title: data.title,
        rawDescription: data.description,
        extractedSkills: analysis.extractedSkills,
        requiredSkills: data.requiredSkills ? 
          data.requiredSkills.map(skill => ({ name: skill, required: true, category: 'technical' as const })) :
          analysis.requiredSkills,
        preferredSkills: data.preferredSkills ?
          data.preferredSkills.map(skill => ({ name: skill, required: false, category: 'technical' as const })) :
          analysis.preferredSkills,
        experienceLevel: data.experienceLevel || analysis.experienceLevel,
        salaryMin: data.salaryMin || analysis.salaryRange?.min,
        salaryMax: data.salaryMax || analysis.salaryRange?.max,
        location: data.location || null,
        remoteAllowed: data.remoteAllowed || false,
        employmentType: data.employmentType || 'full-time',
        status: 'active' as JobPostingStatus,
        aiConfidenceScore: analysis.confidence.toFixed(2),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert into database
      console.log('[JOB-POSTING-SERVICE] Inserting job posting into database');
      console.log('[JOB-POSTING-SERVICE] Job data to insert:', JSON.stringify(jobData, null, 2));
      
      let createdJob;
      try {
        [createdJob] = await db
          .insert(jobPostings)
          .values(jobData)
          .returning();
        console.log('[JOB-POSTING-SERVICE] Database insertion successful, job ID:', createdJob?.id);
      } catch (dbError) {
        console.error('[JOB-POSTING-SERVICE] Database insertion failed:', dbError);
        throw dbError;
      }

      if (!createdJob) {
        console.log('[JOB-POSTING-SERVICE] ERROR: Failed to create job posting in database');
        return {
          success: false,
          error: 'Failed to create job posting',
        };
      }
      console.log('[JOB-POSTING-SERVICE] Job posting created successfully with ID:', createdJob.id);

      // Convert database result to JobPosting interface
      console.log('[JOB-POSTING-SERVICE] Converting database result to JobPosting interface');
      const jobPosting = this.mapDbJobToJobPosting(createdJob);

      // Invalidate related caches
      console.log('[JOB-POSTING-SERVICE] Invalidating dashboard caches for recruiter:', recruiterId);
      try {
        await cacheUtils.invalidateRecruiterDashboardCaches(recruiterId);
      } catch (cacheError) {
        console.warn('[JOB-POSTING-SERVICE] Cache invalidation failed:', cacheError);
        // Don't fail the job creation if cache invalidation fails
      }

      return {
        success: true,
        data: {
          job: jobPosting,
          analysis,
        },
      };
    } catch (error) {
      console.error('Error creating job posting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job posting',
      };
    }
  }

  /**
   * Get a job posting by ID
   */
  async getJobPosting(jobId: string, recruiterId?: string): Promise<JobPostingResponse> {
    try {
      const query = db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, jobId));

      // If recruiterId is provided, ensure the job belongs to the recruiter
      if (recruiterId) {
        query.where(and(
          eq(jobPostings.id, jobId),
          eq(jobPostings.recruiterId, recruiterId)
        ));
      }

      const [job] = await query.limit(1);

      if (!job) {
        return {
          success: false,
          error: 'Job posting not found',
        };
      }

      return {
        success: true,
        data: this.mapDbJobToJobPosting(job),
      };
    } catch (error) {
      console.error('Error fetching job posting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job posting',
      };
    }
  }

  /**
   * Get all job postings for a recruiter with pagination and filtering
   */
  async getJobPostings(
    recruiterId: string,
    options: {
      page?: number;
      limit?: number;
      status?: JobPostingStatus;
      search?: string;
    } = {}
  ): Promise<JobPostingsResponse> {
    try {
      console.log('[JOB-POSTING-SERVICE] getJobPostings called with:', { recruiterId, options });
      const { page = 1, limit = 10, status, search } = options;
      const offset = (page - 1) * limit;

      // First, let's check if there are ANY jobs in the database for debugging
      const allJobsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobPostings);
      console.log('[JOB-POSTING-SERVICE] Total jobs in database:', allJobsCount[0]?.count || 0);

      // Check jobs for this specific recruiter
      const recruiterJobsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobPostings)
        .where(eq(jobPostings.recruiterId, recruiterId));
      console.log('[JOB-POSTING-SERVICE] Jobs for recruiter', recruiterId, ':', recruiterJobsCount[0]?.count || 0);

      // Build where conditions
      const conditions = [eq(jobPostings.recruiterId, recruiterId)];
      console.log('[JOB-POSTING-SERVICE] Base condition: recruiterId =', recruiterId);

      if (status) {
        conditions.push(eq(jobPostings.status, status));
        console.log('[JOB-POSTING-SERVICE] Added status condition:', status);
      }

      if (search) {
        conditions.push(
          or(
            like(jobPostings.title, `%${search}%`),
            like(jobPostings.rawDescription, `%${search}%`),
            like(jobPostings.location, `%${search}%`)
          )
        );
        console.log('[JOB-POSTING-SERVICE] Added search condition:', search);
      }

      // Get total count
      console.log('[JOB-POSTING-SERVICE] Executing count query with conditions:', conditions.length);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobPostings)
        .where(and(...conditions));
      console.log('[JOB-POSTING-SERVICE] Total count result:', count);

      // Get paginated results
      console.log('[JOB-POSTING-SERVICE] Executing select query with limit:', limit, 'offset:', offset);
      const jobs = await db
        .select()
        .from(jobPostings)
        .where(and(...conditions))
        .orderBy(desc(jobPostings.createdAt))
        .limit(limit)
        .offset(offset);
      console.log('[JOB-POSTING-SERVICE] Raw jobs from database:', jobs.length, 'jobs found');
      
      if (jobs.length > 0) {
        console.log('[JOB-POSTING-SERVICE] First job raw data:', JSON.stringify(jobs[0], null, 2));
      }

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        data: jobs.map(job => this.mapDbJobToJobPosting(job)),
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching job postings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job postings',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  /**
   * Update a job posting
   */
  async updateJobPosting(
    jobId: string,
    recruiterId: string,
    data: UpdateJobPostingRequest
  ): Promise<JobPostingResponse> {
    try {
      // Verify job exists and belongs to recruiter
      const existingJob = await this.getJobPosting(jobId, recruiterId);
      if (!existingJob.success || !existingJob.data) {
        return existingJob;
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Update basic fields
      if (data.title !== undefined) updateData.title = data.title;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.remoteAllowed !== undefined) updateData.remoteAllowed = data.remoteAllowed;
      if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
      if (data.experienceLevel !== undefined) updateData.experienceLevel = data.experienceLevel;
      if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin;
      if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax;
      if (data.status !== undefined) updateData.status = data.status;

      // Handle skills updates
      if (data.requiredSkills !== undefined) {
        updateData.requiredSkills = data.requiredSkills.map(skill => ({ 
          name: skill, 
          required: true, 
          category: 'technical' as const 
        }));
      }

      if (data.preferredSkills !== undefined) {
        updateData.preferredSkills = data.preferredSkills.map(skill => ({ 
          name: skill, 
          required: false, 
          category: 'technical' as const 
        }));
      }

      // If description is updated, re-run AI analysis
      if (data.description !== undefined) {
        updateData.rawDescription = data.description;
        
        try {
          const analysis = await jobAnalysisService.analyzeJobPosting(
            data.description, 
            data.title || existingJob.data.title
          );

          updateData.extractedSkills = analysis.extractedSkills;
          updateData.aiConfidenceScore = analysis.confidence.toString();

          // Update AI-extracted fields if not manually specified
          if (data.requiredSkills === undefined && analysis.requiredSkills.length > 0) {
            updateData.requiredSkills = analysis.requiredSkills;
          }
          if (data.preferredSkills === undefined && analysis.preferredSkills.length > 0) {
            updateData.preferredSkills = analysis.preferredSkills;
          }
          if (data.experienceLevel === undefined && analysis.experienceLevel) {
            updateData.experienceLevel = analysis.experienceLevel;
          }
          if (data.salaryMin === undefined && analysis.salaryRange?.min) {
            updateData.salaryMin = analysis.salaryRange.min;
          }
          if (data.salaryMax === undefined && analysis.salaryRange?.max) {
            updateData.salaryMax = analysis.salaryRange.max;
          }
        } catch (analysisError) {
          console.warn('AI analysis failed during update, continuing without re-analysis:', analysisError);
        }
      }

      // Update in database
      const [updatedJob] = await db
        .update(jobPostings)
        .set(updateData)
        .where(and(
          eq(jobPostings.id, jobId),
          eq(jobPostings.recruiterId, recruiterId)
        ))
        .returning();

      if (!updatedJob) {
        return {
          success: false,
          error: 'Failed to update job posting',
        };
      }

      return {
        success: true,
        data: this.mapDbJobToJobPosting(updatedJob),
      };
    } catch (error) {
      console.error('Error updating job posting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job posting',
      };
    }
  }

  /**
   * Delete a job posting
   */
  async deleteJobPosting(jobId: string, recruiterId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify job exists and belongs to recruiter
      const existingJob = await this.getJobPosting(jobId, recruiterId);
      if (!existingJob.success) {
        return existingJob;
      }

      // Delete from database
      const result = await db
        .delete(jobPostings)
        .where(and(
          eq(jobPostings.id, jobId),
          eq(jobPostings.recruiterId, recruiterId)
        ));

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting job posting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete job posting',
      };
    }
  }

  /**
   * Update job posting status
   */
  async updateJobStatus(
    jobId: string, 
    recruiterId: string, 
    status: JobPostingStatus
  ): Promise<JobPostingResponse> {
    return this.updateJobPosting(jobId, recruiterId, { status });
  }

  /**
   * Get job posting statistics for a recruiter
   */
  async getJobPostingStats(recruiterId: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      active: number;
      paused: number;
      closed: number;
      draft: number;
    };
    error?: string;
  }> {
    console.log('[JOB-POSTING-SERVICE] Getting stats for recruiter:', recruiterId);
    
    try {
      const stats = await db
        .select({
          status: jobPostings.status,
          count: sql<number>`count(*)`,
        })
        .from(jobPostings)
        .where(eq(jobPostings.recruiterId, recruiterId))
        .groupBy(jobPostings.status);

      console.log('[JOB-POSTING-SERVICE] Raw stats from database:', stats);

      const result = {
        total: 0,
        active: 0,
        paused: 0,
        closed: 0,
        draft: 0,
      };

      stats.forEach(stat => {
        const count = parseInt(stat.count.toString(), 10);
        result.total += count;
        if (stat.status === 'active') result.active = count;
        else if (stat.status === 'paused') result.paused = count;
        else if (stat.status === 'closed') result.closed = count;
        else if (stat.status === 'draft') result.draft = count;
      });

      console.log('[JOB-POSTING-SERVICE] Calculated stats:', result);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error fetching job posting stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job posting statistics',
      };
    }
  }

  /**
   * Search job postings across all recruiters (for candidate matching)
   */
  async searchJobPostings(options: {
    skills?: string[];
    experienceLevel?: string;
    location?: string;
    remoteAllowed?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<JobPostingsResponse> {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(jobPostings.status, 'active')];

      if (options.experienceLevel) {
        conditions.push(eq(jobPostings.experienceLevel, options.experienceLevel));
      }

      if (options.location) {
        conditions.push(
          or(
            like(jobPostings.location, `%${options.location}%`),
            eq(jobPostings.remoteAllowed, true)
          )
        );
      }

      if (options.remoteAllowed) {
        conditions.push(eq(jobPostings.remoteAllowed, true));
      }

      if (options.salaryMin) {
        conditions.push(sql`${jobPostings.salaryMax} >= ${options.salaryMin}`);
      }

      if (options.salaryMax) {
        conditions.push(sql`${jobPostings.salaryMin} <= ${options.salaryMax}`);
      }

      // TODO: Add skill-based filtering using JSONB queries
      // This would require more complex SQL for matching skills in the JSONB arrays

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobPostings)
        .where(and(...conditions));

      // Get paginated results
      const jobs = await db
        .select()
        .from(jobPostings)
        .where(and(...conditions))
        .orderBy(desc(jobPostings.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        data: jobs.map(job => this.mapDbJobToJobPosting(job)),
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error searching job postings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search job postings',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  /**
   * Extract skills from job description using comprehensive skill extraction
   */
  async extractSkillsFromDescription(description: string, title?: string): Promise<{
    skills: Array<{ name: string; required: boolean; category: string }>;
    confidence: number;
  }> {
    try {
      // Import the comprehensive skill extraction service
      const { skillExtractionService } = await import('./skill-extraction');
      
      // Use the comprehensive skill extraction
      const result = await skillExtractionService.extractSkills(description, 'job_posting');
      
      // Convert to the expected format for job postings
      const skills = result.skills.map(skill => ({
        name: skill.name,
        required: skill.confidence > 0.7, // High confidence skills are considered required
        category: skill.category
      }));

      return {
        skills,
        confidence: result.confidence
      };
    } catch (error) {
      console.warn('⚠️ Comprehensive skill extraction failed, using fallback:', error);
      
      // Fallback to basic job analysis service
      try {
        const analysis = await jobAnalysisService.analyzeJobPosting(description, title);
        const skills = [
          ...analysis.requiredSkills.map(skill => ({ ...skill, required: true })),
          ...analysis.preferredSkills.map(skill => ({ ...skill, required: false }))
        ];
        
        return {
          skills,
          confidence: analysis.confidence
        };
      } catch (fallbackError) {
        console.error('Both skill extraction methods failed:', fallbackError);
        return {
          skills: [],
          confidence: 0.1
        };
      }
    }
  }

  /**
   * Map database job posting to JobPosting interface
   */
  private mapDbJobToJobPosting(dbJob: any): JobPosting {
    console.log('[JOB-POSTING-SERVICE] Mapping database job to JobPosting interface');
    console.log('[JOB-POSTING-SERVICE] dbJob object:', JSON.stringify(dbJob, null, 2));
    
    if (!dbJob) {
      console.error('[JOB-POSTING-SERVICE] ERROR: dbJob is null or undefined');
      throw new Error('Database job object is null or undefined');
    }
    
    // Handle both camelCase and snake_case property names
    const title = dbJob.title || dbJob.title;
    const recruiterId = dbJob.recruiterId || dbJob.recruiter_id;
    const rawDescription = dbJob.rawDescription || dbJob.raw_description;
    const extractedSkills = dbJob.extractedSkills || dbJob.extracted_skills || [];
    const requiredSkills = dbJob.requiredSkills || dbJob.required_skills || [];
    const preferredSkills = dbJob.preferredSkills || dbJob.preferred_skills || [];
    const experienceLevel = dbJob.experienceLevel || dbJob.experience_level;
    const salaryMin = dbJob.salaryMin || dbJob.salary_min;
    const salaryMax = dbJob.salaryMax || dbJob.salary_max;
    const remoteAllowed = dbJob.remoteAllowed || dbJob.remote_allowed || false;
    const employmentType = dbJob.employmentType || dbJob.employment_type || 'full-time';
    const aiConfidenceScore = dbJob.aiConfidenceScore || dbJob.ai_confidence_score;
    const createdAt = dbJob.createdAt || dbJob.created_at;
    const updatedAt = dbJob.updatedAt || dbJob.updated_at;
    
    if (!title) {
      console.error('[JOB-POSTING-SERVICE] ERROR: Job title is missing');
      console.error('[JOB-POSTING-SERVICE] Available properties:', Object.keys(dbJob));
      throw new Error('Job title is missing from database result');
    }
    
    return {
      id: dbJob.id,
      recruiterId,
      title,
      rawDescription,
      extractedSkills,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      salaryMin,
      salaryMax,
      location: dbJob.location,
      remoteAllowed,
      employmentType,
      status: dbJob.status as JobPostingStatus,
      aiConfidenceScore: aiConfidenceScore ? parseFloat(aiConfidenceScore) : undefined,
      createdAt,
      updatedAt,
    };
  }
}

// Export a singleton instance
export const jobPostingService = new JobPostingService();