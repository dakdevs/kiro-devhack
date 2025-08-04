'use client'

import { Fragment } from 'react'
import { X } from 'lucide-react'
import { SidebarLink } from './sidebar-link'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: 'Home' as const },
  { name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' as const },
  { name: 'Users', href: '/dashboard/users', icon: 'Users' as const },
  { name: 'Reports', href: '/dashboard/reports', icon: 'FileText' as const },
  { name: 'Calendar', href: '/dashboard/calendar', icon: 'Calendar' as const },
  { name: 'Messages', href: '/dashboard/messages', icon: 'MessageSquare' as const },
  { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' as const },
  { name: 'Help', href: '/dashboard/help', icon: 'HelpCircle' as const },
]

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-gray-900">Dashboard</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <div key={item.name} onClick={onClose}>
              <SidebarLink {...item} />
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}