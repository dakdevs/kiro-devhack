import { TrendingUp, TrendingDown, Send, Calendar, CheckCircle, XCircle } from 'lucide-react'

const stats = [
  {
    title: 'Applications Sent',
    value: '23',
    change: '+5',
    trend: 'up' as const,
    icon: Send,
    color: 'blue' as const,
    description: 'This month'
  },
  {
    title: 'Interviews Scheduled',
    value: '5',
    change: '+2',
    trend: 'up' as const,
    icon: Calendar,
    color: 'green' as const,
    description: 'Upcoming'
  },
  {
    title: 'Offers Received',
    value: '2',
    change: '+1',
    trend: 'up' as const,
    icon: CheckCircle,
    color: 'purple' as const,
    description: 'Pending response'
  },
  {
    title: 'Applications Rejected',
    value: '8',
    change: '+3',
    trend: 'up' as const,
    icon: XCircle,
    color: 'orange' as const,
    description: 'Learning opportunities'
  }
]

const colorClasses = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200',
  green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 border-orange-200',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200'
}

const cardGradients = {
  blue: 'hover:shadow-blue-100',
  green: 'hover:shadow-green-100',
  orange: 'hover:shadow-orange-100',
  purple: 'hover:shadow-purple-100'
}

export function JobSearchStats() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className={`group relative rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-200 cursor-pointer ${cardGradients[stat.color]}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`rounded-xl p-3 border ${colorClasses[stat.color]}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
          
          {/* Value */}
          <div className="mb-3">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-gray-600">{stat.title}</div>
          </div>

          {/* Change Indicator */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${
              stat.trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {stat.trend === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {stat.change}
            </div>
            <span className="text-xs text-gray-500 font-medium">{stat.description}</span>
          </div>

          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 overflow-hidden rounded-2xl">
            <stat.icon className="w-full h-full transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
        </div>
      ))}
    </div>
  )
}