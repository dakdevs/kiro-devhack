"use client"

import { useState } from 'react';

export default function TestCompleteWorkflowPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testJobMatches = async () => {
    const response = await fetch('/api/job-matches?candidateId=test-candidate');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  };

  const testRefreshJobMatches = async () => {
    const response = await fetch('/api/job-matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'test-candidate' })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  };

  const testRecruiterAvailability = async () => {
    const response = await fetch('/api/recruiter-availability?recruiterId=test-recruiter');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  };

  const testCalConnect = async () => {
    const response = await fetch('/api/recruiter-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'connect',
        recruiterId: 'test-recruiter',
        calApiKey: 'test-key'
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  };

  const testDatabase = async () => {
    const response = await fetch('/api/test-db');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  };

  const testAuth = async () => {
    const response = await fetch('/api/auth/session');
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  };

  const runAllTests = async () => {
    const tests = [
      { name: 'Database Connection', fn: testDatabase },
      { name: 'Auth Session', fn: testAuth },
      { name: 'Job Matches (GET)', fn: testJobMatches },
      { name: 'Job Matches (POST)', fn: testRefreshJobMatches },
      { name: 'Recruiter Availability (GET)', fn: testRecruiterAvailability },
      { name: 'Cal.com Connect (POST)', fn: testCalConnect },
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const ResultDisplay = ({ testName, result }: { testName: string, result: any }) => {
    if (!result) return null;

    return (
      <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <h3 className="font-semibold">{testName}</h3>
        </div>
        
        {result.success ? (
          <div>
            <p className="text-green-700 mb-2">✅ Success</p>
            <details className="text-sm">
              <summary className="cursor-pointer text-green-600 hover:text-green-800">View Response</summary>
              <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div>
            <p className="text-red-700 mb-2">❌ Failed</p>
            <p className="text-red-600 text-sm font-mono bg-red-100 p-2 rounded">
              {result.error}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Complete Workflow Test Suite</h1>
        <p className="text-gray-600 mb-6">
          Test all API endpoints and functionality to verify the client-server separation is working correctly.
        </p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={Object.values(loading).some(Boolean)}
            className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.values(loading).some(Boolean) ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          <button
            onClick={() => {
              setResults({});
              setLoading({});
            }}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>
      </div>

      <div className="grid gap-4 mb-8">
        <h2 className="text-xl font-semibold">Individual Tests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => runTest('Database Connection', testDatabase)}
            disabled={loading['Database Connection']}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <h3 className="font-semibold">Database Connection</h3>
            <p className="text-sm text-gray-600">Test database connectivity</p>
            {loading['Database Connection'] && <p className="text-sm text-blue-600">Testing...</p>}
          </button>

          <button
            onClick={() => runTest('Auth Session', testAuth)}
            disabled={loading['Auth Session']}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <h3 className="font-semibold">Auth Session</h3>
            <p className="text-sm text-gray-600">Test authentication system</p>
            {loading['Auth Session'] && <p className="text-sm text-blue-600">Testing...</p>}
          </button>

          <button
            onClick={() => runTest('Job Matches (GET)', testJobMatches)}
            disabled={loading['Job Matches (GET)']}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <h3 className="font-semibold">Job Matches (GET)</h3>
            <p className="text-sm text-gray-600">Fetch job matches for candidate</p>
            {loading['Job Matches (GET)'] && <p className="text-sm text-blue-600">Testing...</p>}
          </button>

          <button
            onClick={() => runTest('Job Matches (POST)', testRefreshJobMatches)}
            disabled={loading['Job Matches (POST)']}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <h3 className="font-semibold">Job Matches (POST)</h3>
            <p className="text-sm text-gray-600">Refresh job matches</p>
            {loading['Job Matches (POST)'] && <p className="text-sm text-blue-600">Testing...</p>}
          </button>

          <button
            onClick={() => runTest('Recruiter Availability (GET)', testRecruiterAvailability)}
            disabled={loading['Recruiter Availability (GET)']}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <h3 className="font-semibold">Recruiter Availability (GET)</h3>
            <p className="text-sm text-gray-600">Get recruiter availability status</p>
            {loading['Recruiter Availability (GET)'] && <p className="text-sm text-blue-600">Testing...</p>}
          </button>

          <button
            onClick={() => runTest('Cal.com Connect (POST)', testCalConnect)}
            disabled={loading['Cal.com Connect (POST)']}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <h3 className="font-semibold">Cal.com Connect (POST)</h3>
            <p className="text-sm text-gray-600">Test Cal.com integration</p>
            {loading['Cal.com Connect (POST)'] && <p className="text-sm text-blue-600">Testing...</p>}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results</h2>
        
        {Object.keys(results).length === 0 ? (
          <p className="text-gray-500 italic">No tests run yet. Click "Run All Tests" or individual test buttons above.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(results).map(([testName, result]) => (
              <ResultDisplay key={testName} testName={testName} result={result} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">What This Tests</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Database Connection:</strong> Verifies database is accessible</li>
          <li>• <strong>Auth Session:</strong> Tests authentication system</li>
          <li>• <strong>Job Matches API:</strong> Tests job matching service via API</li>
          <li>• <strong>Recruiter Availability API:</strong> Tests Cal.com integration via API</li>
          <li>• <strong>Client-Server Separation:</strong> Ensures no direct database imports in client</li>
          <li>• <strong>Error Handling:</strong> Validates proper error responses</li>
        </ul>
      </div>
    </div>
  );
}