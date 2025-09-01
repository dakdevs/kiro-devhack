"use client";

import { useState } from 'react';

export default function TestGreenhouseImportPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);

  const testImport = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setRawData(null);

    try {
      console.log('Testing URL:', url);
      
      // First, let's see what the raw data looks like
      console.log('Fetching raw data...');
      const rawResponse = await fetch(url);
      if (!rawResponse.ok) {
        throw new Error(`Failed to fetch raw data: ${rawResponse.status} ${rawResponse.statusText}`);
      }
      
      const rawJson = await rawResponse.json();
      console.log('Raw JSON data:', rawJson);
      setRawData(rawJson);
      
      // Now test our conversion API
      console.log('Testing conversion API...');
      const response = await fetch(`/api/convert_from_json?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Converted data:', data);
      setResult(data.text);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testGreenhouseUrl = () => {
    // Example Greenhouse API URL
    setUrl('https://boards-api.greenhouse.io/v1/boards/greenhouse/jobs/4076519007?questions=true&pay_transparency=true');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Greenhouse Import</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">URL to Import:</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://boards-api.greenhouse.io/v1/boards/..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={testImport}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Import'}
            </button>
          </div>
        </div>
        
        <button
          onClick={testGreenhouseUrl}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Use Example Greenhouse URL
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Error:</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {rawData && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Raw JSON Data:</h3>
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">Click to expand raw data</summary>
            <pre className="whitespace-pre-wrap text-xs mt-2 bg-white p-2 rounded border max-h-64 overflow-y-auto">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h3 className="font-bold">Converted Content:</h3>
          <div className="mt-2 p-3 bg-white border rounded">
            <pre className="whitespace-pre-wrap text-sm text-black">{result}</pre>
          </div>
          <div className="mt-2 text-sm">
            Character count: {result.length}
          </div>
        </div>
      )}
    </div>
  );
}