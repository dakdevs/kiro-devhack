'use client'

import { useState } from 'react'
import { Menu, X, Bell, Search, User } from 'lucide-react'
import { MobileMenu } from './mobile-menu'
import { UserMenu } from './user-menu'

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

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
            
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