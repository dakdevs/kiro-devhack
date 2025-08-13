"use client";

import { useState } from 'react';
import SimpleChat from "~/components/SimpleChat";
import { SessionManager } from './_modules/session-manager';
import { ChatSearch } from './_modules/chat-search';
import type { ChatSession, SearchResult } from '~/lib/interview-chat-service';

export default function InterviewPage() {
    const [activeTab, setActiveTab] = useState<'chat' | 'sessions' | 'search'>('chat');
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    
    // In a real app, get this from authentication
    const userId = 'demo-user-id';

    const handleSessionSelect = (session: ChatSession) => {
        setSelectedSession(session);
        setActiveTab('chat');
    };

    const handleSearchResultClick = (result: SearchResult) => {
        // Could navigate to the specific message in the chat
        console.log('Search result clicked:', result);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header with Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Interview Practice
                    </h1>
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'chat'
                                    ? 'border-apple-blue text-apple-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Practice Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'sessions'
                                    ? 'border-apple-blue text-apple-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            My Sessions
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'search'
                                    ? 'border-apple-blue text-apple-blue'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            Search Conversations
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' && (
                    <div className="h-full">
                        {selectedSession && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-2 border-b border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Continuing session: <span className="font-medium">{selectedSession.sessionName}</span>
                                </p>
                            </div>
                        )}
                        <SimpleChat />
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div className="h-full overflow-y-auto p-6">
                        <SessionManager
                            userId={userId}
                            onSessionSelect={handleSessionSelect}
                            selectedSessionId={selectedSession?.id}
                        />
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="h-full overflow-y-auto p-6">
                        <ChatSearch
                            userId={userId}
                            onResultClick={handleSearchResultClick}
                        />
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                        <span>🤖 AI-powered interview practice</span>
                        <span>🔍 Vector search enabled</span>
                        <span>📊 Performance tracking</span>
                    </div>
                    {selectedSession && (
                        <div className="text-xs">
                            Session: {selectedSession.id.slice(0, 8)}...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}