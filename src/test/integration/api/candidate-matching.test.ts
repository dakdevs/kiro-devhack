import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '~/app/api/recruiter/jobs/[id]/candidates/route';
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

// Mock the candidate matching service
vi.mock('~/services/candidate-matching', () => ({
  CandidateMatchingService: vi.fn().mockImplementation(() => ({
    findMatchingCandidates: vi.fn().mockResolvedValue([
      {
        candidate: {
          id: 'candidate-1',
          name: 'John Doe',
          email: 'john@example.com',
          skills: [
            { skillName: 'JavaScript', proficiencyScore: 85 },
            { skillName: 'React', proficiencyScore: 90 },
            { skillName: 'Node.js', proficiencyScore: 75 }
          ]
        },
        matchScore: 0.85,
        matchingSkills: ['JavaScript', 'React'],
        skillGaps: ['TypeScript'],
        overallFit: 'excellent',
        availability: [
          {
            id: 'avail-1',
            startTime: new Date('2024-12-01T10:00:00Z'),
            endTime: new Date('2024-12-01T12:00:00Z'),
            status: 'available'
          }
        ]
      },
      {
        candidate: {
          id: 'candidate-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          skills: [
            { skillName: 'JavaScript', proficiencyScore: 70 },
            { skillName: 'Vue.js', proficiencyScore: 80 }
          ]
        },
        matchScore: 0.65,
        matchingSkills: ['JavaScript'],
        skillGaps: ['React', 'Node.js'],
        overallFit: 'good',
        availability: []
      }
    ])
  }))
}));

