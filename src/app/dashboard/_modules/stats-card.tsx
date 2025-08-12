import { TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Activity, MoreHorizontal } from 'lucide-react'
import { cn } from '~/lib/utils'

const iconMap = {
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
}

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: keyof typeof iconMap
  color: 'blue' | 'green' | 'orange' | 'purple'
}

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

export function StatsCard({ title, value, change, trend, icon, color }: StatsCardProps) {
  const Icon = iconMap[icon]
  return (
    <div className={cn(
      'group relative rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-200 cursor-pointer',
      cardGradients[color]
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn('rounded-xl p-3 border', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-lg transition-all">
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      
      {/* Value */}
      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold',
          trend === 'up' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        )}>
          {trend === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {change}
        </div>
        <span className="text-xs text-gray-500 font-medium">vs last month</span>
      </div>

      {/* Subtle background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 overflow-hidden rounded-2xl">
        <Icon className="w-full h-full transform rotate-12 translate-x-8 -translate-y-8" />
      </div>
    </div>
  )
}