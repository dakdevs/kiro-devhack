"use client"

import { useState } from 'react';
// Define interfaces locally to avoid importing server-side code
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
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Mail
} from 'lucide-react';
import { ScheduleInterviewButton } from './schedule-interview-button';

interface JobMatchCardProps {
  match: JobMatch;
}

export function JobMatchCard({ match }: JobMatchCardProps) {
  const { job, matchScore, matchingSkills, skillGaps, overallFit } = match;

  const getMatchColor = (score: number) => {
    if (score >= 95) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 90) return 'text-apple-blue bg-blue-50 border-blue-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-apple-blue bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return 'Competitive salary';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getMatchColor(matchScore)}`}>
                {matchScore}% Match
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <Building className="h-4 w-4" />
              <span className="font-medium">{job.company}</span>
              <span className="text-gray-400">•</span>
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
              {job.remoteAllowed && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-600 text-sm">Remote OK</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFitColor(overallFit)}`}>
                  {overallFit.charAt(0).toUpperCase() + overallFit.slice(1)} Fit
                </span>
              </div>
            </div>
          </div>
          <ScheduleInterviewButton 
            jobId={job.id}
            jobTitle={job.title}
            company={job.company}
          />
        </div>
      </div>

      {/* Job Description */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-gray-700 leading-relaxed line-clamp-3">
          {job.description}
        </p>
      </div>

      {/* Skills Match */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Matching Skills */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Matching Skills ({matchingSkills.length})</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchingSkills.slice(0, 8).map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200"
                >
                  {skill.name}
                </span>
              ))}
              {matchingSkills.length > 8 && (
                <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm">
                  +{matchingSkills.length - 8} more
                </span>
              )}
            </div>
          </div>

          {/* Skill Gaps */}
          {skillGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium text-gray-900">Skills to Develop ({skillGaps.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillGaps.slice(0, 6).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm border border-yellow-200"
                  >
                    {skill.name}
                  </span>
                ))}
                {skillGaps.length > 6 && (
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm">
                    +{skillGaps.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits & Contact */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {job.benefits.slice(0, 4).map((benefit, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {benefit}
                  </span>
                ))}
                {job.benefits.length > 4 && (
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm">
                    +{job.benefits.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Contact</h4>
            <div className="space-y-2">
              {job.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <a 
                    href={`mailto:${job.contactEmail}`}
                    className="hover:text-apple-blue transition-colors"
                  >
                    {job.contactEmail}
                  </a>
                </div>
              )}
              {job.applicationUrl && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-apple-blue transition-colors"
                  >
                    Apply Online
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}