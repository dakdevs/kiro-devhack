/**
 * Chat Debug Test Component
 * Simple test to verify API connectivity
 */

"use client";

import React, { useState } from 'react';

const ChatDebugTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testAPI = async () => {
    setIsLoading(true);
    setResult('');
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello, this is a test message' }
          ]
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success! AI Response: "${data.reply}"`);
      } else {
        setError(`❌ API Error: ${data.reply || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`❌ Network Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEnvironment = () => {
    const env = {
      hasAPIKey: !!process.env.NEXT_PUBLIC_TEST || 'API key should be server-side',
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      userAgent: navigator.userAgent.substring(0, 100) + '...',
    };

    setResult(`🔍 Environment Info:
Protocol: ${env.protocol}
Hostname: ${env.hostname}
Port: ${env.port}
User Agent: ${env.userAgent}
API Key: ${env.hasAPIKey}`);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-16 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-green-600 transition-colors"
        >
          🧪 Chat Test
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Chat API Test</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={testAPI}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {isLoading ? '🔄 Testing...' : '🚀 Test Chat API'}
            </button>
            
            <button
              onClick={testEnvironment}
              className="w-full bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              🔍 Check Environment
            </button>
          </div>
          
          {(result || error) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Result:</div>
              <div className={`text-xs p-2 rounded ${
                error 
                  ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}>
                <pre className="whitespace-pre-wrap">{result || error}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDebugTest;