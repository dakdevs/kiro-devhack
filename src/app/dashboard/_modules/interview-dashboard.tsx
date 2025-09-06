"use client"

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface CalEventType {
  id: string;
  name: string;
  duration: number;
  isActive: boolean;
  calComLink?: string;
}

interface CalAvailability {
  isConnected: boolean;
  calComUsername?: string;
  eventTypes: CalEventType[];
  lastSyncedAt?: Date;
}

interface InterviewDashboardProps {
  userId: string;
}

export function InterviewDashboard({ userId }: InterviewDashboardProps) {
  const [calData, setCalData] = useState<CalAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'event-types' | 'bookings'>('overview');
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [calUsername, setCalUsername] = useState('');
  const [recruiterId, setRecruiterId] = useState<string | null>(null);

  useEffect(() => {
    fetchCalData();
  }, [userId]);

  const fetchCalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get or create recruiter profile
      const profileResponse = await fetch('/api/recruiter/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'Default Organization',
          recruitingFor: 'Software Engineering',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to get recruiter profile');
      }

      const profileResult = await profileResponse.json();
      const currentRecruiterId = profileResult.data?.id;
      
      if (!currentRecruiterId) {
        throw new Error('Failed to create recruiter profile');
      }

      setRecruiterId(currentRecruiterId);

      // Now fetch Cal.com data
      const response = await fetch(`/api/recruiter-availability?recruiterId=${currentRecruiterId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch Cal.com data');
      }

      setCalData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Cal.com data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCal = async () => {
    if (!recruiterId) {
      setError('Recruiter profile not found');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/recruiter-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          recruiterId: recruiterId,
          calUsername: calUsername
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect Cal.com');
      }

      setShowApiKeyForm(false);
      setCalUsername('');
      await fetchCalData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Cal.com');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEventTypes = async () => {
    if (!recruiterId) {
      setError('Recruiter profile not found');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/recruiter-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          recruiterId: recruiterId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync event types');
      }

      await fetchCalData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync event types');
    } finally {
      setLoading(false);
    }
  };

  const openCalComDashboard = () => {
    window.open('https://cal.com/event-types', '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
          Error Loading Interview Dashboard
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button 
          onClick={fetchCalData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Interview Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Cal.com integration and interview scheduling
          </p>
        </div>
        
        {calData?.connected ? (
          <div className="flex gap-3">
            <button
              onClick={openCalComDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-150"
            >
              <ExternalLink className="w-4 h-4" />
              Cal.com Dashboard
            </button>
            <button
              onClick={handleSyncEventTypes}
              className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            >
              <Settings className="w-4 h-4" />
              Sync Event Types
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowApiKeyForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            Connect Cal.com
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${
        calData?.connected 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-center gap-3">
          {calData?.connected ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          )}
          <div>
            <h3 className={`font-semibold ${
              calData?.connected 
                ? 'text-green-800 dark:text-green-400'
                : 'text-yellow-800 dark:text-yellow-400'
            }`}>
              {calData?.connected ? 'Cal.com Connected' : 'Cal.com Not Connected'}
            </h3>
            <p className={`text-sm ${
              calData?.connected 
                ? 'text-green-700 dark:text-green-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {calData?.connected 
                ? 'Your Cal.com account is connected and ready for interview scheduling.'
                : 'Connect your Cal.com account to enable interview scheduling with candidates.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeTab === 'overview'
                ? 'border-apple-blue text-apple-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('event-types')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeTab === 'event-types'
                ? 'border-apple-blue text-apple-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Event Types
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeTab === 'bookings'
                ? 'border-apple-blue text-apple-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Bookings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-apple-blue">
                  {calData?.eventTypes?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Event Types
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-apple-green">
                  {calData?.eventTypes?.filter(et => et.isActive)?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Types
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              Setup Guide
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  calData?.connected 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  1
                </div>
                <span className={calData?.connected ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}>
                  Connect Cal.com account
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  calData?.eventTypes?.length 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  2
                </div>
                <span className={calData?.eventTypes?.length ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}>
                  Create interview event types
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  3
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  Share booking links with candidates
                </span>
              </div>
            </div>
          </div>

          {/* Recent Event Types */}
          {calData?.eventTypes && calData.eventTypes.length > 0 && (
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Your Event Types
                  </h2>
                  <button
                    onClick={() => setActiveTab('event-types')}
                    className="text-sm text-apple-blue hover:underline"
                  >
                    View All
                  </button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {calData.eventTypes.slice(0, 4).map((eventType) => (
                    <div key={eventType.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-black dark:text-white">
                            {eventType.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {eventType.duration} minutes
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          !eventType.isActive 
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {eventType.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {eventType.calComLink && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <a
                            href={eventType.calComLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-apple-blue hover:underline flex items-center gap-1"
                          >
                            View Booking Page
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'event-types' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Event Types
            </h2>
            <button
              onClick={openCalComDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            >
              <ExternalLink className="w-4 h-4" />
              Manage in Cal.com
            </button>
          </div>

          {calData?.eventTypes && calData.eventTypes.length > 0 ? (
            <div className="grid gap-4">
              {calData.eventTypes.map((eventType) => (
                <div key={eventType.id} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                          {eventType.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          !eventType.isActive 
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {eventType.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {eventType.duration} minutes
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Event ID: {eventType.id}
                        </div>
                      </div>
                    </div>
                  </div>
                  {eventType.calComLink && (
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={eventType.calComLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Booking Page
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(eventType.calComLink)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Event Types Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create event types in Cal.com to start scheduling interviews.
              </p>
              <button
                onClick={openCalComDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
              >
                <ExternalLink className="w-4 h-4" />
                Create Event Types
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Recent Bookings
            </h2>
            <button
              onClick={openCalComDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            >
              <ExternalLink className="w-4 h-4" />
              View All in Cal.com
            </button>
          </div>

          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Bookings Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Booking management will be available in the next update. For now, manage your bookings directly in Cal.com.
            </p>
            <button
              onClick={openCalComDashboard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Cal.com
            </button>
          </div>
        </div>
      )}

      {/* Cal.com Username Form Modal */}
      {showApiKeyForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Connect Cal.com Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Enter your Cal.com username to connect your account
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cal.com Username
                  </label>
                  <input
                    type="text"
                    value={calUsername}
                    onChange={(e) => setCalUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-apple-blue focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your Cal.com username (e.g., "sumiran-mishra-6okorg"). Find it in your{' '}
                    <a 
                      href="https://cal.com/settings/my-account/profile" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-apple-blue hover:underline"
                    >
                      Cal.com Profile
                    </a>
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">
                    How to find your username:
                  </h4>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Go to cal.com and log in</li>
                    <li>Visit your public booking page</li>
                    <li>Your username is in the URL: cal.com/<strong>your-username</strong></li>
                  </ol>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowApiKeyForm(false);
                    setCalUsername('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectCal}
                  disabled={!calUsername.trim()}
                  className="flex-1 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}