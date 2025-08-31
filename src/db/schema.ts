import { pgTable, text, timestamp, vector, boolean, jsonb, index, bigserial, integer, decimal } from 'drizzle-orm/pg-core';

// Better Auth required tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
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
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Interview sessions - stores conversation/interview session data
export const interviewSessions = pgTable('interview_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  
  // Session metadata
  sessionType: text('session_type').notNull().default('interview'), // interview, practice, assessment
  title: text('title'), // Optional title for the session
  description: text('description'), // Optional description
  
  // Session metrics
  duration: integer('duration'), // Duration in minutes
  messageCount: integer('message_count').notNull().default(0),
  averageEngagement: text('average_engagement').default('medium'), // high, medium, low
  overallScore: text('overall_score').default('0'), // 0-100 overall performance score
  
  // Session analysis
  topicsExplored: jsonb('topics_explored'), // Array of topics discussed
  skillsIdentified: jsonb('skills_identified'), // Array of skills mentioned in this session
  finalAnalysis: jsonb('final_analysis'), // AI analysis summary
  
  // Status and timestamps
  status: text('status').notNull().default('active'), // active, completed, abandoned
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIndex: index('interview_sessions_user_idx').on(table.userId),
  statusIndex: index('interview_sessions_status_idx').on(table.status),
  dateIndex: index('interview_sessions_date_idx').on(table.startedAt),
}));

// User-centric skills tracking system
export const userSkills = pgTable('user_skills', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  skillName: text('skill_name').notNull(),
  
  // Frequency metrics
  mentionCount: integer('mention_count').notNull().default(0),
  lastMentioned: timestamp('last_mentioned').notNull().defaultNow(),
  
  // Proficiency metrics
  proficiencyScore: text('proficiency_score').notNull().default('0'), // Calculated based on engagement and confidence
  averageConfidence: text('average_confidence').notNull().default('0'), // Average confidence of skill detection
  averageEngagement: text('average_engagement').notNull().default('medium'), // Average engagement level when mentioned
  
  // Context information
  topicDepthAverage: text('topic_depth_average').notNull().default('0'), // How deep in conversations this skill appears
  firstMentioned: timestamp('first_mentioned').notNull().defaultNow(),
  
  // Metadata
  synonyms: jsonb('synonyms'), // Alternative names for this skill
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userSkillIndex: index('user_skills_user_skill_idx').on(table.userId, table.skillName),
  userIndex: index('user_skills_user_idx').on(table.userId),
  skillNameIndex: index('user_skills_skill_name_idx').on(table.skillName),
  proficiencyIndex: index('user_skills_proficiency_idx').on(table.proficiencyScore),
}));

// Detailed skill mentions for audit trail and analysis
export const skillMentions = pgTable('skill_mentions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userSkillId: text('user_skill_id').notNull().references(() => userSkills.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => interviewSessions.id, { onDelete: 'cascade' }),
  messageIndex: integer('message_index'), // Which message in the session this was mentioned
  
  // Mention details
  mentionText: text('mention_text'), // The actual text where the skill was mentioned
  confidence: text('confidence'), // Confidence score of the skill detection (0-1)
  engagementLevel: text('engagement_level'), // high, medium, low
  topicDepth: text('topic_depth'), // How deep in the conversation tree this was mentioned
  
  // Context
  conversationContext: text('conversation_context'), // Brief context of what was being discussed
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userSkillIndex: index('skill_mentions_user_skill_idx').on(table.userSkillId),
  userIndex: index('skill_mentions_user_idx').on(table.userId),
  sessionIndex: index('skill_mentions_session_idx').on(table.sessionId),
  confidenceIndex: index('skill_mentions_confidence_idx').on(table.confidence),
}));

// Embeddings table for RAG functionality
export const embeddings = pgTable('embeddings', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => interviewSessions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }),
  messageIndex: integer('message_index'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('embeddings_user_idx').on(table.userId),
  sessionIdx: index('embeddings_session_idx').on(table.sessionId),
  embeddingIdx: index('embeddings_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));



// Interview Management System Tables

// Recruiter profiles table
export const recruiterProfiles = pgTable('recruiter_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name').notNull(),
  recruitingFor: text('recruiting_for').notNull(),
  contactEmail: text('contact_email'),
  phoneNumber: text('phone_number'),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIndex: index('recruiter_profiles_user_idx').on(table.userId),
  organizationIndex: index('recruiter_profiles_organization_idx').on(table.organizationName),
}));

