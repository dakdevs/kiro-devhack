"use client"

import { useState } from 'react';
import { InterviewList } from '~/components/interview-list';
import { 
  ScheduleInterviewRequest,
  ConfirmInterviewRequest,
  RescheduleInterviewRequest
} from '~/types/interview-management';

export function InterviewManagementPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleConfirmInterview = async (
    interviewId: string, 
    confirmed: boolean, 
    notes?: string
  ) => {
    try {
      setActionLoading(interviewId);
      
      const request: ConfirmInterviewRequest = {
        confirmed,
        notes
      };
      
      const response = await fetch(`/api/interviews/${interviewId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to confirm interview');
      }
      
      // Show success message
      alert(confirmed ? 'Interview confirmed successfully!' : 'Interview declined successfully!');
      
    } catch (error) {
      console.error('Error confirming interview:', error);
      alert(error instanceof Error ? error.message : 'Failed to confirm interview');
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleInterview = (interviewId: string) => {
    // For now, just show an alert. In a full implementation, you'd open a reschedule modal
    alert('Reschedule functionality would open a modal here to select new times');
  };

  const handleCancelInterview = async (interviewId: string, reason?: string) => {
    try {
      setActionLoading(interviewId);
      
      const params = new URLSearchParams();
      if (reason) {
        params.append('reason', reason);
      }
      
      const response = await fetch(`/api/interviews/${interviewId}?${params}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel interview');
      }
      
      alert('Interview cancelled successfully!');
      
    } catch (error) {
      console.error('Error cancelling interview:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel interview');
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-semibold text-black dark:text-white">📅</div>
          <div className="mt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
            <div className="text-lg font-semibold text-black dark:text-white">-</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-semibold text-black dark:text-white">✅</div>
          <div className="mt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Confirmed</div>
            <div className="text-lg font-semibold text-black dark:text-white">-</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-semibold text-black dark:text-white">🎯</div>
          <div className="mt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-lg font-semibold text-black dark:text-white">-</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-semibold text-black dark:text-white">⏰</div>
          <div className="mt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
            <div className="text-lg font-semibold text-black dark:text-white">-</div>
          </div>
        </div>
      </div>

      {/* Interview List */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
          Your Interviews
        </h2>
        
        <InterviewList
          userType="recruiter"
          onConfirm={handleConfirmInterview}
          onReschedule={handleRescheduleInterview}
          onCancel={handleCancelInterview}
        />
      </div>
    </div>
  );
}