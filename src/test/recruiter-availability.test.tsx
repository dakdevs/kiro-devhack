import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recruiterAvailabilityService } from '~/services/recruiter-availability';
import { calIntegration } from '~/services/cal-integration';

// Mock the database
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock Cal.com integration
vi.mock('~/services/cal-integration', () => ({
  calIntegration: {
    validateUsername: vi.fn(),
    getEventTypes: vi.fn(),
    generateBookingLink: vi.fn(),
  },
}));

describe('Recruiter Availability Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('connectRecruiterToCal', () => {
    it('should successfully connect recruiter to Cal.com', async () => {
      const mockDb = await import('~/db');
      
      // Mock username validation
      vi.mocked(calIntegration.validateUsername).mockReturnValue(true);
      
      // Mock event types from Cal.com
      const mockEventTypes = [
        {
          id: 1,
          title: '30 Minute Interview',
          slug: '30min-interview',
          length: 30,
          hidden: false,
          schedulingType: 'ROUND_ROBIN',
        },
        {
          id: 2,
          title: '60 Minute Interview',
          slug: '60min-interview',
          length: 60,
          hidden: false,
          schedulingType: 'ROUND_ROBIN',
        },
      ];
      
      vi.mocked(calIntegration.getEventTypes).mockResolvedValue(mockEventTypes);

      // Mock database operations
      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'recruiter-1',
              calComUsername: 'test-recruiter',
            }]),
          }),
        }),
      });

      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await recruiterAvailabilityService.connectRecruiterToCal(
        'recruiter-1',
        'test-recruiter'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.calComUsername).toBe('test-recruiter');
      expect(result.data!.eventTypes).toHaveLength(2);
      
      // Verify Cal.com integration was called
      expect(calIntegration.validateUsername).toHaveBeenCalledWith('test-recruiter');
      expect(calIntegration.getEventTypes).toHaveBeenCalledWith('test-recruiter');
    });

    it('should reject invalid Cal.com usernames', async () => {
      vi.mocked(calIntegration.validateUsername).mockReturnValue(false);

      const result = await recruiterAvailabilityService.connectRecruiterToCal(
        'recruiter-1',
        'invalid-username!'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Cal.com username format');
    });

    it('should rollback connection if sync fails', async () => {
      const mockDb = await import('~/db');
      
      vi.mocked(calIntegration.validateUsername).mockReturnValue(true);
      vi.mocked(calIntegration.getEventTypes).mockRejectedValue(new Error('Cal.com API error'));

      // Mock initial update (connection)
      mockDb.db.update
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        // Mock rollback update
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        });

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'recruiter-1',
              calComUsername: 'test-recruiter',
            }]),
          }),
        }),
      });

      const result = await recruiterAvailabilityService.connectRecruiterToCal(
        'recruiter-1',
        'test-recruiter'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch availability from Cal.com');
      
      // Verify rollback was called
      expect(mockDb.db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncRecruiterAvailability', () => {
    it('should sync availability from Cal.com', async () => {
      const mockDb = await import('~/db');
      
      // Mock recruiter profile
      const mockRecruiter = {
        id: 'recruiter-1',
        calComUsername: 'test-recruiter',
        calComConnected: true,
      };

      // Mock event types
      const mockEventTypes = [
        {
          id: 1,
          title: '30 Minute Interview',
          slug: '30min-interview',
          length: 30,
          hidden: false,
          schedulingType: 'ROUND_ROBIN',
        },
      ];

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRecruiter]),
          }),
        }),
      });

      vi.mocked(calIntegration.getEventTypes).mockResolvedValue(mockEventTypes);

      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await recruiterAvailabilityService.syncRecruiterAvailability('recruiter-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.eventTypes).toHaveLength(1);
      expect(result.data!.eventTypes[0].name).toBe('30 Minute Interview');
    });

    it('should handle recruiter not connected to Cal.com', async () => {
      const mockDb = await import('~/db');
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'recruiter-1',
              calComUsername: null,
              calComConnected: false,
            }]),
          }),
        }),
      });

      const result = await recruiterAvailabilityService.syncRecruiterAvailability('recruiter-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recruiter not connected to Cal.com');
    });

    it('should handle Cal.com API errors gracefully', async () => {
      const mockDb = await import('~/db');
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'recruiter-1',
              calComUsername: 'test-recruiter',
              calComConnected: true,
            }]),
          }),
        }),
      });

      vi.mocked(calIntegration.getEventTypes).mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await recruiterAvailabilityService.syncRecruiterAvailability('recruiter-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch availability from Cal.com');
    });
  });

  describe('getRecruiterAvailability', () => {
    it('should return availability for connected recruiter', async () => {
      const mockDb = await import('~/db');
      
      const mockRecruiter = {
        id: 'recruiter-1',
        calComUsername: 'test-recruiter',
        calComConnected: true,
      };

      const mockAvailability = [
        {
          id: 'avail-1',
          calComEventTypeId: '1',
          eventTypeName: '30 Minute Interview',
          duration: 30,
          isActive: true,
          calComData: { slug: '30min-interview' },
          lastSyncedAt: new Date(),
        },
      ];

      mockDb.db.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockRecruiter]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockAvailability),
          }),
        });

      vi.mocked(calIntegration.generateBookingLink).mockReturnValue('https://cal.com/test-recruiter/30min-interview');

      const result = await recruiterAvailabilityService.getRecruiterAvailability('recruiter-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.isConnected).toBe(true);
      expect(result.data!.eventTypes).toHaveLength(1);
      expect(result.data!.eventTypes[0].calComLink).toBe('https://cal.com/test-recruiter/30min-interview');
    });

    it('should return not connected for unconnected recruiter', async () => {
      const mockDb = await import('~/db');
      
      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'recruiter-1',
              calComUsername: null,
              calComConnected: false,
            }]),
          }),
        }),
      });

      const result = await recruiterAvailabilityService.getRecruiterAvailability('recruiter-1');

      expect(result.success).toBe(true);
      expect(result.data!.isConnected).toBe(false);
      expect(result.data!.eventTypes).toEqual([]);
    });
  });

  describe('disconnectRecruiterFromCal', () => {
    it('should successfully disconnect recruiter', async () => {
      const mockDb = await import('~/db');
      
      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await recruiterAvailabilityService.disconnectRecruiterFromCal('recruiter-1');

      expect(result.success).toBe(true);
      
      // Verify both delete and update were called
      expect(mockDb.db.delete).toHaveBeenCalled();
      expect(mockDb.db.update).toHaveBeenCalled();
    });
  });

  describe('syncAllRecruiters', () => {
    it('should sync all connected recruiters', async () => {
      const mockDb = await import('~/db');
      
      const mockConnectedRecruiters = [
        { id: 'recruiter-1' },
        { id: 'recruiter-2' },
      ];

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockConnectedRecruiters),
        }),
      });

      // Mock successful sync for both recruiters
      mockDb.db.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockConnectedRecruiters),
          }),
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'recruiter-1',
                calComUsername: 'recruiter-1',
                calComConnected: true,
              }]),
            }),
          }),
        });

      vi.mocked(calIntegration.getEventTypes).mockResolvedValue([]);

      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await recruiterAvailabilityService.syncAllRecruiters();

      expect(result.success).toBe(true);
      expect(result.data!.totalProcessed).toBe(2);
      expect(result.data!.successful).toBeGreaterThan(0);
    });

    it('should handle individual sync failures gracefully', async () => {
      const mockDb = await import('~/db');
      
      const mockConnectedRecruiters = [
        { id: 'recruiter-1' },
        { id: 'recruiter-2' },
      ];

      mockDb.db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockConnectedRecruiters),
        }),
      });

      // Mock one successful, one failed sync
      mockDb.db.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockConnectedRecruiters),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'recruiter-1',
                calComUsername: 'recruiter-1',
                calComConnected: true,
              }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

      vi.mocked(calIntegration.getEventTypes)
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('API error'));

      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const result = await recruiterAvailabilityService.syncAllRecruiters();

      expect(result.success).toBe(true);
      expect(result.data!.totalProcessed).toBe(2);
      expect(result.data!.successful).toBe(1);
      expect(result.data!.failed).toBe(1);
      expect(result.data!.errors).toHaveLength(1);
    });
  });
});