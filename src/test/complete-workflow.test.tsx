import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jobMatchingService } from '~/services/job-matching';
import { recruiterAvailabilityService } from '~/services/recruiter-availability';
import { jobPostingService } from '~/services/job-posting';

// Mock all dependencies
vi.mock('~/db');
vi.mock('~/services/cal-integration');
vi.mock('~/services/job-analysis');

describe('Complete Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow from job posting to interview scheduling', async () => {
      const mockDb = await import('~/db');
      const { calIntegration } = await import('~/services/cal-integration');
      
      // Step 1: Recruiter posts job
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'recruiter-1',
              organizationName: 'Tech Corp',
            }]),
          }),
        }),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'job-1',
            title: 'Frontend Developer',
            status: 'active',
          }]),
        }),
      });

      // Step 2: Recruiter connects Cal.com
      vi.mocked(calIntegration.validateUsername).mockReturnValue(true);
      vi.mocked(calIntegration.getEventTypes).mockResolvedValue([
        {
          id: 1,
          title: '30 Minute Interview',
          slug: '30min-interview',
          length: 30,
          hidden: false,
        },
      ]);

      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      // Step 3: Candidate gets job matches
      const mockSkills = [
        { skillName: 'React', proficiencyScore: '85', mentionCount: 10 },
      ];

      const mockJobs = [
        {
          job: {
            id: 'job-1',
            title: 'Frontend Developer',
            requiredSkills: [{ name: 'React' }],
            status: 'active',
          },
          recruiter: {
            id: 'recruiter-1',
            organizationName: 'Tech Corp',
            calComConnected: true,
          },
        },
      ];

      // Reset mocks for job matching
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

      // Execute the workflow
      const jobResult = await jobPostingService.createJobPosting('recruiter-1', {
        title: 'Frontend Developer',
        description: 'React developer needed',
        requiredSkills: ['React'],
      });

      const calResult = await recruiterAvailabilityService.connectRecruiterToCal(
        'recruiter-1',
        'tech-corp-hr'
      );

      const matchResult = await jobMatchingService.findJobMatches('candidate-1');

      // Verify complete workflow
      expect(jobResult.success).toBe(true);
      expect(calResult.success).toBe(true);
      expect(matchResult.success).toBe(true);
      expect(matchResult.data).toHaveLength(1);
      expect(matchResult.data![0].hasAvailability).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Cal.com API failures gracefully', async () => {
      const { calIntegration } = await import('~/services/cal-integration');
      
      vi.mocked(calIntegration.validateUsername).mockReturnValue(true);
      vi.mocked(calIntegration.getEventTypes).mockRejectedValue(
        new Error('Cal.com API unavailable')
      );

      const result = await recruiterAvailabilityService.connectRecruiterToCal(
        'recruiter-1',
        'test-user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch availability from Cal.com');
    });

    it('should handle database connection failures', async () => {
      const mockDb = await import('~/db');
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Database connection lost')),
          }),
        }),
      });

      const result = await jobMatchingService.findJobMatches('candidate-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection lost');
    });
  });
});