"use client";

import { useState, useEffect } from 'react';
import { JobAnalysisResult } from '~/types/interview-management';
import { useRouter } from 'next/navigation';

interface JobPostingSuccessProps {
  jobResult: {
    job: any;
    analysis: JobAnalysisResult;
  };
  onStartOver: () => void;
}

export function JobPostingSuccess({ jobResult, onStartOver }: JobPostingSuccessProps) {
  const router = useRouter();
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(10);
  
  // Debug logging
  console.log('[JOB-POSTING-SUCCESS] jobResult:', JSON.stringify(jobResult, null, 2));
  console.log('[JOB-POSTING-SUCCESS] jobResult type:', typeof jobResult);
  console.log('[JOB-POSTING-SUCCESS] jobResult keys:', jobResult ? Object.keys(jobResult) : 'null');
  console.log('[JOB-POSTING-SUCCESS] jobResult.job:', jobResult?.job);
  console.log('[JOB-POSTING-SUCCESS] jobResult.analysis:', jobResult?.analysis);
  
  // Handle case where jobResult might be the job object directly
  let job, analysis;
  
  if (jobResult?.job && jobResult?.analysis !== undefined) {
    // Standard case: jobResult contains job and analysis
    job = jobResult.job;
    analysis = jobResult.analysis;
    console.log('[JOB-POSTING-SUCCESS] Standard case - job and analysis found');
  } else if (jobResult?.job && !jobResult?.analysis) {
    // Case where jobResult has job but no analysis
    console.log('[JOB-POSTING-SUCCESS] Job found but analysis is missing');
    job = jobResult.job;
    analysis = null;
  } else if (jobResult?.id && jobResult?.title) {
    // Case where jobResult is the job object directly
    console.log('[JOB-POSTING-SUCCESS] jobResult appears to be the job object directly');
    job = jobResult;
    analysis = null;
  } else {
    console.error('[JOB-POSTING-SUCCESS] ERROR: Cannot determine job data structure');
    console.error('[JOB-POSTING-SUCCESS] jobResult:', jobResult);
  }
  
  // Safety check
  if (!job) {
    console.error('[JOB-POSTING-SUCCESS] ERROR: job object is missing');
    console.error('[JOB-POSTING-SUCCESS] Available data:', jobResult);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-600">Job data is missing. Please try posting the job again.</p>
        <button 
          onClick={onStartOver}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!job.title) {
    console.error('[JOB-POSTING-SUCCESS] ERROR: job.title is missing');
    console.error('[JOB-POSTING-SUCCESS] Available job properties:', Object.keys(job));
  }

  const handleViewJobs = () => {
    router.push('/recruiter/jobs');
  };

  const handleFindCandidates = () => {
    router.push(`/recruiter/jobs/${job.id}/candidates`);
  };

  const handleGoToDashboard = () => {
    // Add a timestamp to force dashboard refresh
    router.push(`/recruiter?refresh=${Date.now()}`);
  };

  // Auto-redirect countdown
  useEffect(() => {
    if (autoRedirectCountdown <= 0) return;

    const interval = setInterval(() => {
      setAutoRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGoToDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const cancelAutoRedirect = () => {
    setAutoRedirectCountdown(0);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="bg-apple-green/10 border border-apple-green/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-apple-green rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-apple-green mb-2">
              Job Posted Successfully!
            </h2>
            <p className="text-apple-green/80 text-[15px] mb-2">
              Your job posting has been created and analyzed by AI. Here's what we extracted from your posting:
            </p>
            {autoRedirectCountdown > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-apple-green/60 text-[13px]">
                  Redirecting to dashboard in {autoRedirectCountdown} seconds...
                </p>
                <button
                  onClick={cancelAutoRedirect}
                  className="text-[12px] text-apple-green/60 hover:text-apple-green underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
            {job.title || 'Untitled Job Posting'}
          </h3>
          <div className="flex items-center gap-4 text-[13px] text-gray-600 dark:text-gray-400">
            <span>Job ID: {job.id}</span>
            <span>•</span>
            {analysis?.confidence !== undefined && (
              <>
                <span>•</span>
                <span>AI Confidence: {Math.round(analysis.confidence * 100)}%</span>
              </>
            )}
            <span>•</span>
            <span>Status: Active</span>
          </div>
        </div>

        {/* AI Analysis Results */}
        <div className="space-y-6">
          {/* No Analysis Warning */}
          {!analysis && (
            <div className="bg-apple-orange/10 border border-apple-orange/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-apple-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-apple-orange mb-1">AI Analysis Unavailable</h4>
                  <p className="text-[15px] text-apple-orange/80">
                    Your job was posted successfully, but AI analysis was not available. You can still find candidates and manage your posting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Job Info when no analysis */}
          {!analysis && (
            <div>
              <h4 className="text-[15px] font-medium text-black dark:text-white mb-3">
                Job Description
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-[15px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {job.rawDescription ? job.rawDescription.substring(0, 500) + (job.rawDescription.length > 500 ? '...' : '') : 'No description available'}
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          {analysis?.summary && (
            <div>
              <h4 className="text-[15px] font-medium text-black dark:text-white mb-2">
                AI Summary
              </h4>
              <p className="text-[15px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Required Skills */}
          {analysis?.requiredSkills && analysis.requiredSkills.length > 0 && (
            <div>
              <h4 className="text-[15px] font-medium text-black dark:text-white mb-3">
                Required Skills ({analysis.requiredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-apple-blue/10 text-apple-blue border border-apple-blue/20 rounded-full text-[13px] font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {analysis?.preferredSkills && analysis.preferredSkills.length > 0 && (
            <div>
              <h4 className="text-[15px] font-medium text-black dark:text-white mb-3">
                Preferred Skills ({analysis.preferredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.preferredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full text-[13px] font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience Level */}
            {(analysis?.experienceLevel || job.experienceLevel) && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="text-[13px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Experience Level
                </h4>
                <p className="text-[15px] font-medium text-black dark:text-white capitalize">
                  {analysis?.experienceLevel || job.experienceLevel}
                </p>
              </div>
            )}

            {/* Salary Range */}
            {analysis.salaryRange && (analysis.salaryRange.min || analysis.salaryRange.max) && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="text-[13px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Salary Range
                </h4>
                <p className="text-[15px] font-medium text-black dark:text-white">
                  {analysis.salaryRange.min && analysis.salaryRange.max
                    ? `$${analysis.salaryRange.min.toLocaleString()} - $${analysis.salaryRange.max.toLocaleString()}`
                    : analysis.salaryRange.min
                    ? `From $${analysis.salaryRange.min.toLocaleString()}`
                    : `Up to $${analysis.salaryRange.max?.toLocaleString()}`
                  }
                </p>
              </div>
            )}

            {/* Employment Type */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="text-[13px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Employment Type
              </h4>
              <p className="text-[15px] font-medium text-black dark:text-white capitalize">
                {job.employmentType ? job.employmentType.replace('-', ' ') : 'Not specified'}
              </p>
            </div>

            {/* Location */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="text-[13px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Location
              </h4>
              <p className="text-[15px] font-medium text-black dark:text-white">
                {job.location || 'Not specified'}
                {job.remoteAllowed && (
                  <span className="ml-2 px-2 py-0.5 bg-apple-green/10 text-apple-green text-[12px] rounded-full">
                    Remote OK
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Key Terms */}
          {analysis?.keyTerms && analysis.keyTerms.length > 0 && (
            <div>
              <h4 className="text-[15px] font-medium text-black dark:text-white mb-3">
                Key Terms & Buzzwords
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keyTerms.slice(0, 15).map((term, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[12px]"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Skills (if different from required/preferred) */}
          {analysis?.extractedSkills && analysis.extractedSkills.length > 0 && (
            <div>
              <h4 className="text-[15px] font-medium text-black dark:text-white mb-3">
                All Extracted Skills ({analysis.extractedSkills.length})
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {analysis.extractedSkills.slice(0, 20).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded text-[12px] flex items-center gap-1"
                    >
                      {skill.name}
                      <span className="text-gray-400 text-[10px]">
                        {Math.round((skill.confidence || 0) * 100)}%
                      </span>
                    </span>
                  ))}
                  {analysis.extractedSkills.length > 20 && (
                    <span className="px-2 py-1 text-gray-500 text-[12px]">
                      +{analysis.extractedSkills.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGoToDashboard}
          className="flex-1 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z" />
          </svg>
          Go to Dashboard
        </button>
        
        <button
          onClick={handleFindCandidates}
          className="flex-1 min-h-[44px] px-6 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Find Candidates
        </button>
        
        <button
          onClick={handleViewJobs}
          className="flex-1 min-h-[44px] px-6 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View All Jobs
        </button>

        <button
          onClick={onStartOver}
          className="min-h-[44px] px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-150 ease-out flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post Another Job
        </button>
      </div>
    </div>
  );
}