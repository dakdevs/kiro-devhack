import { NextResponse } from 'next/server';
import { convert } from 'html-to-text';

function turnUrlToJsonUrl(url: any): string {
    if (url.includes('greenhouse.io')) {
        const regex = /jobs\/(\d+)/;
        const match = url.match(regex);
        var jobIdString = ''
        if (match && match[1]) {
            jobIdString = match[1];
        }
        else {
            throw Error("something got messed up during regex matching");
        }
        return `https://boards-api.greenhouse.io/v1/boards/greenhouse/jobs/${jobIdString}?questions=true&pay_transparency=true`;
    }
    return '';
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

        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw Error(`Failed to fetch data from external URL: ${response.statusText}`);
        }

        const data = await response.json();

        const extractedContent = extractAndClean(data);

        if (!extractedContent) {
            return NextResponse.json({ error: 'Could not extract meaningful info fron JSON' }, { status: 400 });

        }
        return NextResponse.json({ text: extractedContent });
    }
    catch (error) {
        console.error('[API/ convert_from_json] Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occured';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}