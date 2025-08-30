"use client"

import { useState } from 'react';
import { useCSRFToken } from '~/hooks/use-csrf-token';

export default function DebugJobPostingPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { token: csrfToken, isLoading: csrfLoading } = useCSRFToken();

  const testJobPosting = async () => {
    if (!csrfToken) {
      setResult({ error: 'CSRF token not available' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const testData = {
        title: 'Test Software Engineer',
        description: 'We are looking for a software engineer with JavaScript and React experience.',
        location: 'San Francisco, CA',
        requiredSkills: ['JavaScript', 'React'],
        preferredSkills: ['TypeScript'],
        experienceLevel: 'mid',
        employmentType: 'full-time',
        remoteAllowed: true,
        salaryMin: 100000,
        salaryMax: 150000
      };

      console.log('Making API call with data:', testData);
      console.log('CSRF token:', csrfToken);

      const response = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(testData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { error: 'Invalid JSON response', responseText };
      }

      setResult({
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      });

    } catch (error) {
      console.error('Error testing job posting:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Job Posting</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">CSRF Status</h2>
          <p>Loading: {csrfLoading ? 'Yes' : 'No'}</p>
          <p>Token: {csrfToken ? 'Available' : 'Not available'}</p>
          {csrfToken && (
            <p className="text-xs text-gray-600 mt-1">Token: {csrfToken.substring(0, 10)}...</p>
          )}
        </div>

        <button
          onClick={testJobPosting}
          disabled={loading || csrfLoading || !csrfToken}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Job Posting API'}
        </button>

        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">API Response</h2>
            <pre className="text-xs overflow-auto max-h-96 bg-white p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}