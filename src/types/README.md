# Interview Management System Types

This directory contains comprehensive TypeScript types, interfaces, and validation schemas for the Interview Management System.

## Overview

The type system is organized into several modules:

- **`interview-management.ts`** - Core data models and business logic types
- **`database.ts`** - Database utility types and error handling
- **`api.ts`** - API endpoint types and request/response schemas
- **`index.ts`** - Barrel exports for easy importing

## Core Data Models

### RecruiterProfile
Represents a recruiter's profile information.

```typescript
interface RecruiterProfile {
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
```

### JobPosting
Represents a job posting with AI-extracted information.

```typescript
interface JobPosting {
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
```

### CandidateAvailability
Represents a candidate's available time slots for interviews.

```typescript
interface CandidateAvailability {
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
```

### InterviewSession
Represents a scheduled interview session.

```typescript
interface InterviewSession {
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
```

## Validation Schemas

All data models include comprehensive Zod validation schemas:

### Recruiter Profile Validation
```typescript
const createRecruiterProfileSchema = z.object({
  organizationName: z.string().min(1).max(255),
  recruitingFor: z.string().min(1).max(255),
  contactEmail: z.string().email().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  timezone: z.string().min(1).default('UTC'),
});
```

### Job Posting Validation
```typescript
const createJobPostingSchema = z.object({
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
```

### Availability Validation
```typescript
const createAvailabilitySchema = z.object({
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
```

## API Types

### Request/Response Types
Each API endpoint has corresponding request and response types:

```typescript
// GET /api/recruiter/jobs
interface GetJobPostingsQuery {
  page?: number;
  limit?: number;
  status?: 'active' | 'paused' | 'closed' | 'draft';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface GetJobPostingsResponse extends PaginatedResponse<JobPosting> {}

// POST /api/recruiter/jobs
interface CreateJobPostingRequest {
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

interface CreateJobPostingResponse extends ApiResponse<{
  job: JobPosting;
  analysis: JobAnalysisResult;
}> {}
```

## Utility Functions

### Match Score Calculation
```typescript
function calculateMatchScore(
  candidateSkills: Skill[], 
  requiredSkills: Skill[], 
  preferredSkills: Skill[] = []
): number {
  // Returns a score from 0-100 based on skill matching
  // 70% weight for required skills, 30% for preferred skills
}
```

### Time Slot Management
```typescript
function isTimeSlotConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Checks if two time slots overlap
}

function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  duration: number, // minutes
  timezone: string
): TimeSlot[] {
  // Generates available time slots within a date range
}
```

### Overall Fit Assessment
```typescript
function determineOverallFit(matchScore: number): OverallFit {
  // Returns 'excellent', 'good', 'fair', or 'poor' based on match score
}
```

## Type Guards

Type guards are provided for runtime type checking:

```typescript
function isValidTimeSlot(slot: any): slot is TimeSlot;
function isValidRecruiterProfile(profile: any): profile is RecruiterProfile;
function isValidJobPosting(job: any): job is JobPosting;
```

## Error Handling

Comprehensive error types for API responses:

```typescript
interface ApiError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  field?: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId?: string;
}

interface ValidationError extends ApiError {
  category: 'validation';
  field: string;
  value?: any;
  constraint?: string;
}
```

## Usage Examples

### Creating a Job Posting
```typescript
import { createJobPostingSchema, CreateJobPostingRequest } from '~/types';

const jobData: CreateJobPostingRequest = {
  title: 'Senior Software Engineer',
  description: 'We are looking for a senior software engineer...',
  location: 'San Francisco, CA',
  remoteAllowed: true,
  employmentType: 'full-time',
  experienceLevel: 'senior',
  salaryMin: 120000,
  salaryMax: 180000,
  requiredSkills: ['JavaScript', 'React', 'Node.js'],
  preferredSkills: ['TypeScript', 'GraphQL'],
};

// Validate the data
const result = createJobPostingSchema.safeParse(jobData);
if (result.success) {
  // Data is valid, proceed with API call
  console.log('Valid job posting data:', result.data);
} else {
  // Handle validation errors
  console.error('Validation errors:', result.error.issues);
}
```

### Scheduling an Interview
```typescript
import { scheduleInterviewSchema, ScheduleInterviewRequest } from '~/types';

const interviewData: ScheduleInterviewRequest = {
  jobPostingId: 'job-123',
  candidateId: 'candidate-456',
  preferredTimes: [
    {
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T11:00:00Z'),
      timezone: 'America/New_York',
    },
  ],
  interviewType: 'video',
  duration: 60,
  timezone: 'America/New_York',
};

const result = scheduleInterviewSchema.safeParse(interviewData);
if (result.success) {
  // Schedule the interview
  console.log('Valid interview data:', result.data);
}
```

### Calculating Match Scores
```typescript
import { calculateMatchScore, determineOverallFit } from '~/types';

const candidateSkills = [
  { name: 'JavaScript', proficiencyScore: 85 },
  { name: 'React', proficiencyScore: 90 },
  { name: 'Node.js', proficiencyScore: 75 },
];

const requiredSkills = [
  { name: 'JavaScript', required: true },
  { name: 'React', required: true },
];

const preferredSkills = [
  { name: 'TypeScript' },
  { name: 'Node.js' },
];

const matchScore = calculateMatchScore(candidateSkills, requiredSkills, preferredSkills);
const overallFit = determineOverallFit(matchScore);

console.log(`Match Score: ${matchScore}%, Overall Fit: ${overallFit}`);
```

## Best Practices

1. **Always validate input data** using the provided Zod schemas
2. **Use type guards** for runtime type checking when dealing with unknown data
3. **Handle errors gracefully** using the structured error types
4. **Leverage utility functions** for common operations like match score calculation
5. **Use TypeScript strict mode** to catch type errors at compile time
6. **Import types from the main index** for consistency: `import { Type } from '~/types'`

## Testing

The types include comprehensive test coverage. Run tests with:

```bash
npm test src/types/__tests__/
```

## Contributing

When adding new types:

1. Add the interface/type to the appropriate module
2. Create corresponding Zod validation schemas
3. Add utility functions if needed
4. Include type guards for runtime checking
5. Add comprehensive tests
6. Update this documentation

## Dependencies

- **zod** - Runtime type validation
- **TypeScript** - Static type checking
- **vitest** - Testing framework (for tests)