import { z } from 'zod';
import type {
  RecruiterProfile,
  JobPosting,
  CandidateAvailability,
  InterviewSession,
  CandidateJobMatch,
  InterviewNotification,
  TimeSlot,
  ConflictInfo,
  JobAnalysisResult,
  CandidateWithMatch,
  NotificationPreferences,
  ApiResponse,
  PaginatedResponse,
} from './interview-management';

// =============================================================================
// API ENDPOINT TYPES
// =============================================================================

// =============================================================================
// RECRUITER PROFILE ENDPOINTS
// =============================================================================

// GET /api/recruiter/profile
export interface GetRecruiterProfileResponse extends ApiResponse<RecruiterProfile> {}

// POST /api/recruiter/profile
export interface CreateRecruiterProfileRequest {
  organizationName: string;
  recruitingFor: string;
  contactEmail?: string;
  phoneNumber?: string;
  timezone?: string;
}

export interface CreateRecruiterProfileResponse extends ApiResponse<RecruiterProfile> {}

// PUT /api/recruiter/profile
export interface UpdateRecruiterProfileRequest {
  organizationName?: string;
  recruitingFor?: string;
  contactEmail?: string;
  phoneNumber?: string;
  timezone?: string;
}

export interface UpdateRecruiterProfileResponse extends ApiResponse<RecruiterProfile> {}

// =============================================================================
// JOB POSTING ENDPOINTS
// =============================================================================

// GET /api/recruiter/jobs
export interface GetJobPostingsQuery {
  page?: number;
  limit?: number;
  status?: 'active' | 'paused' | 'closed' | 'draft';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface GetJobPostingsResponse extends PaginatedResponse<JobPosting> {}

// GET /api/recruiter/jobs/[id]
export interface GetJobPostingResponse extends ApiResponse<JobPosting> {}

// POST /api/recruiter/jobs
export interface CreateJobPostingRequest {
  title: string;
  description: string;
  location?: string;
  remoteAllowed?: boolean;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive' | 'intern';
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export interface CreateJobPostingResponse extends ApiResponse<{
  job: JobPosting;
  analysis: JobAnalysisResult;
}> {}

// PUT /api/recruiter/jobs/[id]
export interface UpdateJobPostingRequest {
  title?: string;
  description?: string;
  location?: string;
  remoteAllowed?: boolean;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive' | 'intern';
  salaryMin?: number;
  salaryMax?: number;
  status?: 'active' | 'paused' | 'closed' | 'draft';
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export interface UpdateJobPostingResponse extends ApiResponse<JobPosting> {}

// DELETE /api/recruiter/jobs/[id]
export interface DeleteJobPostingResponse extends ApiResponse<{ deleted: boolean }> {}

// GET /api/recruiter/jobs/[id]/candidates
export interface GetJobCandidatesQuery {
  page?: number;
  limit?: number;
  skills?: string[];
  experienceLevel?: ('entry' | 'mid' | 'senior' | 'executive' | 'intern')[];
  location?: string;
  remoteOnly?: boolean;
  minMatchScore?: number;
  sortBy?: 'matchScore' | 'name' | 'experienceLevel';
  sortOrder?: 'asc' | 'desc';
  availability?: {
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
}

export interface GetJobCandidatesResponse extends PaginatedResponse<CandidateWithMatch> {
  data: CandidateWithMatch[];
  summary: {
    totalCandidates: number;
    averageMatchScore: number;
    topSkills: string[];
  };
}

// =============================================================================
// CANDIDATE AVAILABILITY ENDPOINTS
// =============================================================================

// GET /api/availability
export interface GetAvailabilityQuery {
  startDate?: string;
  endDate?: string;
  status?: 'available' | 'booked' | 'unavailable';
  includeInterviews?: boolean;
}

export interface GetAvailabilityResponse extends ApiResponse<{
  availability: CandidateAvailability[];
  upcomingInterviews?: InterviewSession[];
}> {}

// POST /api/availability
export interface CreateAvailabilityRequest {
  startTime: string; // ISO string
  endTime: string; // ISO string
  timezone: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
    maxOccurrences?: number;
  };
}

export interface CreateAvailabilityResponse extends ApiResponse<CandidateAvailability> {}

// PUT /api/availability/[id]
export interface UpdateAvailabilityRequest {
  startTime?: string;
  endTime?: string;
  timezone?: string;
  status?: 'available' | 'booked' | 'unavailable';
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
    maxOccurrences?: number;
  };
}

export interface UpdateAvailabilityResponse extends ApiResponse<CandidateAvailability> {}

// DELETE /api/availability/[id]
export interface DeleteAvailabilityResponse extends ApiResponse<{
  deleted: boolean;
  conflictingInterviews?: InterviewSession[];
}> {}

// =============================================================================
// INTERVIEW SCHEDULING ENDPOINTS
// =============================================================================

// GET /api/interviews
export interface GetInterviewsQuery {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  startDate?: string;
  endDate?: string;
  jobPostingId?: string;
  candidateId?: string;
  recruiterId?: string;
  sortBy?: 'scheduledStart' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface GetInterviewsResponse extends PaginatedResponse<InterviewSession> {}

// GET /api/interviews/[id]
export interface GetInterviewResponse extends ApiResponse<InterviewSession> {}

// POST /api/interviews/schedule
export interface ScheduleInterviewRequest {
  jobPostingId: string;
  candidateId: string;
  preferredTimes: TimeSlot[];
  interviewType: 'video' | 'phone' | 'in-person';
  duration: number; // minutes
  notes?: string;
  timezone: string;
}

export interface ScheduleInterviewResponse extends ApiResponse<{
  interview?: InterviewSession;
  suggestedTimes?: TimeSlot[];
  conflicts?: ConflictInfo[];
}> {}

// PUT /api/interviews/[id]/confirm
export interface ConfirmInterviewRequest {
  confirmed: boolean;
  notes?: string;
}

export interface ConfirmInterviewResponse extends ApiResponse<InterviewSession> {}

// PUT /api/interviews/[id]/reschedule
export interface RescheduleInterviewRequest {
  newStartTime: string;
  newEndTime: string;
  timezone: string;
  reason?: string;
}

export interface RescheduleInterviewResponse extends ApiResponse<InterviewSession> {}

// DELETE /api/interviews/[id]
export interface CancelInterviewRequest {
  reason?: string;
  notifyParties?: boolean;
}

export interface CancelInterviewResponse extends ApiResponse<{
  cancelled: boolean;
  interview: InterviewSession;
}> {}

// =============================================================================
// NOTIFICATION ENDPOINTS
// =============================================================================

// GET /api/notifications
export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: 'interview_scheduled' | 'interview_confirmed' | 'interview_cancelled' | 'interview_rescheduled' | 'availability_updated' | 'job_posted' | 'candidate_matched' | 'application_received';
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'sentAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetNotificationsResponse extends PaginatedResponse<InterviewNotification> {}

// POST /api/notifications/mark-read
export interface MarkNotificationsReadRequest {
  notificationIds: string[];
}

export interface MarkNotificationsReadResponse extends ApiResponse<{
  markedCount: number;
}> {}

// GET /api/notifications/preferences
export interface GetNotificationPreferencesResponse extends ApiResponse<NotificationPreferences> {}

// PUT /api/notifications/preferences
export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreferences;
}

export interface UpdateNotificationPreferencesResponse extends ApiResponse<NotificationPreferences> {}

// =============================================================================
// ANALYTICS AND REPORTING ENDPOINTS
// =============================================================================

// GET /api/recruiter/analytics/dashboard
export interface GetRecruiterAnalyticsResponse extends ApiResponse<{
  activeJobs: number;
  totalCandidates: number;
  scheduledInterviews: number;
  completedInterviews: number;
  averageMatchScore: number;
  topSkills: string[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
  interviewStats: {
    thisWeek: number;
    thisMonth: number;
    completionRate: number;
  };
}> {}

// GET /api/candidate/analytics/dashboard
export interface GetCandidateAnalyticsResponse extends ApiResponse<{
  availableSlots: number;
  scheduledInterviews: number;
  completedInterviews: number;
  jobMatches: number;
  averageMatchScore: number;
  topMatchingSkills: string[];
  upcomingInterviews: InterviewSession[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
}> {}

// =============================================================================
// VALIDATION SCHEMAS FOR API ENDPOINTS
// =============================================================================

// Query parameter schemas
export const getJobPostingsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['active', 'paused', 'closed', 'draft']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getJobCandidatesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'executive', 'intern'])).optional(),
  location: z.string().optional(),
  remoteOnly: z.boolean().optional(),
  minMatchScore: z.coerce.number().min(0).max(100).optional(),
  sortBy: z.enum(['matchScore', 'name', 'experienceLevel']).default('matchScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  availability: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    timezone: z.string().optional(),
  }).optional(),
});

