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
      const analysis = await jobAnalysisService.analyzeJobPosting(
        data.description, 
        data.title
      );

      // Generate unique ID for the job posting
      const jobId = generateId();

      // Prepare job posting data
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
        location: data.location,
        remoteAllowed: data.remoteAllowed || false,
        employmentType: data.employmentType || 'full-time',
        status: 'active' as JobPostingStatus,
        aiConfidenceScore: analysis.confidence.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert into database
      const [createdJob] = await db
        .insert(jobPostings)
        .values(jobData)
        .returning();

      if (!createdJob) {
        return {
          success: false,
          error: 'Failed to create job posting',
        };
      }

      // Convert database result to JobPosting interface
      const jobPosting = this.mapDbJobToJobPosting(createdJob);

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
      const { page = 1, limit = 10, status, search } = options;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(jobPostings.recruiterId, recruiterId)];

      if (status) {
        conditions.push(eq(jobPostings.status, status));
      }

      if (search) {
        conditions.push(
          or(
            like(jobPostings.title, `%${search}%`),
            like(jobPostings.rawDescription, `%${search}%`),
            like(jobPostings.location, `%${search}%`)
          )
        );
      }

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
    try {
      const stats = await db
        .select({
          status: jobPostings.status,
          count: sql<number>`count(*)`,
        })
        .from(jobPostings)
        .where(eq(jobPostings.recruiterId, recruiterId))
        .groupBy(jobPostings.status);

      const result = {
        total: 0,
        active: 0,
        paused: 0,
        closed: 0,
        draft: 0,
      };

      stats.forEach(stat => {
        result.total += stat.count;
        if (stat.status === 'active') result.active = stat.count;
        else if (stat.status === 'paused') result.paused = stat.count;
        else if (stat.status === 'closed') result.closed = stat.count;
        else if (stat.status === 'draft') result.draft = stat.count;
      });

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
   * Map database job posting to JobPosting interface
   */
  private mapDbJobToJobPosting(dbJob: any): JobPosting {
    return {
      id: dbJob.id,
      recruiterId: dbJob.recruiterId,
      title: dbJob.title,
      rawDescription: dbJob.rawDescription,
      extractedSkills: dbJob.extractedSkills || [],
      requiredSkills: dbJob.requiredSkills || [],
      preferredSkills: dbJob.preferredSkills || [],
      experienceLevel: dbJob.experienceLevel,
      salaryMin: dbJob.salaryMin,
      salaryMax: dbJob.salaryMax,
      location: dbJob.location,
      remoteAllowed: dbJob.remoteAllowed || false,
      employmentType: dbJob.employmentType || 'full-time',
      status: dbJob.status as JobPostingStatus,
      aiConfidenceScore: dbJob.aiConfidenceScore ? parseFloat(dbJob.aiConfidenceScore) : undefined,
      createdAt: dbJob.createdAt,
      updatedAt: dbJob.updatedAt,
    };
  }
}

// Export a singleton instance
export const jobPostingService = new JobPostingService();