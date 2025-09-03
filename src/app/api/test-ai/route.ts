import { NextRequest, NextResponse } from 'next/server';
import { jobAnalysisService } from '~/services/job-analysis';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, jobTitle } = await request.json();
    
    if (!jobDescription) {
      return NextResponse.json({
        success: false,
        error: 'jobDescription is required'
      }, { status: 400 });
    }

    console.log('Testing AI analysis for:', jobTitle || 'Untitled Job');
    
    const result = await jobAnalysisService.analyzeJobPosting(
      jobDescription, 
      jobTitle || 'Test Job'
    );

    return NextResponse.json({
      success: true,
      data: {
        result,
        summary: {
          extractedSkillsCount: result.extractedSkills?.length || 0,
          requiredSkillsCount: result.requiredSkills?.length || 0,
          preferredSkillsCount: result.preferredSkills?.length || 0,
          confidence: result.confidence,
          experienceLevel: result.experienceLevel
        }
      }
    });

  } catch (error) {
    console.error('AI test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}