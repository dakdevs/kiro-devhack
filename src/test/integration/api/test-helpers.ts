import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.BETTER_AUTH_SECRET = 'test-secret';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';

// Create mock database functions
export const createMockDb = () => ({
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis()
  }),
  insert: vi.fn().mockReturnValue({
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis()
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis()
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis()
  })
});

// Create mock auth session
export const createMockSession = (userId = 'test-user-id') => ({
  user: { id: userId },
  session: { id: 'test-session-id' }
});

// Create mock request helper
export const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
};

// Mock response helper
export const createMockResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Test data factories
export const createMockRecruiterProfile = (overrides = {}) => ({
  id: 'test-profile-id',
  userId: 'test-user-id',
  organizationName: 'Test Company',
  recruitingFor: 'Software Engineers',
  contactEmail: 'recruiter@test.com',
  phoneNumber: '+1234567890',
  timezone: 'America/New_York',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockJobPosting = (overrides = {}) => ({
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
  updatedAt: new Date(),
  ...overrides
});

export const createMockAvailability = (overrides = {}) => ({
  id: 'test-availability-id',
  userId: 'test-user-id',
  startTime: new Date('2024-12-01T10:00:00Z'),
  endTime: new Date('2024-12-01T12:00:00Z'),
  timezone: 'America/New_York',
  isRecurring: false,
  recurrencePattern: null,
  status: 'available',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockInterview = (overrides = {}) => ({
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
  updatedAt: new Date(),
  ...overrides
});

export const createMockNotification = (overrides = {}) => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'interview_scheduled',
  title: 'Interview Scheduled',
  message: 'Your interview has been scheduled',
  data: {
    interviewId: 'test-interview-id',
    jobTitle: 'Senior Software Engineer'
  },
  read: false,
  sentAt: null,
  createdAt: new Date(),
  ...overrides
});

export const createMockCandidate = (overrides = {}) => ({
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
  skillGaps: ['TypeScript'],
  overallFit: 'excellent',
  availability: [],
  ...overrides
});