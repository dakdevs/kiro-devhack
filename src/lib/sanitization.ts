/**
 * Data sanitization utilities for user input
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (can be used for XSS)
    .replace(/data:/gi, '')
    // Remove style attributes (can contain javascript)
    .replace(/style="[^"]*"/gi, '')
    .replace(/style='[^']*'/gi, '')
    // Remove potentially dangerous tags
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|option|link|meta|base)[^>]*>/gi, '')
    .replace(/<\/(iframe|object|embed|form|input|button|textarea|select|option|link|meta|base)>/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(input: string, maxLength?: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim
    .trim();

  // Truncate if max length specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, ''); // Keep only alphanumeric, @, ., and -
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  return phone
    .trim()
    .replace(/[^\d\s\-\(\)\+]/g, ''); // Keep only digits, spaces, hyphens, parentheses, and plus
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url.trim());
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  return filename
    // Remove path separators and dangerous characters
    .replace(/[\/\\:*?"<>|]/g, '_')
    // Remove control characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    // Normalize spaces
    .replace(/\s+/g, '_')
    // Remove leading/trailing dots and spaces
    .replace(/^[\.\s]+|[\.\s]+$/g, '')
    // Limit length
    .substring(0, 255)
    // Ensure it's not empty
    || 'file';
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(input: string): any {
  if (!input || typeof input !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(input.trim());
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Recursively sanitize object properties
 */
export function sanitizeObject(obj: any, maxDepth: number = 10): any {
  if (maxDepth <= 0) {
    return null;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .slice(0, 1000) // Limit array size
      .map(item => sanitizeObject(item, maxDepth - 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    const keys = Object.keys(obj).slice(0, 100); // Limit number of keys
    
    for (const key of keys) {
      const sanitizedKey = sanitizeText(key, 100);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(obj[key], maxDepth - 1);
      }
    }
    
    return sanitized;
  }

  return null;
}

/**
 * Sanitize SQL-like input to prevent injection
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove SQL keywords and dangerous characters
    .replace(/[';--]/g, '')
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b/gi, '')
    .trim();
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  return query
    // Remove special regex characters that could cause issues
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Limit length
    .substring(0, 200);
}

/**
 * Sanitize user input for display
 */
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize markdown content
 */
export function sanitizeMarkdown(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove potentially dangerous markdown
    .replace(/!\[.*?\]\(javascript:.*?\)/gi, '') // Remove javascript: image links
    .replace(/\[.*?\]\(javascript:.*?\)/gi, '') // Remove javascript: links
    .replace(/<script.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe.*?<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object.*?<\/object>/gi, '') // Remove object tags
    .replace(/<embed.*?>/gi, '') // Remove embed tags
    .trim();
}

/**
 * Sanitize CSV data
 */
export function sanitizeCsvField(field: string): string {
  if (!field || typeof field !== 'string') {
    return '';
  }

  return field
    // Remove potential CSV injection characters
    .replace(/^[=+\-@]/, '')
    // Escape quotes
    .replace(/"/g, '""')
    // Remove line breaks
    .replace(/[\r\n]/g, ' ')
    .trim();
}

/**
 * Sanitize color hex code
 */
export function sanitizeHexColor(color: string): string {
  if (!color || typeof color !== 'string') {
    return '#000000';
  }

  const cleaned = color.trim().toLowerCase();
  
  // Check if it's a valid hex color
  if (/^#[0-9a-f]{6}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Check if it's a 3-digit hex color
  if (/^#[0-9a-f]{3}$/.test(cleaned)) {
    return cleaned;
  }
  
  return '#000000'; // Default to black if invalid
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): number | null {
  const { min, max, integer = false } = options;
  
  let num: number;
  
  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    num = parseFloat(input.trim());
  } else {
    return null;
  }
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (integer) {
    num = Math.round(num);
  }
  
  if (min !== undefined && num < min) {
    num = min;
  }
  
  if (max !== undefined && num > max) {
    num = max;
  }
  
  return num;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    return ['true', '1', 'yes', 'on'].includes(lower);
  }
  
  if (typeof input === 'number') {
    return input !== 0;
  }
  
  return false;
}

/**
 * Sanitize array input
 */
export function sanitizeArray<T>(
  input: any,
  itemSanitizer: (item: any) => T | null,
  maxLength: number = 100
): T[] {
  if (!Array.isArray(input)) {
    return [];
  }
  
  return input
    .slice(0, maxLength)
    .map(itemSanitizer)
    .filter((item): item is T => item !== null);
}

/**
 * Comprehensive input sanitization for forms
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const sanitizedKey = sanitizeText(key, 100);
    
    if (!sanitizedKey) {
      continue;
    }
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value);
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = sanitizeBoolean(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeArray(value, (item) => {
        if (typeof item === 'string') {
          return sanitizeText(item);
        }
        return item;
      });
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized;
}