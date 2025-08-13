"use client";

import React, { useState, useEffect } from 'react';
import { useInterviewChat } from '~/hooks/useInterviewChat';
import type { ChatSession } from '~/lib/interview-chat-service';

interface SessionManagerProps {
  userId: string;
  onSessionSelect?: (session: ChatSession) => void;
  selectedSessionId?: string;
}

export function SessionManager({ userId, onSessionSelect, selectedSessionId }: SessionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalMessages: number;
    averageSessionScore: number;
    totalTopicsExplored: number;
  } | null>(null);

  const {
    sessions,
    isLoading,
    error,
    createSession,
    loadSessions,
    deleteSession,
    getUserStats,
  } = useInterviewChat(userId);

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const loadStats = async () => {
    const userStats = await getUserStats();
    setStats(userStats);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    const sessionId = await createSession(newSessionName);
    if (sessionId) {
      setNewSessionName('');
      setShowCreateForm(false);
      await loadStats(); // Refresh stats
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      await deleteSession(sessionId);
      await loadStats(); // Refresh stats
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 1.8) return 'text-green-600 dark:text-green-400';
    if (score >= 1.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 1.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 1.8) return 'Excellent';
    if (score >= 1.5) return 'Strong';
    if (score >= 1.0) return 'Good';
    return 'Needs Work';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSessions}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalMessages}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Messages</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className={`text-2xl font-bold ${getScoreColor(stats.averageSessionScore)}`}>
              {stats.averageSessionScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Score</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTopicsExplored}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Topics Explored</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Interview Sessions
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleCreateSession} className="flex gap-3">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Enter session name..."
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newSessionName.trim() || isLoading}
              className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewSessionName('');
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading sessions...</p>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect?.(session)}
              className={`p-4 bg-white dark:bg-gray-800 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedSessionId === session.id
                  ? 'border-apple-blue ring-2 ring-apple-blue/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {session.sessionName || `Session ${session.id.slice(0, 8)}`}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatDate(session.startTime)}</span>
                    <span>{session.totalMessages} messages</span>
                    <span>Depth: {session.maxDepthReached}</span>
                    {session.averageScore > 0 && (
                      <span className={getScoreColor(session.averageScore)}>
                        {getScoreLabel(session.averageScore)} ({session.averageScore.toFixed(1)})
                      </span>
                    )}
                  </div>
                  {session.endTime && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Ended: {formatDate(session.endTime)}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No interview sessions yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start your first interview practice session to begin building your profile.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}