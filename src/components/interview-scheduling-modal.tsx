"use client"

import { useState } from 'react';
import { 
  ScheduleInterviewRequest,
  TimeSlot,
  InterviewType,
  CandidateWithMatch
} from '~/types/interview-management';

interface InterviewSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateWithMatch;
  jobPostingId: string;
  onSchedule: (request: ScheduleInterviewRequest) => Promise<void>;
  isLoading?: boolean;
}

export function InterviewSchedulingModal({
  isOpen,
  onClose,
  candidate,
  jobPostingId,
  onSchedule,
  isLoading = false
}: InterviewSchedulingModalProps) {
  const [selectedTimes, setSelectedTimes] = useState<TimeSlot[]>([]);
  const [interviewType, setInterviewType] = useState<InterviewType>('video');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTimes.length === 0) {
      alert('Please select at least one preferred time slot');
      return;
    }

    const request: ScheduleInterviewRequest = {
      jobPostingId,
      candidateId: candidate.candidate.id,
      preferredTimes: selectedTimes,
      interviewType,
      duration,
      notes: notes.trim() || undefined,
      timezone
    };

    try {
      await onSchedule(request);
      onClose();
      // Reset form
      setSelectedTimes([]);
      setNotes('');
      setDuration(60);
      setInterviewType('video');
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    }
  };

  const addTimeSlot = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(10, 0, 0, 0); // Default to 10 AM tomorrow
    
    const endTime = new Date(tomorrow.getTime() + duration * 60 * 1000);
    
    setSelectedTimes([...selectedTimes, {
      start: tomorrow,
      end: endTime,
      timezone
    }]);
  };

  const removeTimeSlot = (index: number) => {
    setSelectedTimes(selectedTimes.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...selectedTimes];
    const newDate = new Date(value);
    
    if (field === 'start') {
      updated[index] = {
        ...updated[index],
        start: newDate,
        end: new Date(newDate.getTime() + duration * 60 * 1000)
      };
    } else {
      updated[index] = {
        ...updated[index],
        end: newDate
      };
    }
    
    setSelectedTimes(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-300 mx-4">
        
        {/* Modal Header */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white m-0">Schedule Interview</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              with {candidate.candidate.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 border-none bg-none rounded-full flex items-center justify-center cursor-pointer text-gray-600 dark:text-gray-400 transition-all duration-150 ease-out hover:bg-gray-50 hover:dark:bg-gray-900 hover:text-black hover:dark:text-white"
          >
            ×
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Candidate Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium text-black dark:text-white mb-2">Candidate Details</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Email:</span> {candidate.candidate.email}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Match Score:</span> {candidate.match.score}%
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Top Skills:</span> {candidate.match.matchingSkills.slice(0, 3).map(s => s.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Interview Type
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
              >
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="in-person">In Person</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            {/* Preferred Times */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-black dark:text-white">
                  Preferred Times
                </label>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="px-3 py-1 text-sm bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
                >
                  Add Time Slot
                </button>
              </div>
              
              {selectedTimes.length === 0 && (
                <p className="text-gray-500 text-sm italic">
                  Add at least one preferred time slot
                </p>
              )}
              
              <div className="space-y-3">
                {selectedTimes.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start</label>
                        <input
                          type="datetime-local"
                          value={slot.start.toISOString().slice(0, 16)}
                          onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-black text-black dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End</label>
                        <input
                          type="datetime-local"
                          value={slot.end.toISOString().slice(0, 16)}
                          onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-black text-black dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="p-2 text-apple-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-150"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or requirements for the interview..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
              />
            </div>
          </form>
        </div>
        
        {/* Modal Actions */}
        <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button 
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading || selectedTimes.length === 0}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Scheduling...
              </>
            ) : (
              'Schedule Interview'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}