"use client"

import { useState, useEffect } from 'react';
import { RecruiterProfileForm } from '../_modules/recruiter-profile-form';
import { RecruiterProfileView } from '../_modules/recruiter-profile-view';
import { CalComSetup } from '../_modules/cal-com-setup';
import { useCSRFToken, secureApiRequest } from '~/hooks/use-csrf-token';
import { 
  RecruiterProfile, 
  CreateRecruiterProfileRequest, 
  UpdateRecruiterProfileRequest,
  RecruiterProfileResponse,
  ApiResponse
} from '~/types/interview-management';

type ViewMode = 'view' | 'create' | 'edit';

export default function RecruiterProfilePage() {
  console.log('[RECRUITER-PROFILE-PAGE] Component initialized');
  
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize CSRF token
  const csrfToken = useCSRFToken();

  // Load profile on component mount
  useEffect(() => {
    console.log('[RECRUITER-PROFILE-PAGE] Component mounted, loading profile');
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('[RECRUITER-PROFILE-PAGE] Loading profile from API');
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/recruiter/profile');
      const data: RecruiterProfileResponse = await response.json();
      console.log('[RECRUITER-PROFILE-PAGE] API response:', { success: data.success, status: response.status });

      if (data.success && data.data) {
        console.log('[RECRUITER-PROFILE-PAGE] Profile loaded successfully:', data.data.id);
        setProfile({
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        });
        setViewMode('view');
      } else if (response.status === 404) {
        // Profile doesn't exist, show create form
        console.log('[RECRUITER-PROFILE-PAGE] No profile found, switching to create mode');
        setProfile(null);
        setViewMode('create');
      } else {
        console.log('[RECRUITER-PROFILE-PAGE] Error loading profile:', data.error);
        setError(data.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('[RECRUITER-PROFILE-PAGE] Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (data: CreateRecruiterProfileRequest) => {
    try {
      console.log('[RECRUITER-PROFILE-PAGE] Creating profile with data:', data);
      setIsSubmitting(true);
      setError(null);

      const response = await secureApiRequest('/api/recruiter/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result: RecruiterProfileResponse = await response.json();
      console.log('[RECRUITER-PROFILE-PAGE] Create profile response:', { success: result.success, status: response.status });

      if (result.success && result.data) {
        console.log('[RECRUITER-PROFILE-PAGE] Profile created successfully:', result.data.id);
        setProfile({
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        });
        setViewMode('view');
        setSuccessMessage('Profile created successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.log('[RECRUITER-PROFILE-PAGE] Profile creation failed:', result.error);
        setError(result.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('[RECRUITER-PROFILE-PAGE] Error creating profile:', error);
      setError('Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateRecruiterProfileRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await secureApiRequest('/api/recruiter/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const result: RecruiterProfileResponse = await response.json();

      if (result.success && result.data) {
        setProfile({
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        });
        setViewMode('view');
        setSuccessMessage('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Are you sure you want to delete your recruiter profile? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await secureApiRequest('/api/recruiter/profile', {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setProfile(null);
        setViewMode('create');
        setSuccessMessage('Profile deleted successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    if (profile) {
      setViewMode('view');
    } else {
      // If no profile exists, stay in create mode
      setViewMode('create');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
            Recruiter Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your recruiting information and contact details
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Recruiter Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {viewMode === 'create' 
            ? 'Set up your recruiter profile to start posting jobs and managing candidates'
            : 'Manage your recruiting information and contact details'
          }
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="px-4 py-3 rounded-lg border border-apple-green bg-apple-green/10 text-apple-green flex items-start gap-2">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="m-0">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 rounded-lg border border-apple-red bg-apple-red/10 text-apple-red flex items-start gap-2">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="m-0">{error}</p>
          </div>
        </div>
      )}

      {/* Debug Section (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
            Debug Information
          </h3>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/debug/user-session');
                const data = await response.json();
                console.log('Debug user session:', data);
                alert(`Debug Info:\nUser ID: ${data.debug?.session?.userId || 'None'}\nUser exists in DB: ${data.debug?.userExists || false}\nTotal users: ${data.debug?.totalUsers || 0}`);
              } catch (error) {
                console.error('Debug failed:', error);
                alert('Debug failed - check console');
              }
            }}
            className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700"
          >
            Debug User Session
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          {viewMode === 'view' && profile && (
            <RecruiterProfileView
              profile={profile}
              onEdit={() => setViewMode('edit')}
              onDelete={handleDeleteProfile}
              isLoading={isSubmitting}
            />
          )}

          {viewMode === 'create' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white mb-1">
                  Create Recruiter Profile
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fill in your information to get started with recruiting
                </p>
              </div>
              
              <RecruiterProfileForm
                mode="create"
                onSubmit={handleCreateProfile}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {viewMode === 'edit' && profile && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white mb-1">
                  Edit Recruiter Profile
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update your recruiting information
                </p>
              </div>
              
              <RecruiterProfileForm
                mode="edit"
                initialData={profile}
                onSubmit={handleUpdateProfile}
                onCancel={handleCancel}
                isLoading={isSubmitting}
              />
            </div>
          )}
        </div>

        {/* Cal.com Integration Section */}
        {viewMode === 'view' && profile && (
          <CalComSetup
            isConnected={profile.calComConnected}
            calComUsername={profile.calComUsername}
            onSetupComplete={loadProfile}
          />
        )}
      </div>
    </div>
  );
}