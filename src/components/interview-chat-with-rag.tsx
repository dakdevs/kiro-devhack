"use client";

import { useState } from 'react';
import { useInterviewRAG } from '~/hooks/use-interview-rag';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function InterviewChatWithRAG({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { processUserInput, storeAssistantResponse, isProcessing } = useInterviewRAG();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Process with RAG agent
      const ragResult = await processUserInput(userMessage, userId);

      if (ragResult.type === 'off-topic') {
        // RAG agent handled off-topic query directly
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: ragResult.response! 
        }]);
        return;
      }

      // Send enhanced prompt to your main LLM
      const enhancedPrompt = ragResult.type === 'enhanced' 
        ? ragResult.enhancedPrompt 
        : ragResult.originalQuery;

      // Call your existing interview API with enhanced prompt
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhancedPrompt,
          userId
        })
      });

      const data = await response.json();
      const assistantResponse = data.reply;

      // Store assistant response for future context
      await storeAssistantResponse(assistantResponse);

      // Add to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantResponse 
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-apple-blue text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            className="flex-1 min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}