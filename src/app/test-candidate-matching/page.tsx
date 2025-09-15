"use client";

import { useState } from 'react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: Array<{
    name: string;
    proficiencyScore: number;
    category: string;
  }>;
  experienceLevel?: string;
  location?: string;
}

interface Match {
  candidate: Candidate;
  match: {
    score: number;
    matchingSkills: Array<{
      name: string;
      proficiencyScore: number;
      category: string;
    }>;
    skillGaps: Array<{
      name: string;
      proficiencyScore: number;
      category: string;
    }>;
    overallFit: string;
  };
}

interface CandidateMatchResponse {
  success: boolean;
  data: Match[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: any;
  summary: {
    totalCandidates: number;
    averageMatchScore: number;
    topSkills: string[];
  };
}

export default function TestCandidateMatchingPage() {
  const [jobId, setJobId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    data?: CandidateMatchResponse;
  }>({ status: null, message: '' });

  const [filters, setFilters] = useState({
    minMatchScore: 10,
    skills: '',
    experienceLevel: '',
    location: '',
    remoteOnly: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId.trim()) {
      setResult({ status: 'error', message: 'Please enter a job ID' });
      return;
    }

    setIsLoading(true);
    setResult({ status: null, message: '' });

    try {
      const requestBody = {
        jobId: jobId.trim(),
        filters: {
          ...(filters.minMatchScore > 0 && { minMatchScore: filters.minMatchScore }),
          ...(filters.skills && { skills: filters.skills.split(',').map(s => s.trim()).filter(Boolean) }),
          ...(filters.experienceLevel && { experienceLevel: filters.experienceLevel.split(',').map(s => s.trim()) }),
          ...(filters.location && { location: filters.location }),
          ...(filters.remoteOnly && { remoteOnly: filters.remoteOnly }),
        },
        pagination,
      };

      console.log('Sending request:', requestBody);

      const response = await fetch('/api/jobs/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ 
          status: 'success', 
          message: `Found ${data.data.length} matching candidates`,
          data: data
        });
      } else {
        setResult({ 
          status: 'error', 
          message: `Error: ${data.error || 'Unknown error'}` 
        });
      }
    } catch (error) {
      setResult({ 
        status: 'error', 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleJobIds = [
    'job-1',
    'job-2', 
    'job-3',
    'test-job-id',
    'sample-job-123'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Candidate Matching Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the candidate matching endpoint by entering a job ID and optional filters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job ID Input */}
            <div>
              <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-2">
                Job ID
              </label>
              <input
                id="jobId"
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter a job ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minMatchScore" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Match Score (%)
                </label>
                <input
                  id="minMatchScore"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minMatchScore}
                  onChange={(e) => setFilters({...filters, minMatchScore: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills (comma-separated)
                </label>
                <input
                  id="skills"
                  type="text"
                  value={filters.skills}
                  onChange={(e) => setFilters({...filters, skills: e.target.value})}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <input
                  id="experienceLevel"
                  type="text"
                  value={filters.experienceLevel}
                  onChange={(e) => setFilters({...filters, experienceLevel: e.target.value})}
                  placeholder="junior, mid, senior"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Pagination */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="page" className="block text-sm font-medium text-gray-700 mb-2">
                  Page
                </label>
                <input
                  id="page"
                  type="number"
                  min="1"
                  value={pagination.page}
                  onChange={(e) => setPagination({...pagination, page: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
                  Results per Page
                </label>
                <input
                  id="limit"
                  type="number"
                  min="1"
                  max="100"
                  value={pagination.limit}
                  onChange={(e) => setPagination({...pagination, limit: parseInt(e.target.value) || 10})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || !jobId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Finding Candidates...' : 'Find Matching Candidates'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setJobId('');
                  setResult({ status: null, message: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Result Display */}
          {result.status && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.status === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">
                  {result.status === 'success' ? 'Success' : 'Error'}
                </span>
              </div>
              <p className="mt-1">{result.message}</p>
            </div>
          )}

          {/* Results Display */}
          {result.data && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Matching Candidates ({result.data.data.length} found)
              </h3>
              
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Total Candidates:</span> {result.data.summary.totalCandidates}
                  </div>
                  <div>
                    <span className="font-medium">Average Match Score:</span> {result.data.summary.averageMatchScore}%
                  </div>
                  <div>
                    <span className="font-medium">Top Skills:</span> {result.data.summary.topSkills.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              <div className="space-y-4">
                {result.data.data.map((match, index) => (
                  <div key={match.candidate.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{match.candidate.name}</h4>
                        <p className="text-sm text-gray-600">{match.candidate.email}</p>
                        {match.candidate.location && (
                          <p className="text-sm text-gray-500">📍 {match.candidate.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          match.match.score >= 80 ? 'bg-green-100 text-green-800' :
                          match.match.score >= 60 ? 'bg-blue-100 text-blue-800' :
                          match.match.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {match.match.score}% Match
                        </div>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{match.match.overallFit}</p>
                      </div>
                    </div>

                    {/* Matching Skills */}
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Matching Skills ({match.match.matchingSkills.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {match.match.matchingSkills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                          >
                            {skill.name} ({skill.proficiencyScore}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skill Gaps */}
                    {match.match.skillGaps.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Missing Skills ({match.match.skillGaps.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {match.match.skillGaps.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Info */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Page {result.data.pagination.page} of {result.data.pagination.totalPages} 
                ({result.data.pagination.total} total candidates)
              </div>
            </div>
          )}

          {/* Sample Job IDs */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sample Job IDs to Test
            </h3>
            <div className="space-y-2">
              {sampleJobIds.map((id, index) => (
                <button
                  key={index}
                  onClick={() => setJobId(id)}
                  className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  <span className="text-sm text-gray-700">{id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Enter a job ID (try the sample IDs above)</li>
              <li>Optionally set filters like minimum match score, required skills, etc.</li>
              <li>Click "Find Matching Candidates" to get ranked candidates</li>
              <li>Results show match scores, matching skills, and skill gaps</li>
              <li>Use pagination to browse through more candidates</li>
            </ol>
          </div>

          {/* API Info */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">API Endpoint:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Method:</strong> POST</p>
              <p><strong>URL:</strong> /api/jobs/matching</p>
              <p><strong>Body:</strong> {`{ "jobId": "job-id", "filters": {...}, "pagination": {...} }`}</p>
              <p><strong>Response:</strong> Ranked candidate list with match scores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
