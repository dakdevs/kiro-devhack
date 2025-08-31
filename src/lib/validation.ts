/**
 * Zod validation schemas for API endpoints and data validation
 */

import { z } from 'zod';
import { InputSanitizer } from '~/lib/security';

// Common validation patterns
export const idSchema = z.string()
  .min(1, 'ID is required')
  .max(50, 'ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'ID contains invalid characters');
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email address too long')
  .transform((email) => email.toLowerCase().trim())
  .refine((email) => InputSanitizer.validateEmail(email), 'Invalid email format');
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine((url) => InputSanitizer.validateURL(url), 'Invalid or unsafe URL');
export const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .max(20, 'Phone number too long')
  .refine((phone) => InputSanitizer.validatePhoneNumber(phone), 'Invalid phone number format');
export const timezoneSchema = z.string().min(1, 'Timezone is required');

// Date validation with timezone support
export const dateTimeSchema = z.string().datetime('Invalid datetime format');
export const futureDateTimeSchema = z.string().datetime().refine(
  (date) => new Date(date) > new Date(),
  'Date must be in the future'
);

// Text validation with sanitization
export const sanitizedTextSchema = (maxLength: number = 1000) => 
  z.string()
    .max(maxLength, `Text too long (max ${maxLength} characters)`)
    .transform((text) => InputSanitizer.sanitizeString(text))
    .refine((text) => text.length > 0, 'Text cannot be empty after trimming')
    .refine((text) => InputSanitizer.validateSQLSafety(text), 'Text contains potentially unsafe content');

export const optionalSanitizedTextSchema = (maxLength: number = 1000) =>
  z.string()
    .max(maxLength, `Text too long (max ${maxLength} characters)`)
    .transform((text) => InputSanitizer.sanitizeString(text))
    .refine((text) => InputSanitizer.validateSQLSafety(text), 'Text contains potentially unsafe content')
    .optional();

// Job posting validation schemas
export const jobPostingCreateSchema = z.object({
  title: sanitizedTextSchema(200),
  description: sanitizedTextSchema(10000),
  location: sanitizedTextSchema(200).optional(),
  salaryMin: z.number().int().min(0, 'Minimum salary must be non-negative').optional(),
  salaryMax: z.number().int().min(0, 'Maximum salary must be non-negative').optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive', 'intern']).optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship']).optional(),
  remoteAllowed: z.boolean().default(false),
  requiredSkills: z.array(sanitizedTextSchema(100)).max(50, 'Too many required skills').optional(),
  preferredSkills: z.array(sanitizedTextSchema(100)).max(50, 'Too many preferred skills').optional(),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  }
);

export const jobPostingUpdateSchema = jobPostingCreateSchema.partial();

// Interview scheduling validation schemas
export const timeSlotSchema = z.object({
  start: dateTimeSchema,
  end: dateTimeSchema,
}).refine(
  (slot) => new Date(slot.end) > new Date(slot.start),
  {
    message: 'End time must be after start time',
    path: ['end'],
  }
);

export const scheduleInterviewSchema = z.object({
  jobPostingId: idSchema,
  candidateId: idSchema,
  preferredTimes: z.array(timeSlotSchema)
    .min(1, 'At least one preferred time slot is required')
    .max(10, 'Too many preferred time slots'),
  duration: z.number()
    .int('Duration must be a whole number')
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  timezone: timezoneSchema,
  interviewType: z.enum(['video', 'phone', 'in-person']).default('video'),
  notes: optionalSanitizedTextSchema(1000),
});

export const confirmInterviewSchema = z.object({
  interviewId: idSchema,
  confirmed: z.boolean(),
  notes: optionalSanitizedTextSchema(1000),
});

export const rescheduleInterviewSchema = z.object({
  interviewId: idSchema,
  newTimeSlot: timeSlotSchema,
  reason: optionalSanitizedTextSchema(500),
});

