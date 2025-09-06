"use client"

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  User, 
  Building, 
  ExternalLink,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Interview {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  status: string;
  interviewType: string;
  meetingLink?: string;
  candidateName: string;
  candidateEmail: string;
  notes?: string;
  calComBookingId?: number;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    location: string;
  };
  recruiter?: {
    organizationName: string;
    contactEmail: string;
  };
  recruiterUser?: {
    name: string;
    email: string;
  };
}

interface InterviewCardProps {
  interview: Interview;
  userType: 'candidate' | 'recruiter';
}

export function InterviewCard({ interview, userType }: InterviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getDuration = () => {
    const start = new Date(interview.scheduledStart);
    const end = new Date(interview.scheduledEnd);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20';
      case 'confirmed': return 'bg-apple-green/10 text-apple-green border-apple-green/20';
      case 'cancelled': return 'bg-apple-red/10 text-apple-red border-apple-red/20';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const isUpcoming = new Date(interview.scheduledStart) > new Date();
  const startDateTime = formatDateTime(interview.scheduledStart);

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {interview.job?.title || 'Interview'}
            </h3>
            <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(interview.status)}`}>
              {interview.status}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            {userType === 'candidate' ? (
              <>
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {interview.recruiter?.organizationName}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {interview.recruiterUser?.name}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {interview.candidateName}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {interview.candidateEmail}
                </div>
              </>
            )}
          </div>
          
          {interview.job?.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              {interview.job.location}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-black dark:text-white">
            {startDateTime.date}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {startDateTime.time}
          </div>
        </div>
      </div>

      {/* Interview Details */}
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {getDuration()}
        </div>
        <div className="flex items-center gap-1">
          <Video className="w-4 h-4" />
          Video call
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {interview.timezone}
        </div>
      </div>

      {/* Notes */}
      {interview.notes && (expanded || interview.notes.length < 100) && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-black dark:text-white mb-1">
            Notes
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {expanded ? interview.notes : interview.notes.slice(0, 100) + (interview.notes.length > 100 ? '...' : '')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {isUpcoming && interview.meetingLink && (
          <Button
            onClick={() => window.open(interview.meetingLink, '_blank')}
            className="bg-apple-blue hover:bg-blue-600 text-white"
          >
            <Video className="w-4 h-4 mr-2" />
            Join Meeting
          </Button>
        )}
        
        {interview.meetingLink && (
          <Button
            onClick={() => navigator.clipboard.writeText(interview.meetingLink!)}
            variant="secondary"
            size="sm"
          >
            Copy Link
          </Button>
        )}
        
        {interview.notes && interview.notes.length > 100 && (
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="secondary"
            size="sm"
          >
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
        )}
        
        <div className="flex-1" />
        
        {isUpcoming && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-apple-green hover:text-green-600"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-apple-red hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {interview.calComBookingId && (
          <div className="text-xs text-gray-500">
            Booking #{interview.calComBookingId}
          </div>
        )}
      </div>
    </div>
  );
}