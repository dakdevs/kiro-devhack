"use client"

import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { X, Calendar, Clock, Video, User, Building } from 'lucide-react';

interface JobMatch {
  id: string;
  job: {
    id: string;
    title: string;
  };
  recruiter: {
    id: string;
    organizationName: string;
    calComUsername: string;
  };
  recruiterUser: {
    name: string;
    email: string;
  };
}

interface EventType {
  id: string;
  calComEventTypeId: number;
  eventTypeName: string;
  eventTypeSlug: string;
  duration: number;
}

interface ScheduleInterviewModalProps {
  match: JobMatch;
  onClose: () => void;
}

export function ScheduleInterviewModal({ match, onClose }: ScheduleInterviewModalProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState({
    scheduledStart: '',
    scheduledEnd: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    candidateName: '',
    candidateEmail: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      // For demo purposes, we'll use mock data
      // In production, this would fetch from the recruiter's available event types
      const mockEventTypes = [
        {
          id: 'avail_1',
          calComEventTypeId: 101,
          eventTypeName: 'Technical Interview - 45 min',
          eventTypeSlug: 'technical-interview-45min',
          duration: 45
        },
        {
          id: 'avail_2',
          calComEventTypeId: 102,
          eventTypeName: 'Initial Screening - 30 min',
          eventTypeSlug: 'initial-screening-30min',
          duration: 30
        }
      ];
      
      setEventTypes(mockEventTypes);
      if (mockEventTypes.length > 0) {
        setSelectedEventType(mockEventTypes[0]);
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toISOString().slice(0, 16);
  };

  const handleStartTimeChange = (startTime: string) => {
    setFormData(prev => ({
      ...prev,
      scheduledStart: startTime,
      scheduledEnd: selectedEventType ? updateEndTime(startTime, selectedEventType.duration) : ''
    }));
  };

  const handleEventTypeChange = (eventType: EventType) => {
    setSelectedEventType(eventType);
    if (formData.scheduledStart) {
      setFormData(prev => ({
        ...prev,
        scheduledEnd: updateEndTime(prev.scheduledStart, eventType.duration)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedEventType || !formData.scheduledStart) {
      setError('Please select an event type and start time');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPostingId: match.job.id,
          recruiterId: match.recruiter.id,
          eventTypeId: selectedEventType.calComEventTypeId,
          scheduledStart: formData.scheduledStart,
          scheduledEnd: formData.scheduledEnd,
          timezone: formData.timezone,
          candidateName: formData.candidateName,
          candidateEmail: formData.candidateEmail,
          notes: formData.notes
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Show success message or redirect
        alert('Interview scheduled successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setError('An error occurred while scheduling the interview');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Minimum 2 hours from now
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Schedule Interview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {match.job.title} at {match.recruiter.organizationName}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Recruiter Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-black dark:text-white">
                {match.recruiterUser.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {match.recruiter.organizationName}
              </span>
            </div>
          </div>

          {/* Event Type Selection */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-3">
              Interview Type *
            </label>
            <div className="space-y-2">
              {eventTypes.map((eventType) => (
                <label
                  key={eventType.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedEventType?.id === eventType.id
                      ? 'border-apple-blue bg-apple-blue/5'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="eventType"
                    checked={selectedEventType?.id === eventType.id}
                    onChange={() => handleEventTypeChange(eventType)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Video className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-black dark:text-white">
                        {eventType.eventTypeName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {eventType.duration} minutes
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Date and Time *
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                min={getMinDateTime()}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
                required
              />
            </div>
            {formData.scheduledEnd && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ends at: {new Date(formData.scheduledEnd).toLocaleString()}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={formData.candidateName}
                onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={formData.candidateEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none resize-none"
              rows={3}
              placeholder="Any specific topics you'd like to discuss or questions you have..."
            />
          </div>

          {error && (
            <div className="p-3 bg-apple-red/10 border border-apple-red/20 rounded-lg">
              <p className="text-sm text-apple-red">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-apple-blue hover:bg-blue-600 text-white"
              disabled={submitting}
            >
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}