// Availability validation schemas
export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  timezone: timezoneSchema,
}).refine(
  (slot) => slot.endTime > slot.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const createAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema)
    .min(1, 'At least one availability slot is required')
    .max(21, 'Too many availability slots'), // Max 3 slots per day * 7 days
  validFrom: dateTimeSchema,
  validUntil: dateTimeSchema,
}).refine(
  (data) => new Date(data.validUntil) > new Date(data.validFrom),
  {
    message: 'Valid until date must be after valid from date',
    path: ['validUntil'],
  }
);

// User profile validation schemas
export const candidateProfileSchema = z.object({
  firstName: sanitizedTextSchema(100),
  lastName: sanitizedTextSchema(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  location: sanitizedTextSchema(200).optional(),
  timezone: timezoneSchema,
  bio: optionalSanitizedTextSchema(2000),
  skills: z.array(sanitizedTextSchema(100)).max(50, 'Too many skills').optional(),
  experience: z.array(z.object({
    title: sanitizedTextSchema(200),
    company: sanitizedTextSchema(200),
    startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid date format (YYYY-MM)'),
    endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid date format (YYYY-MM)').optional(),
    description: optionalSanitizedTextSchema(1000),
  })).max(20, 'Too many experience entries').optional(),
  education: z.array(z.object({
    institution: sanitizedTextSchema(200),
    degree: sanitizedTextSchema(200),
    field: sanitizedTextSchema(200),
    graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 10),
  })).max(10, 'Too many education entries').optional(),
});

export const recruiterProfileSchema = z.object({
  firstName: sanitizedTextSchema(100),
  lastName: sanitizedTextSchema(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: sanitizedTextSchema(200),
  title: sanitizedTextSchema(200),
  timezone: timezoneSchema,
  bio: optionalSanitizedTextSchema(2000),
  specializations: z.array(sanitizedTextSchema(100)).max(20, 'Too many specializations').optional(),
});

// Notification validation schemas
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  interviewReminders: z.boolean().default(true),
  applicationUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  reminderTiming: z.number().int().min(5).max(1440).default(60), // 5 minutes to 24 hours
});

// Search and filter validation schemas
export const jobSearchSchema = z.object({
  query: optionalSanitizedTextSchema(200),
  location: optionalSanitizedTextSchema(200),
  remote: z.boolean().optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'executive', 'intern'])).optional(),
  jobType: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship'])).optional(),
  skills: z.array(sanitizedTextSchema(100)).max(20).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'date', 'salary']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  }
);

export const candidateSearchSchema = z.object({
  query: optionalSanitizedTextSchema(200),
  location: optionalSanitizedTextSchema(200),
  skills: z.array(sanitizedTextSchema(100)).max(20).optional(),
  experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'executive', 'intern'])).optional(),
  availability: z.enum(['immediate', 'within_month', 'within_quarter', 'not_looking']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'experience', 'match_score']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// API response validation schemas
export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }).optional(),
});

// Utility functions for validation
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fieldName?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(
        `Validation failed${fieldName ? ` for ${fieldName}` : ''}: ${firstError.message} at ${firstError.path.join('.')}`
      );
    }
    throw error;
  }
}

export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Partial<T> {
  if ('partial' in schema && typeof schema.partial === 'function') {
    const partialSchema = (schema as any).partial();
    return validateAndSanitize(partialSchema, data);
  }
  // Fallback for schemas that don't support partial
  return validateAndSanitize(schema, data) as Partial<T>;
}

// Sanitization utilities
export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function sanitizeFileName(filename: string): string {
  // Remove dangerous characters from filenames
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

// Timezone validation
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Date range validation
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date,
  maxRangeDays: number = 365
): { start: Date; end: Date } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (end <= start) {
    throw new Error('End date must be after start date');
  }
  
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > maxRangeDays) {
    throw new Error(`Date range cannot exceed ${maxRangeDays} days`);
  }
  
  return { start, end };
}

// Security-specific validation schemas
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const csrfTokenSchema = z.string()
  .length(32, 'Invalid CSRF token length')
  .regex(/^[A-Za-z0-9]+$/, 'Invalid CSRF token format');

export const ipAddressSchema = z.string()
  .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address format');

export const userAgentSchema = z.string()
  .max(512, 'User agent string too long')
  .transform((ua) => InputSanitizer.sanitizeString(ua));

