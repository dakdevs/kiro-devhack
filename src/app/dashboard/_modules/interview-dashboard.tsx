"use client"

import { useState, useEffect } from 'react';
import { InterviewList } from '~/components/interview-list';
import { AvailabilityCalendar } from '~/components/availability-calendar';
import { AvailabilitySlotForm } from '~/components/availability-slot-form';
import { CandidateAvailability, InterviewSession, TimeSlot } from '~/types/interview-management';
import { Calendar, Clock, Plus, Settings } from 'lucide-react';

interface InterviewDashboardProps {
  userId: string;
}

export function InterviewDashboard({ userId }: InterviewDashboardProps) {
  const [availability, setAvailability] = useState<CandidateAvailability[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [editingAvailability, setEditingAvailability] = useState<CandidateAvailability | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'availability' | 'interviews'>('overview');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch availability and interviews in parallel
      const [availabilityResponse, interviewsResponse] = await Promise.all([
        fetch('/api/availability'),
        fetch('/api/interviews?userType=candidate&limit=10')
      ]);

      const availabilityData = await availabilityResponse.json();
      const interviewsData = await interviewsResponse.json();

      if (!availabilityData.success) {
        throw new Error(availabilityData.error || 'Failed to fetch availability');
      }

      if (!interviewsData.success) {
        throw new Error(interviewsData.error || 'Failed to fetch interviews');
      }

      setAvailability(availabilityData.data || []);
      
      // Filter for upcoming interviews only
      const upcoming = (interviewsData.data || []).filter((interview: InterviewSession) => 
        new Date(interview.scheduledStart) > new Date() && 
        ['scheduled', 'confirmed', 'rescheduled'].includes(interview.status)
      );
      setUpcomingInterviews(upcoming);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setEditingAvailability(null);
    setShowAvailabilityForm(true);
  };

  const handleAvailabilityEdit = (availability: CandidateAvailability) => {
    setEditingAvailability(availability);
    setSelectedSlot(null);
    setShowAvailabilityForm(true);
  };

  const handleAvailabilitySubmit = async (data: any) => {
    try {
      const url = editingAvailability 
        ? `/api/availability/${editingAvailability.id}`
        : '/api/availability';
      
      const method = editingAvailability ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save availability');
      }

      setShowAvailabilityForm(false);
      setSelectedSlot(null);
      setEditingAvailability(null);
      await fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to save availability:', error);
      // You might want to show a toast notification here
    }
  };

  const handleInterviewConfirm = async (interviewId: string, confirmed: boolean, notes?: string) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed, notes })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm interview');
      }

      await fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to confirm interview:', error);
      throw error; // Re-throw to let InterviewList handle the error
    }
  };

  const handleInterviewCancel = async (interviewId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel interview');
      }

      await fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      throw error; // Re-throw to let InterviewList handle the error
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
          Error Loading Interview Dashboard
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Interview Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your availability and scheduled interviews
          </p>
        </div>
        
        <button
          onClick={() => setShowAvailabilityForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Add Availability
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeTab === 'overview'
                ? 'border-apple-blue text-apple-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeTab === 'availability'
                ? 'border-apple-blue text-apple-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Availability
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeTab === 'interviews'
                ? 'border-apple-blue text-apple-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All Interviews
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-apple-blue">
                  {availability.filter(a => a.status === 'available').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Available Slots
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-apple-green">
                  {upcomingInterviews.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Upcoming Interviews
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Interviews Preview */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Upcoming Interviews
              </h2>
              <button
                onClick={() => setActiveTab('interviews')}
                className="text-sm text-apple-blue hover:underline"
              >
                View All
              </button>
            </div>
            
            {upcomingInterviews.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No upcoming interviews
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.slice(0, 3).map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <div className="font-medium text-black dark:text-white">
                        {interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)} Interview
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Intl.DateTimeFormat('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        }).format(new Date(interview.scheduledStart))}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      interview.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability Calendar Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Availability Calendar
                  </h2>
                  <button
                    onClick={() => setActiveTab('availability')}
                    className="text-sm text-apple-blue hover:underline"
                  >
                    Manage Availability
                  </button>
                </div>
              </div>
              <AvailabilityCalendar
                availability={availability}
                onSlotSelect={handleSlotSelect}
                onSlotEdit={handleAvailabilityEdit}
                readonly={false}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div>
          <AvailabilityCalendar
            availability={availability}
            onSlotSelect={handleSlotSelect}
            onSlotEdit={handleAvailabilityEdit}
            readonly={false}
          />
        </div>
      )}

      {activeTab === 'interviews' && (
        <div>
          <InterviewList
            userType="candidate"
            onConfirm={handleInterviewConfirm}
            onCancel={handleInterviewCancel}
          />
        </div>
      )}

      {/* Availability Form Modal */}
      {showAvailabilityForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {editingAvailability ? 'Edit Availability' : 'Add Availability'}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <AvailabilitySlotForm
                initialData={editingAvailability || selectedSlot}
                onSubmit={handleAvailabilitySubmit}
                onCancel={() => {
                  setShowAvailabilityForm(false);
                  setSelectedSlot(null);
                  setEditingAvailability(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}