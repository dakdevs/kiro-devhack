"use client"

import { useState, useEffect } from 'react';
import { JobPosting } from '~/types/interview-management';

interface JobWithDetails extends JobPosting {
  salaryRange?: string;
  requiredSkillsCount?: number;
  preferredSkillsCount?: number;
  extractedSkillsCount?: number;
}

export default function DemoJobsPage() {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobWithDetails | null>(null);
  const [stats, setStats] = useState<{
    totalJobs: number;
    avgRequiredSkills: number;
    avgPreferredSkills: number;
    avgExtractedSkills: number;
    avgConfidenceScore: number;
  } | null>(null);

  // Use the recruiter ID from our mock data
  const recruiterId = "21b448edfc635d367b1d9216654d74f5";

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[DEMO-JOBS] Fetching jobs from test API');
      const response = await fetch(`/api/test-jobs?recruiterId=${recruiterId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[DEMO-JOBS] API response:', data);

      if (data.success) {
        setJobs(data.data.jobs || []);
        setStats(data.data.summary || null);
        console.log('[DEMO-JOBS] Loaded jobs:', data.data.jobs?.length || 0, 'jobs');
      } else {
        console.error('Failed to load jobs:', data.error);
        setError(data.error || 'Failed to load jobs');
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load jobs');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-apple-green bg-apple-green/10 border-apple-green/20';
      case 'paused': return 'text-apple-orange bg-apple-orange/10 border-apple-orange/20';
      case 'closed': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'draft': return 'text-apple-blue bg-apple-blue/10 border-apple-blue/20';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'entry': return 'text-apple-green bg-apple-green/10';
      case 'mid': return 'text-apple-blue bg-apple-blue/10';
      case 'senior': return 'text-apple-purple bg-apple-purple/10';
      case 'executive': return 'text-apple-red bg-apple-red/10';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading jobs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            Job Postings Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstrating 25 diverse job postings with AI-powered skill extraction and candidate matching
          </p>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-black dark:text-white mb-1">
                {stats.totalJobs}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Total Jobs
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-blue mb-1">
                {stats.avgRequiredSkills.toFixed(1)}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Avg Required Skills
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-green mb-1">
                {stats.avgPreferredSkills.toFixed(1)}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Avg Preferred Skills
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-purple mb-1">
                {stats.avgExtractedSkills.toFixed(1)}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Avg Extracted Skills
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-orange mb-1">
                {(stats.avgConfidenceScore * 100).toFixed(0)}%
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Avg AI Confidence
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-apple-red/10 border border-apple-red/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-apple-red font-medium">Error loading jobs</span>
            </div>
            <p className="text-apple-red/80 text-sm mt-1">{error}</p>
            <button
              onClick={loadJobs}
              className="mt-2 px-3 py-1 bg-apple-red text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Job Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              {/* Job Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-black dark:text-white line-clamp-2">
                    {job.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{job.location}</span>
                  {job.remoteAllowed && (
                    <span className="px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-xs rounded">
                      Remote OK
                    </span>
                  )}
                </div>

                {job.salaryRange && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>{job.salaryRange}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getExperienceLevelColor(job.experienceLevel || 'mid')}`}>
                    {job.experienceLevel || 'Mid'} Level
                  </span>
                  {job.aiConfidenceScore && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      AI: {(job.aiConfidenceScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Skills Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Required Skills</span>
                  <span className="font-medium text-apple-red">
                    {job.requiredSkills?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Preferred Skills</span>
                  <span className="font-medium text-apple-blue">
                    {job.preferredSkills?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">AI Extracted</span>
                  <span className="font-medium text-apple-green">
                    {job.extractedSkills?.length || 0}
                  </span>
                </div>
              </div>

              {/* Quick Skills Preview */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Top Required Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-apple-red/10 text-apple-red text-xs rounded"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden w-full">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {selectedJob.title}
                </h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-8 h-8 border-none bg-none rounded-full flex items-center justify-center cursor-pointer text-gray-600 dark:text-gray-400 transition-all duration-150 ease-out hover:bg-gray-50 hover:dark:bg-gray-900 hover:text-black hover:dark:text-white"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Job Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="ml-2 text-black dark:text-white">{selectedJob.location}</span>
                        {selectedJob.remoteAllowed && (
                          <span className="ml-2 px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-xs rounded">
                            Remote OK
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Experience Level:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getExperienceLevelColor(selectedJob.experienceLevel || 'mid')}`}>
                          {selectedJob.experienceLevel || 'Mid'} Level
                        </span>
                      </div>
                      
                      {selectedJob.salaryRange && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Salary:</span>
                          <span className="ml-2 text-black dark:text-white">{selectedJob.salaryRange}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded border ${getStatusColor(selectedJob.status)}`}>
                          {selectedJob.status}
                        </span>
                      </div>
                      
                      {selectedJob.aiConfidenceScore && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">AI Confidence:</span>
                          <span className="ml-2 text-black dark:text-white">
                            {(selectedJob.aiConfidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Skills Analysis</h3>
                    
                    {/* Required Skills */}
                    {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-apple-red mb-2">
                          Required Skills ({selectedJob.requiredSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.requiredSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-apple-red/10 text-apple-red text-sm rounded border border-apple-red/20"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preferred Skills */}
                    {selectedJob.preferredSkills && selectedJob.preferredSkills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-apple-blue mb-2">
                          Preferred Skills ({selectedJob.preferredSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.preferredSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-apple-blue/10 text-apple-blue text-sm rounded border border-apple-blue/20"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Extracted Skills */}
                    {selectedJob.extractedSkills && selectedJob.extractedSkills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-apple-green mb-2">
                          AI Extracted Skills ({selectedJob.extractedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.extractedSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-apple-green/10 text-apple-green text-sm rounded border border-apple-green/20"
                              title={`Confidence: ${((skill as any).confidence * 100).toFixed(0)}%`}
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              Demonstrating AI-powered job analysis with skill extraction and candidate matching
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <span>• 25 diverse job postings across 5 industries</span>
              <span>• AI skill extraction with confidence scores</span>
              <span>• Realistic candidate matching system</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}