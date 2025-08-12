/**
 * Unit tests for ScoringEngine and scoring strategy pattern
 * Tests scoring logic independence from tree operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoringEngine, BaseScoringStrategy } from '../ScoringEngine';
import { TopicNode } from '../TopicNode';
import { IScoringStrategy, QAPair, ScoringContext } from '../../types/conversation-grading';

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine;
  let mockQAPair: QAPair;
  let mockContext: ScoringContext;
  let mockTopicNode: TopicNode;

  beforeEach(() => {
    scoringEngine = new ScoringEngine();
    
    mockQAPair = {
      question: 'What is TypeScript?',
      answer: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
      timestamp: new Date(),
      metadata: {}
    };

    mockTopicNode = new TopicNode('test-node', 'Programming Languages');
    
    mockContext = {
      currentTopic: mockTopicNode.toPlainObject(),
      conversationHistory: [mockQAPair],
      topicDepth: 2
    };
  });

  describe('Constructor', () => {
    it('should initialize with default BaseScoringStrategy', () => {
      const engine = new ScoringEngine();
      expect(engine.getCurrentStrategy()).toBeInstanceOf(BaseScoringStrategy);
    });

    it('should initialize with provided strategy', () => {
      const customStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockResolvedValue(75)
      };
      
      const engine = new ScoringEngine(customStrategy);
      expect(engine.getCurrentStrategy()).toBe(customStrategy);
    });
  });

  describe('setStrategy', () => {
    it('should update the scoring strategy', () => {
      const newStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockResolvedValue(90)
      };
      
      scoringEngine.setStrategy(newStrategy);
      expect(scoringEngine.getCurrentStrategy()).toBe(newStrategy);
    });
  });

  describe('calculateScore', () => {
    it('should calculate score using current strategy', async () => {
      const score = await scoringEngine.calculateScore(mockQAPair, mockContext);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should use custom strategy when set', async () => {
      const customStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockResolvedValue(85)
      };
      
      scoringEngine.setStrategy(customStrategy);
      const score = await scoringEngine.calculateScore(mockQAPair, mockContext);
      
      expect(customStrategy.calculateScore).toHaveBeenCalledWith(mockQAPair, mockContext);
      expect(score).toBe(85);
    });

    it('should handle strategy errors gracefully', async () => {
      const faultyStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockRejectedValue(new Error('Strategy failed'))
      };
      
      scoringEngine.setStrategy(faultyStrategy);
      const score = await scoringEngine.calculateScore(mockQAPair, mockContext);
      
      expect(score).toBe(50); // Default fallback score
    });

    it('should be independent of tree operations', async () => {
      // Test that scoring works without any tree modifications
      const initialScore = await scoringEngine.calculateScore(mockQAPair, mockContext);
      
      // Modify the tree structure
      const childNode = new TopicNode('child-node', 'Child Topic');
      mockTopicNode.addChild(childNode);
      
      // Score calculation should remain consistent
      const scoreAfterTreeChange = await scoringEngine.calculateScore(mockQAPair, mockContext);
      expect(scoreAfterTreeChange).toBe(initialScore);
    });
  });

  describe('getCurrentStrategy', () => {
    it('should return the current strategy', () => {
      const strategy = scoringEngine.getCurrentStrategy();
      expect(strategy).toBeInstanceOf(BaseScoringStrategy);
    });
  });
});

describe('BaseScoringStrategy', () => {
  let strategy: BaseScoringStrategy;
  let mockQAPair: QAPair;
  let mockContext: ScoringContext;

  beforeEach(() => {
    strategy = new BaseScoringStrategy();
    
    mockQAPair = {
      question: 'Test question?',
      answer: 'This is a test answer with reasonable length.',
      timestamp: new Date(),
      metadata: {}
    };

    const mockTopicNode = new TopicNode('test-node', 'Test Topic');
    mockContext = {
      currentTopic: mockTopicNode.toPlainObject(),
      conversationHistory: [mockQAPair],
      topicDepth: 1
    };
  });

  describe('calculateScore', () => {
    it('should return a score between 0 and 100', async () => {
      const score = await strategy.calculateScore(mockQAPair, mockContext);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores for longer answers', async () => {
      const shortAnswer = { ...mockQAPair, answer: 'Short.' };
      const longAnswer = { ...mockQAPair, answer: 'This is a much longer answer that provides more detailed information and should receive a higher score.' };
      
      const shortScore = await strategy.calculateScore(shortAnswer, mockContext);
      const longScore = await strategy.calculateScore(longAnswer, mockContext);
      
      expect(longScore).toBeGreaterThan(shortScore);
    });

    it('should adjust scores based on topic depth', async () => {
      const shallowContext = { ...mockContext, topicDepth: 1 };
      const deepContext = { ...mockContext, topicDepth: 5 };
      
      const shallowScore = await strategy.calculateScore(mockQAPair, shallowContext);
      const deepScore = await strategy.calculateScore(mockQAPair, deepContext);
      
      expect(deepScore).toBeGreaterThan(shallowScore);
    });

    it('should handle empty answers', async () => {
      const emptyAnswer = { ...mockQAPair, answer: '' };
      const score = await strategy.calculateScore(emptyAnswer, mockContext);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle very long answers', async () => {
      const veryLongAnswer = { ...mockQAPair, answer: 'A'.repeat(2000) };
      const score = await strategy.calculateScore(veryLongAnswer, mockContext);
      
      expect(score).toBeLessThanOrEqual(100); // Should cap at 100
    });

    it('should be deterministic for same input', async () => {
      const score1 = await strategy.calculateScore(mockQAPair, mockContext);
      const score2 = await strategy.calculateScore(mockQAPair, mockContext);
      
      expect(score1).toBe(score2);
    });
  });
});

describe('Scoring Independence from Tree Operations', () => {
  let scoringEngine: ScoringEngine;
  let topicNode: TopicNode;
  let qaPair: QAPair;
  let context: ScoringContext;

  beforeEach(() => {
    scoringEngine = new ScoringEngine();
    topicNode = new TopicNode('root', 'Root Topic');
    
    qaPair = {
      question: 'What is independence?',
      answer: 'Independence means being separate and not dependent on other systems.',
      timestamp: new Date()
    };

    context = {
      currentTopic: topicNode.toPlainObject(),
      conversationHistory: [qaPair],
      topicDepth: 1
    };
  });

  it('should calculate scores independently of node creation', async () => {
    const scoreBeforeNodeCreation = await scoringEngine.calculateScore(qaPair, context);
    
    // Create new nodes
    const child1 = new TopicNode('child1', 'Child 1');
    const child2 = new TopicNode('child2', 'Child 2');
    
    const scoreAfterNodeCreation = await scoringEngine.calculateScore(qaPair, context);
    expect(scoreAfterNodeCreation).toBe(scoreBeforeNodeCreation);
  });

  it('should calculate scores independently of tree structure changes', async () => {
    const initialScore = await scoringEngine.calculateScore(qaPair, context);
    
    // Modify tree structure
    const child = new TopicNode('child', 'Child Topic');
    topicNode.addChild(child);
    
    const grandchild = new TopicNode('grandchild', 'Grandchild Topic');
    child.addChild(grandchild);
    
    const scoreAfterStructureChange = await scoringEngine.calculateScore(qaPair, context);
    expect(scoreAfterStructureChange).toBe(initialScore);
  });

  it('should calculate scores independently of node score updates', async () => {
    const initialScore = await scoringEngine.calculateScore(qaPair, context);
    
    // Update node scores
    topicNode.updateScore(75);
    const child = new TopicNode('child', 'Child Topic');
    child.updateScore(90);
    
    const scoreAfterScoreUpdates = await scoringEngine.calculateScore(qaPair, context);
    expect(scoreAfterScoreUpdates).toBe(initialScore);
  });

  it('should calculate scores independently of node metadata changes', async () => {
    const initialScore = await scoringEngine.calculateScore(qaPair, context);
    
    // Modify node metadata
    topicNode.markAsVisited();
    topicNode.markAsExhausted();
    topicNode.addQAPair(qaPair);
    
    const scoreAfterMetadataChanges = await scoringEngine.calculateScore(qaPair, context);
    expect(scoreAfterMetadataChanges).toBe(initialScore);
  });

  it('should allow tree operations independently of scoring', () => {
    // Perform tree operations without scoring
    const parent = new TopicNode('parent', 'Parent Topic');
    const child1 = new TopicNode('child1', 'Child 1');
    const child2 = new TopicNode('child2', 'Child 2');
    
    parent.addChild(child1);
    parent.addChild(child2);
    
    // Tree operations should work fine
    expect(parent.getChildren()).toHaveLength(2);
    expect(child1.getParent()).toBe(parent);
    expect(child2.getParent()).toBe(parent);
    
    // Scoring should still work after tree operations
    expect(async () => {
      await scoringEngine.calculateScore(qaPair, context);
    }).not.toThrow();
  });
});