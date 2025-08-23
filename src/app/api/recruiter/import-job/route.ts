import { NextRequest, NextResponse } from 'next/server';

interface FirecrawlResponse {
  success: boolean;
  data?: {
    content: string;
    markdown: string;
    metadata: {
      title: string;
      description: string;
      [key: string]: any;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Call Firecrawl API to scrape the job posting
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        pageOptions: {
          onlyMainContent: true,
          includeHtml: false,
        },
        extractorOptions: {
          mode: 'llm-extraction',
          extractionPrompt: `Extract job posting information from this page. Return a JSON object with the following fields:
            - jobTitle: The job title/position name
            - jobDescription: The full job description
            - primaryTech: Array of important/required technologies and skills
            - secondaryTech: Array of nice-to-have technologies and skills  
            - requirements: Job requirements and qualifications
            - responsibilities: Job responsibilities and duties
            - salaryMin: Minimum salary if mentioned
            - salaryMax: Maximum salary if mentioned
            - companyDescription: Information about the company
            - teamDescription: Information about the team or project
            
            If any field is not found, return an empty string or empty array as appropriate.`
        }
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to scrape job posting' },
        { status: 500 }
      );
    }

    const firecrawlData: FirecrawlResponse = await firecrawlResponse.json();

    if (!firecrawlData.success || !firecrawlData.data) {
      return NextResponse.json(
        { error: 'Failed to extract job information from the URL' },
        { status: 400 }
      );
    }

    // Parse the extracted data
    let extractedData;
    try {
      // Try to parse the extracted content as JSON
      const content = firecrawlData.data.content;
      
      // Look for JSON in the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: extract basic information from metadata and content
        extractedData = {
          jobTitle: firecrawlData.data.metadata.title || '',
          jobDescription: firecrawlData.data.content.substring(0, 1000) || '',
          primaryTech: [],
          secondaryTech: [],
          requirements: '',
          responsibilities: '',
          salaryMin: '',
          salaryMax: '',
          companyDescription: firecrawlData.data.metadata.description || '',
          teamDescription: ''
        };
      }
    } catch (parseError) {
      console.error('Error parsing extracted data:', parseError);
      // Return basic extracted information
      extractedData = {
        jobTitle: firecrawlData.data.metadata.title || '',
        jobDescription: firecrawlData.data.content.substring(0, 1000) || '',
        primaryTech: [],
        secondaryTech: [],
        requirements: '',
        responsibilities: '',
        salaryMin: '',
        salaryMax: '',
        companyDescription: firecrawlData.data.metadata.description || '',
        teamDescription: ''
      };
    }

    // Clean and format the extracted data
    const jobData = {
      jobTitle: extractedData.jobTitle || '',
      primaryTech: Array.isArray(extractedData.primaryTech) ? extractedData.primaryTech : [],
      secondaryTech: Array.isArray(extractedData.secondaryTech) ? extractedData.secondaryTech : [],
      jobDescription: extractedData.jobDescription || extractedData.requirements || '',
      teamDescription: extractedData.teamDescription || '',
      salaryMin: extractedData.salaryMin || '',
      salaryMax: extractedData.salaryMax || '',
      companyDescription: extractedData.companyDescription || '',
    };

    return NextResponse.json({
      success: true,
      jobData,
      sourceUrl: url
    });

  } catch (error) {
    console.error('Error importing job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}