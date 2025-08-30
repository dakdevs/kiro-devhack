"use client"

import React, { useState } from 'react';
import { CandidateWithMatch } from '~/types/interview-management';
import { SkillMatchIndicator } from './skill-match-indicator';

interface CandidateCardProps {
  candidateMatch: CandidateWithMatch;
  jobId: string;
  onScheduleInterview?: (candidateId: string) => void;
}

export function CandidateCard({ 
  candidateMatch, 
  jobId, 
  onScheduleInterview 
}: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { candidate, match } = candidateMatch;

  // Get match score color
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  // Get overall fit badge color
  const getFitBadgeColor = (fit: string) => {
    switch (fit) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleScheduleInterview = () => {
    if (onScheduleInterview) {
      onScheduleInterview(candidate.id);
    }
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Avatar placeholder */}
            <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-apple-purple rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-black dark:text-white truncate">
                {candidate.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {candidate.email}
              </p>
            </div>
          </div>

          {/* Experience level and location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {candidate.experienceLevel && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md capitalize">
                {candidate.experienceLevel}
              </span>
            )}
            {candidate.location && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {candidate.location}
              </span>
            )}
          </div>
        </div>

        {/* Match score and fit */}
        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchScoreColor(match.score)}`}>
            {match.score}% match
          </div>
          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${getFitBadgeColor(match.overallFit)}`}>
            {match.overallFit} fit
          </span>
        </div>
      </div>

      {/* Skills preview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Matching Skills ({match.matchingSkills.length})
          </h4>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-apple-blue hover:text-blue-600 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {match.matchingSkills.slice(0, expanded ? undefined : 6).map((skill, index) => (
            <SkillMatchIndicator
              key={index}
              skill={skill}
              candidateSkill={candidate.skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())}
            />
          ))}
          {!expanded && match.matchingSkills.length > 6 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-sm">
              +{match.matchingSkills.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* All candidate skills */}
          {candidate.skills.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                All Skills ({candidate.skills.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm"
                  >
                    {skill.name}
                    {skill.proficiencyScore && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({skill.proficiencyScore}%)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill gaps */}
          {match.skillGaps && match.skillGaps.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Missing Skills ({match.skillGaps.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {match.skillGaps.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability preview */}
          {match.availability && match.availability.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Availability ({match.availability.length} slots)
              </h5>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {match.availability.slice(0, 3).map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(slot.startTime).toLocaleDateString()} - {new Date(slot.endTime).toLocaleDateString()}
                  </div>
                ))}
                {match.availability.length > 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{match.availability.length - 3} more slots
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {match.matchingSkills.length} skills match
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {expanded ? 'Less details' : 'View details'}
          </button>
          
          <button
            onClick={handleScheduleInterview}
            className="px-4 py-2 bg-apple-blue text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  );
}