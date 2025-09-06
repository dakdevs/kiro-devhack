"use client"

import { useState } from 'react';
import { Button } from '~/components/ui/button';

interface CalComSetupProps {
  onSetupComplete?: () => void;
  isConnected?: boolean;
  calComUsername?: string;
}

export function CalComSetup({ onSetupComplete, isConnected = false, calComUsername }: CalComSetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Cal.com API key');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cal_com_api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calComApiKey: apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to connect to Cal.com');
      }

      const data = await response.json();
      setSuccess(`Successfully connected to Cal.com as ${data.user.username}`);
      setApiKey('');
      
      if (onSetupComplete) {
        onSetupComplete();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Cal.com');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupEventType = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cal_com_api/setup', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to setup interview event type');
      }

      const data = await response.json();
      setSuccess(`Interview event type created successfully! Event Type ID: ${data.eventTypeId}`);
      
      if (onSetupComplete) {
        onSetupComplete();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup interview event type');
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-apple-green rounded-full"></div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Cal.com Connected
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your Cal.com account is connected as <strong>@{calComUsername}</strong>
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleSetupEventType}
            disabled={isLoading}
            className="bg-apple-blue text-white hover:bg-blue-600"
          >
            {isLoading ? 'Setting up...' : 'Setup Interview Event Type'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-apple-red/10 border border-apple-red/20 rounded-lg">
            <p className="text-apple-red text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-apple-green/10 border border-apple-green/20 rounded-lg">
            <p className="text-apple-green text-sm">{success}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Connect Cal.com
        </h3>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Connect your Cal.com account to allow candidates to schedule interviews with you automatically.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="cal-api-key" className="block text-sm font-medium text-black dark:text-white mb-2">
            Cal.com API Key
          </label>
          <input
            id="cal-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Cal.com API key"
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You can find your API key in your Cal.com settings under "API Keys"
          </p>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isLoading || !apiKey.trim()}
          className="w-full bg-apple-blue text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect Cal.com Account'}
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-apple-red/10 border border-apple-red/20 rounded-lg">
          <p className="text-apple-red text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-apple-green/10 border border-apple-green/20 rounded-lg">
          <p className="text-apple-green text-sm">{success}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="text-sm font-medium text-black dark:text-white mb-2">
          How to get your Cal.com API Key:
        </h4>
        <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
          <li>Go to your Cal.com dashboard</li>
          <li>Navigate to Settings → API Keys</li>
          <li>Click "Create API Key"</li>
          <li>Copy the generated key and paste it above</li>
        </ol>
      </div>
    </div>
  );
}