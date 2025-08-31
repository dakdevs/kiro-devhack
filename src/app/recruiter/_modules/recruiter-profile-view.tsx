"use client"

import { RecruiterProfile } from '~/types/interview-management';

interface RecruiterProfileViewProps {
  profile: RecruiterProfile;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export function RecruiterProfileView({
  profile,
  onEdit,
  onDelete,
  isLoading = false
}: RecruiterProfileViewProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white mb-1">
            Recruiter Profile
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your recruiting information and contact details
          </p>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="min-h-[44px] px-4 py-2 bg-apple-blue text-white rounded-lg font-system text-sm font-semibold transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
              >
                Edit Profile
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="min-h-[44px] px-4 py-2 bg-apple-red text-white rounded-lg font-system text-sm font-semibold transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-red focus-visible:outline-offset-2 hover:bg-red-600 hover:-translate-y-px active:bg-red-700 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-red disabled:hover:translate-y-0"
              >
                Delete Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Organization Name
          </label>
          <p className="text-base text-black dark:text-white font-medium">
            {profile.organizationName}
          </p>
        </div>

        {/* Recruiting For */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Recruiting For
          </label>
          <p className="text-base text-black dark:text-white font-medium">
            {profile.recruitingFor}
          </p>
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Contact Email
          </label>
          {profile.contactEmail ? (
            <a
              href={`mailto:${profile.contactEmail}`}
              className="text-base text-apple-blue hover:text-blue-600 transition-colors duration-150 underline"
            >
              {profile.contactEmail}
            </a>
          ) : (
            <p className="text-base text-gray-400 dark:text-gray-500 italic">
              Not provided
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Phone Number
          </label>
          {profile.phoneNumber ? (
            <a
              href={`tel:${profile.phoneNumber}`}
              className="text-base text-apple-blue hover:text-blue-600 transition-colors duration-150 underline"
            >
              {profile.phoneNumber}
            </a>
          ) : (
            <p className="text-base text-gray-400 dark:text-gray-500 italic">
              Not provided
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Timezone
          </label>
          <p className="text-base text-black dark:text-white font-medium">
            {profile.timezone}
          </p>
        </div>

        {/* Profile ID */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Profile ID
          </label>
          <p className="text-base text-gray-500 dark:text-gray-400 font-mono text-sm">
            {profile.id}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Created
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(profile.createdAt)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Last Updated
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(profile.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Status Indicator */}
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 bg-apple-green rounded-full"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Profile is active and visible to candidates
        </span>
      </div>
    </div>
  );
}