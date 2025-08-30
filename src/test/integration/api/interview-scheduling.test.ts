import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '~/app/api/interviews/route';
import { POST as ScheduleInterview } from '~/app/api/interviews/schedule/route';
import { PUT as ConfirmInterview } from '~/app/api/interviews/[id]/confirm/route';
import { GET as GetInterview, DELETE } from '~/app/api/interviews/[id]/route';
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

// Mock the interview scheduling service
vi.mock('~/services/interview-scheduling', () => ({
  InterviewSchedulingService: vi.fn().mockImplementation(() => ({
    scheduleInterview: vi.fn().mockResolvedValue({
      success: true,
      interview: {
        id: 'test-interview-id',
        jobPostingId: 'test-job-id',
        candidateId: 'test-candidate-id',
        recruiterId: 'test-recruiter-id',
        scheduledStart: new Date('2024-12-01T10:00:00Z'),
        scheduledEnd: new Date('2024-12-01T11:00:00Z'),
        status: 'scheduled',
        interviewType: 'video',
        candidateConfirmed: false,
        recruiterConfirmed: false
      }
    }),
    findMutualAvailability: vi.fn().mockResolvedValue([
      {
        start: new Date('2024-12-01T10:00:00Z'),
        end: new Date('2024-12-01T11:00:00Z'),
        timezone: 'America/New_York'
      }
    ])
  }))
}));

// Mock the notification service
vi.mock('~/services/notification', () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    sendInterviewScheduledNotification: vi.fn().mockResolvedValue(true),
    sendInterviewConfirmedNotification: vi.fn().mockResolvedValue(true),
    sendInterviewCancelledNotification: vi.fn().mockResolvedValue(true)
  }))
}));

