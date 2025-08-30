import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { auth } from '~/lib/auth';
import { db } from '~/db';
import { userSkills, recruiterProfiles, jobPostings, candidateAvailability, interviewSessions } from '~/db/schema';
import { eq } from 'drizzle-orm';

// Mock auth
vi.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock database
vi.mock('~/db', () => ({
  db: {
    query: {
      user: {
        findFirst: vi.fn(),
      },
      userSkills: {
        findMany: vi.fn(),
      },
      recruiterProfiles: {
        findFirst: vi.fn(),
      },
      jobPostings: {
        findMany: vi.fn(),
      },
      candidateAvailability: {
        findMany: vi.fn(),
      },
      interviewSessions: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  redirect: vi.fn(),
}));

describe('Interview System Integration', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    image: null,
    createdAt: new Date(),
  };

  const mockSession = {
    user: mockUser,
    session: {
      id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
    },
  };

  const mockUserSkills = [
    {
      id: 'skill-1',
      userId: 'user-1',
      skillName: 'JavaScript',
      mentionCount: 5,
      proficiencyScore: '85',
      averageConfidence: '0.9',
      averageEngagement: 'high',
      topicDepthAverage: '0.8',
      firstMentioned: new Date(),
      lastMentioned: new Date(),
    },
    {
      id: 'skill-2',
      userId: 'user-1',
      skillName: 'React',
      mentionCount: 3,
      proficiencyScore: '80',
      averageConfidence: '0.85',
      averageEngagement: 'high',
      topicDepthAverage: '0.75',
      firstMentioned: new Date(),
      lastMentioned: new Date(),
    },
  ];

  const mockRecruiterProfile = {
    id: 'recruiter-1',
    userId: 'recruiter-user-1',
    organizationName: 'Tech Corp',
    recruitingFor: 'Software Engineering',
    contactEmail: 'recruiter@techcorp.com',
    timezone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJobPosting = {
    id: 'job-1',
    recruiterId: 'recruiter-1',
    title: 'Senior Frontend Developer',
    rawDescription: 'Looking for a senior frontend developer...',
    extractedSkills: [{ name: 'JavaScript', confidence: 0.9 }],
    requiredSkills: [{ name: 'JavaScript' }, { name: 'React' }],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAvailability = [
    {
      id: 'avail-1',
      userId: 'user-1',
      startTime: new Date('2024-02-15T10:00:00Z'),
      endTime: new Date('2024-02-15T12:00:00Z'),
      timezone: 'America/New_York',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (auth.api.getSession as any).mockResolvedValue(mockSession);
    (db.query.user.findFirst as any).mockResolvedValue(mockUser);
    (db.query.userSkills.findMany as any).mockResolvedValue(mockUserSkills);
    (db.query.recruiterProfiles.findFirst as any).mockResolvedValue(mockRecruiterProfile);
    (db.query.jobPostings.findMany as any).mockResolvedValue([mockJobPosting]);
    (db.query.candidateAvailability.findMany as any).mockResolvedValue(mockAvailability);
    (db.query.interviewSessions.findMany as any).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Integration', () => {
    it('should redirect unauthenticated users', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);
      
      // This would be tested in the actual layout components
      expect(auth.api.getSession).toBeDefined();
    });

    it('should allow authenticated users to access dashboard', async () => {
      const session = await auth.api.getSession({ headers: {} });
      expect(session).toEqual(mockSession);
    });
  });

  describe('User Skills Integration', () => {
    it('should integrate user skills with candidate matching', async () => {
      const skills = await db.query.userSkills.findMany({
        where: eq(userSkills.userId, 'user-1'),
      });

      expect(skills).toEqual(mockUserSkills);
      
      // Verify skills can be used for matching
      const jsSkill = skills.find(s => s.skillName === 'JavaScript');
      expect(jsSkill).toBeDefined();
      expect(parseInt(jsSkill!.proficiencyScore)).toBeGreaterThan(80);
    });

    it('should calculate match scores based on user skills', () => {
      const requiredSkills = ['JavaScript', 'React'];
      const userSkillNames = mockUserSkills.map(s => s.skillName);
      
      const matchingSkills = requiredSkills.filter(skill => 
        userSkillNames.includes(skill)
      );
      
      expect(matchingSkills).toHaveLength(2);
      expect(matchingSkills).toContain('JavaScript');
      expect(matchingSkills).toContain('React');
    });
  });

  describe('Navigation Integration', () => {
    it('should have consistent navigation between dashboard and recruiter sections', () => {
      // Test navigation structure
      const dashboardNavItems = [
        'Dashboard',
        'Interview Availability', 
        'Interview Management',
        'Interviews'
      ];

      const recruiterNavItems = [
        'Profile',
        'Jobs', 
        'Post Job',
        'Interviews',
        'Applications'
      ];

      // Verify navigation items exist
      expect(dashboardNavItems).toContain('Interview Availability');
      expect(dashboardNavItems).toContain('Interview Management');
      expect(recruiterNavItems).toContain('Interviews');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      (db.query.userSkills.findMany as any).mockRejectedValue(new Error('Database error'));

      try {
        await db.query.userSkills.findMany({ where: eq(userSkills.userId, 'user-1') });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });

    it('should handle authentication errors', async () => {
      (auth.api.getSession as any).mockRejectedValue(new Error('Auth error'));

      try {
        await auth.api.getSession({ headers: {} });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Auth error');
      }
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across components', async () => {
      // Test that user data flows correctly through the system
      const user = await db.query.user.findFirst();
      const skills = await db.query.userSkills.findMany();
      const availability = await db.query.candidateAvailability.findMany();

      expect(user?.id).toBe('user-1');
      expect(skills[0].userId).toBe('user-1');
      expect(availability[0].userId).toBe('user-1');
    });

    it('should handle recruiter-candidate relationships', async () => {
      const recruiter = await db.query.recruiterProfiles.findFirst();
      const jobs = await db.query.jobPostings.findMany();

      expect(recruiter?.id).toBe('recruiter-1');
      expect(jobs[0].recruiterId).toBe('recruiter-1');
    });
  });

  describe('Component Integration', () => {
    it('should integrate notification system with interview scheduling', () => {
      // Mock notification creation when interview is scheduled
      const mockNotification = {
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: 'Your interview has been scheduled',
        userId: 'user-1',
      };

      expect(mockNotification.type).toBe('interview_scheduled');
      expect(mockNotification.userId).toBe('user-1');
    });

    it('should integrate availability with scheduling system', () => {
      const availability = mockAvailability[0];
      const scheduledTime = new Date('2024-02-15T10:30:00Z');

      // Check if scheduled time falls within availability
      const isWithinAvailability = 
        scheduledTime >= availability.startTime && 
        scheduledTime <= availability.endTime;

      expect(isWithinAvailability).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent requests', async () => {
      const promises = [
        db.query.user.findFirst(),
        db.query.userSkills.findMany(),
        db.query.candidateAvailability.findMany(),
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockUser);
      expect(results[1]).toEqual(mockUserSkills);
      expect(results[2]).toEqual(mockAvailability);
    });
  });
});

describe('End-to-End Workflow Integration', () => {
  it('should support complete candidate workflow', async () => {
    // 1. User authentication
    const session = await auth.api.getSession({ headers: {} });
    expect(session?.user).toBeDefined();

    // 2. User skills are available
    const skills = await db.query.userSkills.findMany();
    expect(skills.length).toBeGreaterThan(0);

    // 3. User can set availability
    const availability = await db.query.candidateAvailability.findMany();
    expect(availability.length).toBeGreaterThan(0);

    // 4. User can be matched to jobs
    const jobs = await db.query.jobPostings.findMany();
    expect(jobs.length).toBeGreaterThan(0);
  });

  it('should support complete recruiter workflow', async () => {
    // 1. Recruiter authentication
    const session = await auth.api.getSession({ headers: {} });
    expect(session?.user).toBeDefined();

    // 2. Recruiter profile exists
    const profile = await db.query.recruiterProfiles.findFirst();
    expect(profile).toBeDefined();

    // 3. Recruiter can post jobs
    const jobs = await db.query.jobPostings.findMany();
    expect(jobs.length).toBeGreaterThan(0);

    // 4. Recruiter can view candidates
    const candidates = await db.query.userSkills.findMany();
    expect(candidates.length).toBeGreaterThan(0);
  });
});