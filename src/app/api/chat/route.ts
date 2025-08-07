import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';

// --- Configuration Constants ---
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'AI Interviewer';

// Configure OpenAI client to use OpenRouter
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
    },
});

// --- System Prompt for the Interviewer Model ---
const INTERVIEW_SYSTEM_PROMPT = [
    { role: 'system', content: "You are a minimal, open-ended interviewer for a technical job." },
    { role: 'system', content: "Do NOT provide technology names, tools, frameworks, or buzzwords in your questions or responses." },
    { role: 'system', content: "Ask concise, open-ended questions that prompt the user to explain their experience, approach, or ideas." },
    { role: 'system', content: "If the user mentions technology or specifics, ask them to elaborate without restating those words yourself." },
    { role: 'system', content: "Keep your replies short to encourage the user to do most of the talking." },
    { role: 'system', content: "Track context from the conversation and adapt your questions based on the user’s role, level, and setting." },
    { role: 'system', content: "Limit your responses to a maximum of 4 sentences." }
];

// --- System Prompt for the Grading Model ---
const GRADING_SYSTEM_PROMPT = `
You are an expert evaluator of job interview conversations. Analyze the provided chat history.
Based on the user's responses, provide a floating-point score from 0.0 (poor) to 2.0 (excellent).
Consider the clarity, depth, and relevance of the user's answers.
Respond ONLY with the numerical score and nothing else. Example: 1.7
`;

// --- Models to use ---
const INTERVIEW_MODEL = 'liquid/lfm-3b';
const GRADING_MODEL = 'liquid/lfm-3b';

// --- Conversation Grading ---
async function gradeConversation(history: any[]) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.error('Grading failed: API key is not configured.');
            return;
        }

        const messagesToGrade = [
            { role: 'system', content: GRADING_SYSTEM_PROMPT },
            ...history
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GRADING_MODEL,
                messages: messagesToGrade,
            }),
        });

        if (!response.ok) {
            console.error(`Grading API Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const scoreText = data.choices?.[0]?.message?.content;
        const score = parseFloat(scoreText);

        if (!isNaN(score)) {
            console.log(`✅ Conversation scored: ${score.toFixed(2)}`);
            // In a real app, you would save this score to a database here.
        } else {
            console.warn('⚠️ Could not parse score from grading response:', scoreText);
        }
    } catch (error) {
        console.error('❌ Failed to grade conversation:', error);
    }
}

// --- Main handler ---
export async function POST(req: NextRequest) {
    try {
        // Accept either { messages: [...] } (recommended) or { message: string } (fallback for single-turn)
        const body = await req.json();
        let messages = Array.isArray(body.messages) ? body.messages : [];
        if (!messages.length && typeof body.message === "string") {
            messages = [{ role: "user", content: body.message }];
        }

        // Flatten system prompts into a single system message
        const systemMessage = {
            role: 'system',
            content: INTERVIEW_SYSTEM_PROMPT.map(msg => msg.content).join(' ')
        };
        const fullMessages = [systemMessage, ...messages];

        // Call the LLM (non-streaming)
        const result = await generateText({
            model: openrouter(INTERVIEW_MODEL),
            messages: fullMessages,
            temperature: 0.7,
        });

        return NextResponse.json({ reply: result.text });
    } catch (error: any) {
        return NextResponse.json(
            { reply: `Error: ${error?.message ?? 'Unknown error occurred.'}` },
            { status: 500 }
        );
    }
}

