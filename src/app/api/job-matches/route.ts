import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { candidateJobMatches, jobPostings, recruiterProfiles, user } from '~/db/schema';
import { eq, desc, gte } from 'drizzle-orm';
import { auth } from '~/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minMatchScore = searchParams.get('minMatchScore') || '30';
    const candidateId = session.user.id; // Always use the authenticated user

    // Get job matches for the candidate
    const matches = await db
      .select({
        id: candidateJobMatches.id,
        matchScore: candidateJobMatches.matchScore,
        matchingSkills: candidateJobMatches.matchingSkills,
        skillGaps: candidateJobMatches.skillGaps,
        overallFit: candidateJobMatches.overallFit,
        createdAt: candidateJobMatches.createdAt,
        jobPosting: {
          id: jobPostings.id,
          title: jobPostings.title,
          rawDescription: jobPostings.rawDescription,
          requiredSkills: jobPostings.requiredSkills,
          preferredSkills: jobPostings.preferredSkills,
          experienceLevel: jobPostings.experienceLevel,
          salaryMin: jobPostings.salaryMin,
          salaryMax: jobPostings.salaryMax,
          location: jobPostings.location,
          remoteAllowed: jobPostings.remoteAllowed,
          employmentType: jobPostings.employmentType,
          createdAt: jobPostings.createdAt,
        },
        recruiter: {
          id: recruiterProfiles.id,
          organizationName: recruiterProfiles.organizationName,
          contactEmail: recruiterProfiles.contactEmail,
          calComUsername: recruiterProfiles.calComUsername,
          calComConnected: recruiterProfiles.calComConnected,
        }
      })
      .from(candidateJobMatches)
      .innerJoin(jobPostings, eq(candidateJobMatches.jobPostingId, jobPostings.id))
      .innerJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
      .where(
        eq(candidateJobMatches.candidateId, candidateId)
      )
      .orderBy(desc(candidateJobMatches.matchScore));

    // Transform the data to match the expected frontend format
    const transformedMatches = matches.map(match => ({
      id: match.id,
      jobPosting: match.jobPosting,
      recruiter: match.recruiter,
      matchScore: parseFloat(match.matchScore),
      matchingSkills: match.matchingSkills || [],
      skillGaps: match.skillGaps || [],
      overallFit: match.overallFit,
      hasAvailability: true, // For now, assume all have availability
      createdAt: match.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedMatches
    });
  } catch (error: any) {
    console.error('Error fetching job matches:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}