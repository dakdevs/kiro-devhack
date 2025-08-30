import { SidebarLink } from './sidebar-link'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
  { name: 'Job Applications', href: '/dashboard/applications', icon: 'Briefcase' },
  { name: 'Interview Availability', href: '/dashboard/availability', icon: 'Clock' },
  { name: 'Interview Management', href: '/dashboard/interview-management', icon: 'Calendar' },
  { name: 'Interviews', href: '/dashboard/interviews', icon: 'Calendar' },
  { name: 'Browse Jobs', href: '/dashboard/jobs', icon: 'Search' },
  { name: 'My Profile', href: '/dashboard/profile', icon: 'User' },
  { name: 'Resume Builder', href: '/dashboard/resume', icon: 'FileText' },
]

const secondaryNavigation = [
  { name: 'Interview Prep', href: '/dashboard/prep', icon: 'BookOpen' },
  { name: 'Career Goals', href: '/dashboard/goals', icon: 'Target' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
  { name: 'Help & Support', href: '/dashboard/help', icon: 'HelpCircle' },
]

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
        </div>
      </nav>
    </aside>
  )
}