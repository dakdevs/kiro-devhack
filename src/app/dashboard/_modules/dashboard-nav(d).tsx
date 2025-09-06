"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/lib/utils';
import { 
  Calendar, 
  Users, 
  Briefcase, 
  Settings, 
  Home,
  Clock
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Job Matches', href: '/dashboard/job-matches', icon: Briefcase },
  { name: 'Interviews', href: '/dashboard/interviews', icon: Calendar },
  { name: 'Event Types', href: '/dashboard/event-types', icon: Clock },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="text-xl font-semibold text-black dark:text-white no-underline"
          >
            JobMatch
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ease-out',
                    isActive
                      ? 'bg-apple-blue text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors duration-150 ease-out"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}