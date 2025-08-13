import { describe, it, expect } from 'vitest';
import { 
  IngestRequestSchema, 
  SearchRequestSchema, 
  sanitizeHtml, 
  validateEmail,
  validateUrl,
  classifyError,
  ErrorCategory
} from '~/lib/validation';

describe('Validation', () => {
  describe('IngestRequestSchema', () => {
    it('should validate valid ingest request', () => {
      const validRequest = {
        documents: [
          {
            content: 'Test document content',
            metadata: { category: 'test', tags: ['tag1', 'tag2'] }
          },
          {
            content: 'Another document',
            metadata: {}
          }
        ]
      };

      const result = IngestRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.documents).toHaveLength(2);
        expect(result.data.documents[0].content).toBe('Test document content');
        expect(result.data.documents[1].metadata).toEqual({});
      }
    });

    it('should reject empty documents array', () => {
      const invalidRequest = { documents: [] };
      
      const result = IngestRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject documents with empty content', () => {
      const invalidRequest = {
        documents: [{ content: '', metadata: {} }]
      };
      
      const result = IngestRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject documents with content too long', () => {
      const invalidRequest = {
        documents: [{ 
          content: 'a'.repeat(60001), // Exceeds 50k limit
          metadata: {} 
        }]
      };
      
      const result = IngestRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject too many documents', () => {
      const documents = Array.from({ length: 101 }, (_, i) => ({
        content: `Document ${i}`,
        metadata: {}
      }));
      
      const invalidRequest = { documents };
      
      const result = IngestRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should handle various metadata types', () => {
      const validRequest = {
        documents: [
          {
            content: 'Document with object metadata',
            metadata: { 
              title: 'Test',
              count: 42,
              active: true,
              tags: ['a', 'b']
            }
          },
          {
            content: 'Document with empty metadata',
            metadata: {}
          }
        ]
      };

      const result = IngestRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('SearchRequestSchema', () => {
    it('should validate valid search request', () => {
      const validRequest = {
        query: 'test search query',
        k: 5
      };

      const result = SearchRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.query).toBe('test search query');
        expect(result.data.k).toBe(5);
      }
    });

    it('should use default k value when not provided', () => {
      const validRequest = {
        query: 'test search query'
      };

      const result = SearchRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.k).toBe(10); // Default value
      }
    });

    it('should reject empty query', () => {
      const invalidRequest = { query: '' };
      
      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject query too long', () => {
      const invalidRequest = {
        query: 'a'.repeat(1001) // Exceeds 1k limit
      };
      
      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject k value too small', () => {
      const invalidRequest = {
        query: 'test query',
        k: 0
      };
      
      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject k value too large', () => {
      const invalidRequest = {
        query: 'test query',
        k: 101
      };
      
      const result = SearchRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should handle edge case k values', () => {
      const validRequests = [
        { query: 'test', k: 1 },
        { query: 'test', k: 100 }
      ];

      validRequests.forEach(request => {
        const result = SearchRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove dangerous HTML tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Safe content');
    });

    it('should remove javascript protocols', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('javascript:');
    });

    it('should preserve normal text', () => {
      const input = 'This is normal text with punctuation! And numbers: 123.';
      const result = sanitizeHtml(input);
      
      expect(result).toBe(input);
    });

    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle unicode characters', () => {
      const input = 'Unicode text: 你好世界 🌍 café naïve';
      const result = sanitizeHtml(input);
      
      expect(result).toBe(input);
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Safe content';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<iframe>');
      expect(result).toContain('Safe content');
    });

    it('should handle very long text', () => {
      const input = 'a'.repeat(1000);
      const result = sanitizeHtml(input);
      
      expect(result).toBe(input);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path?query=value'
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false);
      });
    });
  });

  describe('classifyError', () => {
    it('should classify validation errors', () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      
      const classified = classifyError(zodError);
      expect(classified.category).toBe(ErrorCategory.INTERNAL);
      expect(classified.retryable).toBe(false);
    });

    it('should classify API errors', () => {
      const apiError = new Error('DashScope API rate limit exceeded');
      
      const classified = classifyError(apiError);
      expect(classified.category).toBe(ErrorCategory.EXTERNAL_API);
      expect(classified.retryable).toBe(true);
    });

    it('should classify database errors', () => {
      const dbError = new Error('Database connection failed');
      
      const classified = classifyError(dbError);
      expect(classified.category).toBe(ErrorCategory.DATABASE);
      expect(classified.retryable).toBe(true);
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      
      const classified = classifyError(unknownError);
      expect(classified.category).toBe(ErrorCategory.INTERNAL);
      expect(classified.statusCode).toBe(500);
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle malformed JSON in metadata', () => {
      // This would be caught by Zod schema validation
      const invalidRequest = {
        documents: [
          {
            content: 'Valid content',
            metadata: 'invalid-json-string' // Should be object
          }
        ]
      };

      const result = IngestRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should handle non-string content', () => {
      const invalidRequest = {
        documents: [
          {
            content: 123, // Should be string
            metadata: {}
          }
        ]
      };

      const result = IngestRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should handle missing required fields', () => {
      const invalidRequests = [
        { documents: [{ metadata: {} }] }, // Missing content
        { documents: [{ content: 'test' }] }, // Missing metadata
        {} // Missing documents array
      ];

      invalidRequests.forEach(request => {
        const result = IngestRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });
    });
  });
});