"use client";

import { useState } from 'react';
import { InterviewRAGAgent } from '~/services/rag-agent';
import { storeConversation } from '~/utils/conversation-storage';

export function useInterviewRAG() {
  const [isProcessing, setIsProcessing] = useState(false);
  const ragAgent = new InterviewRAGAgent();

  const processUserInput = async (userInput: string, userId: string) => {
    setIsProcessing(true);
    
    try {
      // Store user input
      await storeConversation(userInput, 'user');
      
      // Process with RAG agent
      const result = await ragAgent.processQuery(userInput, userId);
      
      if (!result.isRelevant) {
        return { 
          type: 'off-topic' as const, 
          response: result.response 
        };
      }
      
      return { 
        type: 'enhanced' as const, 
        enhancedPrompt: result.enhancedPrompt 
      };
      
    } catch (error) {
      console.error('RAG processing failed:', error);
      return { 
        type: 'fallback' as const, 
        originalQuery: userInput 
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const storeAssistantResponse = async (response: string) => {
    await storeConversation(response, 'assistant');
  };

  return {
    processUserInput,
    storeAssistantResponse,
    isProcessing
  };
}