import { pgTable, text, timestamp, vector, boolean, jsonb, index, bigserial } from 'drizzle-orm/pg-core';

// Better Auth required tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// Job applications and interview management
export const jobApplications = pgTable('job_applications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  jobTitle: text('job_title').notNull(),
  company: text('company').notNull(),
  jobUrl: text('job_url'),
  status: text('status').notNull().default('applied'), // applied, interview_scheduled, interviewed, rejected, offered
  applicationDate: timestamp('application_date').notNull().defaultNow(),
  notes: text('notes'),
  salary: text('salary'),
  location: text('location'),
  jobType: text('job_type'), // full-time, part-time, contract, remote
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const interviews = pgTable('interviews', {
  id: text('id').primaryKey(),
  jobApplicationId: text('job_application_id').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  interviewType: text('interview_type').notNull(), // phone, video, in-person, technical
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: text('duration'), // e.g., "60 minutes"
  interviewerName: text('interviewer_name'),
  interviewerEmail: text('interviewer_email'),
  meetingLink: text('meeting_link'),
  location: text('location'),
  notes: text('notes'),
  status: text('status').notNull().default('scheduled'), // scheduled, completed, cancelled, rescheduled
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  resume: text('resume'), // URL to resume file
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  portfolioUrl: text('portfolio_url'),
  skills: text('skills'), // JSON array of skills
  experience: text('experience'), // JSON object with experience details
  preferences: text('preferences'), // JSON object with job preferences
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Example table with pgvector support
export const embeddings = pgTable('embeddings', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, {
    onDelete: 'cascade'
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  finalAnalysis: jsonb('final_analysis'),
}, (table) => ({
  userIndex: index('conversation_user_idx').on(table.userId),
}));

export const userResponses = pgTable('user_responses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }).notNull(),
}, (table) => ({
  embeddingIdx: index('response_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));

// Recruiter-specific tables
export const recruiterProfiles = pgTable('recruiter_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  companyDescription: text('company_description'),
  companyWebsite: text('company_website'),
  companyLogo: text('company_logo'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  googleCalendarId: text('google_calendar_id'),
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobPostings = pgTable('job_postings', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id').notNull().references(() => recruiterProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  responsibilities: text('responsibilities'),
  salaryMin: text('salary_min'),
  salaryMax: text('salary_max'),
  location: text('location').notNull(),
  jobType: text('job_type').notNull(), // full-time, part-time, contract, remote
  experienceLevel: text('experience_level'), // entry, mid, senior, executive
  skills: text('skills'), // JSON array of required skills
  benefits: text('benefits'),
  applicationDeadline: timestamp('application_deadline'),
  status: text('status').notNull().default('active'), // active, paused, closed, draft
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const recruiterAvailability = pgTable('recruiter_availability', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id').notNull().references(() => recruiterProfiles.id, { onDelete: 'cascade' }),
  jobPostingId: text('job_posting_id').references(() => jobPostings.id, { onDelete: 'cascade' }),
  dayOfWeek: text('day_of_week').notNull(), // monday, tuesday, etc.
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  timezone: text('timezone').notNull().default('UTC'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobApplicationsFromCandidates = pgTable('job_applications_from_candidates', {
  id: text('id').primaryKey(),
  jobPostingId: text('job_posting_id').notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  candidateUserId: text('candidate_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  coverLetter: text('cover_letter'),
  resumeUrl: text('resume_url'),
  status: text('status').notNull().default('pending'), // pending, reviewing, interview_scheduled, rejected, hired
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


