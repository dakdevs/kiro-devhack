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
  Target
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
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon
        className={cn(
          'mr-3 h-5 w-5 flex-shrink-0',
          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
        )}
      />
      {name}
    </Link>
  )
}