import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '~/app/api/notifications/route';
import { POST as MarkAsRead } from '~/app/api/notifications/mark-read/route';
import { GET as GetUnreadCount } from '~/app/api/notifications/unread-count/route';
import { GET as GetPreferences, PUT as UpdatePreferences } from '~/app/api/notifications/preferences/route';
import { db } from '~/db';

// Mock the auth module
vi.mock('~/lib/auth', () => ({
  auth: {
    api: vi.fn().mockReturnValue({
      getSession: vi.fn().mockResolvedValue({
        user: { id: 'test-user-id' }
      })
    })
  }
}));

// Mock the database
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock the notification service
vi.mock('~/services/notification', () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    createNotification: vi.fn().mockResolvedValue({
      id: 'test-notification-id',
      userId: 'test-user-id',
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: 'Your interview has been scheduled',
      data: { interviewId: 'test-interview-id' },
      read: false,
      sentAt: null,
      createdAt: new Date()
    }),
    sendEmailNotification: vi.fn().mockResolvedValue(true),
    getUserPreferences: vi.fn().mockResolvedValue({
      userId: 'test-user-id',
      emailNotifications: true,
      interviewReminders: true,
      jobMatchAlerts: true,
      systemUpdates: false
    }),
    updateUserPreferences: vi.fn().mockResolvedValue({
      userId: 'test-user-id',
      emailNotifications: false,
      interviewReminders: true,
      jobMatchAlerts: true,
      systemUpdates: false
    })
  }))
}));