export const getAvailabilityQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['available', 'booked', 'unavailable']).optional(),
  includeInterviews: z.boolean().default(false),
});

export const getInterviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  jobPostingId: z.string().optional(),
  candidateId: z.string().optional(),
  recruiterId: z.string().optional(),
  sortBy: z.enum(['scheduledStart', 'createdAt', 'status']).default('scheduledStart'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  read: z.boolean().optional(),
  type: z.enum([
    'interview_scheduled',
    'interview_confirmed',
    'interview_cancelled',
    'interview_rescheduled',
    'availability_updated',
    'job_posted',
    'candidate_matched',
    'application_received'
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'sentAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// UTILITY TYPES FOR API HANDLERS
// =============================================================================

// Next.js API route handler types
export type ApiHandler<T = any> = (
  req: Request,
  context?: { params?: Record<string, string> }
) => Promise<Response>;

// API route context
export interface ApiContext {
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
}

// API middleware function type
export type ApiMiddleware = (
  req: Request,
  context: ApiContext,
  next: () => Promise<Response>
) => Promise<Response>;

// Error handler type
export type ErrorHandler = (
  error: unknown,
  req: Request,
  context: ApiContext
) => Response;

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

// Webhook event types
export type WebhookEventType = 
  | 'interview.scheduled'
  | 'interview.confirmed'
  | 'interview.cancelled'
  | 'interview.completed'
  | 'job.posted'
  | 'candidate.matched'
  | 'availability.updated';

// Webhook payload
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

// Webhook endpoint configuration
export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// RATE LIMITING TYPES
// =============================================================================

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// Rate limit status
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// =============================================================================
// CACHING TYPES
// =============================================================================

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
  revalidate?: boolean;
}

// Cache entry
export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  ttl: number;
  tags: string[];
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type {
  // Re-export from interview-management for convenience
  RecruiterProfile,
  JobPosting,
  CandidateAvailability,
  InterviewSession,
  CandidateJobMatch,
  InterviewNotification,
  TimeSlot,
  ConflictInfo,
  JobAnalysisResult,
  CandidateWithMatch,
  NotificationPreferences,
  ApiResponse,
  PaginatedResponse,
};