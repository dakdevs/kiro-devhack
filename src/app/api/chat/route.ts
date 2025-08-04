import { NextRequest, NextResponse } from 'next/server';

// Define the expected shape of the API request body
interface ApiRequestBody {
  message: string;
}

// This is a placeholder for a real AI service call.
const getAIResponse = async (message: string): Promise<string> => {
  // In a real application, you would make a call to an AI API
  // like OpenAI, Gemini, or a self-hosted model.
  console.log("Simulating AI response for:", message);

  // Simulate network delay to mimic a real API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  return `This is a simulated AI response to your message: "${message}"`;
};

// The main API handler function for POST requests
export async function POST(req: NextRequest) {
  try {
    const body: ApiRequestBody = await req.json();
    const { message } = body;

    // Validate the incoming message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: 'Message is required and must be a string.' },
        { status: 400 }
      );
    }

    // Get the response from our simulated AI service
    const aiResponse = await getAIResponse(message);
    
    // Send the successful response back to the client
    return NextResponse.json({ reply: aiResponse });
  } catch (error) {
    console.error("AI service error:", error);
    // Handle any errors that occur during the AI call
    return NextResponse.json(
      { message: 'Error processing your request' },
      { status: 500 }
    );
  }
}