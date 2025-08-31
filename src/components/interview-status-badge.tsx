"use client"

import { InterviewStatus } from '~/types/interview-management';

interface InterviewStatusBadgeProps {
  status: InterviewStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function InterviewStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = false 
}: InterviewStatusBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-2 text-sm';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  const getStatusConfig = (status: InterviewStatus) => {
    switch (status) {
      case 'scheduled':
        return {
          classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: '📅',
          label: 'Scheduled'
        };
      case 'confirmed':
        return {
          classes: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: '✅',
          label: 'Confirmed'
        };
      case 'completed':
        return {
          classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: '✓',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          classes: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: '❌',
          label: 'Cancelled'
        };
      case 'rescheduled':
        return {
          classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
          icon: '🔄',
          label: 'Rescheduled'
        };
      case 'no-show':
        return {
          classes: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
          icon: '👻',
          label: 'No Show'
        };
      default:
        return {
          classes: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
          icon: '❓',
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const config = getStatusConfig(status);
  const baseClasses = "font-medium rounded-full inline-flex items-center gap-1";
  const sizeClasses = getSizeClasses();

  return (
    <span className={`${baseClasses} ${sizeClasses} ${config.classes}`}>
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}