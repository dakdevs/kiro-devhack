"use client";

import { useState } from 'react';
import { JobPosting, UpdateJobPostingRequest, JobAnalysisResult } from '~/types/interview-management';

interface JobEditModalProps {
  job: JobPosting;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobId: string, updates: UpdateJobPostingRequest) => Promise<void>;
}

export function JobEditModal({ job, isOpen, onClose, onSave }: JobEditModalProps) {
  const [description, setDescription] = useState(job.rawDescription);
  const [title, setTitle] = useState(job.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Job description is required');
      return;
    }

    if (description.trim().length < 50) {
      setError('Job description must be at least 50 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updates: UpdateJobPostingRequest = {
        title: title.trim(),
        description: description.trim(),
      };

      await onSave(job.id, updates);
      onClose();
    } catch (err) {
      console.error('Error updating job posting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job posting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setDescription(job.rawDescription);
      setTitle(job.title);
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Edit Job Posting
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-8 h-8 border-none bg-none rounded-full flex items-center justify-center cursor-pointer text-gray-600 dark:text-gray-400 transition-all duration-150 ease-out hover:bg-gray-50 hover:dark:bg-gray-900 hover:text-black hover:dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Re-analysis Info */}
            <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-apple-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-apple-blue mb-1">AI Re-analysis</h3>
                  <p className="text-[15px] text-apple-blue/80">
                    When you update the job description, our AI will automatically re-analyze it to extract updated skills, requirements, and other details.
                  </p>
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-[15px] font-medium text-black dark:text-white mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Enter job title"
                disabled={isLoading}
                required
              />
            </div>

            {/* Job Description */}
            <div>
              <label htmlFor="description" className="block text-[15px] font-medium text-black dark:text-white mb-2">
                Job Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[15px] leading-relaxed transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
                placeholder="Enter the complete job description..."
                disabled={isLoading}
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[13px] text-gray-600 dark:text-gray-400">
                  {description.length} characters {description.length < 50 && description.length > 0 && '(minimum 50 required)'}
                </p>
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
                </div>
              </div>
            )}

            {/* AI Processing Info */}
            {isLoading && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-apple-blue/30 border-t-apple-blue rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-black dark:text-white">
                      AI is re-analyzing your job posting...
                    </p>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
                      This will update the extracted skills and requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !description.trim() || description.trim().length < 50}
            className="px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Update & Re-analyze
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}