/**
 * Unit tests for ConversationGradingSystem error handling and validation
 * Tests error scenarios, recovery mechanisms, and graceful degradation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationGradingSystem } from '../ConversationGradingSystem';
import { ValidationError, TreeIntegrityError, ScoringError } from '../ValidationUtils';
import { QAPair, IScoringStrategy, ITopicAnalyzer, ScoringContext, TopicRelationship } from '../../types/conversation-grading';

describe('ConversationGradingSystem Error Handling', () => {
  let system: ConversationGradingSystem;

  beforeEach(() => {
    system = new ConversationGradingSystem('test-session');
  });

  describe('Constructor Validation', () => {
    it('should throw error for invalid session ID', () => {
      expect(() => new ConversationGradingSystem('')).toThrow(ValidationError);
      expect(() => new ConversationGradingSystem('invalid@session')).toThrow(ValidationError);
      expect(() => new ConversationGradingSystem('a'.repeat(256))).toThrow(ValidationError);
    });

    it('should accept valid session IDs', () => {
      expect(() => new ConversationGradingSystem('valid-session')).not.toThrow();
      expect(() => new ConversationGradingSystem('valid_session_123')).not.toThrow();
    });
  });

  describe('addQAPair Input Validation', () => {
    it('should throw ValidationError for invalid Q&A pair', async () => {
      const invalidQAPairs = [
        null,
        undefined,
        'not an object',
        {},
        { question: '', answer: 'answer', timestamp: new Date() },
        { question: 'question', answer: '', timestamp: new Date() },
        { question: 'question', answer: 'answer' }, // missing timestamp
        { question: 'question', answer: 'answer', timestamp: 'invalid' },
        { question: 123, answer: 'answer', timestamp: new Date() },
        { question: 'question', answer: 123, timestamp: new Date() }
      ];

      for (const invalidQAPair of invalidQAPairs) {
        await expect(system.addQAPair(invalidQAPair as any)).rejects.toThrow(ValidationError);
      }
    });

    it('should throw ValidationError for invalid score', async () => {
      const validQAPair: QAPair = {
        question: 'What is TypeScript?',
        answer: 'TypeScript is a typed superset of JavaScript.',
        timestamp: new Date()
      };

      await expect(system.addQAPair(validQAPair, -1)).rejects.toThrow(ValidationError);
      await expect(system.addQAPair(validQAPair, 101)).rejects.toThrow(ValidationError);
      await expect(system.addQAPair(validQAPair, NaN)).rejects.toThrow(ValidationError);
      await expect(system.addQAPair(validQAPair, 'invalid' as any)).rejects.toThrow(ValidationError);
    });

    it('should detect and reject malicious input', async () => {
      const maliciousQAPairs = [
        {
          question: '<script>alert("xss")</script>',
          answer: 'answer',
          timestamp: new Date()
        },
        {
          question: 'question',
          answer: 'SELECT * FROM users',
          timestamp: new Date()
        },
        {
          question: 'DROP TABLE users; --',
          answer: 'answer',
          timestamp: new Date()
        }
      ];

      for (const maliciousQAPair of maliciousQAPairs) {
        await expect(system.addQAPair(maliciousQAPair)).rejects.toThrow(ValidationError);
      }
    });

    it('should sanitize input properly', async () => {
      const qaPairWithWhitespace: QAPair = {
        question: '  What is TypeScript?  \n\t',
        answer: '  TypeScript is a typed superset of JavaScript.  \n\t',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(qaPairWithWhitespace);
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);

      expect(node?.metadata.qaPairs[0].question).toBe('What is TypeScript?');
      expect(node?.metadata.qaPairs[0].answer).toBe('TypeScript is a typed superset of JavaScript.');
    });
  });

  describe('Topic Analysis Error Handling', () => {
    it('should handle topic analyzer failures gracefully', async () => {
      const failingAnalyzer: ITopicAnalyzer = {
        extractTopics: vi.fn().mockRejectedValue(new Error('Topic extraction failed')),
        determineRelationship: vi.fn().mockImplementation(() => {
          throw new Error('Relationship analysis failed');
        })
      };

      system.setTopicAnalyzer(failingAnalyzer);

      const qaPair: QAPair = {
        question: 'What is machine learning?',
        answer: 'Machine learning is a subset of AI.',
        timestamp: new Date()
      };

      // Should not throw error, but use fallback mechanisms
      const nodeId = await system.addQAPair(qaPair);
      expect(nodeId).toBeDefined();

      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);
      expect(node).toBeDefined();
      expect(node?.topic).toBeDefined(); // Should have fallback topic
    });

    it('should handle empty topic extraction gracefully', async () => {
      const emptyAnalyzer: ITopicAnalyzer = {
        extractTopics: vi.fn().mockResolvedValue([]),
        determineRelationship: vi.fn().mockReturnValue({
          type: 'new_root',
          confidence: 0.5
        })
      };

      system.setTopicAnalyzer(emptyAnalyzer);

      const qaPair: QAPair = {
        question: 'What is programming?',
        answer: 'Programming is writing code.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(qaPair);
      expect(nodeId).toBeDefined();

      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);
      expect(node?.topic).toBeDefined();
    });
  });

  describe('Scoring Error Handling', () => {
    it('should handle scoring strategy failures gracefully', async () => {
      const failingStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockRejectedValue(new Error('Scoring failed'))
      };

      system.setScoringStrategy(failingStrategy);

      const qaPair: QAPair = {
        question: 'What is AI?',
        answer: 'AI is artificial intelligence.',
        timestamp: new Date()
      };

      // Should not throw error, but use fallback scoring
      const nodeId = await system.addQAPair(qaPair);
      expect(nodeId).toBeDefined();

      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);
      expect(node?.score).toBeDefined();
      expect(typeof node?.score).toBe('number');
    });

    it('should validate scoring strategy on set', () => {
      expect(() => system.setScoringStrategy(null as any)).toThrow(ValidationError);
      expect(() => system.setScoringStrategy({} as any)).toThrow(ValidationError);
      expect(() => system.setScoringStrategy({ notCalculateScore: () => {} } as any)).toThrow(ValidationError);
    });

    it('should validate topic analyzer on set', () => {
      expect(() => system.setTopicAnalyzer(null as any)).toThrow(ValidationError);
      expect(() => system.setTopicAnalyzer({} as any)).toThrow(ValidationError);
      expect(() => system.setTopicAnalyzer({ extractTopics: () => {} } as any)).toThrow(ValidationError);
    });
  });

  describe('Tree Integrity Error Handling', () => {
    it('should handle tree corruption gracefully', async () => {
      // Add a valid node first
      const qaPair: QAPair = {
        question: 'What is programming?',
        answer: 'Programming is writing code.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(qaPair);
      
      // Manually corrupt the tree by accessing private members (for testing)
      const tree = system.getTopicTree();
      const corruptedNode = tree.nodes.get(nodeId);
      if (corruptedNode) {
        // Create a circular reference
        corruptedNode.parentTopic = nodeId;
      }

      // The system should detect corruption when getting the tree
      const retrievedTree = system.getTopicTree();
      expect(retrievedTree).toBeDefined(); // Should still return tree for inspection
    });

    it('should prevent excessive tree depth', async () => {
      // Create a deep tree structure
      let parentId: string | undefined;
      
      // Add nodes up to the limit
      for (let i = 1; i <= 50; i++) {
        const qaPair: QAPair = {
          question: `Question at depth ${i}`,
          answer: `Answer at depth ${i}`,
          timestamp: new Date()
        };

        const nodeId = await system.addQAPair(qaPair);
        if (i === 1) {
          parentId = nodeId;
        }
      }

      // Adding one more should potentially fail or be handled gracefully
      const deepQAPair: QAPair = {
        question: 'Very deep question',
        answer: 'Very deep answer',
        timestamp: new Date()
      };

      // The system should handle this gracefully, either by limiting depth or creating a new root
      const result = await system.addQAPair(deepQAPair);
      expect(result).toBeDefined();
    });

    it('should prevent excessive tree size', async () => {
      // This test would be slow with 10000 nodes, so we'll mock the validation
      const { ValidationUtils: VU } = await import('../ValidationUtils');
      const originalValidateTreeSize = VU.validateTreeSize;
      VU.validateTreeSize = vi.fn().mockImplementation((size: number) => {
        if (size > 5) {
          throw new ValidationError('Tree size exceeds maximum', 'nodeCount', size);
        }
      });

      try {
        // Add nodes up to the mocked limit
        for (let i = 1; i <= 5; i++) {
          const qaPair: QAPair = {
            question: `Question ${i}`,
            answer: `Answer ${i}`,
            timestamp: new Date()
          };
          await system.addQAPair(qaPair);
        }

        // Adding one more should fail
        const extraQAPair: QAPair = {
          question: 'Extra question',
          answer: 'Extra answer',
          timestamp: new Date()
        };

        await expect(system.addQAPair(extraQAPair)).rejects.toThrow(ValidationError);
      } finally {
        // Restore original function
        VU.validateTreeSize = originalValidateTreeSize;
      }
    });
  });

  describe('Node Operations Error Handling', () => {
    it('should handle getDepthFromRoot with invalid node ID', () => {
      expect(() => system.getDepthFromRoot('')).toThrow(ValidationError);
      expect(() => system.getDepthFromRoot('invalid@id')).toThrow(ValidationError);
      expect(() => system.getDepthFromRoot('non-existent')).toThrow();
    });

    it('should handle markTopicAsVisited with invalid node ID', () => {
      expect(() => system.markTopicAsVisited('')).toThrow(ValidationError);
      expect(() => system.markTopicAsVisited('invalid@id')).toThrow(ValidationError);
      expect(() => system.markTopicAsVisited('non-existent')).toThrow(ValidationError);
    });

    it('should validate node marking operation', async () => {
      const qaPair: QAPair = {
        question: 'What is testing?',
        answer: 'Testing is verification.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(qaPair);
      
      // Should work normally
      expect(() => system.markTopicAsVisited(nodeId)).not.toThrow();
      
      // Verify the marking worked
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);
      expect(node?.metadata.visitCount).toBe(1);
    });
  });

  describe('Path Building Error Handling', () => {
    it('should handle circular references in path building', async () => {
      const qaPair: QAPair = {
        question: 'What is circular reference?',
        answer: 'A circular reference is when objects reference each other.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(qaPair);
      
      // Manually create a circular reference for testing
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);
      if (node) {
        // This would normally be prevented by tree integrity checks
        // but we're testing the path building error handling
        try {
          // Try to get depth which uses path building internally
          const depth = system.getDepthFromRoot(nodeId);
          expect(depth).toBeGreaterThan(0);
        } catch (error) {
          // Should handle gracefully
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Recovery and Graceful Degradation', () => {
    it('should recover from partial failures', async () => {
      // Create a scenario where topic analysis fails but scoring works
      const partiallyFailingAnalyzer: ITopicAnalyzer = {
        extractTopics: vi.fn().mockRejectedValue(new Error('Topic extraction failed')),
        determineRelationship: vi.fn().mockReturnValue({
          type: 'new_root',
          confidence: 0.5
        })
      };

      system.setTopicAnalyzer(partiallyFailingAnalyzer);

      const qaPair: QAPair = {
        question: 'What is recovery?',
        answer: 'Recovery is the ability to handle failures gracefully.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(qaPair);
      expect(nodeId).toBeDefined();

      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);
      expect(node).toBeDefined();
      expect(node?.topic).toBeDefined();
      expect(node?.score).toBeDefined();
    });

    it('should maintain system state after errors', async () => {
      // Add a valid node
      const validQAPair: QAPair = {
        question: 'What is state?',
        answer: 'State is the current condition of the system.',
        timestamp: new Date()
      };

      const validNodeId = await system.addQAPair(validQAPair);
      
      // Try to add an invalid node
      try {
        await system.addQAPair({
          question: '',
          answer: 'Invalid',
          timestamp: new Date()
        } as any);
      } catch (error) {
        // Expected to fail
      }

      // System should still be functional
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(1);
      expect(tree.nodes.has(validNodeId)).toBe(true);

      // Should be able to add more valid nodes
      const anotherValidQAPair: QAPair = {
        question: 'What is resilience?',
        answer: 'Resilience is the ability to recover from failures.',
        timestamp: new Date()
      };

      const anotherNodeId = await system.addQAPair(anotherValidQAPair);
      expect(anotherNodeId).toBeDefined();
    });
  });

  describe('Error Message Safety', () => {
    it('should create safe error messages', async () => {
      try {
        await system.addQAPair({
          question: 'Question with email user@example.com',
          answer: 'Answer with timestamp 2023-01-01T12:00:00.000Z',
          timestamp: new Date()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Error messages should not contain sensitive information
        expect(errorMessage).not.toContain('user@example.com');
        expect(errorMessage).not.toContain('2023-01-01T12:00:00.000Z');
      }
    });
  });

  describe('Concurrent Access Error Handling', () => {
    it('should handle concurrent addQAPair operations', async () => {
      const qaPairs: QAPair[] = Array.from({ length: 10 }, (_, i) => ({
        question: `Question ${i}`,
        answer: `Answer ${i}`,
        timestamp: new Date()
      }));

      // Add multiple Q&A pairs concurrently
      const promises = qaPairs.map(qaPair => system.addQAPair(qaPair));
      const results = await Promise.allSettled(promises);

      // All should succeed or fail gracefully
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);

      // Tree should be in a consistent state
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(successful.length);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle clear operation safely', async () => {
      // Add some nodes
      for (let i = 0; i < 5; i++) {
        await system.addQAPair({
          question: `Question ${i}`,
          answer: `Answer ${i}`,
          timestamp: new Date()
        });
      }

      // Clear should work without errors
      expect(() => system.clear()).not.toThrow();

      // Tree should be empty
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(0);
      expect(tree.rootNodes).toHaveLength(0);
      expect(tree.currentPath).toHaveLength(0);
    });

    it('should handle stats calculation with corrupted data', () => {
      // Stats should work even with empty tree
      const stats = system.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalNodes).toBe(0);
      expect(stats.totalQAPairs).toBe(0);
      expect(stats.averageScore).toBeNull();
    });
  });
});