describe('Notifications API Integration Tests', () => {
  const mockNotification = {
    id: 'test-notification-id',
    userId: 'test-user-id',
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: 'Your interview with Test Company has been scheduled for December 1st at 10:00 AM',
    data: {
      interviewId: 'test-interview-id',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Test Company',
      scheduledTime: '2024-12-01T10:00:00Z'
    },
    read: false,
    sentAt: null,
    createdAt: new Date('2024-11-01T10:00:00Z')
  };

  const mockNotificationPreferences = {
    userId: 'test-user-id',
    emailNotifications: true,
    interviewReminders: true,
    jobMatchAlerts: true,
    systemUpdates: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      // Mock notifications lookup
      const mockNotificationsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([mockNotification])
      };

      // Mock count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      };

      (db.select as any)
        .mockReturnValueOnce(mockNotificationsResponse)
        .mockReturnValueOnce(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notifications).toHaveLength(1);
      expect(data.data.notifications[0]).toEqual(mockNotification);
      expect(data.data.totalCount).toBe(1);
    });

    it('should filter notifications by read status', async () => {
      const unreadNotification = { ...mockNotification, read: false };

      // Mock notifications lookup with filter
      const mockNotificationsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([unreadNotification])
      };

      // Mock count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      };

      (db.select as any)
        .mockReturnValueOnce(mockNotificationsResponse)
        .mockReturnValueOnce(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications?unreadOnly=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notifications).toHaveLength(1);
      expect(data.data.notifications[0].read).toBe(false);
    });

    it('should filter notifications by type', async () => {
      const interviewNotification = { ...mockNotification, type: 'interview_scheduled' };

      // Mock notifications lookup with type filter
      const mockNotificationsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([interviewNotification])
      };

      // Mock count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      };

      (db.select as any)
        .mockReturnValueOnce(mockNotificationsResponse)
        .mockReturnValueOnce(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications?type=interview_scheduled');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notifications).toHaveLength(1);
      expect(data.data.notifications[0].type).toBe('interview_scheduled');
    });

    it('should paginate notifications', async () => {
      // Mock notifications lookup with pagination
      const mockNotificationsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([mockNotification])
      };

      // Mock count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 25 }])
      };

      (db.select as any)
        .mockReturnValueOnce(mockNotificationsResponse)
        .mockReturnValueOnce(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications?page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.totalPages).toBe(3);
    });

    it('should return empty array when no notifications exist', async () => {
      // Mock empty notifications lookup
      const mockNotificationsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([])
      };

      // Mock count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }])
      };

      (db.select as any)
        .mockReturnValueOnce(mockNotificationsResponse)
        .mockReturnValueOnce(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notifications).toHaveLength(0);
      expect(data.data.totalCount).toBe(0);
    });
  });

  describe('POST /api/notifications', () => {
    const validNotificationData = {
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: 'Your interview has been scheduled',
      data: {
        interviewId: 'test-interview-id',
        jobTitle: 'Senior Software Engineer'
      }
    };

    it('should create notification', async () => {
      // Mock notification insertion
      const mockInsertResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockNotification])
      };

      (db.insert as any).mockReturnValue(mockInsertResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(validNotificationData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNotification);
    });

    it('should return 400 with invalid notification data', async () => {
      const invalidData = {
        type: '', // Empty required field
        title: 'Test Title'
      };

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('POST /api/notifications/mark-read', () => {
    it('should mark single notification as read', async () => {
      const readNotification = { ...mockNotification, read: true };

      // Mock notification update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([readNotification])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notificationId: 'test-notification-id' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await MarkAsRead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Notification marked as read');
    });

    it('should mark multiple notifications as read', async () => {
      const notificationIds = ['notification-1', 'notification-2'];

      // Mock bulk update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          { ...mockNotification, id: 'notification-1', read: true },
          { ...mockNotification, id: 'notification-2', read: true }
        ])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notificationIds }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await MarkAsRead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Notifications marked as read');
    });

    it('should mark all notifications as read', async () => {
      // Mock bulk update for all notifications
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          { ...mockNotification, read: true }
        ])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ markAllAsRead: true }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await MarkAsRead(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('All notifications marked as read');
    });

    it('should return 400 when no valid parameters provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await MarkAsRead(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('notificationId, notificationIds, or markAllAsRead');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      // Mock unread count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }])
      };

      (db.select as any).mockReturnValue(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await GetUnreadCount(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.unreadCount).toBe(5);
    });

    it('should return zero when no unread notifications', async () => {
      // Mock zero count query
      const mockCountResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }])
      };

      (db.select as any).mockReturnValue(mockCountResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/unread-count');
      const response = await GetUnreadCount(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.unreadCount).toBe(0);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should return user notification preferences', async () => {
      // Mock preferences lookup
      const mockPreferencesResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockNotificationPreferences])
      };

      (db.select as any).mockReturnValue(mockPreferencesResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences');
      const response = await GetPreferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNotificationPreferences);
    });

    it('should return default preferences when none exist', async () => {
      // Mock empty preferences lookup
      const mockPreferencesResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockPreferencesResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences');
      const response = await GetPreferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.emailNotifications).toBe(true); // Default value
      expect(data.data.interviewReminders).toBe(true); // Default value
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    const updatePreferencesData = {
      emailNotifications: false,
      interviewReminders: true,
      jobMatchAlerts: false,
      systemUpdates: true
    };

    it('should update notification preferences', async () => {
      const updatedPreferences = { ...mockNotificationPreferences, ...updatePreferencesData };

      // Mock preferences update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedPreferences])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(updatePreferencesData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdatePreferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.emailNotifications).toBe(false);
      expect(data.data.systemUpdates).toBe(true);
    });

    it('should create preferences if none exist', async () => {
      // Mock empty update (no existing preferences)
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      // Mock preferences insertion
      const mockInsertResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...mockNotificationPreferences, ...updatePreferencesData }])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);
      (db.insert as any).mockReturnValue(mockInsertResponse);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(updatePreferencesData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdatePreferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.emailNotifications).toBe(false);
    });

    it('should return 400 with invalid preferences data', async () => {
      const invalidData = {
        emailNotifications: 'invalid', // Should be boolean
        interviewReminders: true
      };

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdatePreferences(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });
});