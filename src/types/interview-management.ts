import { z } from 'zod';

// =============================================================================
// CORE DATA INTERFACES
// =============================================================================

// Recruiter Profile Interface
export interface RecruiterProfile {
  id: string;
  userId: string;
  organizationName: string;
  recruitingFor: string;
  contactEmail?: string;
  phoneNumber?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job Posting Interface
export interface JobPosting {
  id: string;
  recruiterId: string;
  title: string;
  rawDescription: string;
  extractedSkills?: ExtractedSkill[];
  requiredSkills?: Skill[];
  preferredSkills?: Skill[];
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  remoteAllowed: boolean;
  employmentType: string;
  status: JobPostingStatus;
  aiConfidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Candidate Availability Interface
export interface CandidateAvailability {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  status: AvailabilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Interview Session Interface (for scheduled interviews)
export interface InterviewSession {
  id: string;
  jobPostingId: string;
  candidateId: string;
  recruiterId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  timezone: string;
  status: InterviewStatus;
  interviewType: InterviewType;
  meetingLink?: string;
  notes?: string;
  candidateConfirmed: boolean;
  recruiterConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Candidate Job Match Interface
export interface CandidateJobMatch {
  id: string;
  jobPostingId: string;
  candidateId: string;
  matchScore: number;
  matchingSkills?: Skill[];
  skillGaps?: Skill[];
  overallFit?: OverallFit;
  createdAt: Date;
  updatedAt: Date;
}

// Interview Notification Interface
export interface InterviewNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  sentAt?: Date;
  createdAt: Date;
}

// =============================================================================
// SUPPORTING TYPES AND ENUMS
// =============================================================================

// Job Posting Status
export type JobPostingStatus = 'active' | 'paused' | 'closed' | 'draft';

// Availability Status
export type AvailabilityStatus = 'available' | 'booked' | 'unavailable';

// Interview Status
export type InterviewStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

// Interview Type
export type InterviewType = 'video' | 'phone' | 'in-person';

// Overall Fit Assessment
export type OverallFit = 'excellent' | 'good' | 'fair' | 'poor';

// Notification Types
export type NotificationType = 
  | 'interview_scheduled' 
  | 'interview_confirmed' 
  | 'interview_cancelled' 
  | 'interview_rescheduled'
  | 'availability_updated'
  | 'job_posted'
  | 'candidate_matched'
  | 'application_received';

// Experience Levels
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive' | 'intern';

// Employment Types
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';

// Skill Interface
export interface Skill {
  name: string;
  proficiencyScore?: number;
  required?: boolean;
  category?: SkillCategory;
}

// Skill Categories
export type SkillCategory = 'technical' | 'soft' | 'domain' | 'language' | 'certification';

// Extracted Skill (from AI analysis)
export interface ExtractedSkill {
  name: string;
  confidence: number;
  category: SkillCategory;
  synonyms?: string[];
  context?: string;
}

// Recurrence Pattern for availability
export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
  maxOccurrences?: number;
}

// Recurrence Types
export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

// Time Slot Interface
export interface TimeSlot {
  start: Date;
  end: Date;
  timezone: string;
}

// Conflict Information
export interface ConflictInfo {
  type: ConflictType;
  conflictingSlot: TimeSlot;
  description: string;
  interviewId?: string;
}

// Conflict Types
export type ConflictType = 'existing_interview' | 'unavailable' | 'outside_hours' | 'timezone_mismatch';

// Notification Data (flexible JSON structure)
export interface NotificationData {
  interviewId?: string;
  jobPostingId?: string;
  candidateName?: string;
  recruiterName?: string;
  jobTitle?: string;
  scheduledTime?: Date;
  meetingLink?: string;
  previousTime?: Date;
  newTime?: Date;
  reason?: string;
  [key: string]: any; // Allow additional properties
}

// =============================================================================
// API REQUEST/RESPONSE UTILITY TYPES
// =============================================================================

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated Response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// RECRUITER PROFILE API TYPES
// =============================================================================

export interface CreateRecruiterProfileRequest {
  organizationName: string;
  recruitingFor: string;
  contactEmail?: string;
  phoneNumber?: string;
  timezone?: string;
}

export interface UpdateRecruiterProfileRequest {
  organizationName?: string;
  recruitingFor?: string;
  contactEmail?: string;
  phoneNumber?: string;
  timezone?: string;
}

export interface RecruiterProfileResponse extends ApiResponse<RecruiterProfile> {}

// =============================================================================
// JOB POSTING API TYPES
// =============================================================================

export interface CreateJobPostingRequest {
  title: string;
  description: string;
  location?: string;
  remoteAllowed?: boolean;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export interface UpdateJobPostingRequest {
  title?: string;
  description?: string;
  location?: string;
  remoteAllowed?: boolean;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  status?: JobPostingStatus;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export interface JobPostingResponse extends ApiResponse<JobPosting> {}

export interface JobPostingsResponse extends PaginatedResponse<JobPosting> {}

// Job Analysis Result (from AI)
export interface JobAnalysisResult {
  extractedSkills: ExtractedSkill[];
  requiredSkills: Skill[];
  preferredSkills: Skill[];
  experienceLevel?: ExperienceLevel;
  salaryRange?: {
    min?: number;
    max?: number;
  };
  keyTerms: string[];
  confidence: number;
  summary?: string;
}

export interface CreateJobPostingResponse extends ApiResponse<{
  job: JobPosting;
  analysis: JobAnalysisResult;
}> {}

// =============================================================================
// AVAILABILITY API TYPES
// =============================================================================

export interface CreateAvailabilityRequest {
  startTime: string; // ISO string
  endTime: string; // ISO string
  timezone: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface UpdateAvailabilityRequest {
  startTime?: string;
  endTime?: string;
  timezone?: string;
  status?: AvailabilityStatus;
  recurrencePattern?: RecurrencePattern;
}

export interface AvailabilityResponse extends ApiResponse<CandidateAvailability> {}

export interface AvailabilityListResponse extends ApiResponse<{
  availability: CandidateAvailability[];
  upcomingInterviews: InterviewSession[];
}> {}

export interface DeleteAvailabilityResponse extends ApiResponse<{
  deleted: boolean;
  conflictingInterviews?: InterviewSession[];
}> {}

// =============================================================================
// CANDIDATE MATCHING API TYPES
// =============================================================================

export interface CandidateFilters {
  skills?: string[];
  experienceLevel?: ExperienceLevel[];
  location?: string;
  remoteOnly?: boolean;
  minMatchScore?: number;
  availability?: {
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
}

export interface CandidateWithMatch {
  candidate: {
    id: string;
    name: string;
    email: string;
    skills: Skill[];
    experienceLevel?: string;
    location?: string;
  };
  match: {
    score: number;
    matchingSkills: Skill[];
    skillGaps: Skill[];
    overallFit: OverallFit;
    availability: CandidateAvailability[];
  };
}

export interface CandidateMatchResponse extends PaginatedResponse<CandidateWithMatch> {
  data: CandidateWithMatch[];
  filters: CandidateFilters;
  summary: {
    totalCandidates: number;
    averageMatchScore: number;
    topSkills: string[];
  };
}

// =============================================================================
// INTERVIEW SCHEDULING API TYPES
// =============================================================================

export interface ScheduleInterviewRequest {
  jobPostingId: string;
  candidateId: string;
  preferredTimes: TimeSlot[];
  interviewType: InterviewType;
  duration: number; // minutes
  notes?: string;
  timezone: string;
}

export interface ScheduleInterviewResponse extends ApiResponse<{
  interview?: InterviewSession;
  suggestedTimes?: TimeSlot[];
  conflicts?: ConflictInfo[];
}> {}

export interface ConfirmInterviewRequest {
  confirmed: boolean;
  notes?: string;
}

export interface ConfirmInterviewResponse extends ApiResponse<InterviewSession> {}

export interface RescheduleInterviewRequest {
  newStartTime: string;
  newEndTime: string;
  timezone: string;
  reason?: string;
}

export interface InterviewListResponse extends PaginatedResponse<InterviewSession> {}

// =============================================================================
// NOTIFICATION API TYPES
// =============================================================================

export interface NotificationListResponse extends PaginatedResponse<InterviewNotification> {}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  types: NotificationType[];
}

export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreferences;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

// Base validation schemas
export const timeSlotSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
  timezone: z.string().min(1),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  proficiencyScore: z.number().min(0).max(100).optional(),
  required: z.boolean().optional(),
  category: z.enum(['technical', 'soft', 'domain', 'language', 'certification']).optional(),
});

export const recurrencePatternSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().min(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endDate: z.coerce.date().optional(),
  maxOccurrences: z.number().min(1).optional(),
});

// Recruiter Profile Schemas
export const createRecruiterProfileSchema = z.object({
  organizationName: z.string().min(1).max(255),
  recruitingFor: z.string().min(1).max(255),
  contactEmail: z.string().email().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  timezone: z.string().min(1).default('UTC'),
});

export const updateRecruiterProfileSchema = createRecruiterProfileSchema.partial();

// Job Posting Schemas
export const createJobPostingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(10),
  location: z.string().max(255).optional(),
  remoteAllowed: z.boolean().default(false),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship']).default('full-time'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive', 'intern']).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMax >= data.salaryMin;
  }
  return true;
}, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salaryMax"],
});