export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters')
    .refine((name) => !name.startsWith('.'), 'Filename cannot start with a dot')
    .refine((name) => {
      const ext = name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'];
      return ext && allowedExtensions.includes(ext);
    }, 'File type not allowed'),
  size: z.number()
    .int('File size must be an integer')
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'), // 10MB limit
  mimeType: z.string()
    .refine((type) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return allowedTypes.includes(type);
    }, 'File type not allowed'),
});

// Rate limiting validation
export const rateLimitHeadersSchema = z.object({
  'x-ratelimit-limit': z.string().optional(),
  'x-ratelimit-remaining': z.string().optional(),
  'x-ratelimit-reset': z.string().optional(),
});

// Security headers validation
export const securityHeadersSchema = z.object({
  'x-csrf-token': csrfTokenSchema.optional(),
  'x-forwarded-for': z.string().optional(),
  'x-real-ip': ipAddressSchema.optional(),
  'user-agent': userAgentSchema.optional(),
  'origin': urlSchema.optional(),
  'referer': urlSchema.optional(),
});

// Input sanitization validation
export const sanitizedInputSchema = z.object({
  text: z.string()
    .transform((text) => InputSanitizer.sanitizeString(text))
    .refine((text) => InputSanitizer.validateSQLSafety(text), 'Input contains potentially unsafe content'),
  html: z.string()
    .transform((html) => sanitizeHtml(html))
    .refine((html) => !html.includes('<script'), 'HTML contains unsafe content'),
  json: z.string()
    .transform((json) => {
      try {
        const parsed = JSON.parse(json);
        return JSON.stringify(InputSanitizer.sanitizeObject(parsed));
      } catch {
        throw new Error('Invalid JSON format');
      }
    }),
});

// Enhanced validation with security checks
export function validateAndSanitizeSecure<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: {
    fieldName?: string;
    maxDepth?: number;
    allowUnsafeContent?: boolean;
  } = {}
): T {
  const { fieldName, maxDepth = 10, allowUnsafeContent = false } = options;

  // Pre-sanitize the data if it's an object
  if (data && typeof data === 'object' && !allowUnsafeContent) {
    data = InputSanitizer.sanitizeObject(data, maxDepth);
  }

  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(
        `Validation failed${fieldName ? ` for ${fieldName}` : ''}: ${firstError.message} at ${firstError.path.join('.')}`
      );
    }
    throw error;
  }
}

// Batch validation for arrays with security limits
export function validateBatchSecure<T>(
  schema: z.ZodSchema<T>,
  dataArray: unknown[],
  options: {
    maxItems?: number;
    fieldName?: string;
  } = {}
): T[] {
  const { maxItems = 100, fieldName } = options;

  if (!Array.isArray(dataArray)) {
    throw new Error(`${fieldName || 'Data'} must be an array`);
  }

  if (dataArray.length > maxItems) {
    throw new Error(`${fieldName || 'Array'} cannot contain more than ${maxItems} items`);
  }

  return dataArray.map((item, index) => {
    try {
      return validateAndSanitizeSecure(schema, item, {
        fieldName: `${fieldName || 'item'}[${index}]`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Validation failed for ${fieldName || 'item'} at index ${index}: ${errorMessage}`);
    }
  });
}

// Export type definitions for TypeScript
export type JobPostingCreate = z.infer<typeof jobPostingCreateSchema>;
export type JobPostingUpdate = z.infer<typeof jobPostingUpdateSchema>;
export type ScheduleInterview = z.infer<typeof scheduleInterviewSchema>;
export type ConfirmInterview = z.infer<typeof confirmInterviewSchema>;
export type RescheduleInterview = z.infer<typeof rescheduleInterviewSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type CreateAvailability = z.infer<typeof createAvailabilitySchema>;
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type RecruiterProfile = z.infer<typeof recruiterProfileSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type JobSearch = z.infer<typeof jobSearchSchema>;
export type CandidateSearch = z.infer<typeof candidateSearchSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type SecurityHeaders = z.infer<typeof securityHeadersSchema>;
export type SanitizedInput = z.infer<typeof sanitizedInputSchema>;