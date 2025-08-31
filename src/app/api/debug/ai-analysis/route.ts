import { NextRequest, NextResponse } from 'next/server';
import { jobAnalysisService } from '~/services/job-analysis';

export async function POST(request: NextRequest) {
  try {
    const { description, title } = await request.json();
    
    console.log('[DEBUG-AI-ANALYSIS] Testing AI analysis with:', { title, descriptionLength: description?.length });
    
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const result = await jobAnalysisService.analyzeJobPosting(description, title);
    
    console.log('[DEBUG-AI-ANALYSIS] Analysis result:', result);
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        skillsExtracted: result.extractedSkills?.length || 0,
        confidence: result.confidence,
        hasAnalysis: !!result,
      }
    });
    
  } catch (error) {
    console.error('[DEBUG-AI-ANALYSIS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}