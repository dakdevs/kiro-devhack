"use client"

import { useState, useEffect } from 'react';
import { NotificationPreferences, NotificationType } from '~/types/interview-management';

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferencesComponent({ className = '' }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    inApp: true,
    types: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
    interview_scheduled: {
      label: 'Interview Scheduled',
      description: 'When an interview is scheduled with you'
    },
    interview_confirmed: {
      label: 'Interview Confirmed',
      description: 'When an interview is confirmed by both parties'
    },
    interview_cancelled: {
      label: 'Interview Cancelled',
      description: 'When an interview is cancelled'
    },
    interview_rescheduled: {
      label: 'Interview Rescheduled',
      description: 'When an interview time is changed'
    },
    availability_updated: {
      label: 'Availability Updated',
      description: 'When your availability is successfully updated'
    },
    job_posted: {
      label: 'Job Posted',
      description: 'When you successfully post a new job (recruiters only)'
    },
    candidate_matched: {
      label: 'Candidate Matched',
      description: 'When a candidate matches your job requirements (recruiters only)'
    },
    application_received: {
      label: 'Application Received',
      description: 'When you receive a new job application (recruiters only)'
    }
  };

  // Fetch current preferences
  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleDeliveryMethodChange = (method: 'email' | 'inApp', enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [method]: enabled
    }));
  };

  const handleTypeToggle = (type: NotificationType, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      types: enabled 
        ? [...prev.types, type]
        : prev.types.filter(t => t !== type)
    }));
  };

  const handleSelectAll = () => {
    const allTypes = Object.keys(notificationTypeLabels) as NotificationType[];
    setPreferences(prev => ({
      ...prev,
      types: allTypes
    }));
  };

  const handleDeselectAll = () => {
    setPreferences(prev => ({
      ...prev,
      types: []
    }));
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <div className="text-apple-red text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
            Failed to Load Preferences
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchPreferences}
            className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose how and when you want to receive notifications
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Delivery Methods */}
        <div>
          <h3 className="text-lg font-medium text-black dark:text-white mb-4">
            Delivery Methods
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email}
                onChange={(e) => handleDeliveryMethodChange('email', e.target.checked)}
                className="w-4 h-4 text-apple-blue bg-gray-100 border-gray-300 rounded focus:ring-apple-blue focus:ring-2"
              />
              <div>
                <div className="text-sm font-medium text-black dark:text-white">
                  Email Notifications
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Receive notifications via email
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.inApp}
                onChange={(e) => handleDeliveryMethodChange('inApp', e.target.checked)}
                className="w-4 h-4 text-apple-blue bg-gray-100 border-gray-300 rounded focus:ring-apple-blue focus:ring-2"
              />
              <div>
                <div className="text-sm font-medium text-black dark:text-white">
                  In-App Notifications
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Show notifications in the app
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Notification Types
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-apple-blue hover:text-blue-600 transition-colors duration-150"
              >
                Select All
              </button>
              <span className="text-xs text-gray-400">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-apple-blue hover:text-blue-600 transition-colors duration-150"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(notificationTypeLabels).map(([type, { label, description }]) => (
              <label key={type} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.types.includes(type as NotificationType)}
                  onChange={(e) => handleTypeToggle(type as NotificationType, e.target.checked)}
                  className="w-4 h-4 text-apple-blue bg-gray-100 border-gray-300 rounded focus:ring-apple-blue focus:ring-2 mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-black dark:text-white">
                    {label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {success && (
              <div className="flex items-center gap-2 text-apple-green">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Preferences saved!</span>
              </div>
            )}
            {error && (
              <div className="text-sm text-apple-red">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}