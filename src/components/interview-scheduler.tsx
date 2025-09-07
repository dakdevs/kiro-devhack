"use client"

import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';

interface TimeSlot {
  time: string;
  attendees: number;
}

interface InterviewSchedulerProps {
  jobPostingId?: string;
  recruiterId?: string;
  eventTypeId?: number;
  onScheduled?: (interviewData: any) => void;
  onCancel?: () => void;
}

export function InterviewScheduler({ 
  jobPostingId, 
  recruiterId, 
  eventTypeId, 
  onScheduled, 
  onCancel 
}: InterviewSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState('');
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (optional - you might want to allow weekend interviews)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return dates;
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!eventTypeId || !date) return;

    setIsLoadingSlots(true);
    setError('');
    setAvailableSlots([]);

    try {
      const startTime = `${date}T00:00:00.000Z`;
      const endTime = `${date}T23:59:59.000Z`;
      
      console.log('[INTERVIEW_SCHEDULER] Fetching slots for:', { eventTypeId, date, startTime, endTime });
      
      const response = await fetch(
        `/api/cal_com_api/slots?eventTypeId=${eventTypeId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch available time slots`);
      }

      const data = await response.json();
      console.log('[INTERVIEW_SCHEDULER] Slots response:', data);

      if (data.success) {
        setAvailableSlots(Array.isArray(data.slots) ? data.slots : []);
      } else {
        throw new Error(data.error || 'Failed to load available times');
      }

    } catch (err) {
      console.error('[INTERVIEW_SCHEDULER] Error fetching slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available times');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (date) {
      fetchAvailableSlots(date);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedDate || !selectedTime || !candidateInfo.name || !candidateInfo.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!eventTypeId) {
      setError('Event type not configured. Please contact the recruiter.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateInfo.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsScheduling(true);
    setError('');

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const eventLengthInMinutes = 45; // Default interview length
      
      // Validate that the selected time is in the future
      if (startDateTime <= new Date()) {
        throw new Error('Selected time must be in the future');
      }

      console.log('[INTERVIEW_SCHEDULER] Scheduling interview:', {
        eventTypeId,
        startDateTime: startDateTime.toISOString(),
        candidateInfo,
        jobPostingId,
        recruiterId
      });
      
      const response = await fetch('/api/cal_com_api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recruiterId,
          eventTypeId,
          start: startDateTime.toISOString(),
          name: candidateInfo.name.trim(),
          email: candidateInfo.email.trim(),
          timeZone: candidateInfo.timeZone,
          eventLengthInMinutes,
          jobPostingId,
        }),
      });

      const result = await response.json();
      console.log('[INTERVIEW_SCHEDULER] Booking response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to schedule interview`);
      }
      
      if (onScheduled) {
        onScheduled(result);
      }

    } catch (err) {
      console.error('[INTERVIEW_SCHEDULER] Error scheduling interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setIsScheduling(false);
    }
  };

  const formatTimeSlot = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const availableDates = getAvailableDates();

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-black dark:text-white mb-6">
        Schedule Interview
      </h3>

      <div className="space-y-6">
        {/* Candidate Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="candidate-name" className="block text-sm font-medium text-black dark:text-white mb-2">
              Your Name *
            </label>
            <input
              id="candidate-name"
              type="text"
              value={candidateInfo.name}
              onChange={(e) => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label htmlFor="candidate-email" className="block text-sm font-medium text-black dark:text-white mb-2">
              Your Email *
            </label>
            <input
              id="candidate-email"
              type="email"
              value={candidateInfo.email}
              onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
              placeholder="Enter your email address"
            />
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="interview-date" className="block text-sm font-medium text-black dark:text-white mb-2">
            Select Date *
          </label>
          <select
            id="interview-date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
          >
            <option value="">Choose a date</option>
            {availableDates.map(date => (
              <option key={date.value} value={date.value}>
                {date.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Available Times *
            </label>
            
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading available times...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTime(new Date(slot.time).toTimeString().split(' ')[0])}
                    className={`p-3 text-sm border rounded-lg transition-all duration-150 ease-out ${
                      selectedTime === new Date(slot.time).toTimeString().split(' ')[0]
                        ? 'bg-apple-blue text-white border-apple-blue'
                        : 'bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-700 hover:border-apple-blue hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    {formatTimeSlot(slot.time)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No available time slots for this date. Please try another date.
              </div>
            )}
          </div>
        )}

        {/* Time Zone Display */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Times shown in your timezone: {candidateInfo.timeZone}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-apple-red/10 border border-apple-red/20 rounded-lg">
            <p className="text-apple-red text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleScheduleInterview}
            disabled={isScheduling || !selectedDate || !selectedTime || !candidateInfo.name || !candidateInfo.email}
            className="flex-1 bg-apple-blue text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isScheduling ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
          
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}