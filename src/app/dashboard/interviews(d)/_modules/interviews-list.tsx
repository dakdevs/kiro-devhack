"use client"

import { useState, useEffect } from 'react';
import { InterviewCard } from './interview-card';
import { Button } from '~/components/ui/button';
import { RefreshCw, Calendar, Users } from 'lucide-react';

interface Interview {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  status: string;
  interviewType: string;
  meetingLink?: string;
  candidateName: string;
  candidateEmail: string;
  notes?: string;
  calComBookingId?: number;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    location: string;
  };
  recruiter?: {
    organizationName: string;
    contactEmail: string;
  };
  recruiterUser?: {
    name: string;
    email: string;
  };
}

export function InterviewsList() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<'candidate' | 'recruiter'>('candidate');

  const fetchInterviews = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/interviews?userType=${userType}`);
      
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      } else {
        console.error('Failed to fetch interviews');
        // Set mock data for demo
        setInterviews([
          {
            id: 'interview_1',
            scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
            timezone: 'America/New_York',
            status: 'scheduled',
            interviewType: 'video',
            meetingLink: 'https://zoom.us/j/123456789',
            candidateName: 'Sarah Chen',
            candidateEmail: 'sarah.chen@example.com',
            notes: 'Technical interview focusing on React and Node.js experience',
            calComBookingId: 12345,
            createdAt: new Date().toISOString(),
            job: {
              id: 'job_1',
              title: 'Senior Full Stack Developer',
              location: 'New York, NY'
            },
            recruiter: {
              organizationName: 'TechCorp Solutions',
              contactEmail: 'david.kim@techcorp.com'
            },
            recruiterUser: {
              name: 'David Kim',
              email: 'david.kim@techcorp.com'
            }
          },
          {
            id: 'interview_2',
            scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
            scheduledEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            timezone: 'America/Los_Angeles',
            status: 'scheduled',
            interviewType: 'video',
            meetingLink: 'https://zoom.us/j/987654321',
            candidateName: 'Marcus Johnson',
            candidateEmail: 'marcus.johnson@example.com',
            notes: 'Product management interview with case study discussion',
            calComBookingId: 12346,
            createdAt: new Date().toISOString(),
            job: {
              id: 'job_2',
              title: 'Product Manager - AI/ML',
              location: 'San Francisco, CA'
            },
            recruiter: {
              organizationName: 'StartupCo',
              contactEmail: 'lisa.thompson@startupco.com'
            },
            recruiterUser: {
              name: 'Lisa Thompson',
              email: 'lisa.thompson@startupco.com'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [userType]);

  const upcomingInterviews = interviews.filter(interview => 
    new Date(interview.scheduledStart) > new Date() && interview.status === 'scheduled'
  );

  const pastInterviews = interviews.filter(interview => 
    new Date(interview.scheduledStart) <= new Date() || interview.status === 'completed'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              onClick={() => setUserType('candidate')}
              size="sm"
              variant={userType === 'candidate' ? 'default' : 'ghost'}
              className={userType === 'candidate' ? 'bg-white dark:bg-black shadow-sm' : ''}
            >
              <Users className="w-4 h-4 mr-2" />
              As Candidate
            </Button>
            <Button
              onClick={() => setUserType('recruiter')}
              size="sm"
              variant={userType === 'recruiter' ? 'default' : 'ghost'}
              className={userType === 'recruiter' ? 'bg-white dark:bg-black shadow-sm' : ''}
            >
              <Calendar className="w-4 h-4 mr-2" />
              As Recruiter
            </Button>
          </div>
          
          <Button
            onClick={fetchInterviews}
            disabled={refreshing}
            variant="secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {interviews.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {interviews.length} interview{interviews.length !== 1 ? 's' : ''} total
          </div>
        )}
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-black dark:text-white mb-2">
            No interviews scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {userType === 'candidate' 
              ? 'Schedule interviews from your job matches to get started'
              : 'Candidates will be able to schedule interviews with you once you set up your event types'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Interviews */}
          {upcomingInterviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Upcoming Interviews ({upcomingInterviews.length})
              </h2>
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <InterviewCard 
                    key={interview.id} 
                    interview={interview} 
                    userType={userType}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Interviews */}
          {pastInterviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Past Interviews ({pastInterviews.length})
              </h2>
              <div className="space-y-4">
                {pastInterviews.map((interview) => (
                  <InterviewCard 
                    key={interview.id} 
                    interview={interview} 
                    userType={userType}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}