"use client"

import { useState } from 'react';
import { useCSRFToken, secureApiRequest } from '~/hooks/use-csrf-token';

export default function TestCSRFPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const csrfToken = useCSRFToken();

  const testJobPosting = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const testJobData = {
        title: 'Test Job',
        description: 'This is a test job posting to verify CSRF token functionality. It should work now with proper CSRF protection.',
        location: 'Remote',
        remoteAllowed: true,
        employmentType: 'full-time' as const,
      };

      const response = await secureApiRequest('/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(testJobData),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult('✅ Success! Job posting created with CSRF protection.');
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">CSRF Token Test</h1>
      
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Current CSRF Token:
          </p>
          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
            {csrfToken || 'Loading...'}
          </code>
        </div>

        <button
          onClick={testJobPosting}
          disabled={loading || !csrfToken}
          className="w-full px-4 py-3 bg-apple-blue text-white rounded-lg font-semibold transition-all duration-150 ease-out hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Job Posting API with CSRF'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}