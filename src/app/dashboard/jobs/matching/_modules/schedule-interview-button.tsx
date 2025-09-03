"use client"

import { useState } from 'react';
import { Calendar, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ScheduleInterviewButtonProps {
  jobId: string;
  jobTitle: string;
  company: string;
}

export function ScheduleInterviewButton({ jobId, jobTitle, company }: ScheduleInterviewButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleScheduleInterview = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/schedule-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          jobTitle,
          company,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Interview request submitted successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to submit interview request');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
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
          Submitting...
        </>
      );
    }

    if (status === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4" />
          Request Sent
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
        <Calendar className="h-4 w-4" />
        Schedule Interview
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

    return 'bg-apple-blue hover:bg-blue-600 text-white';
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleScheduleInterview}
        disabled={loading || status === 'success'}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
      >
        {getButtonContent()}
      </button>
      
      {message && (
        <div className={`text-sm max-w-xs text-right ${
          status === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-xs text-gray-500 max-w-xs text-right">
          You'll receive a confirmation email within 24 hours
        </div>
      )}
    </div>
  );
}