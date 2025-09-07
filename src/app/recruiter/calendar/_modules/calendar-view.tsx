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
  status?: string;
  meetingLink?: string;
  source?: 'local' | 'calcom';
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
      // Load both local interviews and Cal.com bookings
      const [interviewsResponse, calComResponse] = await Promise.all([
        fetch(`/api/recruiter/interviews?filter=all`),
        fetch(`/api/cal_com_api/bookings?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`)
      ]);

      const combinedEvents: CalendarEvent[] = [];

      // Process local interviews
      if (interviewsResponse.ok) {
        const interviewsData = await interviewsResponse.json();
        if (interviewsData.success && interviewsData.interviews) {
          const interviewEvents = interviewsData.interviews.map((interview: any) => ({
            id: `interview-${interview.id}`,
            title: interview.candidateName || 'Interview',
            start: interview.scheduledStart,
            end: interview.scheduledEnd,
            type: 'interview' as const,
            candidateName: interview.candidateName,
            jobTitle: interview.jobTitle,
            status: interview.status,
            meetingLink: interview.meetingLink,
            source: 'local'
          }));
          combinedEvents.push(...interviewEvents);
        }
      }

      // Process Cal.com bookings
      if (calComResponse.ok) {
        const calComData = await calComResponse.json();
        if (calComData.success && calComData.bookings) {
          const calComEvents = calComData.bookings.map((booking: any) => ({
            id: `calcom-${booking.id}`,
            title: booking.title || 'Cal.com Booking',
            start: booking.startTime,
            end: booking.endTime,
            type: 'interview' as const,
            candidateName: booking.attendees?.[0]?.name || 'Unknown',
            jobTitle: booking.eventType?.title || 'Interview',
            status: booking.status?.toLowerCase() || 'scheduled',
            meetingLink: booking.location,
            source: 'calcom'
          }));
          combinedEvents.push(...calComEvents);
        }
      }

      setEvents(combinedEvents);
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
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {monthYear}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-3 h-3 bg-apple-blue/20 border-l-2 border-apple-blue rounded-sm"></div>
              <span>Local Interviews</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-3 h-3 bg-apple-green/20 border-l-2 border-apple-green rounded-sm"></div>
              <span>Cal.com Bookings</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadCalendarEvents}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150"
            title="Refresh calendar"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
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
                          className={`text-xs px-1 py-0.5 rounded truncate relative ${
                            event.type === 'interview'
                              ? event.source === 'calcom'
                                ? 'bg-apple-green/10 text-apple-green border-l-2 border-apple-green'
                                : 'bg-apple-blue/10 text-apple-blue border-l-2 border-apple-blue'
                              : event.type === 'meeting'
                              ? 'bg-apple-orange/10 text-apple-orange'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                          title={`${event.candidateName || event.title} - ${formatTime(event.start)} ${event.source === 'calcom' ? '(Cal.com)' : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            {event.source === 'calcom' && (
                              <div className="w-1 h-1 bg-apple-green rounded-full flex-shrink-0"></div>
                            )}
                            <span className="truncate">
                              {formatTime(event.start)} {event.candidateName || event.title}
                            </span>
                          </div>
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
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .slice(0, 5)
            .map(event => (
              <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                event.source === 'calcom' 
                  ? 'bg-apple-green/5 border-apple-green' 
                  : 'bg-apple-blue/5 border-apple-blue'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-black dark:text-white">
                      {event.candidateName} - {event.jobTitle}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      event.source === 'calcom'
                        ? 'bg-apple-green/10 text-apple-green'
                        : 'bg-apple-blue/10 text-apple-blue'
                    }`}>
                      {event.source === 'calcom' ? 'Cal.com' : 'Local'}
                    </div>
                    {event.status && (
                      <div className={`px-2 py-1 text-xs rounded-full capitalize ${
                        event.status === 'confirmed' 
                          ? 'bg-apple-green/10 text-apple-green'
                          : event.status === 'cancelled'
                          ? 'bg-apple-red/10 text-apple-red'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {event.status}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(event.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })} at {formatTime(event.start)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm text-apple-blue hover:bg-apple-blue/10 rounded transition-colors duration-150"
                    >
                      Join Meeting
                    </a>
                  )}
                  <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-150">
                    Details
                  </button>
                </div>
              </div>
            ))}
          {events.filter(event => event.type === 'interview' && new Date(event.start) > new Date()).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m-4 0V3m0 4h4m0 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h4" />
                </svg>
              </div>
              <p className="font-medium">No upcoming interviews scheduled</p>
              <p className="text-sm mt-1">Interviews will appear here once candidates book time slots</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}