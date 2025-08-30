"use client"

import { useState, useEffect } from 'react';
import { JobPostingForm } from '../_modules/job-posting-form';
import { JobPostingList } from '../_modules/job-posting-list';
import { JobEditModal } from '../_modules/job-edit-modal';
import { JobDeleteModal } from '../_modules/job-delete-modal';
import { useCSRFToken, secureApiRequest } from '~/hooks/use-csrf-token';
import { 
  JobPosting, 
  CreateJobPostingRequest,
  CreateJobPostingResponse,
  JobPostingsResponse,
  JobPostingStatus,
  UpdateJobPostingRequest
} from '~/types/interview-management';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<JobPostingsResponse['pagination']>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobPostingStatus | ''>('');
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    paused: number;
    closed: number;
    draft: number;
  } | null>(null);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [deletingJob, setDeletingJob] = useState<JobPosting | null>(null);

  // Initialize CSRF token
  const csrfToken = useCSRFToken();

  // Load jobs on component mount and when filters change
  useEffect(() => {
    loadJobs();
  }, [searchTerm, statusFilter]);

  // Load job statistics
  useEffect(() => {
    loadStats();
  }, [jobs]);

  const loadJobs = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      console.log('[JOBS-PAGE] Fetching jobs with params:', params.toString());
      const response = await fetch(`/api/recruiter/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: JobPostingsResponse = await response.json();
      console.log('[JOBS-PAGE] API response:', data);

      if (data.success) {
        // Ensure data.data is an array
        const jobsArray = Array.isArray(data.data) ? data.data : [];
        setJobs(jobsArray);
        setPagination(data.pagination);
        console.log('[JOBS-PAGE] Loaded jobs:', jobsArray.length, 'jobs');
      } else {
        console.error('Failed to load jobs:', data.error);
        setError(data.error || 'Failed to load jobs');
        setJobs([]); // Ensure jobs is always an array
        setPagination(undefined);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load jobs');
      setJobs([]); // Ensure jobs is always an array
      setPagination(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/recruiter/jobs/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading job stats:', error);
    }
  };

  const handleCreateJob = async (jobData: CreateJobPostingRequest): Promise<CreateJobPostingResponse> => {
    setIsCreating(true);
    try {
      const response = await secureApiRequest('/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const result: CreateJobPostingResponse = await response.json();

      if (result.success) {
        // Refresh the job list
        await loadJobs();
        setShowForm(false);
      }

      return result;
    } catch (error) {
      console.error('Error creating job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job posting',
      };
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (jobId: string, status: JobPostingStatus) => {
    try {
      const response = await secureApiRequest(`/api/recruiter/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the job in the local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? { ...job, status } : job
          )
        );
      } else {
        console.error('Failed to update job status:', result.error);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
  };

  const handleSaveJob = async (jobId: string, updates: UpdateJobPostingRequest) => {
    try {
      const response = await secureApiRequest(`/api/recruiter/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        // Update the job in the local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? { ...job, ...result.data } : job
          )
        );
        setEditingJob(null);
      } else {
        throw new Error(result.error || 'Failed to update job posting');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  };

  const handleDeleteJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setDeletingJob(job);
    }
  };

  const handleConfirmDelete = async (jobId: string) => {
    try {
      const response = await secureApiRequest(`/api/recruiter/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove the job from the local state
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        setDeletingJob(null);
      } else {
        throw new Error(result.error || 'Failed to delete job posting');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  };

  const handlePageChange = (page: number) => {
    loadJobs(page);
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <JobPostingForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowForm(false)}
          isLoading={isCreating}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white mb-2">
            Job Postings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your job postings and track candidate applications
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0"
        >
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-semibold text-black dark:text-white mb-1">
              {stats.total}
            </div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400">
              Total Jobs
            </div>
          </div>
          
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-semibold text-apple-green mb-1">
              {stats.active}
            </div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400">
              Active
            </div>
          </div>
          
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-semibold text-apple-orange mb-1">
              {stats.paused}
            </div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400">
              Paused
            </div>
          </div>
          
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {stats.closed}
            </div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400">
              Closed
            </div>
          </div>
          
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-2xl font-semibold text-apple-blue mb-1">
              {stats.draft}
            </div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400">
              Drafts
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search jobs by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobPostingStatus | '')}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-apple-red/10 border border-apple-red/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-apple-red font-medium">Error loading jobs</span>
          </div>
          <p className="text-apple-red/80 text-sm mt-1">{error}</p>
          <button
            onClick={() => loadJobs()}
            className="mt-2 px-3 py-1 bg-apple-red text-white rounded text-sm hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Job List */}
      <JobPostingList
        jobs={jobs}
        pagination={pagination}
        onEdit={handleEditJob}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteJob}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {/* Edit Modal */}
      {editingJob && (
        <JobEditModal
          job={editingJob}
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          onSave={handleSaveJob}
        />
      )}

      {/* Delete Modal */}
      <JobDeleteModal
        job={deletingJob}
        isOpen={!!deletingJob}
        onClose={() => setDeletingJob(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}