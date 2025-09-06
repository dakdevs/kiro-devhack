"use client"

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, Clock, Video, Mail } from 'lucide-react';
import Link from 'next/link';

interface InterviewDetails {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  scheduledStart: string;
  scheduledEnd: string;
  meetingLink?: string;
  organizationName: string;
}

export default function InterviewScheduledPage() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (interviewId) {
      fetchInterviewDetails();
    } else {
      setError('No interview ID provided');
      setLoading(false);
    }
  }, [interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch interview details');
      }

      const data = await response.json();
      if (data.success) {
        setInterview(data.interview);
      } else {
        throw new Error(data.error || 'Failed to load interview details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const addToCalendar = () => {
    if (!interview) return;

    const startDate = new Date(interview.scheduledStart);
    const endDate = new Date(interview.scheduledEnd);
    
    const formatDateForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Interview: ${interview.jobTitle}`
    )}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${encodeURIComponent(
      `Interview for ${interview.jobTitle} position at ${interview.organizationName}\n\nCandidate: ${interview.candidateName}\nEmail: ${interview.candidateEmail}${
        interview.meetingLink ? `\n\nMeeting Link: ${interview.meetingLink}` : ''
      }`
    )}&location=${encodeURIComponent(interview.meetingLink || 'Video Call')}`;

    window.open(calendarUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-apple-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-black dark:text-white mb-2">
              Interview Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'The interview details could not be loaded.'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(interview.scheduledStart);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-apple-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-apple-green" />
          </div>
          <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
            Interview Scheduled!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your interview has been successfully scheduled. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Interview Details Card */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Interview Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-apple-blue mt-0.5" />
              <div>
                <h3 className="font-medium text-black dark:text-white">
                  {interview.jobTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {interview.organizationName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-apple-blue" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  {date}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {time}
                </p>
              </div>
            </div>

            {interview.meetingLink && (
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-apple-blue" />
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Video Meeting
                  </p>
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-apple-blue hover:text-blue-600 transition-colors duration-150"
                  >
                    Join meeting link
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-apple-blue" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  Confirmation Email
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Sent to {interview.candidateEmail}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={addToCalendar}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar
          </button>
          
          {interview.meetingLink && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <Video className="w-4 h-4" />
              Test Meeting Link
            </a>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What's Next?
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              <span>You'll receive a confirmation email with all the details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              <span>Add the interview to your calendar using the button above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              <span>Prepare for your interview by reviewing the job description</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              <span>Test your video setup before the interview</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 text-apple-blue hover:text-blue-600 transition-colors duration-150"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}