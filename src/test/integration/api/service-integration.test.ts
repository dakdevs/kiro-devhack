import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createMockDb, 
  createMockRecruiterProfile, 
  createMockJobPosting,
  createMockAvailability,
  createMockInterview,
  createMockNotification,
  createMockCandidate
} from './test-helpers';

// Mock the database
const mockDb = createMockDb();
vi.mock('~/db', () => ({
  db: mockDb
}));

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

describe('Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Recruiter Profile Service Integration', () => {
    it('should create and retrieve recruiter profile', async () => {
      const { RecruiterProfileService } = await import('~/services/recruiter-profile');
      const service = new RecruiterProfileService();
      
      const mockProfile = createMockRecruiterProfile();
      
      // Mock database responses
      mockDb.insert().into().values().returning.mockResolvedValue([mockProfile]);
      mockDb.select().from().where.mockResolvedValue([mockProfile]);

      // Test profile creation
      const profileData = {
        organizationName: 'Test Company',
        recruitingFor: 'Software Engineers',
        contactEmail: 'recruiter@test.com',
        phoneNumber: '+1234567890',
        timezone: 'America/New_York'
      };

      const createdProfile = await service.createProfile('test-user-id', profileData);
      expect(createdProfile).toEqual(mockProfile);

      // Test profile retrieval
      const retrievedProfile = await service.getProfileByUserId('test-user-id');
      expect(retrievedProfile).toEqual(mockProfile);
    });

    it('should update recruiter profile', async () => {
      const { RecruiterProfileService } = await import('~/services/recruiter-profile');
      const service = new RecruiterProfileService();
      
      const mockProfile = createMockRecruiterProfile();
      const updatedProfile = { ...mockProfile, organizationName: 'Updated Company' };
      
      // Mock database response
      mockDb.update().set().where().returning.mockResolvedValue([updatedProfile]);

      const result = await service.updateProfile('test-user-id', {
        organizationName: 'Updated Company'
      });

      expect(result).toEqual(updatedProfile);
    });

    it('should handle profile not found', async () => {
      const { RecruiterProfileService } = await import('~/services/recruiter-profile');
      const service = new RecruiterProfileService();
      
      // Mock empty database response
      mockDb.select().from().where.mockResolvedValue([]);

      const result = await service.getProfileByUserId('nonexistent-user');
      expect(result).toBeNull();
    });
  });

  describe('Job Analysis Service Integration', () => {
    it('should analyze job posting with AI', async () => {
      // Mock the AI service
      vi.mock('~/services/job-analysis', () => ({
        JobAnalysisService: vi.fn().mockImplementation(() => ({
          analyzeJobPosting: vi.fn().mockResolvedValue({
            requiredSkills: ['JavaScript', 'React', 'Node.js'],
            preferredSkills: ['TypeScript', 'Next.js'],
            experienceLevel: 'senior',
            salaryRange: { min: 80000, max: 120000 },
            confidence: 0.85,
            extractedData: {
              location: 'Remote',
              employmentType: 'full-time'
            }
          })
        }))
      }));

      const { JobAnalysisService } = await import('~/services/job-analysis');
      const service = new JobAnalysisService();

      const jobDescription = 'We are looking for a senior software engineer with experience in React and Node.js...';
      const result = await service.analyzeJobPosting(jobDescription);

      expect(result.requiredSkills).toContain('JavaScript');
      expect(result.requiredSkills).toContain('React');
      expect(result.experienceLevel).toBe('senior');
      expect(result.confidence).toBe(0.85);
    });

    it('should handle AI service failure gracefully', async () => {
      // Mock the AI service to fail
      vi.mock('~/services/job-analysis', () => ({
        JobAnalysisService: vi.fn().mockImplementation(() => ({
          analyzeJobPosting: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
        }))
      }));

      const { JobAnalysisService } = await import('~/services/job-analysis');
      const service = new JobAnalysisService();

      await expect(service.analyzeJobPosting('test job description')).rejects.toThrow('AI service unavailable');
    });
  });

  describe('Availability Service Integration', () => {
    it('should create and manage availability slots', async () => {
      const { AvailabilityService } = await import('~/services/availability');
      const service = new AvailabilityService();
      
      const mockAvailability = createMockAvailability();
      
      // Mock database responses
      mockDb.insert().into().values().returning.mockResolvedValue([mockAvailability]);
      mockDb.select().from().where().orderBy.mockResolvedValue([mockAvailability]);

      // Test availability creation
      const availabilityData = {
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T12:00:00Z'),
        timezone: 'America/New_York',
        isRecurring: false
      };

      const createdAvailability = await service.createAvailability('test-user-id', availabilityData);
      expect(createdAvailability).toEqual(mockAvailability);

      // Test availability retrieval
      const userAvailability = await service.getUserAvailability('test-user-id');
      expect(userAvailability).toHaveLength(1);
      expect(userAvailability[0]).toEqual(mockAvailability);
    });

    it('should validate time ranges', async () => {
      const { AvailabilityService } = await import('~/services/availability');
      const service = new AvailabilityService();

      // Test invalid time range (end before start)
      const invalidData = {
        startTime: new Date('2024-12-01T12:00:00Z'),
        endTime: new Date('2024-12-01T10:00:00Z'), // End before start
        timezone: 'America/New_York',
        isRecurring: false
      };

      await expect(service.createAvailability('test-user-id', invalidData))
        .rejects.toThrow('End time must be after start time');
    });

    it('should handle conflict detection', async () => {
      const { AvailabilityService } = await import('~/services/availability');
      const service = new AvailabilityService();
      
      const mockInterview = createMockInterview();
      
      // Mock conflict check
      mockDb.select().from().where.mockResolvedValue([mockInterview]);

      const hasConflicts = await service.checkForConflicts('test-availability-id');
      expect(hasConflicts).toBe(true);
    });
  });

  describe('Candidate Matching Service Integration', () => {
    it('should find and rank matching candidates', async () => {
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const service = new CandidateMatchingService();
      
      const mockJobPosting = createMockJobPosting();
      const mockCandidates = [
        createMockCandidate({ matchScore: 0.85, overallFit: 'excellent' }),
        createMockCandidate({ 
          candidate: { id: 'candidate-2', name: 'Jane Smith', email: 'jane@example.com', skills: [] },
          matchScore: 0.65, 
          overallFit: 'good' 
        })
      ];
      
      // Mock the service method
      vi.spyOn(service, 'findMatchingCandidates').mockResolvedValue(mockCandidates);

      const matches = await service.findMatchingCandidates(mockJobPosting);
      
      expect(matches).toHaveLength(2);
      expect(matches[0].matchScore).toBeGreaterThan(matches[1].matchScore);
      expect(matches[0].overallFit).toBe('excellent');
    });

    it('should filter candidates by minimum match score', async () => {
      const { CandidateMatchingService } = await import('~/services/candidate-matching');
      const service = new CandidateMatchingService();
      
      const mockJobPosting = createMockJobPosting();
      const highScoreCandidate = createMockCandidate({ matchScore: 0.85 });
      
      // Mock the service method to return only high-scoring candidates
      vi.spyOn(service, 'findMatchingCandidates').mockResolvedValue([highScoreCandidate]);

      const matches = await service.findMatchingCandidates(mockJobPosting, { minMatchScore: 0.8 });
      
      expect(matches).toHaveLength(1);
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Interview Scheduling Service Integration', () => {
    it('should schedule interview with mutual availability', async () => {
      const { InterviewSchedulingService } = await import('~/services/interview-scheduling');
      const service = new InterviewSchedulingService();
      
      const mockInterview = createMockInterview();
      const scheduleRequest = {
        jobPostingId: 'test-job-id',
        candidateId: 'test-candidate-id',
        preferredTimes: [
          {
            start: new Date('2024-12-01T10:00:00Z'),
            end: new Date('2024-12-01T11:00:00Z'),
            timezone: 'America/New_York'
          }
        ],
        interviewType: 'video' as const,
        duration: 60
      };
      
      // Mock the service method
      vi.spyOn(service, 'scheduleInterview').mockResolvedValue({
        success: true,
        interview: mockInterview
      });

      const result = await service.scheduleInterview(scheduleRequest);
      
      expect(result.success).toBe(true);
      expect(result.interview).toEqual(mockInterview);
    });

    it('should handle scheduling conflicts', async () => {
      const { InterviewSchedulingService } = await import('~/services/interview-scheduling');
      const service = new InterviewSchedulingService();
      
      const scheduleRequest = {
        jobPostingId: 'test-job-id',
        candidateId: 'test-candidate-id',
        preferredTimes: [
          {
            start: new Date('2024-12-01T10:00:00Z'),
            end: new Date('2024-12-01T11:00:00Z'),
            timezone: 'America/New_York'
          }
        ],
        interviewType: 'video' as const,
        duration: 60
      };
      
      // Mock the service method to return conflicts
      vi.spyOn(service, 'scheduleInterview').mockResolvedValue({
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
              end: new Date('2024-12-01T11:00:00Z'),
              timezone: 'America/New_York'
            },
            description: 'Candidate has existing interview'
          }
        ]
      });

      const result = await service.scheduleInterview(scheduleRequest);
      
      expect(result.success).toBe(false);
      expect(result.suggestedTimes).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('Notification Service Integration', () => {
    it('should create and send notifications', async () => {
      const { NotificationService } = await import('~/services/notification');
      const service = new NotificationService();
      
      const mockNotification = createMockNotification();
      
      // Mock database response
      mockDb.insert().into().values().returning.mockResolvedValue([mockNotification]);
      
      // Mock the service methods
      vi.spyOn(service, 'createNotification').mockResolvedValue(mockNotification);
      vi.spyOn(service, 'sendEmailNotification').mockResolvedValue(true);

      const notificationData = {
        userId: 'test-user-id',
        type: 'interview_scheduled' as const,
        title: 'Interview Scheduled',
        message: 'Your interview has been scheduled',
        data: { interviewId: 'test-interview-id' }
      };

      const createdNotification = await service.createNotification(notificationData);
      expect(createdNotification).toEqual(mockNotification);

      const emailSent = await service.sendEmailNotification(mockNotification);
      expect(emailSent).toBe(true);
    });

    it('should manage notification preferences', async () => {
      const { NotificationService } = await import('~/services/notification');
      const service = new NotificationService();
      
      const mockPreferences = {
        userId: 'test-user-id',
        emailNotifications: true,
        interviewReminders: true,
        jobMatchAlerts: false,
        systemUpdates: false
      };
      
      // Mock the service methods
      vi.spyOn(service, 'getUserPreferences').mockResolvedValue(mockPreferences);
      vi.spyOn(service, 'updateUserPreferences').mockResolvedValue({
        ...mockPreferences,
        emailNotifications: false
      });

      const preferences = await service.getUserPreferences('test-user-id');
      expect(preferences).toEqual(mockPreferences);

      const updatedPreferences = await service.updateUserPreferences('test-user-id', {
        emailNotifications: false
      });
      expect(updatedPreferences.emailNotifications).toBe(false);
    });
  });

  describe('End-to-End Service Integration', () => {
    it('should handle complete interview scheduling workflow', async () => {
      // Import all required services
      const { RecruiterProfileService } = await import('~/services/recruiter-profile');
      const { AvailabilityService } = await import('~/services/availability');
      const { InterviewSchedulingService } = await import('~/services/interview-scheduling');
      const { NotificationService } = await import('~/services/notification');

      const recruiterService = new RecruiterProfileService();
      const availabilityService = new AvailabilityService();
      const schedulingService = new InterviewSchedulingService();
      const notificationService = new NotificationService();

      // Mock data
      const mockProfile = createMockRecruiterProfile();
      const mockAvailability = createMockAvailability();
      const mockInterview = createMockInterview();
      const mockNotification = createMockNotification();

      // Mock service responses
      vi.spyOn(recruiterService, 'getProfileByUserId').mockResolvedValue(mockProfile);
      vi.spyOn(availabilityService, 'getUserAvailability').mockResolvedValue([mockAvailability]);
      vi.spyOn(schedulingService, 'scheduleInterview').mockResolvedValue({
        success: true,
        interview: mockInterview
      });
      vi.spyOn(notificationService, 'createNotification').mockResolvedValue(mockNotification);

      // Execute workflow
      const recruiterProfile = await recruiterService.getProfileByUserId('test-user-id');
      expect(recruiterProfile).toEqual(mockProfile);

      const availability = await availabilityService.getUserAvailability('test-candidate-id');
      expect(availability).toHaveLength(1);

      const scheduleResult = await schedulingService.scheduleInterview({
        jobPostingId: 'test-job-id',
        candidateId: 'test-candidate-id',
        preferredTimes: [
          {
            start: new Date('2024-12-01T10:00:00Z'),
            end: new Date('2024-12-01T11:00:00Z'),
            timezone: 'America/New_York'
          }
        ],
        interviewType: 'video',
        duration: 60
      });
      expect(scheduleResult.success).toBe(true);

      const notification = await notificationService.createNotification({
        userId: 'test-candidate-id',
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: 'Your interview has been scheduled',
        data: { interviewId: mockInterview.id }
      });
      expect(notification).toEqual(mockNotification);
    });
  });
});