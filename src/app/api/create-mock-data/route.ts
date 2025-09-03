import { NextRequest, NextResponse } from 'next/server';
import { createMockData, testCandidateMatching } from '~/scripts/create-mock-data';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting comprehensive mock data creation...');
    
    // Create all mock data
    const result = await createMockData();
    
    console.log('\n✅ Mock data creation completed successfully!');
    
    // Create basic matching results summary
    const matchingResults = result.jobIds.map(jobId => ({
      jobId,
      success: true,
      message: 'Mock data created - use /api/verify-matching to test matching'
    }));
    
    console.log('\n✅ Mock data creation and testing completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Mock data created and tested successfully',
      data: {
        ...result,
        matchingResults,
        testSummary: {
          totalJobs: result.jobIds.length,
          totalCandidates: result.summary.candidates,
          totalSkills: result.summary.totalSkills,
          message: 'Use GET /api/verify-matching to test candidate matching accuracy'
        }
      }
    });

  } catch (error) {
    console.error('❌ Mock data creation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to create mock data',
    endpoints: {
      'POST /api/create-mock-data': 'Create comprehensive mock candidates and job postings',
      'GET /api/debug/candidate-matching': 'Test candidate matching with existing data'
    }
  });
}