describe('Candidate Matching API Integration Tests', () => {
  const mockJobPosting = {
    id: 'test-job-id',
    recruiterId: 'test-recruiter-id',
    title: 'Senior Software Engineer',
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    preferredSkills: ['TypeScript', 'Next.js'],
    experienceLevel: 'senior',
    status: 'active'
  };

  const mockRecruiterProfile = {
    id: 'test-recruiter-id',
    userId: 'test-user-id',
    organizationName: 'Test Company'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/recruiter/jobs/[id]/candidates', () => {
    it('should return ranked candidates for job posting', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
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

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(2);
      expect(data.data.totalCount).toBe(2);
      
      // Check that candidates are sorted by match score (highest first)
      expect(data.data.candidates[0].matchScore).toBeGreaterThan(data.data.candidates[1].matchScore);
      expect(data.data.candidates[0].overallFit).toBe('excellent');
      expect(data.data.candidates[1].overallFit).toBe('good');
    });

    it('should filter candidates by minimum match score', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      // Mock candidate matching service to return filtered results
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const mockMatchingService = new CandidateMatchingService();
      (mockMatchingService.findMatchingCandidates as any).mockResolvedValue([
        {
          candidate: {
            id: 'candidate-1',
            name: 'John Doe',
            email: 'john@example.com',
            skills: [
              { skillName: 'JavaScript', proficiencyScore: 85 },
              { skillName: 'React', proficiencyScore: 90 }
            ]
          },
          matchScore: 0.85,
          matchingSkills: ['JavaScript', 'React'],
          skillGaps: [],
          overallFit: 'excellent',
          availability: []
        }
      ]);

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates?minMatchScore=0.8');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(1);
      expect(data.data.candidates[0].matchScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should filter candidates by required skills', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      // Mock candidate matching service to return skill-filtered results
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const mockMatchingService = new CandidateMatchingService();
      (mockMatchingService.findMatchingCandidates as any).mockResolvedValue([
        {
          candidate: {
            id: 'candidate-1',
            name: 'John Doe',
            email: 'john@example.com',
            skills: [
              { skillName: 'JavaScript', proficiencyScore: 85 },
              { skillName: 'React', proficiencyScore: 90 },
              { skillName: 'Node.js', proficiencyScore: 75 }
            ]
          },
          matchScore: 0.85,
          matchingSkills: ['JavaScript', 'React', 'Node.js'],
          skillGaps: [],
          overallFit: 'excellent',
          availability: []
        }
      ]);

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates?requiredSkills=JavaScript,React,Node.js');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(1);
      expect(data.data.candidates[0].matchingSkills).toContain('JavaScript');
      expect(data.data.candidates[0].matchingSkills).toContain('React');
      expect(data.data.candidates[0].matchingSkills).toContain('Node.js');
    });

    it('should filter candidates by availability', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      // Mock candidate matching service to return availability-filtered results
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const mockMatchingService = new CandidateMatchingService();
      (mockMatchingService.findMatchingCandidates as any).mockResolvedValue([
        {
          candidate: {
            id: 'candidate-1',
            name: 'John Doe',
            email: 'john@example.com',
            skills: [{ skillName: 'JavaScript', proficiencyScore: 85 }]
          },
          matchScore: 0.85,
          matchingSkills: ['JavaScript'],
          skillGaps: [],
          overallFit: 'excellent',
          availability: [
            {
              id: 'avail-1',
              startTime: new Date('2024-12-01T10:00:00Z'),
              endTime: new Date('2024-12-01T12:00:00Z'),
              status: 'available'
            }
          ]
        }
      ]);

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates?hasAvailability=true');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(1);
      expect(data.data.candidates[0].availability).toHaveLength(1);
    });

    it('should sort candidates by different criteria', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      // Mock candidate matching service to return sorted results
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const mockMatchingService = new CandidateMatchingService();
      (mockMatchingService.findMatchingCandidates as any).mockResolvedValue([
        {
          candidate: { id: 'candidate-1', name: 'Alice', email: 'alice@example.com', skills: [] },
          matchScore: 0.75,
          matchingSkills: [],
          skillGaps: [],
          overallFit: 'good',
          availability: []
        },
        {
          candidate: { id: 'candidate-2', name: 'Bob', email: 'bob@example.com', skills: [] },
          matchScore: 0.85,
          matchingSkills: [],
          skillGaps: [],
          overallFit: 'excellent',
          availability: []
        }
      ]);

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates?sortBy=name&sortOrder=asc');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(2);
      // When sorted by name ascending, Alice should come before Bob
      expect(data.data.candidates[0].candidate.name).toBe('Alice');
      expect(data.data.candidates[1].candidate.name).toBe('Bob');
    });

    it('should paginate candidate results', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      // Mock candidate matching service to return paginated results
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const mockMatchingService = new CandidateMatchingService();
      (mockMatchingService.findMatchingCandidates as any).mockResolvedValue([
        {
          candidate: { id: 'candidate-1', name: 'John Doe', email: 'john@example.com', skills: [] },
          matchScore: 0.85,
          matchingSkills: [],
          skillGaps: [],
          overallFit: 'excellent',
          availability: []
        }
      ]);

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates?page=1&limit=10');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(1);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(10);
    });

    it('should return 404 when job posting not found', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
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

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/nonexistent-job/candidates');
      const response = await GET(request, { params: { id: 'nonexistent-job' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Job posting not found');
    });

    it('should return 403 when user is not the job owner', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting with different recruiter
      const otherRecruiterJob = {
        ...mockJobPosting,
        recruiterId: 'other-recruiter-id'
      };

      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([otherRecruiterJob])
      };

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Access denied');
    });

    it('should return empty results when no candidates match', async () => {
      // Mock recruiter profile lookup
      const mockRecruiterResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };

      // Mock job posting lookup
      const mockJobResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockJobPosting])
      };

      // Mock candidate matching service to return no matches
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const mockMatchingService = new CandidateMatchingService();
      (mockMatchingService.findMatchingCandidates as any).mockResolvedValue([]);

      (db.select as any)
        .mockReturnValueOnce(mockRecruiterResponse)
        .mockReturnValueOnce(mockJobResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/jobs/test-job-id/candidates');
      const response = await GET(request, { params: { id: 'test-job-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.candidates).toHaveLength(0);
      expect(data.data.totalCount).toBe(0);
    });
  });
});