"use client";

import { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'interview' | 'meeting' | 'other';
  candidateName?: string;
  jobTitle?: string;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendarEvents();
  }, [currentDate]);

  const loadCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recruiter/calendar/events?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.start.startsWith(dateStr));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          {monthYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square p-2 bg-gray-50 dark:bg-gray-900 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`aspect-square p-1 border border-gray-100 dark:border-gray-800 rounded transition-colors duration-150 ${
                  isCurrentMonth ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-900'
                } ${isToday ? 'ring-2 ring-apple-blue' : ''}`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'
                    } ${isToday ? 'text-apple-blue' : ''}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            event.type === 'interview'
                              ? 'bg-apple-blue/10 text-apple-blue'
                              : event.type === 'meeting'
                              ? 'bg-apple-green/10 text-apple-green'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                          title={`${event.title} - ${formatTime(event.start)}`}
                        >
                          {formatTime(event.start)} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Upcoming Interviews
        </h3>
        <div className="space-y-3">
          {events
            .filter(event => event.type === 'interview' && new Date(event.start) > new Date())
            .slice(0, 5)
            .map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-black dark:text-white">
                    {event.candidateName} - {event.jobTitle}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(event.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })} at {formatTime(event.start)}
                  </div>
                </div>
                <button className="px-3 py-1 text-sm text-apple-blue hover:bg-apple-blue/10 rounded transition-colors duration-150">
                  View Details
                </button>
              </div>
            ))}
          {events.filter(event => event.type === 'interview' && new Date(event.start) > new Date()).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No upcoming interviews scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}