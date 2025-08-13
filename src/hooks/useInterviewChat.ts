"use client";

import { useState, useCallback } from 'react';
import type { ChatSession, ChatMessage, SearchResult } from '~/lib/interview-chat-service';

interface UseInterviewChatReturn {
  // Session management
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createSession: (sessionName?: string) => Promise<string | null>;
  loadSessions: () => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<ChatMessage[]>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Search functionality
  searchMessages: (query: string, sessionId?: string, limit?: number) => Promise<SearchResult[]>;
  getSimilarMessages: (messageId: string, limit?: number) => Promise<SearchResult[]>;
  
  // Stats
  getUserStats: () => Promise<{
    totalSessions: number;
    totalMessages: number;
    averageSessionScore: number;
    totalTopicsExplored: number;
  } | null>;
}

export function useInterviewChat(userId?: string): UseInterviewChatReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`❌ ${context}:`, error);
    setError(`${context}: ${message}`);
  }, []);

  const createSession = useCallback(async (sessionName?: string): Promise<string | null> => {
    if (!userId) {
      setError('User ID is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          userId,
          sessionName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Reload sessions to get the updated list
      await loadSessions();
      
      return data.sessionId;
    } catch (error) {
      handleError(error, 'Failed to create session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const loadSessions = useCallback(async (): Promise<void> => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interview-chat?action=get_sessions&userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.statusText}`);
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      handleError(error, 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const loadSessionMessages = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    if (!userId) {
      setError('User ID is required');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interview-chat?action=get_session_messages&userId=${userId}&sessionId=${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      handleError(error, 'Failed to load session messages');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_session',
          userId,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      // Remove from local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Clear current session if it was deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    } catch (error) {
      handleError(error, 'Failed to delete session');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentSession, handleError]);

  const searchMessages = useCallback(async (
    query: string, 
    sessionId?: string, 
    limit: number = 10
  ): Promise<SearchResult[]> => {
    if (!userId) {
      setError('User ID is required');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interview-chat/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          userId,
          query,
          sessionId,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      handleError(error, 'Search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const getSimilarMessages = useCallback(async (
    messageId: string, 
    limit: number = 5
  ): Promise<SearchResult[]> => {
    if (!userId) {
      setError('User ID is required');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interview-chat/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'similar',
          userId,
          messageId,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get similar messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      handleError(error, 'Failed to get similar messages');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const getUserStats = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interview-chat?action=get_stats&userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      handleError(error, 'Failed to load user stats');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    createSession,
    loadSessions,
    loadSessionMessages,
    deleteSession,
    searchMessages,
    getSimilarMessages,
    getUserStats,
  };
}