"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface AvailabilityData {
  isConnected: boolean;
  calComUsername?: string;
  eventTypes: Array<{
    id: string;
    name: string;
    duration: number;
    isActive: boolean;
    calComLink?: string;
  }>;
  lastSyncedAt?: Date;
}

export function AvailabilityManagementPage() {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [calUsername, setCalUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock recruiter ID - in real app, get from auth context
  const recruiterId = 'mock-recruiter-id';

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/recruiter-availability?recruiterId=${recruiterId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAvailability(result.data);
      } else {
        setError(result.error || 'Failed to load availability');
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setError('Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectToCal = async () => {
    if (!calUsername.trim()) {
      setError('Please enter your Cal.com username');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/recruiter-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          recruiterId,
          calUsername: calUsername.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Successfully connected to Cal.com!');
        setCalUsername('');
        await loadAvailability();
      } else {
        setError(result.error || 'Failed to connect to Cal.com');
      }
    } catch (error) {
      console.error('Error connecting to Cal.com:', error);
      setError('Failed to connect to Cal.com');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncAvailability = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/recruiter-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          recruiterId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Availability synced successfully!');
        await loadAvailability();
      } else {
        setError(result.error || 'Failed to sync availability');
      }
    } catch (error) {
      console.error('Error syncing availability:', error);
      setError('Failed to sync availability');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Cal.com? This will remove all your availability data.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/recruiter-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          recruiterId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Disconnected from Cal.com successfully');
        await loadAvailability();
      } else {
        setError(result.error || 'Failed to disconnect from Cal.com');
      }
    } catch (error) {
      console.error('Error disconnecting from Cal.com:', error);
      setError('Failed to disconnect from Cal.com');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Interview Availability
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your Cal.com account to manage your interview availability and let candidates book time with you.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg">
          {success}
        </div>
      )}

      {!availability?.isConnected ? (
        <>
          {/* Connection Setup */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Connect to Cal.com
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Your Cal.com Username
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-l-lg">
                        cal.com/
                      </span>
                      <input
                        type="text"
                        value={calUsername}
                        onChange={(e) => setCalUsername(e.target.value)}
                        placeholder="your-username"
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-r-lg bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20"
                        disabled={isConnecting}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleConnectToCal}
                    disabled={isConnecting || !calUsername.trim()}
                    className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter your Cal.com username (the part after cal.com/ in your booking link)
                </p>
              </div>
            </div>
          </div>

          {/* Migration Notice */}
          <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-apple-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-apple-blue mb-2">
                  How It Works
                </h3>
                <ul className="text-apple-blue/80 space-y-1 text-sm">
                  <li>• Connect your Cal.com account to sync your availability</li>
                  <li>• Create event types for different interview durations (30min, 60min, etc.)</li>
                  <li>• Candidates will see your jobs and can book interviews directly</li>
                  <li>• All bookings sync with your calendar automatically</li>
                  <li>• You'll receive email notifications for new bookings</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Connected Status */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                    Connected to Cal.com
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Username: <strong>cal.com/{availability.calComUsername}</strong>
                  </p>
                  {availability.lastSyncedAt && (
                    <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                      Last synced: {new Date(availability.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncAvailability}
                  disabled={isSyncing}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150 text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Event Types */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Your Interview Types
            </h2>
            
            {availability.eventTypes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Event Types Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You need to create event types in your Cal.com account for candidates to book interviews.
                </p>
                <Link
                  href="https://app.cal.com/event-types"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
                >
                  Create Event Types
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {availability.eventTypes.map((eventType) => (
                  <div
                    key={eventType.id}
                    className={`p-4 border rounded-lg transition-colors duration-150 ${
                      eventType.isActive
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          eventType.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <h3 className="font-medium text-black dark:text-white">
                            {eventType.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {eventType.duration} minutes • {eventType.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      {eventType.isActive && eventType.calComLink && (
                        <Link
                          href={eventType.calComLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-apple-blue text-white rounded text-sm hover:bg-blue-600 transition-colors duration-150 flex items-center gap-1"
                        >
                          View Booking Page
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
          Need Help?
        </h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            <strong>First time using Cal.com?</strong> Check out their{' '}
            <Link 
              href="https://cal.com/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-apple-blue hover:underline"
            >
              getting started guide
            </Link>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Calendar not syncing?</strong> Make sure you've connected your calendar in{' '}
            <Link 
              href="https://app.cal.com/apps/categories/calendar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-apple-blue hover:underline"
            >
              Cal.com integrations
            </Link>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>Questions about setup?</strong> Contact our support team for assistance with the migration.
          </p>
        </div>
      </div>
    </div>
  );
}