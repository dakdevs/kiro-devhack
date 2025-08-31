/**
 * Client-side form validation utilities
 */

import { z } from 'zod';
import { 
  jobPostingCreateSchema,
  scheduleInterviewSchema,
  candidateProfileSchema,
  recruiterProfileSchema,
  availabilitySlotSchema,
  notificationPreferencesSchema
} from './validation';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: any;
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Generic form validation function
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

/**
 * Validate a single field
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): FieldValidationResult {
  try {
    // Create a partial schema for the specific field
    const fieldSchema = schema.shape?.[fieldName as keyof typeof schema.shape];
    if (!fieldSchema) {
      return { isValid: true };
    }
    
    fieldSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Invalid value',
      };
    }
    
    return {
      isValid: false,
      error: 'Validation failed',
    };
  }
}

/**
 * Real-time validation hook for React forms
 */
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown) => validateForm(schema, data),
    validateField: (fieldName: string, value: unknown) => 
      validateField(schema, fieldName, value),
  };
}

/**
 * Job posting form validation
 */
export function validateJobPostingForm(data: unknown): ValidationResult {
  return validateForm(jobPostingCreateSchema, data);
}

/**
 * Interview scheduling form validation
 */
export function validateInterviewSchedulingForm(data: unknown): ValidationResult {
  return validateForm(scheduleInterviewSchema, data);
}

/**
 * Candidate profile form validation
 */
export function validateCandidateProfileForm(data: unknown): ValidationResult {
  return validateForm(candidateProfileSchema, data);
}

/**
 * Recruiter profile form validation
 */
export function validateRecruiterProfileForm(data: unknown): ValidationResult {
  return validateForm(recruiterProfileSchema, data);
}

/**
 * Availability form validation
 */
export function validateAvailabilityForm(data: unknown): ValidationResult {
  return validateForm(availabilitySlotSchema, data);
}

/**
 * Notification preferences form validation
 */
export function validateNotificationPreferencesForm(data: unknown): ValidationResult {
  return validateForm(notificationPreferencesSchema, data);
}

/**
 * Email validation
 */
export function validateEmail(email: string): FieldValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
}

/**
 * Phone number validation
 */
export function validatePhone(phone: string): FieldValidationResult {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  
  if (!phone) {
    return { isValid: true }; // Phone is optional in most cases
  }
  
  if (phone.length < 10 || phone.length > 20) {
    return { isValid: false, error: 'Phone number must be between 10 and 20 characters' };
  }
  
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true };
}

/**
 * Password validation
 */
export function validatePassword(password: string): FieldValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
}

/**
 * URL validation
 */
export function validateUrl(url: string): FieldValidationResult {
  if (!url) {
    return { isValid: true }; // URL is optional in most cases
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL must use http or https protocol' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Date validation
 */
export function validateDate(date: string | Date): FieldValidationResult {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  return { isValid: true };
}

/**
 * Future date validation
 */
export function validateFutureDate(date: string | Date): FieldValidationResult {
  const dateValidation = validateDate(date);
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (dateObj <= now) {
    return { isValid: false, error: 'Date must be in the future' };
  }
  
  return { isValid: true };
}

/**
 * Time slot validation
 */
export function validateTimeSlot(
  startTime: string | Date,
  endTime: string | Date
): FieldValidationResult {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid time format' };
  }
  
  if (end <= start) {
    return { isValid: false, error: 'End time must be after start time' };
  }
  
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  
  if (durationMinutes < 15) {
    return { isValid: false, error: 'Time slot must be at least 15 minutes long' };
  }
  
  if (durationMinutes > 480) {
    return { isValid: false, error: 'Time slot cannot exceed 8 hours' };
  }
  
  return { isValid: true };
}

/**
 * Salary range validation
 */
export function validateSalaryRange(
  minSalary?: number,
  maxSalary?: number
): FieldValidationResult {
  if (minSalary !== undefined && minSalary < 0) {
    return { isValid: false, error: 'Minimum salary cannot be negative' };
  }
  
  if (maxSalary !== undefined && maxSalary < 0) {
    return { isValid: false, error: 'Maximum salary cannot be negative' };
  }
  
  if (minSalary !== undefined && maxSalary !== undefined && maxSalary < minSalary) {
    return { isValid: false, error: 'Maximum salary must be greater than or equal to minimum salary' };
  }
  
  return { isValid: true };
}

/**
 * Skills array validation
 */
export function validateSkills(skills: string[]): FieldValidationResult {
  if (!Array.isArray(skills)) {
    return { isValid: false, error: 'Skills must be an array' };
  }
  
  if (skills.length > 50) {
    return { isValid: false, error: 'Too many skills (maximum 50)' };
  }
  
  for (const skill of skills) {
    if (typeof skill !== 'string' || skill.trim().length === 0) {
      return { isValid: false, error: 'All skills must be non-empty strings' };
    }
    
    if (skill.length > 100) {
      return { isValid: false, error: 'Skill names cannot exceed 100 characters' };
    }
  }
  
  return { isValid: true };
}

/**
 * File validation
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): FieldValidationResult {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;
  
  if (!file) {
    return required 
      ? { isValid: false, error: 'File is required' }
      : { isValid: true };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { isValid: false, error: `File size cannot exceed ${maxSizeMB}MB` };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }
  
  return { isValid: true };
}

/**
 * Timezone validation
 */
export function validateTimezone(timezone: string): FieldValidationResult {
  if (!timezone) {
    return { isValid: false, error: 'Timezone is required' };
  }
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid timezone' };
  }
}