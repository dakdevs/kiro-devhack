import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '~/app/api/recruiter/jobs/route';
import { GET as GetJobById, PUT, DELETE } from '~/app/api/recruiter/jobs/[id]/route';
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

// Mock the job analysis service
vi.mock('~/services/job-analysis', () => ({
  JobAnalysisService: vi.fn().mockImplementation(() => ({
    analyzeJobPosting: vi.fn().mockResolvedValue({
      requiredSkills: ['JavaScript', 'React', 'Node.js'],
      preferredSkills: ['TypeScript', 'Next.js'],
      experienceLevel: 'mid',
      salaryRange: { min: 80000, max: 120000 },
      confidence: 0.85,
      extractedData: {
        location: 'Remote',
        employmentType: 'full-time'
      }
    })
  }))
}));

describe('Job Posting API Integration Tests', () => {
  const mockJobPosting = {
    id: 'test-job-id',
    recruiterId: 'test-recruiter-id',
    title: 'Senior Software Engineer',
    rawDescription: 'We are looking for a senior software engineer...',
    extractedSkills: ['JavaScript', 'React', 'Node.js'],
    requiredSkills: ['JavaScript', 'React'],
    preferredSkills: ['TypeScript', 'Next.js'],
    experienceLevel: 'senior',
    salaryMin: 80000,
    salaryMax: 120000,
    location: 'Remote',
    remoteAllowed: true,
    employmentType: 'full-time',
    status: 'active',
    aiConfidenceScore: 0.85,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRecruiterProfile = {
    id: 'test-recruiter-id',
    userId: 'test-user-id',
    organizationName: 'Test Company',
    recruitingFor: 'Software Engineers'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/recruiter/jobs', () => {
    it('should return job postings for authenticated recruiter', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };
      
      // Mock job postings lookup
      const mockJobsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([mockJobPosting])
      };

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobsResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toEqual(mockJobPosting);
    });

    it('should return empty array when no jobs exist', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };
      
      // Mock empty job postings lookup
      const mockJobsResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([])
      };

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobsResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it('should return 404 when recruiter profile not found', async () => {
      // Mock empty recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockRecruiterResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recruiter profile not found');
    });
  });

  describe('POST /api/recruiter/jobs', () => {
    const validJobData = {
      title: 'Senior Software Engineer',
      description: 'We are looking for a senior software engineer with experience in React and Node.js...',
      location: 'Remote',
      remoteAllowed: true,
      employmentType: 'full-time',
      salaryMin: 80000,
      salaryMax: 120000
    };

    it('should create job posting with AI analysis', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job insertion
      const mockInsertResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockJobPosting])
      };

      (db.select as any).mockReturnValue(mockRecruiterResponse);
      (db.insert as any).mockReturnValue(mockInsertResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.job).toEqual(mockJobPosting);
      expect(data.data.extractedData).toBeDefined();
      expect(data.data.extractedData.skills).toContain('JavaScript');
    });

    it('should handle AI analysis failure gracefully', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock AI service failure
      const { JobAnalysisService } = await import('~/services/job-analysis');
      const mockAnalysisService = new JobAnalysisService();
      (mockAnalysisService.analyzeJobPosting as any).mockRejectedValue(new Error('AI service unavailable'));

      // Mock job insertion with fallback data
      const jobWithoutAI = { ...mockJobPosting, aiConfidenceScore: null, extractedSkills: [] };
      const mockInsertResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([jobWithoutAI])
      };

      (db.select as any).mockReturnValue(mockRecruiterResponse);
      (db.insert as any).mockReturnValue(mockInsertResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.job.aiConfidenceScore).toBeNull();
    });

    it('should return 400 with invalid job data', async () => {
      const invalidJobData = {
        title: '', // Empty required field
        description: 'Valid description'
      };

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(invalidJobData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('GET /api/recruiter/jobs/[id]', () => {
    it('should return specific job posting', async () => {
      // Mock job lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      (db.select as any).mockReturnValue(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id');
      const response = await GetJobById(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockJobPosting);
    });

    it('should return 404 when job not found', async () => {
      // Mock empty job lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/nonexistent-id');
      const response = await GetJobById(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Job posting not found');
    });
  });

  describe('PUT /api/recruiter/jobs/[id]', () => {
    const updateData = {
      title: 'Updated Job Title',
      salaryMax: 130000
    };

    it('should update job posting', async () => {
      const updatedJob = { ...mockJobPosting, ...updateData };

      // Mock job update
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedJob])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(updateData.title);
      expect(data.data.salaryMax).toBe(updateData.salaryMax);
    });

    it('should return 404 when job not found for update', async () => {
      // Mock empty update response
      const mockUpdateResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      (db.update as any).mockReturnValue(mockUpdateResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/nonexistent-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Job posting not found');
    });
  });

  describe('DELETE /api/recruiter/jobs/[id]', () => {
    it('should delete job posting', async () => {
      // Mock job deletion
      const mockDeleteResponse = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockJobPosting])
      };

      (db.delete as any).mockReturnValue(mockDeleteResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Job posting deleted successfully');
    });

    it('should return 404 when job not found for deletion', async () => {
      // Mock empty deletion response
      const mockDeleteResponse = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };

      (db.delete as any).mockReturnValue(mockDeleteResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/nonexistent-id', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Job posting not found');
    });
  });
});