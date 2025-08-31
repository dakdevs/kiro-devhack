import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationBell } from '../notification-bell';
import { InterviewNotification } from '~/types/interview-management';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock notifications data
const mockNotifications: InterviewNotification[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: 'Your interview with John Doe has been scheduled for tomorrow at 2 PM',
    data: { interviewId: 'interview1' },
    read: false,
    createdAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    userId: 'user1',
    type: 'interview_confirmed',
    title: 'Interview Confirmed',
    message: 'John Doe has confirmed the interview',
    data: { interviewId: 'interview1' },
    read: true,
    createdAt: new Date('2024-01-14T15:30:00Z'),
  },
  {
    id: '3',
    userId: 'user1',
    type: 'candidate_matched',
    title: 'New Candidate Match',
    message: 'A new candidate matches your job posting',
    data: { jobId: 'job1' },
    read: false,
    createdAt: new Date('2024-01-13T09:15:00Z'),
  },
];

const renderNotificationBell = (props = {}) => {
  const defaultProps = {
    className: '',
    ...props,
  };
  return render(<NotificationBell {...defaultProps} />);
};

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses by default
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/notifications/unread-count')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { count: 2 } }),
        });
      }
      
      if (url.includes('/api/notifications?limit=10')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockNotifications }),
        });
      }
      
      if (url.includes('/api/notifications/mark-read')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders notification bell button', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        expect(button).toBeInTheDocument();
      });
    });

    it('displays unread count badge when there are unread notifications', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('does not display badge when there are no unread notifications', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/notifications/unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { count: 0 } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderNotificationBell();
      
      await waitFor(() => {
        expect(screen.queryByText('0')).not.toBeInTheDocument();
      });
    });

    it('shows 99+ for counts over 99', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/notifications/unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { count: 150 } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderNotificationBell();
      
      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      renderNotificationBell({ className: 'custom-class' });
      
      const container = screen.getByLabelText(/Notifications/).closest('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Dropdown Interactions', () => {
    it('opens dropdown when bell is clicked', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('closes dropdown when bell is clicked again', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      const button = screen.getByLabelText(/Notifications/);
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when backdrop is clicked', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Click backdrop (the fixed overlay)
      const backdrop = document.querySelector('.fixed.inset-0.z-40');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
      });
    });

    it('fetches notifications when dropdown is opened', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notifications?limit=10');
      });
    });
  });

  describe('Notification Display', () => {
    it('displays notifications in dropdown', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
        expect(screen.getByText('Interview Confirmed')).toBeInTheDocument();
        expect(screen.getByText('New Candidate Match')).toBeInTheDocument();
      });
    });

    it('shows correct icons for different notification types', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        // Check for emoji icons (this is a simplified check)
        expect(screen.getByText('📅')).toBeInTheDocument(); // interview_scheduled
        expect(screen.getByText('👤')).toBeInTheDocument(); // candidate_matched
      });
    });

    it('shows unread indicator for unread notifications', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        // Unread notifications should have a blue dot indicator
        const unreadIndicators = document.querySelectorAll('.bg-apple-blue.rounded-full');
        expect(unreadIndicators.length).toBeGreaterThan(0);
      });
    });

    it('formats time ago correctly', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        // Should show relative time like "1d ago", "2d ago", etc.
        expect(screen.getByText(/\d+[dhm] ago/)).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching notifications', async () => {
      // Make fetch take longer
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/notifications?limit=10')) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ data: mockNotifications }),
              });
            }, 100);
          });
        }
        if (url.includes('/api/notifications/unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { count: 2 } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
      });
    });

    it('shows empty state when no notifications', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/notifications/unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { count: 0 } }),
          });
        }
        if (url.includes('/api/notifications?limit=10')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });
  });

  describe('Mark as Read Functionality', () => {
    it('shows mark all read button when there are unread notifications', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument();
      });
    });

    it('marks all notifications as read when button is clicked', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const markAllReadButton = screen.getByText('Mark all read');
        fireEvent.click(markAllReadButton);
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notifications/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationIds: ['1', '3'] }), // Only unread ones
        });
      });
    });

    it('marks individual notification as read when clicked', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const notification = screen.getByText('Interview Scheduled');
        fireEvent.click(notification);
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notifications/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationIds: ['1'] }),
        });
      });
    });

    it('does not mark already read notifications', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const notification = screen.getByText('Interview Confirmed');
        fireEvent.click(notification);
      });
      
      // Should not call mark-read API for already read notification
      expect(mockFetch).not.toHaveBeenCalledWith('/api/notifications/mark-read', expect.any(Object));
    });
  });

  describe('Auto-refresh', () => {
    it('refreshes unread count every 30 seconds', async () => {
      vi.useFakeTimers();
      
      renderNotificationBell();
      
      // Initial call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notifications/unread-count');
      });
      
      // Clear the mock to count new calls
      mockFetch.mockClear();
      
      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notifications/unread-count');
      });
      
      vi.useRealTimers();
    });

    it('cleans up interval on unmount', () => {
      vi.useFakeTimers();
      
      const { unmount } = renderNotificationBell();
      
      // Unmount component
      unmount();
      
      // Clear the mock
      mockFetch.mockClear();
      
      // Fast-forward time
      vi.advanceTimersByTime(30000);
      
      // Should not make any calls after unmount
      expect(mockFetch).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFetch.mockRejectedValue(new Error('API Error'));
      
      renderNotificationBell();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch unread count:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles mark as read errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Setup successful initial calls
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/notifications/unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { count: 2 } }),
          });
        }
        if (url.includes('/api/notifications?limit=10')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockNotifications }),
          });
        }
        if (url.includes('/api/notifications/mark-read')) {
          return Promise.reject(new Error('Mark read failed'));
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const notification = screen.getByText('Interview Scheduled');
        fireEvent.click(notification);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to mark notifications as read:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label with unread count', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText('Notifications (2 unread)');
        expect(button).toBeInTheDocument();
      });
    });

    it('has proper ARIA label without unread count', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/notifications/unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { count: 0 } }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText('Notifications');
        expect(button).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('has proper focus management in dropdown', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const markAllReadButton = screen.getByText('Mark all read');
        markAllReadButton.focus();
        expect(markAllReadButton).toHaveFocus();
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive positioning classes', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const dropdown = screen.getByText('Notifications').closest('.absolute');
        expect(dropdown).toHaveClass('right-0', 'top-full');
      });
    });

    it('has proper mobile-friendly sizing', async () => {
      renderNotificationBell();
      
      await waitFor(() => {
        const button = screen.getByLabelText(/Notifications/);
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        const dropdown = screen.getByText('Notifications').closest('.w-80');
        expect(dropdown).toBeInTheDocument();
      });
    });
  });
});