export const updateJobPostingSchema = createJobPostingSchema.partial().extend({
  status: z.enum(['active', 'paused', 'closed', 'draft']).optional(),
});

// Availability Schemas
export const createAvailabilitySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string().min(1),
  isRecurring: z.boolean().default(false),
  recurrencePattern: recurrencePatternSchema.optional(),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
}).refine((data) => {
  const start = new Date(data.startTime);
  return start > new Date();
}, {
  message: "Start time must be in the future",
  path: ["startTime"],
});

export const updateAvailabilitySchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  timezone: z.string().min(1).optional(),
  status: z.enum(['available', 'booked', 'unavailable']).optional(),
  recurrencePattern: recurrencePatternSchema.optional(),
});

// Interview Scheduling Schemas
export const scheduleInterviewSchema = z.object({
  jobPostingId: z.string().min(1),
  candidateId: z.string().min(1),
  preferredTimes: z.array(timeSlotSchema).min(1),
  interviewType: z.enum(['video', 'phone', 'in-person']).default('video'),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  notes: z.string().max(1000).optional(),
  timezone: z.string().min(1),
});

export const confirmInterviewSchema = z.object({
  confirmed: z.boolean(),
  notes: z.string().max(1000).optional(),
});

export const rescheduleInterviewSchema = z.object({
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime(),
  timezone: z.string().min(1),
  reason: z.string().max(500).optional(),
}).refine((data) => {
  const start = new Date(data.newStartTime);
  const end = new Date(data.newEndTime);
  return end > start;
}, {
  message: "New end time must be after new start time",
  path: ["newEndTime"],
});

