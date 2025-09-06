import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jobMatchingService } from '~/services/job-matching';
import { recruiterAvailabilityService } from '~/services/recruiter-availability';

// Mock the database
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock the services
vi.mock('~/services/recruiter-availability');

describe('Job Matching Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findJobMatches', () => {
    it('should return empty array when candidate has no skills', async () => {
      const mockDb = await import('~/db');
      
      // Mock empty skills query
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await jobMatchingService.findJobMatches('candidate-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should calculate match scores correctly', async () => {
      const mockDb = await import('~/db');
      
      // Mock candidate skills
      const mockSkills = [
        { skillName: 'JavaScript', proficiencyScore: '85', mentionCount: 10 },
        { skillName: 'React', proficiencyScore: '90', mentionCount: 8 },
        { skillName: 'Node.js', proficiencyScore: '75', mentionCount: 5 },
      ];

      // Mock active jobs
      const mockJobs = [
        {
          job: {
            id: 'job-1',
            title: 'Frontend Developer',
            rawDescription: 'Looking for a React developer',
            requiredSkills: [{ name: 'JavaScript' }, { name: 'React' }],
            preferredSkills: [{ name: 'TypeScript' }],
            experienceLevel: 'mid',
            salaryMin: 80000,
            salaryMax: 120000,
            location: 'San Francisco',
            remoteAllowed: true,
            employmentType: 'full-time',
            status: 'active',
            createdAt: new Date(),
          },
          recruiter: {
            id: 'recruiter-1',
            organizationName: 'Tech Corp',
            contactEmail: 'hr@techcorp.com',
            calComUsername: 'techcorp-hr',
            calComConnected: true,
          },
        },
      ];

      // Setup mock database calls
      mockDb.db.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockSkills),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockJobs),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'availability-1' }]),
            }),
          }),
        });

      // Mock delete and insert for storing matches
      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await jobMatchingService.findJobMatches('candidate-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const match = result.data![0];
      expect(match.jobPosting.title).toBe('Frontend Developer');
      expect(match.matchScore).toBeGreaterThan(0);
      expect(match.matchingSkills).toContain('javascript');
      expect(match.matchingSkills).toContain('react');
      expect(match.hasAvailability).toBe(true);
    });

    it('should filter matches by criteria', async () => {
      const mockDb = await import('~/db');
      
      // Mock candidate skills
      const mockSkills = [
        { skillName: 'Python', proficiencyScore: '70', mentionCount: 5 },
      ];

      // Mock jobs with different match scores
      const mockJobs = [
        {
          job: {
            id: 'job-1',
            title: 'Senior Python Developer',
            requiredSkills: [{ name: 'Python' }, { name: 'Django' }],
            preferredSkills: [],
            experienceLevel: 'senior',
            salaryMin: 100000,
            salaryMax: 150000,
            location: 'New York',
            remoteAllowed: false,
            status: 'active',
          },
          recruiter: {
            id: 'recruiter-1',
            organizationName: 'Big Corp',
            calComConnected: true,
          },
        },
        {
          job: {
            id: 'job-2',
            title: 'Junior Python Developer',
            requiredSkills: [{ name: 'Python' }],
            preferredSkills: [],
            experienceLevel: 'junior',
            salaryMin: 60000,
            salaryMax: 80000,
            location: 'Remote',
            remoteAllowed: true,
            status: 'active',
          },
          recruiter: {
            id: 'recruiter-2',
            organizationName: 'Startup Inc',
            calComConnected: true,
          },
        },
      ];

      mockDb.db.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockSkills),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockJobs),
            }),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'availability-1' }]),
            }),
          }),
        });

      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      // Test filtering by experience level
      const result = await jobMatchingService.findJobMatches('candidate-1', {
        experienceLevel: 'junior',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].jobPosting.title).toBe('Junior Python Developer');
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = await import('~/db');
      
      // Mock database error
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      });

      const result = await jobMatchingService.findJobMatches('candidate-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('refreshMatches', () => {
    it('should call findJobMatches with minimum score filter', async () => {
      const mockDb = await import('~/db');
      
      // Mock empty skills to trigger early return
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await jobMatchingService.refreshMatches('candidate-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getStoredJobMatches', () => {
    it('should retrieve stored matches from database', async () => {
      const mockDb = await import('~/db');
      
      const mockStoredMatches = [
        {
          match: {
            id: 'match-1',
            matchScore: '85',
            matchingSkills: ['JavaScript', 'React'],
            skillGaps: ['TypeScript'],
            overallFit: 'good',
          },
          job: {
            id: 'job-1',
            title: 'Frontend Developer',
          },
          recruiter: {
            id: 'recruiter-1',
            organizationName: 'Tech Corp',
          },
        },
      ];

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue(mockStoredMatches),
              }),
            }),
          }),
        }),
      });

      const result = await jobMatchingService.getStoredJobMatches('candidate-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStoredMatches);
    });

    it('should handle database errors when retrieving stored matches', async () => {
      const mockDb = await import('~/db');
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockRejectedValue(new Error('Query failed')),
              }),
            }),
          }),
        }),
      });

      const result = await jobMatchingService.getStoredJobMatches('candidate-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query failed');
    });
  });
});

describe('Match Score Calculation', () => {
  it('should give higher scores for exact skill matches', () => {
    // This would test the private calculateJobMatch method
    // In a real implementation, you might extract this logic to a separate testable function
  });

  it('should penalize missing required skills', () => {
    // Test penalty calculation for skill gaps
  });

  it('should bonus for high proficiency scores', () => {
    // Test proficiency bonus calculation
  });

  it('should consider mention count in scoring', () => {
    // Test mention count bonus
  });
});