import { describe, it, expect } from 'vitest';
import {
  // Types
  RecruiterProfile,
  JobPosting,
  CandidateAvailability,
  InterviewSession,
  TimeSlot,
  Skill,
  // Validation schemas
  createRecruiterProfileSchema,
  createJobPostingSchema,
  createAvailabilitySchema,
  scheduleInterviewSchema,
  candidateFiltersSchema,
  // Utility functions
  calculateMatchScore,
  determineOverallFit,
  formatTimeSlot,
  isTimeSlotConflict,
  generateTimeSlots,
  // Type guards
  isValidTimeSlot,
  isValidRecruiterProfile,
  isValidJobPosting,
} from '../interview-management';

describe('Interview Management Types', () => {
  describe('Validation Schemas', () => {
    describe('createRecruiterProfileSchema', () => {
      it('should validate valid recruiter profile data', () => {
        const validData = {
          organizationName: 'Tech Corp',
          recruitingFor: 'Software Engineers',
          contactEmail: 'recruiter@techcorp.com',
          phoneNumber: '+1234567890',
          timezone: 'America/New_York',
        };

        const result = createRecruiterProfileSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.organizationName).toBe('Tech Corp');
          expect(result.data.timezone).toBe('America/New_York');
        }
      });

      it('should reject invalid email', () => {
        const invalidData = {
          organizationName: 'Tech Corp',
          recruitingFor: 'Software Engineers',
          contactEmail: 'invalid-email',
        };

        const result = createRecruiterProfileSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should require organizationName and recruitingFor', () => {
        const invalidData = {
          contactEmail: 'recruiter@techcorp.com',
        };

        const result = createRecruiterProfileSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('createJobPostingSchema', () => {
      it('should validate valid job posting data', () => {
        const validData = {
          title: 'Senior Software Engineer',
          description: 'We are looking for a senior software engineer with 5+ years of experience...',
          location: 'San Francisco, CA',
          remoteAllowed: true,
          employmentType: 'full-time' as const,
          experienceLevel: 'senior' as const,
          salaryMin: 120000,
          salaryMax: 180000,
          requiredSkills: ['JavaScript', 'React', 'Node.js'],
          preferredSkills: ['TypeScript', 'GraphQL'],
        };

        const result = createJobPostingSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Senior Software Engineer');
          expect(result.data.salaryMin).toBe(120000);
          expect(result.data.requiredSkills).toEqual(['JavaScript', 'React', 'Node.js']);
        }
      });

      it('should reject when salaryMax is less than salaryMin', () => {
        const invalidData = {
          title: 'Software Engineer',
          description: 'Job description here...',
          salaryMin: 150000,
          salaryMax: 120000,
        };

        const result = createJobPostingSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should require title and description', () => {
        const invalidData = {
          location: 'San Francisco, CA',
        };

        const result = createJobPostingSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('createAvailabilitySchema', () => {
      it('should validate valid availability data', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
        const endDate = new Date(futureDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

        const validData = {
          startTime: futureDate.toISOString(),
          endTime: endDate.toISOString(),
          timezone: 'America/New_York',
          isRecurring: false,
        };

        const result = createAvailabilitySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.timezone).toBe('America/New_York');
          expect(result.data.isRecurring).toBe(false);
        }
      });

      it('should reject when endTime is before startTime', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const pastDate = new Date(futureDate.getTime() - 2 * 60 * 60 * 1000);

        const invalidData = {
          startTime: futureDate.toISOString(),
          endTime: pastDate.toISOString(),
          timezone: 'America/New_York',
        };

        const result = createAvailabilitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject when startTime is in the past', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        const endDate = new Date(pastDate.getTime() + 2 * 60 * 60 * 1000);

        const invalidData = {
          startTime: pastDate.toISOString(),
          endTime: endDate.toISOString(),
          timezone: 'America/New_York',
        };

        const result = createAvailabilitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('scheduleInterviewSchema', () => {
      it('should validate valid interview scheduling data', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endDate = new Date(futureDate.getTime() + 60 * 60 * 1000);

        const validData = {
          jobPostingId: 'job-123',
          candidateId: 'candidate-456',
          preferredTimes: [
            {
              start: futureDate,
              end: endDate,
              timezone: 'America/New_York',
            },
          ],
          interviewType: 'video' as const,
          duration: 60,
          timezone: 'America/New_York',
        };

        const result = scheduleInterviewSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.duration).toBe(60);
          expect(result.data.interviewType).toBe('video');
        }
      });

      it('should reject invalid duration', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const endDate = new Date(futureDate.getTime() + 60 * 60 * 1000);

        const invalidData = {
          jobPostingId: 'job-123',
          candidateId: 'candidate-456',
          preferredTimes: [
            {
              start: futureDate,
              end: endDate,
              timezone: 'America/New_York',
            },
          ],
          interviewType: 'video' as const,
          duration: 10, // Too short
          timezone: 'America/New_York',
        };

        const result = scheduleInterviewSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('candidateFiltersSchema', () => {
      it('should validate valid candidate filters', () => {
        const validData = {
          skills: ['JavaScript', 'React'],
          experienceLevel: ['mid', 'senior'],
          location: 'San Francisco',
          remoteOnly: true,
          minMatchScore: 70,
          availability: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            timezone: 'America/New_York',
          },
        };

        const result = candidateFiltersSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.skills).toEqual(['JavaScript', 'React']);
          expect(result.data.minMatchScore).toBe(70);
        }
      });

      it('should accept empty filters', () => {
        const result = candidateFiltersSchema.safeParse({});
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('calculateMatchScore', () => {
      it('should calculate correct match score', () => {
        const candidateSkills: Skill[] = [
          { name: 'JavaScript', proficiencyScore: 85 },
          { name: 'React', proficiencyScore: 90 },
          { name: 'Node.js', proficiencyScore: 75 },
        ];

        const requiredSkills: Skill[] = [
          { name: 'JavaScript', required: true },
          { name: 'React', required: true },
        ];

        const preferredSkills: Skill[] = [
          { name: 'TypeScript' },
          { name: 'Node.js' },
        ];

        const score = calculateMatchScore(candidateSkills, requiredSkills, preferredSkills);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it('should return 0 for no skills', () => {
        const score = calculateMatchScore([], [], []);
        expect(score).toBe(0);
      });

      it('should handle perfect match', () => {
        const skills: Skill[] = [
          { name: 'JavaScript' },
          { name: 'React' },
        ];

        const score = calculateMatchScore(skills, skills, []);
        expect(score).toBe(70); // 70% weight for required skills, 100% match
      });
    });

    describe('determineOverallFit', () => {
      it('should return correct fit levels', () => {
        expect(determineOverallFit(90)).toBe('excellent');
        expect(determineOverallFit(70)).toBe('good');
        expect(determineOverallFit(50)).toBe('fair');
        expect(determineOverallFit(30)).toBe('poor');
      });
    });

    describe('formatTimeSlot', () => {
      it('should format time slot correctly', () => {
        const slot: TimeSlot = {
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T11:00:00Z'),
          timezone: 'America/New_York',
        };

        const formatted = formatTimeSlot(slot);
        expect(formatted).toContain('America/New_York');
        expect(typeof formatted).toBe('string');
      });
    });

    describe('isTimeSlotConflict', () => {
      it('should detect overlapping time slots', () => {
        const slot1: TimeSlot = {
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T11:00:00Z'),
          timezone: 'UTC',
        };

        const slot2: TimeSlot = {
          start: new Date('2024-01-15T10:30:00Z'),
          end: new Date('2024-01-15T11:30:00Z'),
          timezone: 'UTC',
        };

        expect(isTimeSlotConflict(slot1, slot2)).toBe(true);
      });

      it('should not detect conflict for non-overlapping slots', () => {
        const slot1: TimeSlot = {
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T11:00:00Z'),
          timezone: 'UTC',
        };

        const slot2: TimeSlot = {
          start: new Date('2024-01-15T12:00:00Z'),
          end: new Date('2024-01-15T13:00:00Z'),
          timezone: 'UTC',
        };

        expect(isTimeSlotConflict(slot1, slot2)).toBe(false);
      });
    });

    describe('generateTimeSlots', () => {
      it('should generate correct number of time slots', () => {
        const startDate = new Date('2024-01-15T09:00:00Z');
        const endDate = new Date('2024-01-15T17:00:00Z');
        const duration = 60; // 1 hour
        const timezone = 'UTC';

        const slots = generateTimeSlots(startDate, endDate, duration, timezone);
        expect(slots).toHaveLength(8); // 8 hours = 8 slots
        expect(slots[0].start).toEqual(startDate);
        expect(slots[0].timezone).toBe(timezone);
      });

      it('should handle partial slots correctly', () => {
        const startDate = new Date('2024-01-15T09:00:00Z');
        const endDate = new Date('2024-01-15T10:30:00Z'); // 1.5 hours
        const duration = 60; // 1 hour
        const timezone = 'UTC';

        const slots = generateTimeSlots(startDate, endDate, duration, timezone);
        expect(slots).toHaveLength(1); // Only 1 complete hour slot
      });
    });
  });

  describe('Type Guards', () => {
    describe('isValidTimeSlot', () => {
      it('should validate correct time slot', () => {
        const validSlot: TimeSlot = {
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T11:00:00Z'),
          timezone: 'UTC',
        };

        expect(isValidTimeSlot(validSlot)).toBe(true);
      });

      it('should reject invalid time slot', () => {
        const invalidSlot = {
          start: new Date('2024-01-15T11:00:00Z'),
          end: new Date('2024-01-15T10:00:00Z'), // End before start
          timezone: 'UTC',
        };

        expect(isValidTimeSlot(invalidSlot)).toBe(false);
      });

      it('should reject non-object input', () => {
        expect(isValidTimeSlot(null)).toBe(false);
        expect(isValidTimeSlot('invalid')).toBe(false);
        expect(isValidTimeSlot(123)).toBe(false);
      });
    });

    describe('isValidRecruiterProfile', () => {
      it('should validate correct recruiter profile', () => {
        const validProfile: RecruiterProfile = {
          id: 'recruiter-123',
          userId: 'user-456',
          organizationName: 'Tech Corp',
          recruitingFor: 'Software Engineers',
          timezone: 'America/New_York',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(isValidRecruiterProfile(validProfile)).toBe(true);
      });

      it('should reject invalid recruiter profile', () => {
        const invalidProfile = {
          id: 'recruiter-123',
          // Missing required fields
        };

        expect(isValidRecruiterProfile(invalidProfile)).toBe(false);
      });
    });

    describe('isValidJobPosting', () => {
      it('should validate correct job posting', () => {
        const validJob: JobPosting = {
          id: 'job-123',
          recruiterId: 'recruiter-456',
          title: 'Software Engineer',
          rawDescription: 'Job description here...',
          remoteAllowed: false,
          employmentType: 'full-time',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(isValidJobPosting(validJob)).toBe(true);
      });

      it('should reject invalid job posting', () => {
        const invalidJob = {
          id: 'job-123',
          // Missing required fields
        };

        expect(isValidJobPosting(invalidJob)).toBe(false);
      });
    });
  });
});