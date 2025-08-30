"use client"

import { useState, useEffect } from 'react';
import { TimeSlot, CandidateAvailability } from '~/types/interview-management';

interface TimeSlotSelectorProps {
  candidateId: string;
  selectedSlots: TimeSlot[];
  onSlotsChange: (slots: TimeSlot[]) => void;
  duration: number; // minutes
  timezone: string;
  maxSlots?: number;
}

export function TimeSlotSelector({
  candidateId,
  selectedSlots,
  onSlotsChange,
  duration,
  timezone,
  maxSlots = 5
}: TimeSlotSelectorProps) {
  const [availableSlots, setAvailableSlots] = useState<CandidateAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchCandidateAvailability();
  }, [candidateId]);

  useEffect(() => {
    // Set default selected date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const fetchCandidateAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Next 30 days
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'available'
      });
      
      const response = await fetch(`/api/availability?${params}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch availability');
      }
      
      setAvailableSlots(data.data?.availability || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlotsForDate = (date: string): TimeSlot[] => {
    const selectedDateObj = new Date(date);
    const nextDay = new Date(selectedDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const daySlots: TimeSlot[] = [];
    
    availableSlots.forEach(availability => {
      const availStart = new Date(availability.startTime);
      const availEnd = new Date(availability.endTime);
      
      // Check if availability falls on the selected date
      if (availStart >= selectedDateObj && availStart < nextDay) {
        // Generate time slots within this availability window
        const slots = generateTimeSlotsInWindow(availStart, availEnd, duration, timezone);
        daySlots.push(...slots);
      }
    });
    
    return daySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const generateTimeSlotsInWindow = (
    windowStart: Date,
    windowEnd: Date,
    slotDuration: number,
    tz: string
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const current = new Date(windowStart);
    
    while (current < windowEnd) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000);
      
      if (slotEnd <= windowEnd) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
          timezone: tz
        });
      }
      
      // Move to next 30-minute interval
      current.setTime(current.getTime() + 30 * 60 * 1000);
    }
    
    return slots;
  };

  const isSlotSelected = (slot: TimeSlot): boolean => {
    return selectedSlots.some(selected => 
      selected.start.getTime() === slot.start.getTime() &&
      selected.end.getTime() === slot.end.getTime()
    );
  };

  const toggleSlot = (slot: TimeSlot) => {
    if (isSlotSelected(slot)) {
      // Remove slot
      const updated = selectedSlots.filter(selected => 
        !(selected.start.getTime() === slot.start.getTime() &&
          selected.end.getTime() === slot.end.getTime())
      );
      onSlotsChange(updated);
    } else {
      // Add slot (if under limit)
      if (selectedSlots.length < maxSlots) {
        onSlotsChange([...selectedSlots, slot]);
      }
    }
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
      timeZone: timezone
    }).format(date);
  };

  const getAvailableDates = (): string[] => {
    const dates = new Set<string>();
    const today = new Date();
    
    availableSlots.forEach(availability => {
      const availDate = new Date(availability.startTime);
      if (availDate >= today) {
        dates.add(availDate.toISOString().split('T')[0]);
      }
    });
    
    return Array.from(dates).sort();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
        <button 
          onClick={fetchCandidateAvailability}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const availableDates = getAvailableDates();
  const slotsForSelectedDate = selectedDate ? getAvailableSlotsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          Select Date
        </label>
        {availableDates.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            No availability found for this candidate
          </p>
        ) : (
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
          >
            <option value="">Select a date</option>
            {availableDates.map(date => {
              const dateObj = new Date(date);
              const formatted = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'full'
              }).format(dateObj);
              
              return (
                <option key={date} value={date}>
                  {formatted}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-black dark:text-white">
              Available Time Slots
            </label>
            <span className="text-xs text-gray-500">
              {selectedSlots.length}/{maxSlots} selected
            </span>
          </div>
          
          {slotsForSelectedDate.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              No available time slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {slotsForSelectedDate.map((slot, index) => {
                const selected = isSlotSelected(slot);
                const disabled = !selected && selectedSlots.length >= maxSlots;
                
                return (
                  <button
                    key={index}
                    onClick={() => toggleSlot(slot)}
                    disabled={disabled}
                    className={`
                      p-3 text-sm rounded-lg border transition-all duration-150 ease-out
                      ${selected 
                        ? 'bg-apple-blue text-white border-apple-blue' 
                        : disabled
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                        : 'bg-white dark:bg-black text-black dark:text-white border-gray-200 dark:border-gray-700 hover:border-apple-blue hover:bg-gray-50 dark:hover:bg-gray-900'
                      }
                    `}
                  >
                    <div className="font-medium">
                      {formatTime(slot.start)}
                    </div>
                    <div className="text-xs opacity-75">
                      {duration} min
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Slots Summary */}
      {selectedSlots.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Selected Time Slots ({selectedSlots.length})
          </h4>
          <div className="space-y-1">
            {selectedSlots.map((slot, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-blue-800 dark:text-blue-200">
                  {new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: timezone
                  }).format(slot.start)} - {formatTime(slot.end)}
                </span>
                <button
                  onClick={() => toggleSlot(slot)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}