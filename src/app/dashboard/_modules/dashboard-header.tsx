'use client'

import { useState } from 'react'
import { Menu, X, Search, User } from 'lucide-react'
import Link from 'next/link'
import { MobileMenu } from './mobile-menu'
import { UserMenu } from './user-menu'
import { NotificationBell } from '~/components/notification-bell'

interface DashboardHeaderProps {
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="hidden font-semibold text-gray-900 sm:block">
                Dashboard
              </span>
            </div>
          </div>

          {/* Center - Search (hidden on mobile) */}
          <div className="hidden flex-1 max-w-md mx-8 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right side - For Recruiters, Notifications and user menu */}
          <div className="flex items-center gap-2">
            {/* Desktop For Recruiters Button */}
            <Link
              href="/recruiter"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-apple-blue hover:bg-blue-600 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
              </svg>
              For Recruiters
            </Link>

            {/* Mobile For Recruiters Button */}
            <Link
              href="/recruiter"
              className="sm:hidden p-2 text-white bg-apple-blue hover:bg-blue-600 rounded-lg transition-colors duration-150"
              title="For Recruiters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
              </svg>
            </Link>
            
            <NotificationBell />
            
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  )
}