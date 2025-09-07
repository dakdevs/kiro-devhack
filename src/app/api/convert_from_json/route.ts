import { NextResponse } from 'next/server';
import { convert } from 'html-to-text';

function turnUrlToJsonUrl(url: string): string {
    
    if (!url.includes('greenhouse.io')) {
        return '';
    }

    
    const regex = /greenhouse\.io\/([^/]+)\/jobs\/(\d+)|greenhouse\.io\/jobs\/(\d+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error("Could not parse the company name or job ID from the Greenhouse URL.");
    }

    // If the 1st capture group exists, use it as the company name. Otherwise, default to 'greenhouse'.
    const companyName = match[1] || 'greenhouse';
    
    // The job ID will be in either the 2nd or 3rd capture group, depending on which pattern matched.
    const jobId = match[2] || match[3];

    return `https://boards-api.greenhouse.io/v1/boards/${companyName}/jobs/${jobId}?questions=true&pay_transparency=true`;
}

function stripHtmlTags(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // First pass: Use html-to-text for comprehensive conversion
    const basicText = convert(html, {
        wordwrap: false,
        preserveNewlines: false,
        selectors: [
            // Remove unwanted elements completely
            { selector: 'script', format: 'skip' },
            { selector: 'style', format: 'skip' },
            { selector: 'noscript', format: 'skip' },
            { selector: 'iframe', format: 'skip' },
            { selector: 'object', format: 'skip' },
            { selector: 'embed', format: 'skip' },

            // Convert structural elements to text with spacing
            { selector: 'h1', format: 'block', options: { leadingLineBreaks: 2, trailingLineBreaks: 1 } },
            { selector: 'h2', format: 'block', options: { leadingLineBreaks: 2, trailingLineBreaks: 1 } },
            { selector: 'h3', format: 'block', options: { leadingLineBreaks: 2, trailingLineBreaks: 1 } },
            { selector: 'h4', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'h5', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'h6', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'p', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'div', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'br', format: 'lineBreak' },

            // Lists
            { selector: 'ul', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'ol', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
            { selector: 'li', format: 'block', options: { itemPrefix: '• ', leadingLineBreaks: 0, trailingLineBreaks: 0 } },

            // Inline elements - just extract text
            { selector: 'strong', format: 'inline' },
            { selector: 'b', format: 'inline' },
            { selector: 'em', format: 'inline' },
            { selector: 'i', format: 'inline' },
            { selector: 'span', format: 'inline' },
            { selector: 'a', format: 'inline' },
            { selector: 'code', format: 'inline' },
            { selector: 'kbd', format: 'inline' },
            { selector: 'samp', format: 'inline' },
            { selector: 'var', format: 'inline' },
            { selector: 'mark', format: 'inline' },
            { selector: 'small', format: 'inline' },
            { selector: 'sub', format: 'inline' },
            { selector: 'sup', format: 'inline' }
        ]
    });

    // Second pass: Aggressive HTML tag removal with multiple regex passes
    let cleanText = basicText;

    // Remove any remaining HTML tags (multiple passes to catch nested tags)
    for (let i = 0; i < 5; i++) {
        cleanText = cleanText.replace(/<[^>]*>/g, '');
    }

    // Remove HTML entities
    cleanText = cleanText
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&hellip;/g, '...')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&deg;/g, '°')
        .replace(/&plusmn;/g, '±')
        .replace(/&times;/g, '×')
        .replace(/&divide;/g, '÷');

    // Remove any remaining HTML entities (numeric)
    cleanText = cleanText.replace(/&#\d+;/g, '');
    cleanText = cleanText.replace(/&#x[0-9a-fA-F]+;/g, '');

    // Third pass: Clean up whitespace and formatting
    cleanText = cleanText
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces/tabs with single space
        .replace(/^\s+|\s+$/gm, '') // Trim whitespace from each line
        .replace(/\n\s*\n/g, '\n\n') // Clean up empty lines
        .trim(); // Trim overall

    return cleanText;
}

function extractAndClean(data: any): string {
    const htmlToConvert = data.content || data.description || data.job_description || '';

    if (!htmlToConvert) {
        return '';
    }

    // Use the improved HTML stripping function
    const descriptionText = stripHtmlTags(htmlToConvert);

    const title = data.title || '';
    const location = data.location?.name || '';
    const company = data.company || data.company_name || '';

    const header = [
        title,
        company ? `Company: ${company}` : '',
        location ? `Location: ${location}` : ''
    ].filter(Boolean).join('\n');

    return `${header}\n\n${descriptionText}`.trim();
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing "url" parameter' }, { status: 400 });
        }

        // Validate URL format
        if (!targetUrl.includes('greenhouse.io')) {
            return NextResponse.json({ error: 'Only Greenhouse.io URLs are supported' }, { status: 400 });
        }

        const urlToFetch = turnUrlToJsonUrl(targetUrl);

        const response = await fetch(urlToFetch, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; JobImporter/1.0)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw Error(`Failed to fetch data from external URL: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const extractedContent = extractAndClean(data);

        if (!extractedContent) {
            return NextResponse.json({ error: 'Could not extract meaningful info from JSON' }, { status: 400 });
        }

        // Also return structured data for better parsing
        return NextResponse.json({ 
            text: extractedContent,
            structured: {
                title: data.title || '',
                company: data.departments?.[0]?.name || data.offices?.[0]?.name || '',
                location: data.location?.name || '',
                content: data.content || '',
                metadata: data.metadata || []
            }
        });
    }
    catch (error) {
        console.error('[API/convert_from_json] Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}