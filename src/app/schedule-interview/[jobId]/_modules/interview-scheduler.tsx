"use client"

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface EventType {
  id: number;
  name: string;
  slug: string;
  duration: number;
  isActive: boolean;
}

interface RecruiterInfo {
  id: string;
  name: string;
  calComUsername: string;
  timezone: string;
}

interface AvailabilityData {
  success: boolean;
  connected: boolean;
  recruiter?: RecruiterInfo;
  eventTypes?: EventType[];
  message?: string;
}

interface TimeSlot {
  time: string;
  attendees: number;
}

export function InterviewScheduler() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.jobId as string;
  const recruiterId = searchParams.get('recruiter');

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (recruiterId) {
      loadRecruiterAvailability();
    }
  }, [recruiterId]);

  useEffect(() => {
    if (selectedEventType) {
      loadAvailableSlots();
    }
  }, [selectedEventType]);

  const loadRecruiterAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/cal_com_api/recruiter-availability?recruiterId=${recruiterId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load recruiter availability');
      }

      const data: AvailabilityData = await response.json();
      setAvailabilityData(data);

      if (data.success && data.eventTypes && data.eventTypes.length > 0) {
        setSelectedEventType(data.eventTypes[0]);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedEventType || !availabilityData?.recruiter) return;

    try {
      setIsLoadingSlots(true);
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 30); // Next 30 days

      const response = await fetch(
        `/api/cal_com_api/slots?eventTypeId=${selectedEventType.id}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load available slots');
      }

      const slots = await response.json();
      
      // Ensure slots is always an array
      const slotsArray = Array.isArray(slots) ? slots : [];
      setAvailableSlots(slotsArray);

    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !selectedEventType || !recruiterId) return;

    setIsBooking(true);
    setError(null);

    try {
      const response = await fetch('/api/cal_com_api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId,
          eventTypeId: selectedEventType.id,
          start: selectedSlot,
          name: candidateInfo.name,
          email: candidateInfo.email,
          timeZone: candidateInfo.timezone,
          eventLengthInMinutes: selectedEventType.duration,
          jobPostingId: jobId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      setBookingSuccess(true);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to book interview');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !availabilityData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-red-900 dark:text-red-100">Unable to Load Scheduling</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!availabilityData?.connected) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Scheduling Not Available</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              The recruiter hasn't connected their calendar yet. Please contact them directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Interview Scheduled Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            You'll receive a calendar invitation with the meeting details shortly.
          </p>
          <div className="bg-white dark:bg-black rounded-lg p-4 text-left">
            <h4 className="font-medium text-black dark:text-white mb-2">Interview Details:</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600 dark:text-gray-400">Date & Time:</span> {new Date(selectedSlot!).toLocaleString()}</p>
              <p><span className="text-gray-600 dark:text-gray-400">Duration:</span> {selectedEventType?.duration} minutes</p>
              <p><span className="text-gray-600 dark:text-gray-400">Type:</span> {selectedEventType?.name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Type Selection */}
      {availabilityData.eventTypes && availabilityData.eventTypes.length > 1 && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Select Interview Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availabilityData.eventTypes.map((eventType) => (
              <button
                key={eventType.id}
                onClick={() => setSelectedEventType(eventType)}
                className={`p-4 text-left border rounded-lg transition-colors duration-150 ${
                  selectedEventType?.id === eventType.id
                    ? 'border-apple-blue bg-apple-blue/10 text-apple-blue'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-900 text-black dark:text-white'
                }`}
              >
                <div className="font-medium">{eventType.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {eventType.duration} minutes
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Slots */}
      {selectedEventType && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Available Time Slots
          </h3>
          
          {isLoadingSlots ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading available slots...
              </p>
            </div>
          ) : !Array.isArray(availableSlots) || availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No available slots found for the next 30 days
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableSlots.slice(0, 12).map((slot, index) => {
                // Handle different slot formats
                const slotTime = typeof slot === 'string' ? slot : slot?.time || slot;
                
                if (!slotTime) {
                  return null;
                }

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slotTime)}
                    className={`p-3 text-left border rounded-lg transition-colors duration-150 ${
                      selectedSlot === slotTime
                        ? 'border-apple-blue bg-apple-blue/10 text-apple-blue'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-900 text-black dark:text-white'
                    }`}
                  >
                    <div className="font-medium">
                      {new Date(slotTime).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(slotTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </button>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      )}

      {/* Candidate Information */}
      {selectedSlot && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Your Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={candidateInfo.name}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={candidateInfo.email}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-medium text-black dark:text-white mb-2">Interview Summary</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600 dark:text-gray-400">Date & Time:</span> {new Date(selectedSlot).toLocaleString()}</p>
              <p><span className="text-gray-600 dark:text-gray-400">Duration:</span> {selectedEventType?.duration} minutes</p>
              <p><span className="text-gray-600 dark:text-gray-400">Type:</span> {selectedEventType?.name}</p>
              <p><span className="text-gray-600 dark:text-gray-400">Recruiter:</span> {availabilityData.recruiter?.name}</p>
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={isBooking || !candidateInfo.name.trim() || !candidateInfo.email.trim()}
            className="w-full mt-6 px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isBooking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Scheduling Interview...
              </div>
            ) : (
              'Schedule Interview'
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}