"use client"

import { useState, useEffect } from 'react';
import { JobMatchCard } from './job-match-card';
import { RefreshCw } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface JobMatch {
  id: string;
  matchScore: string;
  matchingSkills: string[];
  skillGaps: string[];
  overallFit: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    rawDescription: string;
    experienceLevel: string;
    salaryMin: number;
    salaryMax: number;
    location: string;
    remoteAllowed: boolean;
    employmentType: string;
  };
  recruiter: {
    id: string;
    organizationName: string;
    contactEmail: string;
    calComUsername: string;
  };
  recruiterUser: {
    name: string;
    email: string;
  };
}

export function JobMatchesList() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/job-matches');
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      } else {
        console.error('Failed to fetch job matches');
        // Set mock data for demo
        setMatches([
          {
            id: 'match_1',
            matchScore: '87.50',
            matchingSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
            skillGaps: ['Kubernetes', 'CI/CD'],
            overallFit: 'excellent',
            createdAt: new Date().toISOString(),
            job: {
              id: 'job_1',
              title: 'Senior Full Stack Developer',
              rawDescription: 'We are looking for a Senior Full Stack Developer to join our growing team...',
              experienceLevel: 'senior',
              salaryMin: 120000,
              salaryMax: 180000,
              location: 'New York, NY',
              remoteAllowed: true,
              employmentType: 'full-time'
            },
            recruiter: {
              id: 'recruiter_1',
              organizationName: 'TechCorp Solutions',
              contactEmail: 'david.kim@techcorp.com',
              calComUsername: 'david-kim-techcorp'
            },
            recruiterUser: {
              name: 'David Kim',
              email: 'david.kim@techcorp.com'
            }
          },
          {
            id: 'match_2',
            matchScore: '92.00',
            matchingSkills: ['Product Management', 'Data Analysis', 'Leadership', 'Python', 'SQL'],
            skillGaps: ['Machine Learning'],
            overallFit: 'excellent',
            createdAt: new Date().toISOString(),
            job: {
              id: 'job_2',
              title: 'Product Manager - AI/ML',
              rawDescription: 'Join our AI team as a Product Manager to drive the development of cutting-edge ML products...',
              experienceLevel: 'mid',
              salaryMin: 130000,
              salaryMax: 170000,
              location: 'San Francisco, CA',
              remoteAllowed: true,
              employmentType: 'full-time'
            },
            recruiter: {
              id: 'recruiter_2',
              organizationName: 'StartupCo',
              contactEmail: 'lisa.thompson@startupco.com',
              calComUsername: 'lisa-startupco'
            },
            recruiterUser: {
              name: 'Lisa Thompson',
              email: 'lisa.thompson@startupco.com'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching job matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={fetchMatches}
            disabled={refreshing}
            variant="secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Matches
          </Button>
        </div>
        
        {matches.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} found
          </div>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-black dark:text-white mb-2">
            No job matches yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete your profile and skills assessment to get personalized job matches
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <JobMatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}