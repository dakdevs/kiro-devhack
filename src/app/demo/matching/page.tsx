"use client"

import { useState, useEffect } from 'react';

interface MatchingResult {
  jobId: string;
  jobTitle: string;
  success: boolean;
  requiredSkills: number;
  preferredSkills: number;
  matchAnalysis: {
    totalMatches: number;
    excellentFit: number;
    goodFit: number;
    fairFit: number;
    poorFit: number;
    averageMatchScore: number;
    topMatchScore: number;
    skillMatchAccuracy: Array<{
      candidateName: string;
      actualScore: number;
      expectedScore: number;
      scoreDifference: number;
      requiredMatches: number;
      preferredMatches: number;
      totalCandidateSkills: number;
    }>;
  };
}

interface MatchingData {
  overallMetrics: {
    totalJobsTested: number;
    successfulTests: number;
    failedTests: number;
    averageMatchScore: number;
    totalMatches: number;
    averageCandidatesPerJob: number;
  };
  jobResults: MatchingResult[];
}

export default function DemoMatchingPage() {
  const [matchingData, setMatchingData] = useState<MatchingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<MatchingResult | null>(null);

  useEffect(() => {
    loadMatchingData();
  }, []);

  const loadMatchingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[DEMO-MATCHING] Fetching matching data');
      const response = await fetch('/api/verify-matching');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[DEMO-MATCHING] API response:', data);

      if (data.success) {
        setMatchingData(data.data);
        console.log('[DEMO-MATCHING] Loaded matching data for', data.data.jobResults?.length || 0, 'jobs');
      } else {
        console.error('Failed to load matching data:', data.error);
        setError(data.error || 'Failed to load matching data');
      }
    } catch (error) {
      console.error('Error loading matching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load matching data');
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-apple-green bg-apple-green/10 border-apple-green/20';
    if (score >= 60) return 'text-apple-blue bg-apple-blue/10 border-apple-blue/20';
    if (score >= 40) return 'text-apple-orange bg-apple-orange/10 border-apple-orange/20';
    return 'text-apple-red bg-apple-red/10 border-apple-red/20';
  };

  const getFitLabel = (score: number) => {
    if (score >= 80) return 'Excellent Fit';
    if (score >= 60) return 'Good Fit';
    if (score >= 40) return 'Fair Fit';
    return 'Poor Fit';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing candidate matches...</span>
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
            Candidate Matching Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered candidate matching system analyzing skill overlap and fit scores
          </p>
        </header>

        {/* Overall Metrics */}
        {matchingData && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-black dark:text-white mb-1">
                {matchingData.overallMetrics.totalJobsTested}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Jobs Tested
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-green mb-1">
                {matchingData.overallMetrics.successfulTests}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Successful Tests
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-blue mb-1">
                {matchingData.overallMetrics.totalMatches}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Total Matches
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-purple mb-1">
                {matchingData.overallMetrics.averageCandidatesPerJob.toFixed(1)}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Avg Candidates/Job
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-orange mb-1">
                {matchingData.overallMetrics.averageMatchScore.toFixed(0)}%
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Avg Match Score
              </div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl font-semibold text-apple-red mb-1">
                {matchingData.overallMetrics.failedTests}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-gray-400">
                Failed Tests
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
              <span className="text-apple-red font-medium">Error loading matching data</span>
            </div>
            <p className="text-apple-red/80 text-sm mt-1">{error}</p>
            <button
              onClick={loadMatchingData}
              className="mt-2 px-3 py-1 bg-apple-red text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Job Results Grid */}
        {matchingData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingData.jobResults.map((job) => (
              <div
                key={job.jobId}
                className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                {/* Job Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black dark:text-white line-clamp-2 mb-2">
                    {job.jobTitle}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Required: {job.requiredSkills}</span>
                    <span>•</span>
                    <span>Preferred: {job.preferredSkills}</span>
                  </div>
                </div>

                {/* Match Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Matches</span>
                    <span className="font-medium text-black dark:text-white">
                      {job.matchAnalysis.totalMatches}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Top Score</span>
                    <span className={`px-2 py-1 text-sm font-medium rounded border ${getMatchScoreColor(job.matchAnalysis.topMatchScore)}`}>
                      {job.matchAnalysis.topMatchScore}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Score</span>
                    <span className={`px-2 py-1 text-sm font-medium rounded border ${getMatchScoreColor(job.matchAnalysis.averageMatchScore)}`}>
                      {job.matchAnalysis.averageMatchScore.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Fit Distribution */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Candidate Fit Distribution:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-apple-green">Excellent:</span>
                      <span className="font-medium">{job.matchAnalysis.excellentFit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-apple-blue">Good:</span>
                      <span className="font-medium">{job.matchAnalysis.goodFit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-apple-orange">Fair:</span>
                      <span className="font-medium">{job.matchAnalysis.fairFit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-apple-red">Poor:</span>
                      <span className="font-medium">{job.matchAnalysis.poorFit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-6xl max-h-[90vh] overflow-hidden w-full">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {selectedJob.jobTitle} - Candidate Matches
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Job Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Job Requirements</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Required Skills:</span>
                        <span className="ml-2 text-apple-red font-medium">{selectedJob.requiredSkills}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Preferred Skills:</span>
                        <span className="ml-2 text-apple-blue font-medium">{selectedJob.preferredSkills}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Candidates:</span>
                        <span className="ml-2 text-black dark:text-white font-medium">{selectedJob.matchAnalysis.totalMatches}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Top Match Score:</span>
                        <span className={`ml-2 px-2 py-1 text-sm font-medium rounded border ${getMatchScoreColor(selectedJob.matchAnalysis.topMatchScore)}`}>
                          {selectedJob.matchAnalysis.topMatchScore}%
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Average Score:</span>
                        <span className={`ml-2 px-2 py-1 text-sm font-medium rounded border ${getMatchScoreColor(selectedJob.matchAnalysis.averageMatchScore)}`}>
                          {selectedJob.matchAnalysis.averageMatchScore.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Fit Distribution Chart */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-black dark:text-white mb-3">Fit Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-apple-green">Excellent (80%+)</span>
                          <span className="font-medium">{selectedJob.matchAnalysis.excellentFit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-apple-blue">Good (60-79%)</span>
                          <span className="font-medium">{selectedJob.matchAnalysis.goodFit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-apple-orange">Fair (40-59%)</span>
                          <span className="font-medium">{selectedJob.matchAnalysis.fairFit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-apple-red">Poor (<40%)</span>
                          <span className="font-medium">{selectedJob.matchAnalysis.poorFit}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Candidates */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Top Candidate Matches ({selectedJob.matchAnalysis.skillMatchAccuracy.length})
                    </h3>
                    
                    <div className="space-y-4">
                      {selectedJob.matchAnalysis.skillMatchAccuracy.map((candidate, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-black dark:text-white">
                              {candidate.candidateName}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 text-sm font-medium rounded border ${getMatchScoreColor(candidate.actualScore)}`}>
                                {candidate.actualScore}%
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {getFitLabel(candidate.actualScore)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Required Matches:</span>
                              <div className="font-medium text-apple-red">
                                {candidate.requiredMatches}/{selectedJob.requiredSkills}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Preferred Matches:</span>
                              <div className="font-medium text-apple-blue">
                                {candidate.preferredMatches}/{selectedJob.preferredSkills}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Total Skills:</span>
                              <div className="font-medium text-black dark:text-white">
                                {candidate.totalCandidateSkills}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Score Diff:</span>
                              <div className={`font-medium ${candidate.scoreDifference > 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                                {candidate.scoreDifference > 0 ? '+' : ''}{candidate.scoreDifference.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
              AI-powered candidate matching based on skill overlap, experience level, and job requirements
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <span>• Real-time skill matching algorithm</span>
              <span>• Confidence-based scoring system</span>
              <span>• Comprehensive candidate analysis</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}