"use client"

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { ScheduleInterviewModal } from './schedule-interview-modal';

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

interface JobMatchCardProps {
  match: JobMatch;
}

export function JobMatchCard({ match }: JobMatchCardProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getMatchScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return 'text-apple-green';
    if (numScore >= 80) return 'text-apple-blue';
    if (numScore >= 70) return 'text-apple-orange';
    return 'text-apple-red';
  };

  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'excellent': return 'bg-apple-green/10 text-apple-green border-apple-green/20';
      case 'good': return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20';
      case 'fair': return 'bg-apple-orange/10 text-apple-orange border-apple-orange/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatSalary = (min: number, max: number) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    return `$${formatNumber(min)} - $${formatNumber(max)}`;
  };

  return (
    <>
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                {match.job.title}
              </h3>
              <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getFitBadgeColor(match.overallFit)}`}>
                {match.overallFit}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {match.recruiter.organizationName}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {match.job.location}
                {match.job.remoteAllowed && (
                  <span className="text-apple-blue ml-1">• Remote OK</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {formatSalary(match.job.salaryMin, match.job.salaryMax)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {match.job.employmentType}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${getMatchScoreColor(match.matchScore)}`}>
              {parseFloat(match.matchScore).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Match Score</div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-apple-green" />
              <span className="text-sm font-medium text-black dark:text-white">
                Matching Skills ({match.matchingSkills.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {match.matchingSkills.slice(0, expanded ? undefined : 5).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-apple-green/10 text-apple-green text-xs rounded-full border border-apple-green/20"
                >
                  {skill}
                </span>
              ))}
              {!expanded && match.matchingSkills.length > 5 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="px-2 py-1 text-xs text-apple-blue hover:text-blue-600"
                >
                  +{match.matchingSkills.length - 5} more
                </button>
              )}
            </div>
          </div>
          
          {match.skillGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-apple-orange" />
                <span className="text-sm font-medium text-black dark:text-white">
                  Skill Gaps ({match.skillGaps.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.skillGaps.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-apple-orange/10 text-apple-orange text-xs rounded-full border border-apple-orange/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {expanded && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-sm font-medium text-black dark:text-white mb-2">
              Job Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {match.job.rawDescription}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => setShowScheduleModal(true)}
            className="bg-apple-blue hover:bg-blue-600 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
          
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="secondary"
          >
            {expanded ? 'Show Less' : 'View Details'}
          </Button>
          
          <div className="flex-1" />
          
          <div className="text-xs text-gray-500">
            Recruiter: {match.recruiterUser.name}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleInterviewModal
          match={match}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </>
  );
}