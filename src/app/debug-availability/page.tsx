"use client"

import { useState } from 'react';

export default function DebugAvailabilityPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthentication = async () => {
    try {
      addResult('Testing authentication...');
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      addResult(`Auth response: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`Auth error: ${error}`);
    }
  };

  const testGetAvailability = async () => {
    try {
      addResult('Testing GET /api/availability...');
      const response = await fetch('/api/availability');
      const data = await response.json();
      addResult(`GET response status: ${response.status}`);
      addResult(`GET response: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`GET error: ${error}`);
    }
  };

  const testPostAvailability = async () => {
    try {
      addResult('Testing POST /api/availability...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);
      
      const testData = {
        startTime: tomorrow.toISOString(),
        endTime: endTime.toISOString(),
        timezone: 'UTC',
        isRecurring: false
      };
      
      addResult(`POST data: ${JSON.stringify(testData)}`);
      
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      addResult(`POST response status: ${response.status}`);
      addResult(`POST response: ${JSON.stringify(data)}`);
      
    } catch (error) {
      addResult(`POST error: ${error}`);
    }
  };

  const testDatabase = async () => {
    try {
      addResult('Testing database connection...');
      const response = await fetch('/api/test-db');
      const data = await response.json();
      addResult(`DB response: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`DB error: ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    await testAuthentication();
    await testDatabase();
    await testGetAvailability();
    await testPostAvailability();
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
          Availability Debug Tool
        </h1>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Test Controls
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={testAuthentication}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Test Auth
            </button>
            
            <button
              onClick={testDatabase}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Test Database
            </button>
            
            <button
              onClick={testGetAvailability}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              Test GET
            </button>
            
            <button
              onClick={testPostAvailability}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Test POST
            </button>
            
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Test Results
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No test results yet. Click a test button to start.
              </p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono text-black dark:text-white">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}