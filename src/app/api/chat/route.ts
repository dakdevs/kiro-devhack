import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.OPENROUTER_API_KEY; // Store your key in .env.local (see notes below)
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'AI Chatbot';
const STATIC_INTRO =
  process.env.STATIC_INTRO ||
  "Hello, thank you for joining this interview. Let's start by having you tell me a little about yourself.";

// --- System prompt for LLM ---
const SYSTEM_PROMPT = {
  role: 'system',
  content:
    'You are a minimal, open-ended interviewer for a technical job. Do NOT provide technology names, tools, frameworks, or buzzwords in your questions or responses. Ask concise, open-ended questions that prompt the user to explain their experience, approach, or ideas. If the user mentions technology or specifics, ask them to elaborate without restating those words yourself. Keep your replies short to encourage the user to do most of the talking.',
};

// --- In-memory chat history for demo (not per-user, not production safe) ---
let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [
  { role: 'assistant', content: STATIC_INTRO },
];

// --- POST handler ---
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: 'Message is required and must be a string.' },
        { status: 400 }
      );
    }

    // Append user message to history
    chatHistory.push({ role: 'user', content: message });

    // Compose message history (system prompt + chat history)
    const messages = [SYSTEM_PROMPT, ...chatHistory];

    // Build request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
      },
      body: JSON.stringify({
        model: 'liquid/lfm-3b', // You can change this to any other available model
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I didn't get a response.";

    // Append AI reply to history
    chatHistory.push({ role: 'assistant', content: reply });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: `Error processing your request: ${error.message}` },
      { status: 500 }
    );
  }
}
