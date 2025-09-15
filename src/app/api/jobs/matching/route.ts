import { NextRequest, NextResponse } from 'next/server';
import { candidateMatchingService } from '~/services/candidate-matching';
import { db } from '~/db';
import { jobPostings, recruiterProfiles, user, userSkills } from '~/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Authentication required'
  }, { status: 401 });
}

// POST /api/jobs/matching - Get candidates matching a job posting
// Input: { jobID: string }
// Output: { candidateID: string }
export async function POST(req: NextRequest) {
  try {
    console.log('🔍 POST /api/jobs/matching called');
    const body = await req.json();
    const { jobID } = body;
    
    console.log('📝 Request body:', { jobID });

    // Validate required parameters
    if (!jobID || typeof jobID !== 'string') {
      return NextResponse.json(
        { error: 'jobID parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Verify job exists and get job data
    const job = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        recruiterId: jobPostings.recruiterId,
        requiredSkills: jobPostings.requiredSkills,
        preferredSkills: jobPostings.preferredSkills,
        status: jobPostings.status,
        rawDescription: jobPostings.rawDescription,
        experienceLevel: jobPostings.experienceLevel,
        salaryMin: jobPostings.salaryMin,
        salaryMax: jobPostings.salaryMax,
        location: jobPostings.location,
        remoteAllowed: jobPostings.remoteAllowed,
        employmentType: jobPostings.employmentType,
        aiConfidenceScore: jobPostings.aiConfidenceScore,
        createdAt: jobPostings.createdAt,
        updatedAt: jobPostings.updatedAt,
      })
      .from(jobPostings)
      .innerJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
      .where(eq(jobPostings.id, jobID))
      .limit(1);

    if (job.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobData = job[0];
    console.log('✅ Found job:', jobData.title);

    // Get matching candidates using the existing candidate matching service
    // Use no filters to get all candidates, then we'll take the first one
    const matchesResult = await candidateMatchingService.findMatchingCandidates(
      jobData as any,
      undefined, // No filters to get all candidates
      { page: 1, limit: 1 } // Just get the first candidate
    );

    console.log('🔍 Matching results:', {
      totalCandidates: matchesResult.pagination.total,
      foundCandidates: matchesResult.data.length,
      jobTitle: jobData.title,
      requiredSkills: jobData.requiredSkills,
      preferredSkills: jobData.preferredSkills
    });

    if (matchesResult.data.length === 0) {
      console.log('⚠️ No candidates found via matching service, trying direct database query...');
      
      // Fallback: Get any candidate with skills from the database
      const candidateWithSkills = await db
        .select({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        })
        .from(user)
        .innerJoin(userSkills, eq(user.id, userSkills.userId))
        .limit(1);

      if (candidateWithSkills.length === 0) {
        return NextResponse.json(
          { 
            error: 'No candidates found in database',
            debug: {
              totalCandidates: matchesResult.pagination.total,
              jobTitle: jobData.title,
              requiredSkills: jobData.requiredSkills,
              preferredSkills: jobData.preferredSkills
            }
          },
          { status: 404 }
        );
      }

      const candidateID = candidateWithSkills[0].userId;
      console.log('✅ Found candidate via fallback:', {
        candidateID,
        name: candidateWithSkills[0].userName
      });
      
      return NextResponse.json({
        candidateID: candidateID
      });
    }

    const topCandidate = matchesResult.data[0];
    const candidateID = topCandidate.candidate.id;
    
    console.log('✅ Found top candidate:', {
      candidateID,
      name: topCandidate.candidate.name,
      matchScore: topCandidate.match.score
    });
    
    return NextResponse.json({
      candidateID: candidateID
    });
    
  } catch (error) {
    console.error('❌ POST error:', error);
    return NextResponse.json(
      { error: 'Failed to find matching candidates' },
      { status: 500 }
    );
  }
}