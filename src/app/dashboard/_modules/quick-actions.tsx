import { Plus, Upload, Search, User, FileText, Calendar, ArrowRight, Zap, Briefcase } from 'lucide-react'

const iconMap = {
  Plus,
  Upload,
  Search,
  FileText,
  User,
  Calendar,
  Briefcase,
}

const actions = [
  {
    title: 'Add Job Application',
    description: 'Track a new job application',
    icon: 'Plus' as const,
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 border-blue-200',
    href: '/dashboard/applications/new',
    featured: true
  },
  {
    title: 'Update Resume',
    description: 'Upload your latest resume',
    icon: 'Upload' as const,
    color: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200 border-green-200',
    href: '/dashboard/profile/resume',
    featured: false
  },
  {
    title: 'Browse Jobs',
    description: 'Find new opportunities',
    icon: 'Search' as const,
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 hover:from-purple-100 hover:to-purple-200 border-purple-200',
    href: '/dashboard/jobs/browse',
    featured: true
  },
  {
    title: 'Schedule Interview',
    description: 'Book your next interview',
    icon: 'Calendar' as const,
    color: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 hover:from-orange-100 hover:to-orange-200 border-orange-200',
    href: '/dashboard/interviews/schedule',
    featured: false
  }
]

export function QuickActions() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600 text-sm mt-1">Get things done faster</p>
        </div>
        <Zap className="h-5 w-5 text-yellow-500" />
      </div>
      
      {/* Actions Grid */}
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.title}
            className={`group w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${action.color}`}
          >
            <div className="flex-shrink-0">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-gray-900 text-sm">
                  {action.title}
                </div>
                {action.featured && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {action.description}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
      
      {/* Profile Section */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <button className="w-full flex items-center justify-between gap-3 p-4 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all group">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4" />
            <span>Edit Profile</span>
          </div>
          <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Weekly Goals */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-900">Weekly Goal</span>
            <span className="text-gray-600">5/10 applications</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
        </div>
        <p className="text-xs text-gray-600">Keep going! You're halfway to your goal.</p>
      </div>
    </div>
  )
}