describe('Interview Scheduling API Integration Tests', () => {
  const mockInterview = {
    id: 'test-interview-id',
    jobPostingId: 'test-job-id',
    candidateId: 'test-candidate-id',
    recruiterId: 'test-recruiter-id',
    scheduledStart: new Date('2024-12-01T10:00:00Z'),
    scheduledEnd: new Date('2024-12-01T11:00:00Z'),
    timezone: 'America/New_York',
    status: 'scheduled',
    interviewType: 'video',
    meetingLink: 'https://meet.example.com/test-room',
    notes: 'Technical interview',
    candidateConfirmed: false,
    recruiterConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockJobPosting = {
    id: 'test-job-id',
    recruiterId: 'test-recruiter-id',
    title: 'Senior Software Engineer'
  };

  const mockRecruiterProfile = {
    id: 'test-recruiter-id',
    userId: 'test-user-id'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/interviews', () => {
    it('should return interviews for authenticated user', async () => {
      // Mock interviews lookup
      const mockInterviewsResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([mockInterview])
      };

      (db.select as any).mockReturnValue(mockInterviewsResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toEqual(mockInterview);
    });

    it('should filter interviews by status', async () => {
      const scheduledInterview = { ...mockInterview, status: 'scheduled' };
      const confirmedInterview = { ...mockInterview, id: 'confirmed-id', status: 'confirmed' };

      // Mock interviews lookup with status filter
      const mockInterviewsResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([scheduledInterview])
      };

      (db.select as any).mockReturnValue(mockInterviewsResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews?status=scheduled');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('scheduled');
    });

    it('should return empty array when no interviews exist', async () => {
      // Mock empty interviews lookup
      const mockInterviewsResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockInterviewsResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });

  describe('POST /api/interviews/schedule', () => {
    const validScheduleData = {
      jobPostingId: 'test-job-id',
      candidateId: 'test-candidate-id',
      preferredTimes: [
        {
          start: '2024-12-01T10:00:00Z',
          end: '2024-12-01T11:00:00Z',
          timezone: 'America/New_York'
        }
      ],
      interviewType: 'video',
      duration: 60,
      notes: 'Technical interview'
    };

    it('should schedule interview with mutual availability', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify(validScheduleData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ScheduleInterview(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.interview).toBeDefined();
      expect(data.data.interview.jobPostingId).toBe(validScheduleData.jobPostingId);
      expect(data.data.interview.candidateId).toBe(validScheduleData.candidateId);
    });

    it('should return suggested times when no mutual availability', async () => {
      // Mock scheduling service to return no mutual availability
      const { InterviewSchedulingService } = await import('~/services/interview-scheduling');
      const mockSchedulingService = new InterviewSchedulingService();
      (mockSchedulingService.scheduleInterview as any).mockResolvedValue({
        success: false,
        suggestedTimes: [
          {
            start: new Date('2024-12-02T10:00:00Z'),
            end: new Date('2024-12-02T11:00:00Z'),
            timezone: 'America/New_York'
          }
        ],
        conflicts: [
          {
            type: 'existing_interview',
            conflictingSlot: {
              start: new Date('2024-12-01T10:00:00Z'),
              end: new Date('2024-12-01T11:00:00Z')
            },
            description: 'Candidate has existing interview'
          }
        ]
      });

      // Mock recruiter and job lookups
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify(validScheduleData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ScheduleInterview(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.suggestedTimes).toHaveLength(1);
      expect(data.conflicts).toHaveLength(1);
    });

    it('should return 400 with invalid schedule data', async () => {
      const invalidData = {
        jobPostingId: '', // Empty required field
        candidateId: 'test-candidate-id',
        preferredTimes: []
      };

      const request = new NextRequest('http://localhost:3000/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ScheduleInterview(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('should return 404 when job posting not found', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock empty job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify(validScheduleData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ScheduleInterview(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Job posting not found');
    });
  });

  describe('PUT /api/interviews/[id]/confirm', () => {
    const confirmData = {
      confirmed: true,
      notes: 'Looking forward to the interview'
    };

    it('should confirm interview', async () => {
      const confirmedInterview = { ...mockInterview, candidateConfirmed: true, status: 'confirmed' };

      // Mock interview update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([confirmedInterview])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/test-interview-id/confirm', {
        method: 'PUT',
        body: JSON.stringify(confirmData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ConfirmInterview(request, { params: { id: 'test-interview-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidateConfirmed).toBe(true);
      expect(data.data.status).toBe('confirmed');
    });

    it('should decline interview', async () => {
      const declineData = {
        confirmed: false,
        notes: 'Schedule conflict'
      };

      const declinedInterview = { ...mockInterview, status: 'cancelled' };

      // Mock interview update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([declinedInterview])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/test-interview-id/confirm', {
        method: 'PUT',
        body: JSON.stringify(declineData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ConfirmInterview(request, { params: { id: 'test-interview-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('cancelled');
    });

    it('should return 404 when interview not found', async () => {
      // Mock empty update response
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/nonexistent-id/confirm', {
        method: 'PUT',
        body: JSON.stringify(confirmData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ConfirmInterview(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Interview not found');
    });
  });

  describe('GET /api/interviews/[id]', () => {
    it('should return specific interview', async () => {
      // Mock interview lookup
      const mockInterviewResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockInterview])
      };

      (db.select as any).mockReturnValue(mockInterviewResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/test-interview-id');
      const response = await GetInterview(request, { params: { id: 'test-interview-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockInterview);
    });

    it('should return 404 when interview not found', async () => {
      // Mock empty interview lookup
      const mockInterviewResponse = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockInterviewResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/nonexistent-id');
      const response = await GetInterview(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Interview not found');
    });
  });

  describe('DELETE /api/interviews/[id]', () => {
    it('should cancel interview', async () => {
      // Mock interview deletion/cancellation
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...mockInterview, status: 'cancelled' }])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/test-interview-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'test-interview-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Interview cancelled successfully');
    });

    it('should return 404 when interview not found for cancellation', async () => {
      // Mock empty update response
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/interviews/nonexistent-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Interview not found');
    });
  });
});