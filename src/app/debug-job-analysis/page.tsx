"use client";

import { useState } from 'react';

export default function DebugJobAnalysisPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testJobPosting = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const testJobData = {
        title: "Senior Software Engineer",
        description: `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience with JavaScript and React
- Experience with Node.js and PostgreSQL
- Strong problem-solving skills
- Bachelor's degree in Computer Science

Nice to have:
- Experience with TypeScript
- Knowledge of AWS
- Docker experience

Salary: $120,000 - $160,000
Location: San Francisco, CA (Remote OK)
Type: Full-time`,
        remoteAllowed: true,
        employmentType: 'full-time'
      };

      console.log('Testing job posting with data:', testJobData);

      const response = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testJobData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse response as JSON: ${responseText}`);
      }

      console.log('Parsed response:', data);
      setResult(data);

    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testAIAnalysisDirectly = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test the AI analysis service directly
      const response = await fetch('/api/debug/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience with JavaScript and React
- Experience with Node.js and PostgreSQL
- Strong problem-solving skills

Salary: $120,000 - $160,000`,
          title: "Senior Software Engineer"
        }),
      });

      const data = await response.json();
      console.log('AI Analysis result:', data);
      setResult(data);

    } catch (err) {
      console.error('AI Analysis test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Job Analysis</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testJobPosting}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Full Job Posting Flow'}
        </button>

        <button
          onClick={testAIAnalysisDirectly}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test AI Analysis Only'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-red-800">Error:</h3>
          <pre className="text-red-700 text-sm mt-2 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}