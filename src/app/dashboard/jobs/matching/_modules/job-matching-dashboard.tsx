"use client"

import { useState, useEffect } from 'react';
import { JobMatchCard } from './job-match-card';
import { JobMatchingHeader } from './job-matching-header';
import { CreateMockJobsButton } from './create-mock-jobs-button';
import { CandidateSkillImporter } from './candidate-skill-importer';
import { useAuth } from '~/hooks/use-auth';
import { Loader2, Briefcase, AlertCircle, RefreshCw } from 'lucide-react';

// Define JobMatch interface locally to avoid importing server-side code
interface JobListing {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: Skill[];
  preferredSkills?: Skill[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  experienceLevel: string;
  remoteAllowed: boolean;
  benefits?: string[];
  applicationUrl?: string;
  contactEmail?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Skill {
  name: string;
  proficiencyScore?: number;
  category?: string;
}

interface JobMatch {
  job: JobListing;
  matchScore: number;
  matchingSkills: Skill[];
  skillGaps: Skill[];
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
}

export function JobMatchingDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const response = await fetch('/api/jobs/matching');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
        console.log(`✅ Found ${data.matches.length} job matches`);
      } else {
        setError(data.error || 'Failed to load job matches');
        console.error('❌ Job matching failed:', data.error);
      }
    } catch (err) {
      console.error('❌ Network error loading job matches:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Please check your connection and try again'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  useEffect(() => {
    loadMatches();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-apple-blue mx-auto mb-4" />
          <p className="text-gray-600">Finding your perfect job matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Jobs</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <JobMatchingHeader 
        matchCount={matches.length}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Development Tools */}
      <div className="space-y-4">
        {/* Candidate Skill Importer */}
        <CandidateSkillImporter onSkillsImported={loadMatches} />
        
        {/* Job Creation Tool */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Job Listings</h3>
              <p className="text-xs text-yellow-700 mt-1">Generate sample job listings for testing</p>
            </div>
            <CreateMockJobsButton onJobsCreated={loadMatches} />
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm border border-gray-100 text-center">
          <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No High-Quality Matches Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We couldn't find any jobs that match your skills with 90% or higher accuracy. 
            This could mean:
          </p>
          <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-apple-blue">•</span>
              <span>No job listings are currently available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-apple-blue">•</span>
              <span>Your skills profile needs more interview data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-apple-blue">•</span>
              <span>Available jobs don't closely match your expertise</span>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Matches
            </button>
            <a
              href="/dashboard/interview"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Improve Your Profile
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => (
            <JobMatchCard key={match.job.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}