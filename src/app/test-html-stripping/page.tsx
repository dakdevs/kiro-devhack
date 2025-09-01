"use client";

import { useState } from 'react';

export default function TestHtmlStrippingPage() {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHtmlStripping = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const testUrl = `${window.location.origin}/test-job-data-html.json`;
      const response = await fetch(`/api/convert_from_json?url=${encodeURIComponent(testUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testUrls = [
    { name: 'HTML Test Data', url: '/test-job-data-html.json' },
    { name: 'Frontend Dev', url: '/test-job-data.json' },
    { name: 'Product Manager', url: '/test-job-data-alt.json' }
  ];

  const testUrl = async (url: string) => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const fullUrl = `${window.location.origin}${url}`;
      const response = await fetch(`/api/convert_from_json?url=${encodeURIComponent(fullUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test HTML Stripping</h1>
      
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold">Test URLs:</h2>
        <div className="flex flex-wrap gap-2">
          {testUrls.map((testCase) => (
            <button
              key={testCase.name}
              onClick={() => testUrl(testCase.url)}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {testCase.name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Processing...
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Error:</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h3 className="font-bold">Extracted Content:</h3>
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