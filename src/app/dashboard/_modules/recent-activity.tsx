import { Clock, Send, Calendar, CheckCircle, XCircle, FileText, MoreHorizontal, Filter, Building2 } from 'lucide-react'

const iconMap = {
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
}

const activities = [
  {
    id: 1,
    type: 'application',
    title: 'Applied to Senior Frontend Developer',
    description: 'TechCorp Inc. - Application submitted successfully',
    time: '2 minutes ago',
    icon: 'Send' as const,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    priority: 'high'
  },
  {
    id: 2,
    type: 'interview',
    title: 'Interview scheduled',
    description: 'Product Manager role at StartupXYZ - Jan 12, 10:30 AM',
    time: '1 hour ago',
    icon: 'Calendar' as const,
    color: 'bg-green-50 text-green-600 border-green-200',
    priority: 'high'
  },
  {
    id: 3,
    type: 'offer',
    title: 'Job offer received',
    description: 'Full Stack Engineer at InnovateLab - Review by Jan 15',
    time: '2 hours ago',
    icon: 'CheckCircle' as const,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    priority: 'high'
  },
  {
    id: 4,
    type: 'rejection',
    title: 'Application update',
    description: 'DevOps Engineer at CloudTech - Not selected for this role',
    time: '1 day ago',
    icon: 'XCircle' as const,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    priority: 'medium'
  },
  {
    id: 5,
    type: 'profile',
    title: 'Resume updated',
    description: 'New version uploaded with recent project experience',
    time: '2 days ago',
    icon: 'FileText' as const,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    priority: 'low'
  },
  {
    id: 6,
    type: 'company',
    title: 'Company research completed',
    description: 'Added notes for TechCorp Inc. and StartupXYZ',
    time: '3 days ago',
    icon: 'Building2' as const,
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    priority: 'low'
  }
]

const priorityDots = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-gray-400'
}

export function RecentActivity() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-gray-600 text-sm mt-1">Latest updates and events</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="h-4 w-4 text-gray-600" />
          </button>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
            View all
          </button>
        </div>
      </div>
      
      {/* Activity List */}
      <div className="space-y-1">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.icon]
          return (
            <div key={activity.id} className="group relative">
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                {/* Icon */}
                <div className={`relative rounded-xl p-2.5 border ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${priorityDots[activity.priority as keyof typeof priorityDots]}`}></div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-md transition-all">
                        <MoreHorizontal className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < activities.length - 1 && (
                <div className="absolute left-8 top-16 w-px h-4 bg-gray-200"></div>
              )}
            </div>
          )
        })}
      </div>

      {/* Load More */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors">
          Load more activities
        </button>
      </div>
    </div>
  )
}