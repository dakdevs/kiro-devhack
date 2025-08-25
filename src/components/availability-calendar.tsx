"use client"

import { useState, useEffect } from 'react';
import { CandidateAvailability, TimeSlot } from '~/types/interview-management';

interface AvailabilityCalendarProps {
  availability: CandidateAvailability[];
  onSlotSelect?: (slot: TimeSlot) => void;
  onSlotEdit?: (availability: CandidateAvailability) => void;
  selectedDate?: Date;
  timezone?: string;
  readonly?: boolean;
}

export function AvailabilityCalendar({
  availability,
  onSlotSelect,
  onSlotEdit,
  selectedDate = new Date(),
  timezone = 'UTC',
  readonly = false
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days;
  };

  // Get availability for a specific date
  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return availability.filter(slot => 
      slot.startTime.toDateString() === dateStr
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (readonly) return;
    
    setCurrentDate(date);
    if (onSlotSelect) {
      // Default to 1-hour slot starting at 9 AM
      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(10, 0, 0, 0);
      
      onSlotSelect({
        start: startTime,
        end: endTime,
        timezone
      });
    }
  };

  // Handle availability slot click
  const handleSlotClick = (slot: CandidateAvailability) => {
    if (readonly) return;
    
    if (onSlotEdit) {
      onSlotEdit(slot);
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    }).format(date);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors duration-150"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-black dark:text-white">
          {monthYear}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors duration-150"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayAvailability = getAvailabilityForDate(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border-r border-b border-gray-100 dark:border-gray-800 last:border-r-0 ${
                !readonly ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900' : ''
              } transition-colors duration-150`}
              onClick={() => handleDateClick(date)}
            >
              {/* Date Number */}
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonthDate 
                  ? isTodayDate 
                    ? 'text-apple-blue font-semibold' 
                    : 'text-black dark:text-white'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {date.getDate()}
              </div>

              {/* Availability Slots */}
              <div className="space-y-1">
                {dayAvailability.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotClick(slot);
                    }}
                    className={`text-xs px-2 py-1 rounded text-white cursor-pointer transition-all duration-150 hover:scale-105 ${
                      slot.status === 'available' 
                        ? 'bg-apple-green hover:bg-green-600' 
                        : slot.status === 'booked'
                        ? 'bg-apple-blue hover:bg-blue-600'
                        : 'bg-gray-400 hover:bg-gray-500'
                    }`}
                    title={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)} (${slot.status})`}
                  >
                    {formatTime(slot.startTime)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-apple-green rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-apple-blue rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Unavailable</span>
          </div>
        </div>
        
        {!readonly && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Click on a date to add availability, or click on existing slots to edit them.
          </p>
        )}
      </div>
    </div>
  );
}