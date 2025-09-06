'use client'

import { useEffect, useState } from 'react'
import { SidebarLink } from './sidebar-link'

const navigation = [
  { name: 'Job Matches', href: '/dashboard', icon: 'Home' },
  { name: 'Job Applications', href: '/dashboard/applications', icon: 'Briefcase' },
  { name: 'Interview Availability', href: '/dashboard/availability', icon: 'Clock' },
  { name: 'Interview Management', href: '/dashboard/interview-management', icon: 'Calendar' },
  { name: 'Interviews', href: '/dashboard/interviews', icon: 'Calendar' },
  { name: 'My Profile', href: '/dashboard/profile', icon: 'User' },
  { name: 'Resume Builder', href: '/dashboard/resume', icon: 'FileText' },
]

const secondaryNavigation = [
  { name: 'Interview Prep', href: '/dashboard/prep', icon: 'BookOpen' },
  { name: 'Career Goals', href: '/dashboard/goals', icon: 'Target' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
  { name: 'Help & Support', href: '/dashboard/help', icon: 'HelpCircle' },
]

const devNavigation = [
  { name: 'Test Suite', href: '/test-suite', icon: 'TestTube' },
  { name: 'API Health', href: '/api/health-check', icon: 'Activity' },
]

function DevNavigation() {
  const [isDevelopment, setIsDevelopment] = useState(false)

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development')
  }, [])

  if (!isDevelopment) return null

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Development
        </div>
        {devNavigation.map((item) => (
          <SidebarLink key={item.name} {...item} />
        ))}
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="hidden w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 md:block">
      <nav className="flex h-full flex-col">
        <div className="flex-1 space-y-1 px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => (
              <SidebarLink key={item.name} {...item} />
            ))}
          </div>
          
          <div className="pt-8">
            <div className="space-y-1">
              {secondaryNavigation.map((item) => (
                <SidebarLink key={item.name} {...item} />
              ))}
            </div>
          </div>
          
          <DevNavigation />
        </div>
      </nav>
    </aside>
  )
}