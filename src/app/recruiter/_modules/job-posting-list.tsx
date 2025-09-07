"use client"

import { useState } from 'react';
import { 
  JobPosting, 
  JobPostingStatus,
  JobPostingsResponse 
} from '~/types/interview-management';

interface JobPostingListProps {
  jobs: JobPosting[];
  pagination?: JobPostingsResponse['pagination'];
  onEdit?: (job: JobPosting) => void;
  onDelete?: (jobId: string) => void;
  onStatusChange?: (jobId: string, status: JobPostingStatus) => void;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function JobPostingList({ 
  jobs, 
  pagination,
  onEdit, 
  onDelete, 
  onStatusChange,
  onPageChange,
  isLoading = false 
}: JobPostingListProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const getStatusColor = (status: JobPostingStatus) => {
    switch (status) {
      case 'active':
        return 'bg-apple-green/10 text-apple-green';
      case 'paused':
        return 'bg-apple-orange/10 text-apple-orange';
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      case 'draft':
        return 'bg-apple-blue/10 text-apple-blue';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const copyScheduleLink = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/schedule-link`);
      const data = await response.json();
      
      if (data.success && data.scheduling.available && data.scheduling.scheduleUrl) {
        await navigator.clipboard.writeText(data.scheduling.scheduleUrl);
        // You could add a toast notification here
        alert('Schedule link copied to clipboard!');
      } else {
        alert('Interview scheduling is not set up for this job. Please connect Cal.com first.');
      }
    } catch (error) {
      console.error('Error copying schedule link:', error);
      alert('Failed to copy schedule link');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
          No job postings yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create your first job posting to start finding great candidates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-black dark:text-white truncate">
                  {job.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-[12px] font-medium capitalize ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-[13px] text-gray-600 dark:text-gray-400 mb-3">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                )}
                
                {job.remoteAllowed && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    Remote OK
                  </span>
                )}
                
                <span className="capitalize">{job.employmentType}</span>
                
                {job.experienceLevel && (
                  <span className="capitalize">{job.experienceLevel} level</span>
                )}
              </div>

              <p className="text-[15px] text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {job.rawDescription.length > 150 
                  ? `${job.rawDescription.substring(0, 150)}...` 
                  : job.rawDescription
                }
              </p>

              <div className="flex items-center gap-4 text-[13px] text-gray-600 dark:text-gray-400">
                <span>
                  Salary: {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
                <span>
                  Posted: {formatDate(job.createdAt)}
                </span>
                {job.aiConfidenceScore && (
                  <span>
                    AI Confidence: {Math.round(job.aiConfidenceScore * 100)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <a
                href={`/recruiter/jobs/${job.id}/candidates`}
                className="px-3 py-2 text-[13px] font-medium bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 ease-out"
                title="View candidates for this job"
              >
                View Candidates
              </a>
              
              <JobStatusDropdown
                currentStatus={job.status}
                onStatusChange={(status) => onStatusChange?.(job.id, status)}
              />
              
              <button
                onClick={() => copyScheduleLink(job.id)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-apple-green hover:bg-apple-green/10 rounded-lg transition-colors duration-150 ease-out"
                title="Copy interview schedule link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m-4 0V3m0 4h4m0 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h4" />
                </svg>
              </button>

              <button
                onClick={() => onEdit?.(job)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white hover:bg-gray-50 hover:dark:bg-gray-900 rounded-lg transition-colors duration-150 ease-out"
                title="Edit job posting"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={() => onDelete?.(job.id)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-apple-red hover:bg-apple-red/10 rounded-lg transition-colors duration-150 ease-out"
                title="Delete job posting"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Skills */}
          {(job.requiredSkills && job.requiredSkills.length > 0) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.slice(0, 8).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-apple-blue/10 text-apple-blue rounded text-[12px] font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
                {job.requiredSkills.length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[12px] font-medium">
                    +{job.requiredSkills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <p className="text-[13px] text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white hover:bg-gray-50 hover:dark:bg-gray-900 rounded-lg transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:dark:text-gray-400"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-[13px] font-medium text-black dark:text-white">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white hover:bg-gray-50 hover:dark:bg-gray-900 rounded-lg transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:dark:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Job Status Dropdown Component
interface JobStatusDropdownProps {
  currentStatus: JobPostingStatus;
  onStatusChange: (status: JobPostingStatus) => void;
}

function JobStatusDropdown({ currentStatus, onStatusChange }: JobStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions: { value: JobPostingStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: 'text-apple-green' },
    { value: 'paused', label: 'Paused', color: 'text-apple-orange' },
    { value: 'closed', label: 'Closed', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'draft', label: 'Draft', color: 'text-apple-blue' },
  ];

  const currentOption = statusOptions.find(option => option.value === currentStatus);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white hover:bg-gray-50 hover:dark:bg-gray-900 rounded-lg transition-colors duration-150 ease-out"
      >
        <span className={currentOption?.color}>
          {currentOption?.label}
        </span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-[13px] font-medium hover:bg-gray-50 hover:dark:bg-gray-900 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150 ease-out ${option.color} ${
                  option.value === currentStatus ? 'bg-gray-50 dark:bg-gray-900' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}