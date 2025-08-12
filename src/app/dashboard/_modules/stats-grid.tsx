import { StatsCard } from './stats-card'

const stats = [
  {
    title: 'Total Users',
    value: '2,543',
    change: '+12%',
    trend: 'up' as const,
    icon: 'Users' as const,
    color: 'blue' as const
  },
  {
    title: 'Revenue',
    value: '$45,231',
    change: '+8%',
    trend: 'up' as const,
    icon: 'DollarSign' as const,
    color: 'green' as const
  },
  {
    title: 'Orders',
    value: '1,234',
    change: '-3%',
    trend: 'down' as const,
    icon: 'ShoppingCart' as const,
    color: 'orange' as const
  },
  {
    title: 'Active Sessions',
    value: '573',
    change: '+18%',
    trend: 'up' as const,
    icon: 'Activity' as const,
    color: 'purple' as const
  }
]

export function StatsGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}