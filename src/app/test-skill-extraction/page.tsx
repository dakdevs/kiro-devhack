"use client";

import { useState } from 'react';

export default function TestSkillExtractionPage() {
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    extractedSkills?: string[];
  }>({ status: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userQuery.trim()) {
      setResult({ status: 'error', message: 'Please enter a query' });
      return;
    }

    setIsLoading(true);
    setResult({ status: null, message: '' });

    try {
      const response = await fetch('/api/user-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuery: userQuery.trim()
        }),
      });

      if (response.status === 204) {
        setResult({ 
          status: 'success', 
          message: 'Skills extracted successfully! Check the console for details.' 
        });
      } else {
        const errorData = await response.json();
        setResult({ 
          status: 'error', 
          message: `Error: ${errorData.error || 'Unknown error'}` 
        });
      }
    } catch (error) {
      setResult({ 
        status: 'error', 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    "I'm a full-stack developer with 5 years of experience in React, Node.js, and PostgreSQL",
    "I have expertise in Python, machine learning, TensorFlow, and data analysis",
    "I'm skilled in Java, Spring Boot, Docker, Kubernetes, and AWS cloud services",
    "I work with JavaScript, TypeScript, Vue.js, and have experience with REST APIs",
    "I'm a DevOps engineer with knowledge of Jenkins, GitLab CI/CD, and monitoring tools"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Skill Extraction Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the skill extraction endpoint by entering a user query below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="userQuery" className="block text-sm font-medium text-gray-700 mb-2">
                User Query
              </label>
              <textarea
                id="userQuery"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Enter a description of skills, experience, or technologies..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || !userQuery.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Extracting Skills...' : 'Extract Skills'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setUserQuery('');
                  setResult({ status: null, message: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Result Display */}
          {result.status && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.status === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">
                  {result.status === 'success' ? 'Success' : 'Error'}
                </span>
              </div>
              <p className="mt-1">{result.message}</p>
            </div>
          )}

          {/* Sample Queries */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sample Queries to Test
            </h3>
            <div className="space-y-2">
              {sampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setUserQuery(query)}
                  className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  <span className="text-sm text-gray-700">{query}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Enter a description of skills, technologies, or experience</li>
              <li>Click "Extract Skills" to send the query to the API</li>
              <li>Check the browser console (F12) to see the extracted skills</li>
              <li>The endpoint returns 204 No Content on success</li>
              <li>Try the sample queries above for quick testing</li>
            </ol>
          </div>

          {/* API Info */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">API Endpoint:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Method:</strong> POST</p>
              <p><strong>URL:</strong> /api/user-skills</p>
              <p><strong>Body:</strong> {`{ "userQuery": "your query here" }`}</p>
              <p><strong>Response:</strong> 204 No Content (void)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
