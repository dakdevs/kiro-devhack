"use client"

import { useState, useEffect } from 'react';
import { InterviewNotification, NotificationType } from '~/types/interview-management';

interface NotificationListProps {
  className?: string;
}

export function NotificationList({ className = '' }: NotificationListProps) {
  const [notifications, setNotifications] = useState<InterviewNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(typeFilter !== 'all' && { types: typeFilter })
      });

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (reset || pageNum === 1) {
        setNotifications(data.data || []);
      } else {
        setNotifications(prev => [...prev, ...(data.data || [])]);
      }
      
      setHasMore(data.pagination?.hasNext || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications(1, true);
    setPage(1);
  }, [filter, typeFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, false);
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_scheduled':
        return (
          <div className="w-8 h-8 bg-apple-blue/10 text-apple-blue rounded-full flex items-center justify-center">
            📅
          </div>
        );
      case 'interview_confirmed':
        return (
          <div className="w-8 h-8 bg-apple-green/10 text-apple-green rounded-full flex items-center justify-center">
            ✅
          </div>
        );
      case 'interview_cancelled':
        return (
          <div className="w-8 h-8 bg-apple-red/10 text-apple-red rounded-full flex items-center justify-center">
            ❌
          </div>
        );
      case 'interview_rescheduled':
        return (
          <div className="w-8 h-8 bg-apple-orange/10 text-apple-orange rounded-full flex items-center justify-center">
            🔄
          </div>
        );
      case 'availability_updated':
        return (
          <div className="w-8 h-8 bg-apple-purple/10 text-apple-purple rounded-full flex items-center justify-center">
            ⏰
          </div>
        );
      case 'job_posted':
        return (
          <div className="w-8 h-8 bg-apple-blue/10 text-apple-blue rounded-full flex items-center justify-center">
            💼
          </div>
        );
      case 'candidate_matched':
      case 'application_received':
        return (
          <div className="w-8 h-8 bg-apple-green/10 text-apple-green rounded-full flex items-center justify-center">
            👤
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center">
            🔔
          </div>
        );
    }
  };

  const getTypeDisplayName = (type: NotificationType) => {
    switch (type) {
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'interview_confirmed': return 'Interview Confirmed';
      case 'interview_cancelled': return 'Interview Cancelled';
      case 'interview_rescheduled': return 'Interview Rescheduled';
      case 'availability_updated': return 'Availability Updated';
      case 'job_posted': return 'Job Posted';
      case 'candidate_matched': return 'Candidate Matched';
      case 'application_received': return 'Application Received';
      default: return type;
    }
  };

  const notificationTypes: NotificationType[] = [
    'interview_scheduled',
    'interview_confirmed',
    'interview_cancelled',
    'interview_rescheduled',
    'availability_updated',
    'job_posted',
    'candidate_matched',
    'application_received'
  ];

  if (error) {
    return (
      <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <div className="text-apple-red text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
            Failed to Load Notifications
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchNotifications(1, true)}
            className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Notifications
          </h2>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-apple-blue hover:text-blue-600 transition-colors duration-150"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Read/Unread Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors duration-150 ${
                filter === 'all'
                  ? 'bg-apple-blue text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 hover:dark:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors duration-150 ${
                filter === 'unread'
                  ? 'bg-apple-blue text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 hover:dark:bg-gray-700'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-apple-blue"
          >
            <option value="all">All Types</option>
            {notificationTypes.map(type => (
              <option key={type} value={type}>
                {getTypeDisplayName(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread' ? 'No unread notifications' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 hover:dark:bg-gray-900 transition-colors duration-150 ${
                  !notification.read ? 'bg-apple-blue/5 dark:bg-apple-blue/10' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  {getNotificationIcon(notification.type)}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-base font-medium ${
                        !notification.read 
                          ? 'text-black dark:text-white' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(new Date(notification.createdAt))}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-apple-blue rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead([notification.id])}
                        className="text-xs text-apple-blue hover:text-blue-600 transition-colors duration-150 mt-2"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && notifications.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full px-4 py-2 text-sm text-apple-blue hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {loading ? 'Loading...' : 'Load more notifications'}
          </button>
        </div>
      )}
    </div>
  );
}