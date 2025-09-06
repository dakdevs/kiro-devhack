"use client"

import { useState } from 'react';

export default function TestCalApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('sumiran-mishra-6okorg');

  const testGetAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recruiter-availability?recruiterId=test-user`);
      const data = await response.json();
      setResult({ type: 'GET', status: response.status, data });
    } catch (error) {
      setResult({ type: 'GET', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recruiter-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          recruiterId: 'test-user',
          calUsername: username
        })
      });
      const data = await response.json();
      setResult({ type: 'POST Connect', status: response.status, data });
    } catch (error) {
      setResult({ type: 'POST Connect', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cal.com API Test</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Cal.com Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="your-cal-username"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testGetAvailability}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test GET Availability
          </button>
          
          <button
            onClick={testConnect}
            disabled={loading || !username}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Test Connect
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p>Loading...</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Result: {result.type}</h2>
          
          {result.status && (
            <div className={`p-3 rounded-lg ${
              result.status >= 200 && result.status < 300 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className="font-medium">Status: {result.status}</p>
            </div>
          )}
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">Response:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}