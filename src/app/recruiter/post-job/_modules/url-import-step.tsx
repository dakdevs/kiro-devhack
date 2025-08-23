"use client";

import { useState } from 'react';
import { JobData } from './job-posting-workflow';

interface URLImportStepProps {
  onContinue: (importedData?: Partial<JobData>) => void;
}

export function URLImportStep({ onContinue }: URLImportStepProps) {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      const response = await fetch('/api/recruiter/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to import job listing');
      }

      const data = await response.json();
      onContinue(data.jobData);
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import job listing. Please check the URL and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSkip = () => {
    onContinue();
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-apple-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Import Existing Job Listing
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Have an existing job posting? Paste the URL below and we'll automatically extract the relevant information to get you started faster.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <label htmlFor="job-url" className="block text-sm font-medium text-black dark:text-white mb-2">
            Job Listing URL (Optional)
          </label>
          <input
            type="url"
            id="job-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://example.com/job-posting"
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {error && (
            <p className="mt-2 text-sm text-apple-red" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleImport}
            disabled={isImporting || !url.trim()}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import Job Listing
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-black text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          <button
            onClick={handleSkip}
            disabled={isImporting}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Start from Scratch
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-apple-blue mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-black dark:text-white mb-1">
              Supported Job Boards
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We can import from most major job boards including LinkedIn, Indeed, AngelList, and company career pages. The import will extract job title, description, requirements, and other relevant details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}