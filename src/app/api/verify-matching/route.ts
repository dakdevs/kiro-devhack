import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { jobPostings, user, userSkills } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { candidateMatchingService } from '~/services/candidate-matching';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verifying candidate matching accuracy...');
    
    // Get all job postings
    const jobs = await db.select().from(jobPostings).limit(10);
    
    if (jobs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No job postings found. Create mock data first.',
        suggestion: 'POST /api/create-mock-data'
      });
    }
    
    // Get all candidates with skills
    const candidates = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        skillName: userSkills.skillName,
        proficiencyScore: userSkills.proficiencyScore,
      })
      .from(user)
      .innerJoin(userSkills, eq(user.id, userSkills.userId));
    
    const candidateMap = new Map();
    candidates.forEach(row => {
      if (!candidateMap.has(row.userId)) {
        candidateMap.set(row.userId, {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
          skills: []
        });
      }
      candidateMap.get(row.userId).skills.push({
        name: row.skillName,
        proficiencyScore: parseFloat(row.proficiencyScore)
      });
    });
    
    const candidateList = Array.from(candidateMap.values());
    
    console.log(`📊 Found ${jobs.length} jobs and ${candidateList.length} candidates`);
    
    const verificationResults = [];
    
    // Test matching for each job
    for (const job of jobs) {
      console.log(`\n🎯 Testing job: ${job.title}`);
      
      const requiredSkills = (job.requiredSkills as any[]) || [];
      const preferredSkills = (job.preferredSkills as any[]) || [];
      
      console.log(`   Required skills: ${requiredSkills.length}`);
      console.log(`   Preferred skills: ${preferredSkills.length}`);
      
      // Test API endpoint
      const response = await fetch(`http://localhost:3000/api/recruiter/jobs/${job.id}/candidates?limit=20&minMatchScore=1`);
      const apiResult = await response.json();
      
      if (!apiResult.success) {
        console.error(`❌ API failed for job ${job.id}:`, apiResult.error);
        verificationResults.push({
          jobId: job.id,
          jobTitle: job.title,
          success: false,
          error: apiResult.error
        });
        continue;
      }
      
      const matches = apiResult.data;
      console.log(`   API returned ${matches.length} matches`);
      
      // Analyze match quality
      const matchAnalysis = {
        totalMatches: matches.length,
        excellentFit: matches.filter((m: any) => m.match.overallFit === 'excellent').length,
        goodFit: matches.filter((m: any) => m.match.overallFit === 'good').length,
        fairFit: matches.filter((m: any) => m.match.overallFit === 'fair').length,
        poorFit: matches.filter((m: any) => m.match.overallFit === 'poor').length,
        averageMatchScore: matches.length > 0 
          ? matches.reduce((sum: number, m: any) => sum + m.match.score, 0) / matches.length 
          : 0,
        topMatchScore: matches.length > 0 ? matches[0].match.score : 0,
        skillMatchAccuracy: []
      };
      
      // Verify skill matching accuracy for top candidates
      for (const match of matches.slice(0, 3)) {
        const candidate = match.candidate;
        const candidateSkillNames = candidate.skills.map((s: any) => s.name.toLowerCase());
        const requiredSkillNames = requiredSkills.map((s: any) => s.name.toLowerCase());
        const preferredSkillNames = preferredSkills.map((s: any) => s.name.toLowerCase());
        
        const requiredMatches = requiredSkillNames.filter((skill: string) => 
          candidateSkillNames.some((cSkill: string) => 
            cSkill.includes(skill) || skill.includes(cSkill)
          )
        );
        
        const preferredMatches = preferredSkillNames.filter((skill: string) => 
          candidateSkillNames.some((cSkill: string) => 
            cSkill.includes(skill) || skill.includes(cSkill)
          )
        );
        
        const expectedScore = requiredSkills.length > 0 
          ? (requiredMatches.length / requiredSkills.length) * 70 + 
            (preferredSkills.length > 0 ? (preferredMatches.length / preferredSkills.length) * 30 : 0)
          : 0;
        
        matchAnalysis.skillMatchAccuracy.push({
          candidateName: candidate.name,
          actualScore: match.match.score,
          expectedScore: Math.round(expectedScore),
          scoreDifference: Math.abs(match.match.score - expectedScore),
          requiredMatches: requiredMatches.length,
          preferredMatches: preferredMatches.length,
          totalCandidateSkills: candidate.skills.length
        });
      }
      
      verificationResults.push({
        jobId: job.id,
        jobTitle: job.title,
        success: true,
        requiredSkills: requiredSkills.length,
        preferredSkills: preferredSkills.length,
        matchAnalysis
      });
      
      console.log(`   ✅ Average match score: ${matchAnalysis.averageMatchScore.toFixed(1)}%`);
      console.log(`   ✅ Top match score: ${matchAnalysis.topMatchScore}%`);
      console.log(`   ✅ Fit distribution: ${matchAnalysis.excellentFit} excellent, ${matchAnalysis.goodFit} good, ${matchAnalysis.fairFit} fair, ${matchAnalysis.poorFit} poor`);
    }
    
    // Calculate overall accuracy metrics
    const successfulTests = verificationResults.filter(r => r.success);
    const overallMetrics = {
      totalJobsTested: jobs.length,
      successfulTests: successfulTests.length,
      failedTests: verificationResults.length - successfulTests.length,
      averageMatchScore: successfulTests.length > 0 
        ? successfulTests.reduce((sum, r) => sum + (r.matchAnalysis?.averageMatchScore || 0), 0) / successfulTests.length
        : 0,
      totalMatches: successfulTests.reduce((sum, r) => sum + (r.matchAnalysis?.totalMatches || 0), 0),
      averageCandidatesPerJob: successfulTests.length > 0 
        ? successfulTests.reduce((sum, r) => sum + (r.matchAnalysis?.totalMatches || 0), 0) / successfulTests.length
        : 0
    };
    
    console.log('\n📈 Overall Verification Results:');
    console.log(`   - Jobs tested: ${overallMetrics.totalJobsTested}`);
    console.log(`   - Successful tests: ${overallMetrics.successfulTests}`);
    console.log(`   - Average match score: ${overallMetrics.averageMatchScore.toFixed(1)}%`);
    console.log(`   - Total matches found: ${overallMetrics.totalMatches}`);
    console.log(`   - Average candidates per job: ${overallMetrics.averageCandidatesPerJob.toFixed(1)}`);
    
    return NextResponse.json({
      success: true,
      message: 'Candidate matching verification completed',
      data: {
        overallMetrics,
        jobResults: verificationResults,
        candidateStats: {
          totalCandidates: candidateList.length,
          averageSkillsPerCandidate: candidateList.length > 0 
            ? candidateList.reduce((sum, c) => sum + c.skills.length, 0) / candidateList.length 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}