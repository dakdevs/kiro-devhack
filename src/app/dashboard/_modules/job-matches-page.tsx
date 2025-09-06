"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface JobMatch {
  id: string;
  jobPosting: {
    id: string;
    title: string;
    rawDescription: string;
    requiredSkills: any[];
    preferredSkills: any[];
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    location?: string;
    remoteAllowed: boolean;
    employmentType: string;
    createdAt: Date;
  };
  recruiter: {
    id: string;
    organizationName: string;
    contactEmail?: string;
    calComUsername?: string;
    calComConnected: boolean;
  };
  matchScore: number;
  matchingSkills: string[];
  skillGaps: string[];
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  hasAvailability: boolean;
  createdAt: Date;
}

export function JobMatchesPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);

  // Will use the authenticated user's ID from the API

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        minMatchScore: '30',
        requiresAvailability: 'true',
      });
      
      const response = await fetch(`/api/job-matches?${params}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setMatches(result.data);
      } else {
        setError(result.error || 'Failed to load job matches');
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setError('Failed to load job matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshMatches = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const response = await fetch('/api/job-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setMatches(result.data);
      } else {
        setError(result.error || 'Failed to refresh matches');
      }
    } catch (error) {
      console.error('Error refreshing matches:', error);
      setError('Failed to refresh matches');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Job Matches
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Jobs that match your skills and experience
          </p>
        </div>

        <button
          onClick={handleRefreshMatches}
          disabled={isRefreshing}
          className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 flex items-center gap-2 disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Matches
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Job Matches Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Keep practicing interviews to build your skill profile and get better job matches.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
          >
            Start Practicing
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      {match.jobPosting.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFitBadgeColor(match.overallFit)}`}>
                      {match.overallFit} fit
                    </span>
                    {match.hasAvailability && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 rounded-full">
                        Available for interviews
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {match.recruiter.organizationName}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {match.jobPosting.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {match.jobPosting.location}
                      </span>
                    )}
                    {match.jobPosting.remoteAllowed && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        Remote OK
                      </span>
                    )}
                    {match.jobPosting.salaryMin && match.jobPosting.salaryMax && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        ${match.jobPosting.salaryMin.toLocaleString()} - ${match.jobPosting.salaryMax.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-lg border ${getMatchScoreBg(match.matchScore)}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getMatchScoreColor(match.matchScore)}`}>
                      {match.matchScore}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Match
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {match.matchingSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Matching Skills ({match.matchingSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {match.matchingSkills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.matchingSkills.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                          +{match.matchingSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {match.skillGaps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                      Skills to Learn ({match.skillGaps.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {match.skillGaps.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.skillGaps.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                          +{match.skillGaps.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="text-apple-blue hover:text-blue-600 text-sm font-medium"
                >
                  View Details
                </button>

                <div className="flex gap-2">
                  {match.hasAvailability && match.recruiter.calComUsername ? (
                    <Link
                      href={`/schedule-interview/${match.jobPosting.id}?recruiter=${match.recruiter.id}`}
                      className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 text-sm font-medium"
                    >
                      Schedule Interview
                    </Link>
                  ) : (
                    <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                      No Availability
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {selectedMatch.jobPosting.title}
                </h2>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 hover:bg-gray-100 hover:dark:bg-gray-800 rounded-lg transition-colors duration-150"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-black dark:text-white mb-2">Company</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedMatch.recruiter.organizationName}</p>
                </div>

                <div>
                  <h3 className="font-medium text-black dark:text-white mb-2">Job Description</h3>
                  <div className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedMatch.jobPosting.rawDescription}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-black dark:text-white mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedMatch.jobPosting.requiredSkills.map((skill: any, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 rounded"
                        >
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-black dark:text-white mb-2">Preferred Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedMatch.jobPosting.preferredSkills.map((skill: any, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 rounded"
                        >
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                  >
                    Close
                  </button>
                  {selectedMatch.hasAvailability && selectedMatch.recruiter.calComUsername && (
                    <Link
                      href={`/schedule-interview/${selectedMatch.jobPosting.id}?recruiter=${selectedMatch.recruiter.id}`}
                      className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
                    >
                      Schedule Interview
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}