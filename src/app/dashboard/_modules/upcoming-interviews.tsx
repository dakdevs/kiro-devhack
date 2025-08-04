"use client"

import { Calendar, Clock, Video, Phone, MapPin, User, ExternalLink, Plus } from 'lucide-react'
import { useState } from 'react'

const mockInterviews = [
  {
    id: '1',
    jobTitle: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    interviewType: 'video',
    scheduledAt: '2025-01-10T14:00:00Z',
    duration: '60 minutes',
    interviewerName: 'Sarah Johnson',
    interviewerEmail: 'sarah.johnson@techcorp.com',
    meetingLink: 'https://zoom.us/j/123456789',
    status: 'scheduled'
  },
  {
    id: '2',
    jobTitle: 'Product Manager',
    company: 'StartupXYZ',
    interviewType: 'phone',
    scheduledAt: '2025-01-12T10:30:00Z',
    duration: '45 minutes',
    interviewerName: 'Mike Chen',
    interviewerEmail: 'mike.chen@startupxyz.com',
    status: 'scheduled'
  },
  {
    id: '3',
    jobTitle: 'UX Designer',
    company: 'Design Studio',
    interviewType: 'in-person',
    scheduledAt: '2025-01-15T15:00:00Z',
    duration: '90 minutes',
    interviewerName: 'Emily Davis',
    interviewerEmail: 'emily.davis@designstudio.com',
    location: '123 Design Ave, New York, NY',
    status: 'scheduled'
  }
]

const interviewTypeConfig = {
  video: { icon: Video, label: 'Video Call', color: 'text-blue-600 bg-blue-50' },
  phone: { icon: Phone, label: 'Phone Call', color: 'text-green-600 bg-green-50' },
  'in-person': { icon: MapPin, label: 'In Person', color: 'text-purple-600 bg-purple-50' },
  technical: { icon: Video, label: 'Technical', color: 'text-orange-600 bg-orange-50' }
}

export function UpcomingInterviews() {
  const [showAll, setShowAll] = useState(false)
  
  const displayedInterviews = showAll ? mockInterviews : mockInterviews.slice(0, 3)

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (isToday) return `Today at ${timeStr}`
    if (isTomorrow) return `Tomorrow at ${timeStr}`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Starting soon'
    if (diffHours < 24) return `In ${diffHours} hours`
    const diffDays = Math.ceil(diffHours / 24)
    return `In ${diffDays} days`
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h2>
          <p className="text-gray-600 text-sm mt-1">{mockInterviews.length} scheduled</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {displayedInterviews.map((interview) => {
          const typeConfig = interviewTypeConfig[interview.interviewType as keyof typeof interviewTypeConfig]
          const TypeIcon = typeConfig.icon
          
          return (
            <div key={interview.id} className="group border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {interview.jobTitle}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {interview.company}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${typeConfig.color}`}>
                  <TypeIcon className="h-3 w-3" />
                  {typeConfig.label}
                </div>
              </div>

              {/* Time & Duration */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(interview.scheduledAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {interview.duration}
                </div>
              </div>

              {/* Interviewer */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <User className="h-3 w-3" />
                <span>{interview.interviewerName}</span>
              </div>

              {/* Time Until */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {getTimeUntil(interview.scheduledAt)}
                </span>
                <div className="flex items-center gap-2">
                  {interview.meetingLink && (
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      Join Call
                    </button>
                  )}
                  <button className="text-gray-600 hover:text-gray-700 text-xs font-medium">
                    Details
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More/Less */}
      {mockInterviews.length > 3 && (
        <div className="mt-4">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {showAll ? 'Show less' : `Show ${mockInterviews.length - 3} more`}
          </button>
        </div>
      )}

      {mockInterviews.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium mb-1">No interviews scheduled</h3>
          <p className="text-gray-600 text-sm mb-4">Your upcoming interviews will appear here</p>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Schedule Interview
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
          <button className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <Clock className="h-4 w-4" />
            Reschedule
          </button>
        </div>
      </div>
    </div>
  )
}