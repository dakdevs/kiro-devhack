"use client"

import { useState, useEffect } from 'react';

interface CalComUser {
  username: string;
  name: string;
  email: string;
  timeZone: string;
}

interface CalComSchedule {
  id: number;
  name: string;
  timeZone: string;
}

interface EventType {
  id: number;
  title: string;
  slug: string;
  duration: number;
}

interface ConnectionStatus {
  connected: boolean;
  user?: CalComUser;
  schedule?: CalComSchedule;
  eventTypes?: EventType[];
}

export function CalComConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // This would check if the current user has Cal.com connected
      // For now, we'll assume not connected initially
      setConnectionStatus({ connected: false });
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Cal.com API key');
      return;
    }

    setIsConnecting(true);
    setError(null);

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
      
      setConnectionStatus({
        connected: true,
        user: data.user,
        schedule: data.schedule,
      });

      setApiKey('');
      setShowApiKeyInput(false);
      
      // Automatically sync event types after connection
      await syncEventTypes();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect to Cal.com');
    } finally {
      setIsConnecting(false);
    }
  };

  const syncEventTypes = async () => {
    setIsSyncing(true);
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
      
      setConnectionStatus(prev => ({
        ...prev,
        eventTypes: data.eventTypes,
      }));

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sync event types');
    } finally {
      setIsSyncing(false);
    }
  };

  if (connectionStatus.connected) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Cal.com Connected
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{connectionStatus.user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={syncEventTypes}
            disabled={isSyncing}
            className="px-3 py-2 text-sm bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isSyncing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Syncing...
              </div>
            ) : (
              'Sync Event Types'
            )}
          </button>
        </div>

        {connectionStatus.user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <p className="text-black dark:text-white">{connectionStatus.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="text-black dark:text-white">{connectionStatus.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <p className="text-black dark:text-white">@{connectionStatus.user.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
              <p className="text-black dark:text-white">{connectionStatus.user.timeZone}</p>
            </div>
          </div>
        )}

        {connectionStatus.eventTypes && connectionStatus.eventTypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Event Types ({connectionStatus.eventTypes.length})
            </h4>
            <div className="space-y-2">
              {connectionStatus.eventTypes.map((eventType) => (
                <div
                  key={eventType.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-black dark:text-white">{eventType.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {eventType.duration} minutes • /{eventType.slug}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
          Connect Your Cal.com Account
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect your Cal.com account to enable interview scheduling with candidates
        </p>

        {!showApiKeyInput ? (
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
          >
            Connect Cal.com
          </button>
        ) : (
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You can find your API key in your Cal.com settings under Developer → API Keys
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApiKeyInput(false);
                  setApiKey('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 hover:dark:bg-gray-900 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={isConnecting || !apiKey.trim()}
                className="flex-1 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connecting...
                  </div>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to get your Cal.com API Key:
          </h4>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 text-left">
            <li>1. Go to your Cal.com dashboard</li>
            <li>2. Navigate to Settings → Developer</li>
            <li>3. Click on "API Keys"</li>
            <li>4. Create a new API key</li>
            <li>5. Copy and paste it here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}