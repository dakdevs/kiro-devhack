"use client"

import { useState } from 'react';
import { 
  CreateRecruiterProfileRequest, 
  UpdateRecruiterProfileRequest,
  RecruiterProfile 
} from '~/types/interview-management';

interface RecruiterProfileFormProps {
  initialData?: RecruiterProfile;
  onSubmit: (data: CreateRecruiterProfileRequest | UpdateRecruiterProfileRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function RecruiterProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: RecruiterProfileFormProps) {
  const [formData, setFormData] = useState({
    organizationName: initialData?.organizationName || '',
    recruitingFor: initialData?.recruitingFor || '',
    contactEmail: initialData?.contactEmail || '',
    phoneNumber: initialData?.phoneNumber || '',
    timezone: initialData?.timezone || 'UTC',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    console.log('[RECRUITER-PROFILE-FORM] Validating form data:', formData);
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName.trim()) {
      console.log('[RECRUITER-PROFILE-FORM] Validation error: Organization name is required');
      newErrors.organizationName = 'Organization name is required';
    }

    if (!formData.recruitingFor.trim()) {
      console.log('[RECRUITER-PROFILE-FORM] Validation error: Recruiting for field is required');
      newErrors.recruitingFor = 'Recruiting for field is required';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      console.log('[RECRUITER-PROFILE-FORM] Validation error: Invalid email format');
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[RECRUITER-PROFILE-FORM] Form submitted, mode:', mode);
    
    if (!validateForm()) {
      console.log('[RECRUITER-PROFILE-FORM] Form validation failed');
      return;
    }
    console.log('[RECRUITER-PROFILE-FORM] Form validation passed');

    try {
      const submitData = {
        organizationName: formData.organizationName.trim(),
        recruitingFor: formData.recruitingFor.trim(),
        contactEmail: formData.contactEmail.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        timezone: formData.timezone,
      };

      console.log('[RECRUITER-PROFILE-FORM] Submitting data:', submitData);
      await onSubmit(submitData);
      console.log('[RECRUITER-PROFILE-FORM] Form submission successful');
    } catch (error) {
      console.error('[RECRUITER-PROFILE-FORM] Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Name */}
      <div>
        <label htmlFor="organizationName" className="block text-sm font-medium text-black dark:text-white mb-2">
          Organization Name *
        </label>
        <input
          type="text"
          id="organizationName"
          value={formData.organizationName}
          onChange={(e) => handleInputChange('organizationName', e.target.value)}
          className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="Enter your organization name"
          disabled={isLoading}
          required
        />
        {errors.organizationName && (
          <p className="mt-1 text-sm text-apple-red" role="alert">
            {errors.organizationName}
          </p>
        )}
      </div>

      {/* Recruiting For */}
      <div>
        <label htmlFor="recruitingFor" className="block text-sm font-medium text-black dark:text-white mb-2">
          Recruiting For *
        </label>
        <input
          type="text"
          id="recruitingFor"
          value={formData.recruitingFor}
          onChange={(e) => handleInputChange('recruitingFor', e.target.value)}
          className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="e.g., Tech Company, Startup, Enterprise"
          disabled={isLoading}
          required
        />
        {errors.recruitingFor && (
          <p className="mt-1 text-sm text-apple-red" role="alert">
            {errors.recruitingFor}
          </p>
        )}
      </div>

      {/* Contact Email */}
      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-black dark:text-white mb-2">
          Contact Email
        </label>
        <input
          type="email"
          id="contactEmail"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="your.email@company.com"
          disabled={isLoading}
        />
        {errors.contactEmail && (
          <p className="mt-1 text-sm text-apple-red" role="alert">
            {errors.contactEmail}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-black dark:text-white mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="+1 (555) 123-4567"
          disabled={isLoading}
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-apple-red" role="alert">
            {errors.phoneNumber}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-black dark:text-white mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          value={formData.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
          disabled={isLoading}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 min-h-[44px] px-4 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-gray-100 hover:dark:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 min-h-[44px] px-4 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </div>
          ) : (
            mode === 'create' ? 'Create Profile' : 'Update Profile'
          )}
        </button>
      </div>
    </form>
  );
}