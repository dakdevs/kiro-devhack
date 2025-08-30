import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '~/app/api/availability/route';
import { GET as GetAvailabilityById, PUT, DELETE } from '~/app/api/availability/[id]/route';
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

describe('Availability API Integration Tests', () => {
  const mockAvailability = {
    id: 'test-availability-id',
    userId: 'test-user-id',
    startTime: new Date('2024-12-01T10:00:00Z'),
    endTime: new Date('2024-12-01T12:00:00Z'),
    timezone: 'America/New_York',
    isRecurring: false,
    recurrencePattern: null,
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockInterviewSession = {
    id: 'test-interview-id',
    candidateId: 'test-user-id',
    scheduledStart: new Date('2024-12-01T10:30:00Z'),
    scheduledEnd: new Date('2024-12-01T11:30:00Z'),
    status: 'scheduled'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/availability', () => {
    it('should return user availability and upcoming interviews', async () => {
      // Mock availability lookup
      const mockAvailabilityResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([mockAvailability])
      };

      // Mock interviews lookup
      const mockInterviewsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([mockInterviewSession])
      };

      (db.select as any)
        .mockReturnValueOnce(mockAvailabilityResponse)
        .mockReturnValueOnce(mockInterviewsResponse);

      const request = new NextRequest('http://localhost:3000/api/availability');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.availability).toHaveLength(1);
      expect(data.data.upcomingInterviews).toHaveLength(1);
      expect(data.data.availability[0]).toEqual(mockAvailability);
    });

    it('should return empty arrays when no availability or interviews exist', async () => {
      // Mock empty responses
      const mockEmptyResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([])
      };

      (db.select as any)
        .mockReturnValueOnce(mockEmptyResponse)
        .mockReturnValueOnce(mockEmptyResponse);

      const request = new NextRequest('http://localhost:3000/api/availability');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.availability).toHaveLength(0);
      expect(data.data.upcomingInterviews).toHaveLength(0);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Mock auth to return no session
      const { auth } = await import('~/lib/auth');
      (auth.api as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(null)
      });

      const request = new NextRequest('http://localhost:3000/api/availability');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/availability', () => {
    const validAvailabilityData = {
      startTime: '2024-12-01T10:00:00Z',
      endTime: '2024-12-01T12:00:00Z',
      timezone: 'America/New_York',
      isRecurring: false
    };

    it('should create availability slot with valid data', async () => {
      // Mock availability insertion
      const mockInsertResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAvailability])
      };

      (db.insert as any).mockReturnValue(mockInsertResponse);

      const request = new NextRequest('http://localhost:3000/api/availability', {
        method: 'POST',
        body: JSON.stringify(validAvailabilityData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockAvailability);
    });

    it('should return 400 with invalid time range', async () => {
      const invalidData = {
        startTime: '2024-12-01T12:00:00Z',
        endTime: '2024-12-01T10:00:00Z', // End before start
        timezone: 'America/New_York'
      };

      const request = new NextRequest('http://localhost:3000/api/availability', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('End time must be after start time');
    });

    it('should return 400 with past start time', async () => {
      const pastData = {
        startTime: '2020-01-01T10:00:00Z', // Past date
        endTime: '2020-01-01T12:00:00Z',
        timezone: 'America/New_York'
      };

      const request = new NextRequest('http://localhost:3000/api/availability', {
        method: 'POST',
        body: JSON.stringify(pastData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Start time must be in the future');
    });

    it('should create recurring availability', async () => {
      const recurringData = {
        ...validAvailabilityData,
        isRecurring: true,
        recurrencePattern: {
          type: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
          endDate: '2024-12-31T23:59:59Z'
        }
      };

      const recurringAvailability = {
        ...mockAvailability,
        isRecurring: true,
        recurrencePattern: recurringData.recurrencePattern
      };

      // Mock availability insertion
      const mockInsertResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([recurringAvailability])
      };

      (db.insert as any).mockReturnValue(mockInsertResponse);

      const request = new NextRequest('http://localhost:3000/api/availability', {
        method: 'POST',
        body: JSON.stringify(recurringData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.isRecurring).toBe(true);
      expect(data.data.recurrencePattern).toEqual(recurringData.recurrencePattern);
    });
  });

  describe('PUT /api/availability/[id]', () => {
    const updateData = {
      startTime: '2024-12-01T14:00:00Z',
      endTime: '2024-12-01T16:00:00Z'
    };

    it('should update availability slot', async () => {
      const updatedAvailability = { ...mockAvailability, ...updateData };

      // Mock availability update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedAvailability])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/availability/test-availability-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { params: { id: 'test-availability-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.startTime).toBe(updateData.startTime);
      expect(data.data.endTime).toBe(updateData.endTime);
    });

    it('should return 404 when availability not found', async () => {
      // Mock empty update response
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/availability/nonexistent-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Availability slot not found');
    });
  });

  describe('DELETE /api/availability/[id]', () => {
    it('should delete availability slot when no conflicts exist', async () => {
      // Mock conflict check - no conflicts
      const mockConflictResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      // Mock availability deletion
      const mockDeleteResponse = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAvailability])
      };

      (db.select as any).mockReturnValue(mockConflictResponse);
      (db.delete as any).mockReturnValue(mockDeleteResponse);

      const request = new NextRequest('http://localhost:3000/api/availability/test-availability-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'test-availability-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Availability slot deleted successfully');
    });

    it('should return 409 when conflicts exist', async () => {
      // Mock conflict check - conflicts found
      const mockConflictResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockInterviewSession])
      };

      (db.select as any).mockReturnValue(mockConflictResponse);

      const request = new NextRequest('http://localhost:3000/api/availability/test-availability-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'test-availability-id' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot delete availability slot with scheduled interviews');
      expect(data.conflictingInterviews).toHaveLength(1);
    });

    it('should return 404 when availability not found for deletion', async () => {
      // Mock no conflicts
      const mockConflictResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      // Mock empty deletion response
      const mockDeleteResponse = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockConflictResponse);
      (db.delete as any).mockReturnValue(mockDeleteResponse);

      const request = new NextRequest('http://localhost:3000/api/availability/nonexistent-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Availability slot not found');
    });
  });
});