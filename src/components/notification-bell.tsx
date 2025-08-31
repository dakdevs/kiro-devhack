"use client"

import { useState, useEffect } from 'react';
import { InterviewNotification } from '~/types/interview-management';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InterviewNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch recent notifications
  const fetchNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        // Refresh unread count
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: InterviewNotification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    // TODO: Navigate to relevant page based on notification type
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_scheduled':
      case 'interview_confirmed':
        return '📅';
      case 'interview_cancelled':
        return '❌';
      case 'interview_rescheduled':
        return '🔄';
      case 'availability_updated':
        return '⏰';
      case 'job_posted':
        return '💼';
      case 'candidate_matched':
      case 'application_received':
        return '👤';
      default:
        return '🔔';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150 ease-out rounded-lg hover:bg-gray-50 hover:dark:bg-gray-900 outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-apple-red text-white text-xs font-semibold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      const unreadIds = notifications
                        .filter(n => !n.read)
                        .map(n => n.id);
                      if (unreadIds.length > 0) {
                        markAsRead(unreadIds);
                      }
                    }}
                    className="text-sm text-apple-blue hover:text-blue-600 transition-colors duration-150"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 hover:dark:bg-gray-900 transition-colors duration-150 ${
                        !notification.read ? 'bg-apple-blue/5 dark:bg-apple-blue/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="text-lg flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.read 
                                ? 'text-black dark:text-white' 
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-apple-blue rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatTimeAgo(new Date(notification.createdAt))}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to full notifications page
                  }}
                  className="w-full text-center text-sm text-apple-blue hover:text-blue-600 transition-colors duration-150"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}