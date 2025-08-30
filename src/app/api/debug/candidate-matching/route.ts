import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { candidateMatchingService } from '~/services/candidate-matching';
import { db } from '~/db';
import { jobPostings, recruiterProfiles, userSkills, user } from '~/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // TODO: Fix auth - temporarily bypass for testing
    const session = {
      user: {
        id: 'temp-user-id'
      }
    };

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    // Get job posting
    const job = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        requiredSkills: jobPostings.requiredSkills,
        preferredSkills: jobPostings.preferredSkills,
        recruiterId: jobPostings.recruiterId,
      })
      .from(jobPostings)
      .innerJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
      .where(eq(jobPostings.id, jobId))
      // TODO: Re-enable user access check when auth is fixed:
      // .where(
      //   and(
      //     eq(jobPostings.id, jobId),
      //     eq(recruiterProfiles.userId, session.user.id)
      //   )
      // )
      .limit(1);

    if (job.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    const jobData = job[0];

    // Get some sample candidates with skills for testing
    const candidatesWithSkills = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        skillName: userSkills.skillName,
        proficiencyScore: userSkills.proficiencyScore,
        mentionCount: userSkills.mentionCount,
      })
      .from(user)
      .innerJoin(userSkills, eq(user.id, userSkills.userId))
      .limit(100); // Get a sample of candidates

    // Group by user
    const candidateMap = new Map();
    candidatesWithSkills.forEach(row => {
      if (!candidateMap.has(row.userId)) {
        candidateMap.set(row.userId, {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
          skills: [],
        });
      }
      
      candidateMap.get(row.userId).skills.push({
        name: row.skillName,
        proficiencyScore: parseFloat(row.proficiencyScore),
        category: 'technical',
      });
    });

    const candidates = Array.from(candidateMap.values()).slice(0, limit);

    console.log(`[CANDIDATE-MATCHING-DEBUG] Found ${candidates.length} candidates to test matching`);
    
    // Calculate matches
    const matches = await Promise.all(
      candidates.map(candidate => 
        candidateMatchingService.calculateCandidateMatch(candidate, jobData as any)
      )
    );
    
    console.log(`[CANDIDATE-MATCHING-DEBUG] Calculated ${matches.length} matches`);

    // Sort by match score
    const sortedMatches = matches.sort((a, b) => b.match.score - a.match.score);

    return NextResponse.json({
      success: true,
      data: {
        job: {
          id: jobData.id,
          title: jobData.title,
          requiredSkills: jobData.requiredSkills,
          preferredSkills: jobData.preferredSkills,
        },
        candidates: sortedMatches,
        summary: {
          totalCandidates: candidates.length,
          averageMatchScore: sortedMatches.length > 0 
            ? Math.round(sortedMatches.reduce((sum, match) => sum + match.match.score, 0) / sortedMatches.length)
            : 0,
          topMatchScore: sortedMatches[0]?.match.score || 0,
        },
      },
    });

  } catch (error) {
    console.error('Error in candidate matching debug:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test candidate matching',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}