import { NextRequest, NextResponse } from 'next/server';

// --- Configuration Constants ---
const API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'AI Chatbot';
const STATIC_INTRO =
  process.env.STATIC_INTRO ||
  "Hello, thank you for joining this interview. Let's start by having you tell me a little about yourself.";

// --- System Prompt for the Interviewer Model ---
const INTERVIEW_SYSTEM_PROMPT: { role: 'system'; content: string }[] = [
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
const GRADING_MODEL = 'openai/gpt-4o'; // A more powerful model for analysis

// --- In-memory chat history (NOT production-safe) ---
let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [
  { role: 'assistant', content: STATIC_INTRO },
];

/**
 * Asynchronously grades a conversation history in the background.
 * @param history The chat history to analyze.
 */
async function gradeConversation(history: { role: 'user' | 'assistant'; content: string }[]) {
  console.log('Starting background conversation grading...');
  if (!API_KEY) {
    console.error('Grading failed: API key is not configured.');
    return;
  }
  
  try {
    const messagesToGrade = [
      { role: 'system', content: GRADING_SYSTEM_PROMPT },
      ...history
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
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
      // e.g., await db.saveScore(conversationId, score);
    } else {
      console.warn('⚠️ Could not parse score from grading response:', scoreText);
    }
  } catch (error) {
    console.error('❌ Failed to grade conversation:', error);
  }
}

// --- Main POST Handler for Chat ---
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: 'Message is required and must be a string.' },
        { status: 400 }
      );
    }

    if (!API_KEY || API_KEY.includes('your-actual-openrouter-api-key-here')) {
      return NextResponse.json(
        { reply: 'Please configure your OpenRouter API key in the .env.local file to enable AI responses.' },
        { status: 200 }
      );
    }

    chatHistory.push({ role: 'user', content: message });

    const messagesForInterview = [...INTERVIEW_SYSTEM_PROMPT, ...chatHistory];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
      },
      body: JSON.stringify({
        model: INTERVIEW_MODEL,
        messages: messagesForInterview,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I didn't get a response.";

    chatHistory.push({ role: 'assistant', content: reply });

    // --- "Fire-and-forget" the grading task ---
    // We do NOT 'await' this call, so it runs in the background.
    gradeConversation([...chatHistory]);

    // Return the chat reply to the user immediately.
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { message: `Error processing your request: ${error.message}` },
      { status: 500 }
    );
  }
}