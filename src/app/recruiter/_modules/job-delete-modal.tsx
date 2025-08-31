"use client";

import { useState } from 'react';
import { JobPosting } from '~/types/interview-management';

interface JobDeleteModalProps {
  job: JobPosting | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: string) => Promise<void>;
}

export function JobDeleteModal({ job, isOpen, onClose, onConfirm }: JobDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(job.id);
      onClose();
    } catch (err) {
      console.error('Error deleting job posting:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job posting');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-apple-red/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Delete Job Posting
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-[15px] text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete the job posting <strong className="text-black dark:text-white">"{job.title}"</strong>?
          </p>
          
          <div className="bg-apple-red/10 border border-apple-red/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-apple-red" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[15px] text-apple-red font-medium mb-1">
                  This will permanently delete:
                </p>
                <ul className="text-[13px] text-apple-red/80 space-y-1">
                  <li>• The job posting and all its details</li>
                  <li>• Any scheduled interviews for this position</li>
                  <li>• Candidate matches and applications</li>
                  <li>• All related notifications and data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 rounded-lg border border-apple-red bg-apple-red/10 text-apple-red flex items-start gap-2 mb-4">
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

          {/* Deleting Status */}
          {isDeleting && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-apple-red/30 border-t-apple-red rounded-full animate-spin"></div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-black dark:text-white">
                    Deleting job posting...
                  </p>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
                    Please wait while we remove all related data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-6 py-3 bg-apple-red text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-red-600 hover:-translate-y-px active:bg-red-700 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-red disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Job Posting
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}