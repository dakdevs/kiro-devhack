"use client";

import { useState } from 'react';
import { CreateJobPostingRequest } from '~/types/interview-management';
import { useCSRFToken, secureApiRequest } from '~/hooks/use-csrf-token';


interface SimpleJobPostingFormProps {
  onSuccess: (result: any) => void;
}

export function SimpleJobPostingForm({ onSuccess }: SimpleJobPostingFormProps) {
  const [jobPosting, setJobPosting] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Initialize CSRF token
  const csrfToken = useCSRFToken();

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/recruiter/profile');
      const data = await response.json();

      setDebugInfo(`Status: ${response.status}, Auth: ${response.ok ? 'OK' : 'Failed'}, Profile: ${data.success ? 'Exists' : 'Missing'}, Error: ${data.error || 'None'}`);

      // If profile is missing, show helpful error
      if (response.status === 404) {
        setError('You need to create a recruiter profile before posting jobs. Please set up your profile first.');
      }
    } catch (err) {
      setDebugInfo(`Error checking status: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SIMPLE-JOB-FORM] handleSubmit called');
    e.preventDefault();

    // Add debugging info
    console.log('[SIMPLE-JOB-FORM] Current URL:', window.location.href);
    console.log('[SIMPLE-JOB-FORM] User agent:', navigator.userAgent);
    console.log('[SIMPLE-JOB-FORM] Cookies:', document.cookie);

    if (!jobPosting.trim()) {
      console.log('[SIMPLE-JOB-FORM] Error: Empty job posting');
      setError('Please enter a job posting');
      return;
    }

    if (jobPosting.trim().length < 50) {
      setError('Job posting must be at least 50 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait for CSRF token to be available with timeout
      let attempts = 0;
      const maxAttempts = 10;
      while (!csrfToken && attempts < maxAttempts) {
        console.log(`[SIMPLE-JOB-FORM] Waiting for CSRF token, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!csrfToken) {
        throw new Error('Security token not available. Please refresh the page and try again.');
      }

      // Extract a basic title from the first line or first few words
      const lines = jobPosting.trim().split('\n');
      const firstLine = lines[0].trim();
      const title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;

      const jobData: CreateJobPostingRequest = {
        title: title || 'Job Posting',
        description: jobPosting.trim(),
        remoteAllowed: false,
        employmentType: 'full-time',
      };

      console.log('[SIMPLE-JOB-FORM] Submitting job data:', jobData);
      console.log('[SIMPLE-JOB-FORM] CSRF token available:', !!csrfToken);

      const response = await secureApiRequest('/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      console.log('[SIMPLE-JOB-FORM] Response status:', response.status);
      console.log('[SIMPLE-JOB-FORM] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to create job posting';

        try {
          const responseText = await response.text();
          console.log('[SIMPLE-JOB-FORM] Error response text:', responseText);

          if (responseText) {
            try {
              const errorData = JSON.parse(responseText);
              console.log('[SIMPLE-JOB-FORM] Parsed error data:', errorData);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (jsonError) {
              console.log('[SIMPLE-JOB-FORM] Response is not JSON, using raw text');
              errorMessage = responseText;
            }
          }
        } catch (parseError) {
          console.log('[SIMPLE-JOB-FORM] Error reading response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }

        // Handle specific HTTP status codes
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please sign in and try again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions or create a recruiter profile.';
        } else if (response.status === 404) {
          errorMessage = 'Recruiter profile not found. Please create your profile first.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again in a moment.';
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[SIMPLE-JOB-FORM] API response result:', result);

      if (result.success && result.data) {
        console.log('[SIMPLE-JOB-FORM] Job posting created successfully');
        onSuccess(result);
      } else {
        throw new Error(result.error || 'Failed to create job posting');
      }
    } catch (err) {
      console.error('[SIMPLE-JOB-FORM] Error creating job posting:', err);

      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide helpful guidance for common errors
        if (errorMessage.includes('Recruiter profile not found')) {
          errorMessage = 'Please create your recruiter profile first before posting jobs. Go to Profile → Create Profile to get started.';
        } else if (errorMessage.includes('CSRF') || errorMessage.includes('Security token')) {
          errorMessage = 'Security token expired. Please refresh the page and try again.';
        } else if (errorMessage.includes('Authentication required')) {
          errorMessage = 'Please sign in to post jobs.';
        } else if (errorMessage.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Allow the paste to happen naturally
    setTimeout(() => {
      setError(null);
    }, 0);
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setError('Please enter a URL to import from');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      // Use the API route to fetch and convert the JSON data
      const apiUrl = `/api/convert_from_json?url=${encodeURIComponent(importUrl)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // The API returns the extracted content in the 'text' field
      const extractedContent = data.text;

      if (!extractedContent || extractedContent.trim().length === 0) {
        throw new Error('Could not extract job posting content from the provided JSON');
      }

      // Set the extracted content in the textarea
      setJobPosting(extractedContent);
      setImportUrl(''); // Clear the URL field

      // Show success message briefly
      setDebugInfo(`Successfully imported job data from URL (${extractedContent.length} characters)`);
      setTimeout(() => setDebugInfo(null), 3000);

    } catch (err) {
      console.error('Error importing from URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to import from URL');
    } finally {
      setIsImporting(false);
    }
  };


  const exampleJobPosting = `Senior Software Engineer - Full Stack

We're looking for a Senior Software Engineer to join our growing team at TechCorp. You'll be working on our core platform using React, Node.js, and PostgreSQL.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript
- Experience with React and Node.js
- Knowledge of SQL databases (PostgreSQL preferred)
- Experience with AWS or similar cloud platforms
- Strong problem-solving skills and attention to detail

Nice to have:
- Experience with Docker and Kubernetes
- Knowledge of GraphQL
- Previous startup experience

We offer:
- Competitive salary ($120,000 - $160,000)
- Equity package
- Remote work flexibility
- Health, dental, and vision insurance
- 401k matching

Location: San Francisco, CA (Remote OK)
Type: Full-time`;

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      {/* Profile Required Notice */}
      {debugInfo?.includes('Profile: Missing') && (
        <div className="mb-6 px-4 py-4 rounded-lg border border-apple-orange bg-apple-orange/10 text-apple-orange">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Profile Required</h3>
              <p className="text-[15px] mb-3">
                You need to create a recruiter profile before you can post jobs. This helps candidates learn about your company and contact you.
              </p>
              <a
                href="/recruiter/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-apple-orange text-white rounded-lg text-[15px] font-medium hover:bg-orange-600 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Create Recruiter Profile
              </a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Instructions */}
        <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-apple-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-apple-blue mb-1">How it works</h3>
              <p className="text-[15px] text-apple-blue/80">
                Simply paste your complete job posting below. Our AI will automatically extract:
              </p>
              <ul className="text-[13px] text-apple-blue/70 mt-2 space-y-1">
                <li>• Required and preferred skills</li>
                <li>• Experience level and salary range</li>
                <li>• Job type and location details</li>
                <li>• Key responsibilities and requirements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* URL Import Section */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-black dark:text-white mb-1">Import from URL</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-3">
                Import job posting data from a JSON URL. The system will automatically extract job details and populate the form below.
              </p>

              <div className="mb-3">
                <p className="text-[12px] text-gray-500 dark:text-gray-500 mb-1">Test URLs:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setImportUrl(`${window.location.origin}/test-job-data.json`)}
                    className="text-[11px] px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
                    disabled={isImporting || isLoading}
                  >
                    Frontend Dev
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportUrl(`${window.location.origin}/test-job-data-alt.json`)}
                    className="text-[11px] px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
                    disabled={isImporting || isLoading}
                  >
                    Product Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportUrl(`${window.location.origin}/test-job-data-html.json`)}
                    className="text-[11px] px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
                    disabled={isImporting || isLoading}
                  >
                    HTML Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportUrl(`${window.location.origin}/test-greenhouse-job.json`)}
                    className="text-[11px] px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-150"
                    disabled={isImporting || isLoading}
                  >
                    Greenhouse
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://example.com/job-data.json"
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[14px] transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={isImporting || isLoading}
                />
                <button
                  type="button"
                  onClick={handleImportFromUrl}
                  disabled={isImporting || isLoading || !importUrl.trim()}
                  className="px-4 py-2 bg-apple-blue text-white rounded-lg text-[14px] font-medium transition-all duration-150 ease-out hover:bg-[#0056CC] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Job Posting Input */}
        <div>
          <label htmlFor="jobPosting" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Job Posting *
          </label>
          <textarea
            id="jobPosting"
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            onPaste={handlePaste}
            rows={20}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[15px] leading-relaxed transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
            placeholder="Paste your complete job posting here..."
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[13px] text-gray-600 dark:text-gray-400">
              {jobPosting.length} characters {jobPosting.length < 50 && jobPosting.length > 0 && '(minimum 50 required)'}
            </p>
            <button
              type="button"
              onClick={() => setJobPosting(exampleJobPosting)}
              className="text-[13px] text-apple-blue hover:text-blue-600 transition-colors duration-150"
              disabled={isLoading}
            >
              Use example
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 rounded-lg border border-apple-red bg-apple-red/10 text-apple-red flex items-start gap-2">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium">Error</p>
              <p className="text-[14px] opacity-90">{error}</p>
              {error.includes('recruiter profile') && (
                <div className="mt-2">
                  <a
                    href="/recruiter/profile"
                    className="inline-flex items-center gap-1 text-[13px] text-apple-blue hover:text-blue-600 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Go to Profile Setup
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo && (
          <div className="px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <p className="text-[13px] font-mono">{debugInfo}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={checkStatus}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-150"
          >
            Check Status
          </button>

          <button
            type="submit"
            disabled={isLoading || !jobPosting.trim() || jobPosting.trim().length < 50 || (debugInfo?.includes('Profile: Missing') ?? false)}
            className="flex-1 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing with AI...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze & Post Job
              </>
            )}
          </button>
        </div>

        {/* AI Processing Info */}
        {isLoading && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-apple-blue/30 border-t-apple-blue rounded-full animate-spin"></div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-black dark:text-white">
                  AI is analyzing your job posting...
                </p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
                  This usually takes 10-30 seconds. We're extracting skills, requirements, and other details.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}