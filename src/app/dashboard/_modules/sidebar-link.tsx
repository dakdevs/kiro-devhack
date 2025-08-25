'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  FileText, 
  Calendar,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Search,
  User,
  BookOpen,
  Target,
  Clock
} from 'lucide-react'
import { cn } from '~/lib/utils'

const iconMap = {
  Home,
  Users,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Search,
  User,
  BookOpen,
  Target,
  Clock,
}

interface SidebarLinkProps {
  name: string
  href: string
  icon: keyof typeof iconMap
}

export function SidebarLink({ name, href, icon }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  const Icon = iconMap[icon]

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      )}
    >
      <Icon
        className={cn(
          'mr-3 h-5 w-5 flex-shrink-0',
          isActive ? 'text-apple-blue' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
        )}
      />
      {name}
    </Link>
  )
}