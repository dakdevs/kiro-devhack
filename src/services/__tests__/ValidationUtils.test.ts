/**
 * Unit tests for ValidationUtils
 * Tests comprehensive validation and error handling functionality
 */

import { describe, it, expect } from 'vitest';
import { ValidationUtils, ValidationError, TreeIntegrityError, ScoringError } from '../ValidationUtils';
import { QAPair, TopicNode, ConversationTree, ScoringContext } from '../../types/conversation-grading';

describe('ValidationUtils', () => {
  describe('validateQAPair', () => {
    it('should validate valid Q&A pair', () => {
      const validQAPair: QAPair = {
        question: 'What is TypeScript?',
        answer: 'TypeScript is a typed superset of JavaScript.',
        timestamp: new Date(),
        metadata: { source: 'test' }
      };

      expect(() => ValidationUtils.validateQAPair(validQAPair)).not.toThrow();
    });

    it('should throw error for null/undefined Q&A pair', () => {
      expect(() => ValidationUtils.validateQAPair(null)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(undefined)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair('not an object')).toThrow(ValidationError);
    });

    it('should throw error for missing question', () => {
      const invalidQAPair = {
        answer: 'Some answer',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Question is required/);
    });

    it('should throw error for empty question', () => {
      const invalidQAPair = {
        question: '',
        answer: 'Some answer',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Question cannot be empty/);
    });

    it('should throw error for whitespace-only question', () => {
      const invalidQAPair = {
        question: '   \n\t  ',
        answer: 'Some answer',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Question cannot be empty/);
    });

    it('should throw error for non-string question', () => {
      const invalidQAPair = {
        question: 123,
        answer: 'Some answer',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Question must be a string/);
    });

    it('should throw error for question exceeding max length', () => {
      const invalidQAPair = {
        question: 'a'.repeat(10001),
        answer: 'Some answer',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Question exceeds maximum length/);
    });

    it('should throw error for missing answer', () => {
      const invalidQAPair = {
        question: 'Some question',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Answer is required/);
    });

    it('should throw error for empty answer', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: '',
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Answer cannot be empty/);
    });

    it('should throw error for answer exceeding max length', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: 'a'.repeat(50001),
        timestamp: new Date()
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Answer exceeds maximum length/);
    });

    it('should throw error for missing timestamp', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: 'Some answer'
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Timestamp is required/);
    });

    it('should throw error for invalid timestamp', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: 'Some answer',
        timestamp: 'not a date'
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Timestamp must be a Date object/);
    });

    it('should throw error for invalid Date object', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: 'Some answer',
        timestamp: new Date('invalid')
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Timestamp must be a valid Date/);
    });

    it('should throw error for invalid metadata', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: 'Some answer',
        timestamp: new Date(),
        metadata: 'not an object'
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Metadata must be an object/);
    });

    it('should throw error for array metadata', () => {
      const invalidQAPair = {
        question: 'Some question',
        answer: 'Some answer',
        timestamp: new Date(),
        metadata: ['array', 'not', 'allowed']
      };

      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateQAPair(invalidQAPair)).toThrow(/Metadata cannot be an array/);
    });
  });

  describe('validateNodeId', () => {
    it('should validate valid node IDs', () => {
      expect(() => ValidationUtils.validateNodeId('valid-id')).not.toThrow();
      expect(() => ValidationUtils.validateNodeId('valid_id')).not.toThrow();
      expect(() => ValidationUtils.validateNodeId('validId123')).not.toThrow();
      expect(() => ValidationUtils.validateNodeId('123')).not.toThrow();
    });

    it('should throw error for invalid node IDs', () => {
      expect(() => ValidationUtils.validateNodeId('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId('   ')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId(null)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId(undefined)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId(123)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId('invalid@id')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId('invalid id')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateNodeId('a'.repeat(256))).toThrow(ValidationError);
    });
  });

  describe('validateTopicName', () => {
    it('should validate valid topic names', () => {
      expect(() => ValidationUtils.validateTopicName('Valid Topic')).not.toThrow();
      expect(() => ValidationUtils.validateTopicName('Programming')).not.toThrow();
    });

    it('should throw error for invalid topic names', () => {
      expect(() => ValidationUtils.validateTopicName('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTopicName('   ')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTopicName(null)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTopicName(123)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTopicName('a'.repeat(501))).toThrow(ValidationError);
    });
  });

  describe('validateScore', () => {
    it('should validate valid scores', () => {
      expect(() => ValidationUtils.validateScore(0)).not.toThrow();
      expect(() => ValidationUtils.validateScore(50)).not.toThrow();
      expect(() => ValidationUtils.validateScore(100)).not.toThrow();
      expect(() => ValidationUtils.validateScore(null)).not.toThrow();
      expect(() => ValidationUtils.validateScore(undefined)).not.toThrow();
    });

    it('should throw error for invalid scores', () => {
      expect(() => ValidationUtils.validateScore(-1)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateScore(101)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateScore(NaN)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateScore(Infinity)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateScore('50')).toThrow(ValidationError);
    });
  });

  describe('validateSessionId', () => {
    it('should validate valid session IDs', () => {
      expect(() => ValidationUtils.validateSessionId('valid-session')).not.toThrow();
      expect(() => ValidationUtils.validateSessionId('valid_session')).not.toThrow();
      expect(() => ValidationUtils.validateSessionId('session123')).not.toThrow();
    });

    it('should throw error for invalid session IDs', () => {
      expect(() => ValidationUtils.validateSessionId('')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSessionId('   ')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSessionId(null)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSessionId('invalid@session')).toThrow(ValidationError);
      expect(() => ValidationUtils.validateSessionId('a'.repeat(256))).toThrow(ValidationError);
    });
  });

  describe('validateTreeDepth', () => {
    it('should validate acceptable tree depths', () => {
      expect(() => ValidationUtils.validateTreeDepth(1)).not.toThrow();
      expect(() => ValidationUtils.validateTreeDepth(25)).not.toThrow();
      expect(() => ValidationUtils.validateTreeDepth(50)).not.toThrow();
    });

    it('should throw error for excessive tree depth', () => {
      expect(() => ValidationUtils.validateTreeDepth(51)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTreeDepth(100)).toThrow(ValidationError);
    });

    it('should respect custom max depth', () => {
      expect(() => ValidationUtils.validateTreeDepth(10, 5)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTreeDepth(5, 10)).not.toThrow();
    });
  });

  describe('validateTreeSize', () => {
    it('should validate acceptable tree sizes', () => {
      expect(() => ValidationUtils.validateTreeSize(100)).not.toThrow();
      expect(() => ValidationUtils.validateTreeSize(5000)).not.toThrow();
      expect(() => ValidationUtils.validateTreeSize(10000)).not.toThrow();
    });

    it('should throw error for excessive tree size', () => {
      expect(() => ValidationUtils.validateTreeSize(10001)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTreeSize(50000)).toThrow(ValidationError);
    });

    it('should respect custom max size', () => {
      expect(() => ValidationUtils.validateTreeSize(1000, 500)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateTreeSize(500, 1000)).not.toThrow();
    });
  });

  describe('validateScoringContext', () => {
    const validContext: ScoringContext = {
      currentTopic: {
        id: 'test',
        topic: 'Test Topic',
        parentTopic: null,
        children: [],
        depth: 1,
        score: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          qaPairs: [],
          visitCount: 0,
          lastVisited: null,
          isExhausted: false
        }
      },
      conversationHistory: [],
      topicDepth: 1
    };

    it('should validate valid scoring context', () => {
      expect(() => ValidationUtils.validateScoringContext(validContext)).not.toThrow();
    });

    it('should throw error for invalid context', () => {
      expect(() => ValidationUtils.validateScoringContext(null)).toThrow(ValidationError);
      expect(() => ValidationUtils.validateScoringContext('not an object')).toThrow(ValidationError);
    });

    it('should throw error for missing currentTopic', () => {
      const invalidContext = { ...validContext, currentTopic: null };
      expect(() => ValidationUtils.validateScoringContext(invalidContext)).toThrow(ValidationError);
    });

    it('should throw error for invalid conversationHistory', () => {
      const invalidContext = { ...validContext, conversationHistory: 'not an array' };
      expect(() => ValidationUtils.validateScoringContext(invalidContext)).toThrow(ValidationError);
    });

    it('should throw error for invalid topicDepth', () => {
      const invalidContext = { ...validContext, topicDepth: 0 };
      expect(() => ValidationUtils.validateScoringContext(invalidContext)).toThrow(ValidationError);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings properly', () => {
      expect(ValidationUtils.sanitizeString('  normal text  ')).toBe('normal text');
      expect(ValidationUtils.sanitizeString('text\x00with\x01control\x02chars')).toBe('textwithcontrolchars');
      expect(ValidationUtils.sanitizeString('text\nwith\tvalid\rwhitespace')).toBe('text\nwith\tvalid\rwhitespace');
    });

    it('should handle non-string input', () => {
      expect(ValidationUtils.sanitizeString(123 as any)).toBe('');
      expect(ValidationUtils.sanitizeString(null as any)).toBe('');
      expect(ValidationUtils.sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('sanitizeQAPair', () => {
    it('should sanitize valid Q&A pair', () => {
      const qaPair: QAPair = {
        question: '  What is TypeScript?  ',
        answer: '  TypeScript is a typed superset of JavaScript.  ',
        timestamp: new Date(),
        metadata: { source: 'test' }
      };

      const sanitized = ValidationUtils.sanitizeQAPair(qaPair);
      expect(sanitized.question).toBe('What is TypeScript?');
      expect(sanitized.answer).toBe('TypeScript is a typed superset of JavaScript.');
      expect(sanitized.metadata).toEqual({ source: 'test' });
    });
  });

  describe('checkSecurityConstraints', () => {
    it('should allow safe input', () => {
      expect(() => ValidationUtils.checkSecurityConstraints('Normal text input')).not.toThrow();
      expect(() => ValidationUtils.checkSecurityConstraints('Text with some punctuation!')).not.toThrow();
    });

    it('should detect script injection', () => {
      expect(() => ValidationUtils.checkSecurityConstraints('<script>alert("xss")</script>')).toThrow(ValidationError);
      expect(() => ValidationUtils.checkSecurityConstraints('Text with <script>bad</script> content')).toThrow(ValidationError);
    });

    it('should detect SQL injection patterns', () => {
      expect(() => ValidationUtils.checkSecurityConstraints('SELECT * FROM users')).toThrow(ValidationError);
      expect(() => ValidationUtils.checkSecurityConstraints('DROP TABLE users')).toThrow(ValidationError);
      expect(() => ValidationUtils.checkSecurityConstraints("'; DROP TABLE users; --")).toThrow(ValidationError);
    });

    it('should detect excessive special characters', () => {
      const maliciousInput = '<>\'";&&||``$$(){}[]\\'.repeat(10);
      expect(() => ValidationUtils.checkSecurityConstraints(maliciousInput)).toThrow(ValidationError);
    });
  });

  describe('validateTreeIntegrity', () => {
    it('should validate valid tree structure', () => {
      const validTree: ConversationTree = {
        nodes: new Map([
          ['root1', {
            id: 'root1',
            topic: 'Root Topic',
            parentTopic: null,
            children: ['child1'],
            depth: 1,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }],
          ['child1', {
            id: 'child1',
            topic: 'Child Topic',
            parentTopic: 'root1',
            children: [],
            depth: 2,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }]
        ]),
        rootNodes: ['root1'],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      expect(() => ValidationUtils.validateTreeIntegrity(validTree)).not.toThrow();
    });

    it('should detect missing root node', () => {
      const invalidTree: ConversationTree = {
        nodes: new Map(),
        rootNodes: ['missing-root'],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      expect(() => ValidationUtils.validateTreeIntegrity(invalidTree)).toThrow(TreeIntegrityError);
    });

    it('should detect root node with parent', () => {
      const invalidTree: ConversationTree = {
        nodes: new Map([
          ['root1', {
            id: 'root1',
            topic: 'Root Topic',
            parentTopic: 'some-parent', // Invalid: root should have no parent
            children: [],
            depth: 1,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }]
        ]),
        rootNodes: ['root1'],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      expect(() => ValidationUtils.validateTreeIntegrity(invalidTree)).toThrow(TreeIntegrityError);
    });

    it('should detect missing parent node', () => {
      const invalidTree: ConversationTree = {
        nodes: new Map([
          ['child1', {
            id: 'child1',
            topic: 'Child Topic',
            parentTopic: 'missing-parent',
            children: [],
            depth: 2,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }]
        ]),
        rootNodes: [],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      expect(() => ValidationUtils.validateTreeIntegrity(invalidTree)).toThrow(TreeIntegrityError);
    });

    it('should detect inconsistent parent-child relationships', () => {
      const invalidTree: ConversationTree = {
        nodes: new Map([
          ['parent1', {
            id: 'parent1',
            topic: 'Parent Topic',
            parentTopic: null,
            children: [], // Should include child1
            depth: 1,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }],
          ['child1', {
            id: 'child1',
            topic: 'Child Topic',
            parentTopic: 'parent1',
            children: [],
            depth: 2,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }]
        ]),
        rootNodes: ['parent1'],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      expect(() => ValidationUtils.validateTreeIntegrity(invalidTree)).toThrow(TreeIntegrityError);
    });

    it('should detect depth inconsistencies', () => {
      const invalidTree: ConversationTree = {
        nodes: new Map([
          ['root1', {
            id: 'root1',
            topic: 'Root Topic',
            parentTopic: null,
            children: ['child1'],
            depth: 1,
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }],
          ['child1', {
            id: 'child1',
            topic: 'Child Topic',
            parentTopic: 'root1',
            children: [],
            depth: 5, // Should be 2
            score: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              qaPairs: [],
              visitCount: 0,
              lastVisited: null,
              isExhausted: false
            }
          }]
        ]),
        rootNodes: ['root1'],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      expect(() => ValidationUtils.validateTreeIntegrity(invalidTree)).toThrow(TreeIntegrityError);
    });
  });

  describe('createSafeErrorMessage', () => {
    it('should create safe error messages', () => {
      const error = new Error('Test error message');
      const safeMessage = ValidationUtils.createSafeErrorMessage(error);
      expect(safeMessage).toBe('Test error message');
    });

    it('should include context when provided', () => {
      const error = new Error('Test error');
      const safeMessage = ValidationUtils.createSafeErrorMessage(error, 'Test context');
      expect(safeMessage).toBe('Test context: Test error');
    });

    it('should sanitize sensitive information', () => {
      const error = new Error('Error with email user@example.com and timestamp 2023-01-01T12:00:00.000Z');
      const safeMessage = ValidationUtils.createSafeErrorMessage(error);
      expect(safeMessage).toContain('[EMAIL]');
      expect(safeMessage).toContain('[TIMESTAMP]');
      expect(safeMessage).not.toContain('user@example.com');
      expect(safeMessage).not.toContain('2023-01-01T12:00:00.000Z');
    });
  });

  describe('Error Classes', () => {
    it('should create ValidationError with proper properties', () => {
      const error = new ValidationError('Test message', 'testField', 'testValue');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test message');
      expect(error.field).toBe('testField');
      expect(error.value).toBe('testValue');
      expect(error instanceof Error).toBe(true);
    });

    it('should create TreeIntegrityError with proper properties', () => {
      const error = new TreeIntegrityError('Test message', 'testNodeId');
      expect(error.name).toBe('TreeIntegrityError');
      expect(error.message).toBe('Test message');
      expect(error.nodeId).toBe('testNodeId');
      expect(error instanceof Error).toBe(true);
    });

    it('should create ScoringError with proper properties', () => {
      const originalError = new Error('Original error');
      const error = new ScoringError('Test message', originalError);
      expect(error.name).toBe('ScoringError');
      expect(error.message).toBe('Test message');
      expect(error.originalError).toBe(originalError);
      expect(error instanceof Error).toBe(true);
    });
  });
});