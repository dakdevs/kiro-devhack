import { NextRequest, NextResponse } from 'next/server';
import { InputSanitizer } from '~/lib/security';
import { jobPostingCreateSchema } from '~/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Test SQL safety validation
    const sqlSafe = InputSanitizer.validateSQLSafety(text);
    
    // Test full job posting validation
    let validationResult;
    try {
      validationResult = jobPostingCreateSchema.parse({
        title: 'Test Job',
        description: text,
        remoteAllowed: false,
        employmentType: 'full-time'
      });
    } catch (validationError) {
      validationResult = { error: validationError };
    }

    return NextResponse.json({
      text: text.substring(0, 100) + '...',
      length: text.length,
      sqlSafe,
      validationResult: validationResult.error ? { 
        error: validationResult.error.message || 'Validation failed',
        issues: validationResult.error.issues || []
      } : 'Valid',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}