// Candidate Filtering Schema
export const candidateFiltersSchema = z.object({
  skills: z.array(z.string()).optional(),
  experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'executive', 'intern'])).optional(),
  location: z.string().optional(),
  remoteOnly: z.boolean().optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
  availability: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    timezone: z.string().optional(),
  }).optional(),
});

// Notification Schemas
export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
});

export const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  inApp: z.boolean(),
  types: z.array(z.enum([
    'interview_scheduled',
    'interview_confirmed',
    'interview_cancelled',
    'interview_rescheduled',
    'availability_updated',
    'job_posted',
    'candidate_matched',
    'application_received'
  ])),
});

export const updateNotificationPreferencesSchema = z.object({
  preferences: notificationPreferencesSchema,
});

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

export function isValidTimeSlot(slot: any): slot is TimeSlot {
  return (
    slot &&
    typeof slot === 'object' &&
    slot.start instanceof Date &&
    slot.end instanceof Date &&
    typeof slot.timezone === 'string' &&
    slot.end > slot.start
  );
}

export function isValidRecruiterProfile(profile: any): profile is RecruiterProfile {
  return (
    profile &&
    typeof profile === 'object' &&
    typeof profile.id === 'string' &&
    typeof profile.userId === 'string' &&
    typeof profile.organizationName === 'string' &&
    typeof profile.recruitingFor === 'string'
  );
}

export function isValidJobPosting(job: any): job is JobPosting {
  return (
    job &&
    typeof job === 'object' &&
    typeof job.id === 'string' &&
    typeof job.recruiterId === 'string' &&
    typeof job.title === 'string' &&
    typeof job.rawDescription === 'string'
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function calculateMatchScore(candidateSkills: Skill[], requiredSkills: Skill[], preferredSkills: Skill[] = []): number {
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    return 0;
  }

  const candidateSkillNames = new Set(candidateSkills.map(s => s.name.toLowerCase()));
  
  // Calculate required skills match (70% weight)
  const requiredMatches = requiredSkills.filter(skill => 
    candidateSkillNames.has(skill.name.toLowerCase())
  ).length;
  const requiredScore = requiredSkills.length > 0 ? requiredMatches / requiredSkills.length : 1;

  // Calculate preferred skills match (30% weight)
  const preferredMatches = preferredSkills.filter(skill => 
    candidateSkillNames.has(skill.name.toLowerCase())
  ).length;
  const preferredScore = preferredSkills.length > 0 ? preferredMatches / preferredSkills.length : 0;

  // Weighted final score
  const finalScore = (requiredScore * 0.7) + (preferredScore * 0.3);
  return Math.round(finalScore * 100);
}

export function determineOverallFit(matchScore: number): OverallFit {
  if (matchScore >= 80) return 'excellent';
  if (matchScore >= 60) return 'good';
  if (matchScore >= 40) return 'fair';
  return 'poor';
}

export function formatTimeSlot(slot: TimeSlot): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: slot.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  
  return `${formatter.format(slot.start)} - ${formatter.format(slot.end)} (${slot.timezone})`;
}

export function isTimeSlotConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return (
    (slot1.start < slot2.end && slot1.end > slot2.start) ||
    (slot2.start < slot1.end && slot2.end > slot1.start)
  );
}

export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  duration: number, // minutes
  timezone: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const current = new Date(startDate);
  
  while (current < endDate) {
    const slotEnd = new Date(current.getTime() + duration * 60 * 1000);
    if (slotEnd <= endDate) {
      slots.push({
        start: new Date(current),
        end: slotEnd,
        timezone,
      });
    }
    current.setTime(current.getTime() + duration * 60 * 1000);
  }
  
  return slots;
}