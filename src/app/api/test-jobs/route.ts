import { NextRequest, NextResponse } from 'next/server';
import { jobPostingService } from '~/services/job-posting';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get('recruiterId');
    
    if (!recruiterId) {
      return NextResponse.json({
        success: false,
        error: 'recruiterId parameter is required'
      }, { status: 400 });
    }

    // Get job postings for the recruiter
    const result = await jobPostingService.getJobPostings(recruiterId, {
      page: 1,
      limit: 25
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    // Return detailed job information for testing
    const jobDetails = result.data?.map(job => ({
      id: job.id,
      title: job.title,
      experienceLevel: job.experienceLevel,
      location: job.location,
      remoteAllowed: job.remoteAllowed,
      salaryRange: job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : 'Not specified',
      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      extractedSkills: job.extractedSkills || [],
      aiConfidenceScore: job.aiConfidenceScore,
      status: job.status,
      createdAt: job.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobDetails,
        pagination: result.pagination,
        summary: {
          totalJobs: result.pagination?.total || 0,
          avgRequiredSkills: jobDetails ? jobDetails.reduce((sum, job) => sum + (job.requiredSkills?.length || 0), 0) / jobDetails.length : 0,
          avgPreferredSkills: jobDetails ? jobDetails.reduce((sum, job) => sum + (job.preferredSkills?.length || 0), 0) / jobDetails.length : 0,
          avgExtractedSkills: jobDetails ? jobDetails.reduce((sum, job) => sum + (job.extractedSkills?.length || 0), 0) / jobDetails.length : 0,
          avgConfidenceScore: jobDetails ? jobDetails.reduce((sum, job) => sum + (job.aiConfidenceScore || 0), 0) / jobDetails.length : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching test jobs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}