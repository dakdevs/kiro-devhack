import { pgTable, text, timestamp, vector, boolean, jsonb } from 'drizzle-orm/pg-core';

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

// Documents table for Qwen3-4B embeddings (2560 dimensions)
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  embedding: vector('embedding', { dimensions: 2560 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Example table with pgvector support
export const embeddings = pgTable('embeddings', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});