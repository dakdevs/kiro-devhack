/**
 * Unit tests for ScoringEngine error handling and validation
 * Tests error scenarios, recovery mechanisms, and graceful degradation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoringEngine } from '../ScoringEngine';
import { ValidationError, ScoringError } from '../ValidationUtils';
import { IScoringStrategy, ScoringContext, TopicNode, QAPair } from '../../types/conversation-grading';

describe('ScoringEngine Error Handling', () => {
  let scoringEngine: ScoringEngine;
  let mockStrategy: IScoringStrategy;

  const validQAPair: QAPair = {
    question: 'What is TypeScript?',
    answer: 'TypeScript is a typed superset of JavaScript.',
    timestamp: new Date()
  };

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

  beforeEach(() => {
    mockStrategy = {
      calculateScore: vi.fn().mockResolvedValue(75)
    };
    scoringEngine = new ScoringEngine(mockStrategy);
  });

  describe('Constructor Validation', () => {
    it('should throw error for null strategy', () => {
      expect(() => new ScoringEngine(null as any)).toThrow(ValidationError);
    });

    it('should throw error for undefined strategy', () => {
      expect(() => new ScoringEngine(undefined as any)).toThrow(ValidationError);
    });

    it('should throw error for invalid strategy object', () => {
      expect(() => new ScoringEngine({} as any)).toThrow(ValidationError);
      expect(() => new ScoringEngine({ notCalculateScore: () => {} } as any)).toThrow(ValidationError);
    });

    it('should accept valid strategy', () => {
      expect(() => new ScoringEngine(mockStrategy)).not.toThrow();
    });
  });

  describe('calculateScore Error Handling', () => {
    it('should handle strategy throwing error', async () => {
      const failingStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockRejectedValue(new Error('Strategy failed'))
      };
      
      scoringEngine.setStrategy(failingStrategy);
      
      // Should not throw error due to fallback mechanism
      const score = await scoringEngine.calculateScore(validQAPair, validContext);
      expect(typeof score).toBe('number');
    });

    it('should handle invalid context', async () => {
      await expect(scoringEngine.calculateScore(validQAPair, null as any)).rejects.toThrow(ScoringError);
      await expect(scoringEngine.calculateScore(validQAPair, {} as any)).rejects.toThrow(ScoringError);
    });

    it('should validate context before calling strategy', async () => {
      const invalidContext = {
        currentTopic: null,
        conversationHistory: [],
        topicDepth: 1
      };

      await expect(scoringEngine.calculateScore(validQAPair, invalidContext as any)).rejects.toThrow(ScoringError);
      expect(mockStrategy.calculateScore).not.toHaveBeenCalled();
    });
  });

  describe('setStrategy Error Handling', () => {
    it('should validate new strategy', () => {
      expect(() => scoringEngine.setStrategy(null as any)).toThrow(ValidationError);
      expect(() => scoringEngine.setStrategy({} as any)).toThrow(ValidationError);
    });

    it('should accept valid strategy', () => {
      const newStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockResolvedValue(80)
      };
      
      expect(() => scoringEngine.setStrategy(newStrategy)).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should maintain state after scoring error', async () => {
      const failingStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockRejectedValue(new Error('Temporary failure'))
      };
      
      scoringEngine.setStrategy(failingStrategy);
      
      // First call should use fallback
      const score1 = await scoringEngine.calculateScore(validQAPair, validContext);
      expect(typeof score1).toBe('number');
      
      // Switch to working strategy
      scoringEngine.setStrategy(mockStrategy);
      
      // Should work now
      const score2 = await scoringEngine.calculateScore(validQAPair, validContext);
      expect(score2).toBe(75);
    });
  });
});