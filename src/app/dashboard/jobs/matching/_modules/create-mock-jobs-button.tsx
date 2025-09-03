"use client"

import { useState } from 'react';
import { Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CreateMockJobsButtonProps {
  onJobsCreated: () => void;
}

export function CreateMockJobsButton({ onJobsCreated }: CreateMockJobsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCreateMockJobs = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/create-mock-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(`Created ${data.jobsCreated} job listings`);
        // Refresh the job matches after creating new jobs
        setTimeout(() => {
          onJobsCreated();
        }, 1000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to create job listings');
      }
    } catch (error) {
      console.error('Error creating mock jobs:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      );
    }

    if (status === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4" />
          Created!
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <AlertCircle className="h-4 w-4" />
          Try Again
        </>
      );
    }

    return (
      <>
        <Plus className="h-4 w-4" />
        Generate 25 Jobs
      </>
    );
  };

  const getButtonStyles = () => {
    if (status === 'success') {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
    
    if (status === 'error') {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }

    return 'bg-yellow-600 hover:bg-yellow-700 text-white';
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCreateMockJobs}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
      >
        {getButtonContent()}
      </button>
      
      {message && (
        <div className={`text-xs ${
          status === 'success' ? 'text-green-700' : 'text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}