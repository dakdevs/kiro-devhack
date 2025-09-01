"use client";

import { useState } from 'react';

export default function TestJobFormPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testJobSubmission = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1];

      if (!csrfToken) {
        throw new Error('No CSRF token found');
      }

      const testJobData = {
        title: 'Test Software Engineer Position',
        description: `Software Engineer - Full Stack

We're looking for a talented Software Engineer to join our team.

Requirements:
- 3+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript
- Experience with React and Node.js
- Knowledge of SQL databases
- Experience with cloud platforms (AWS/GCP)

Responsibilities:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable code
- Participate in code reviews

Benefits:
- Competitive salary ($100,000 - $140,000)
- Health insurance
- Remote work options
- Professional development budget

Location: San Francisco, CA (Remote OK)
Type: Full-time`,
        remoteAllowed: true,
        employmentType: 'full-time'
      };

      console.log('Submitting test job data:', testJobData);
      console.log('CSRF token:', csrfToken);

      const response = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(testJobData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.error || responseText}`);
      }

      setResult(responseData);
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/recruiter/profile');
      const data = await response.json();
      console.log('Auth check:', { status: response.status, data });
      setResult({ authCheck: { status: response.status, data } });
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Job Form Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={checkAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Auth Status
        </button>
        
        <button
          onClick={testJobSubmission}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Job Submission'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Error:</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}