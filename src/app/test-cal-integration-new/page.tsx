"use client"

import { useState } from 'react';

export default function TestCalIntegrationPage() {
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Cal.com API key');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/cal_com_api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calComApiKey: apiKey }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setResult(data);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const syncEventTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cal_com_api/sync-event-types', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setResult(prev => ({ ...prev, eventTypes: data }));

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sync event types');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-black dark:text-white mb-4">
            Test Cal.com Integration
          </h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cal.com API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Cal.com API key"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={loading || !apiKey.trim()}
                className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {loading ? 'Connecting...' : 'Test Connection'}
              </button>

              {result?.success && (
                <button
                  onClick={syncEventTypes}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {loading ? 'Syncing...' : 'Sync Event Types'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Connection Result:
              </h3>
              <pre className="text-sm text-green-800 dark:text-green-200 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
            How to get your Cal.com API Key:
          </h2>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>1. Go to your Cal.com dashboard</li>
            <li>2. Navigate to Settings → Developer</li>
            <li>3. Click on "API Keys"</li>
            <li>4. Create a new API key</li>
            <li>5. Copy and paste it above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}