// Job postings table
export const jobPostings = pgTable('job_postings', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id').notNull().references(() => recruiterProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  rawDescription: text('raw_description').notNull(),
  extractedSkills: jsonb('extracted_skills'),
  requiredSkills: jsonb('required_skills'),
  preferredSkills: jsonb('preferred_skills'),
  experienceLevel: text('experience_level'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  location: text('location'),
  remoteAllowed: boolean('remote_allowed').default(false),
  employmentType: text('employment_type').default('full-time'),
  status: text('status').notNull().default('active'),
  aiConfidenceScore: decimal('ai_confidence_score', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  recruiterIndex: index('job_postings_recruiter_idx').on(table.recruiterId),
  statusIndex: index('job_postings_status_idx').on(table.status),
  titleIndex: index('job_postings_title_idx').on(table.title),
  locationIndex: index('job_postings_location_idx').on(table.location),
  experienceLevelIndex: index('job_postings_experience_level_idx').on(table.experienceLevel),
}));

// Candidate availability table
export const candidateAvailability = pgTable('candidate_availability', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'),
  status: text('status').notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIndex: index('candidate_availability_user_idx').on(table.userId),
  timeRangeIndex: index('candidate_availability_time_range_idx').on(table.startTime, table.endTime),
  statusIndex: index('candidate_availability_status_idx').on(table.status),
}));

// Interview sessions for scheduling (separate from conversation sessions)
export const interviewSessionsScheduled = pgTable('interview_sessions_scheduled', {
  id: text('id').primaryKey(),
  jobPostingId: text('job_posting_id').notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  candidateId: text('candidate_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  recruiterId: text('recruiter_id').notNull().references(() => recruiterProfiles.id, { onDelete: 'cascade' }),
  scheduledStart: timestamp('scheduled_start').notNull(),
  scheduledEnd: timestamp('scheduled_end').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  status: text('status').notNull().default('scheduled'),
  interviewType: text('interview_type').default('video'),
  meetingLink: text('meeting_link'),
  notes: text('notes'),
  candidateConfirmed: boolean('candidate_confirmed').default(false),
  recruiterConfirmed: boolean('recruiter_confirmed').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  jobPostingIndex: index('interview_sessions_scheduled_job_posting_idx').on(table.jobPostingId),
  candidateIndex: index('interview_sessions_scheduled_candidate_idx').on(table.candidateId),
  recruiterIndex: index('interview_sessions_scheduled_recruiter_idx').on(table.recruiterId),
  statusIndex: index('interview_sessions_scheduled_status_idx').on(table.status),
  scheduledTimeIndex: index('interview_sessions_scheduled_time_idx').on(table.scheduledStart),
}));

// Candidate job matches table
export const candidateJobMatches = pgTable('candidate_job_matches', {
  id: text('id').primaryKey(),
  jobPostingId: text('job_posting_id').notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  candidateId: text('candidate_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  matchScore: decimal('match_score', { precision: 5, scale: 2 }).notNull(),
  matchingSkills: jsonb('matching_skills'),
  skillGaps: jsonb('skill_gaps'),
  overallFit: text('overall_fit'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  jobPostingIndex: index('candidate_job_matches_job_posting_idx').on(table.jobPostingId),
  candidateIndex: index('candidate_job_matches_candidate_idx').on(table.candidateId),
  matchScoreIndex: index('candidate_job_matches_match_score_idx').on(table.matchScore),
  overallFitIndex: index('candidate_job_matches_overall_fit_idx').on(table.overallFit),
}));

// Notifications table
export const interviewNotifications = pgTable('interview_notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  read: boolean('read').default(false),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIndex: index('interview_notifications_user_idx').on(table.userId),
  typeIndex: index('interview_notifications_type_idx').on(table.type),
  readIndex: index('interview_notifications_read_idx').on(table.read),
  createdAtIndex: index('interview_notifications_created_at_idx').on(table.createdAt),
}));