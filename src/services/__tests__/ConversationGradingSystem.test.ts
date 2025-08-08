/**
 * Unit tests for ConversationGradingSystem
 * Tests main system integration and API methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationGradingSystem } from '../ConversationGradingSystem';
import { QAPair, IScoringStrategy, ITopicAnalyzer, ScoringContext, TopicRelationship } from '../../types/conversation-grading';

describe('ConversationGradingSystem', () => {
  let system: ConversationGradingSystem;

  beforeEach(() => {
    system = new ConversationGradingSystem('test-session');
  });

  describe('addQAPair', () => {
    it('should add a Q&A pair and create a root topic node', async () => {
      const qaPair: QAPair = {
        question: 'What is machine learning?',
        answer: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data.',
        timestamp: new Date(),
        metadata: { source: 'test' }
      };

      const nodeId = await system.addQAPair(qaPair);

      expect(nodeId).toBeDefined();
      expect(typeof nodeId).toBe('string');

      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(1);
      expect(tree.rootNodes).toHaveLength(1);
      expect(tree.rootNodes[0]).toBe(nodeId);

      const node = tree.nodes.get(nodeId);
      expect(node).toBeDefined();
      expect(node!.depth).toBe(1);
      expect(node!.parentTopic).toBeNull();
      expect(node!.metadata.qaPairs).toHaveLength(1);
      expect(node!.metadata.qaPairs[0]).toEqual(qaPair);
    });

    it('should add a child topic when related to existing topic', async () => {
      // Add first Q&A pair
      const firstQA: QAPair = {
        question: 'What is machine learning?',
        answer: 'Machine learning is a subset of AI.',
        timestamp: new Date(),
      };
      const firstNodeId = await system.addQAPair(firstQA);

      // Add related Q&A pair
      const secondQA: QAPair = {
        question: 'What are machine learning algorithms?',
        answer: 'Machine learning algorithms are methods that allow computers to learn from data.',
        timestamp: new Date(),
      };
      const secondNodeId = await system.addQAPair(secondQA);

      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(2);
      expect(tree.rootNodes).toHaveLength(1);

      const secondNode = tree.nodes.get(secondNodeId);
      expect(secondNode).toBeDefined();
      expect(secondNode!.parentTopic).toBe(firstNodeId);
      expect(secondNode!.depth).toBe(2);
    });

    it('should calculate and assign scores automatically', async () => {
      const qaPair: QAPair = {
        question: 'What is AI?',
        answer: 'Artificial Intelligence is the simulation of human intelligence in machines.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);

      expect(node!.score).not.toBeNull();
      expect(typeof node!.score).toBe('number');
      expect(node!.score).toBeGreaterThanOrEqual(0);
      expect(node!.score).toBeLessThanOrEqual(100);
    });

    it('should use provided score when given', async () => {
      const qaPair: QAPair = {
        question: 'What is AI?',
        answer: 'AI is artificial intelligence.',
        timestamp: new Date(),
      };
      const providedScore = 85;

      const nodeId = await system.addQAPair(qaPair, providedScore);
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);

      expect(node!.score).toBe(providedScore);
    });

    it('should update current path correctly', async () => {
      const firstQA: QAPair = {
        question: 'What is programming?',
        answer: 'Programming is writing instructions for computers.',
        timestamp: new Date(),
      };
      const firstNodeId = await system.addQAPair(firstQA);

      let tree = system.getTopicTree();
      expect(tree.currentPath).toEqual([firstNodeId]);

      const secondQA: QAPair = {
        question: 'What are programming languages used for?',
        answer: 'Programming languages are used for writing computer programs.',
        timestamp: new Date(),
      };
      const secondNodeId = await system.addQAPair(secondQA);

      tree = system.getTopicTree();
      expect(tree.currentPath).toEqual([firstNodeId, secondNodeId]);
    });

    it('should throw error for invalid Q&A pairs', async () => {
      const invalidQA1: QAPair = {
        question: '',
        answer: 'Some answer',
        timestamp: new Date(),
      };

      const invalidQA2: QAPair = {
        question: 'Some question',
        answer: '',
        timestamp: new Date(),
      };

      await expect(system.addQAPair(invalidQA1)).rejects.toThrow('Q&A pair must have non-empty question and answer');
      await expect(system.addQAPair(invalidQA2)).rejects.toThrow('Q&A pair must have non-empty question and answer');
    });
  });

  describe('getTopicTree', () => {
    it('should return empty tree initially', () => {
      const tree = system.getTopicTree();
      
      expect(tree.nodes.size).toBe(0);
      expect(tree.rootNodes).toHaveLength(0);
      expect(tree.currentPath).toHaveLength(0);
      expect(tree.sessionId).toBe('test-session');
      expect(tree.createdAt).toBeInstanceOf(Date);
    });

    it('should return complete tree structure after adding nodes', async () => {
      const qaPair: QAPair = {
        question: 'What is testing?',
        answer: 'Testing is verifying software works correctly.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const tree = system.getTopicTree();

      expect(tree.nodes.size).toBe(1);
      expect(tree.rootNodes).toEqual([nodeId]);
      expect(tree.currentPath).toEqual([nodeId]);
    });
  });

  describe('getDepthFromRoot', () => {
    it('should return correct depth for root node', async () => {
      const qaPair: QAPair = {
        question: 'What is depth?',
        answer: 'Depth is the distance from root.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const depth = system.getDepthFromRoot(nodeId);

      expect(depth).toBe(1);
    });

    it('should return correct depth for child nodes', async () => {
      // Add root node
      const rootQA: QAPair = {
        question: 'What is computer science?',
        answer: 'Computer science is the study of computation.',
        timestamp: new Date(),
      };
      const rootNodeId = await system.addQAPair(rootQA);

      // Add child node
      const childQA: QAPair = {
        question: 'What are computer science algorithms?',
        answer: 'Computer science algorithms are step-by-step procedures for solving problems.',
        timestamp: new Date(),
      };
      const childNodeId = await system.addQAPair(childQA);

      expect(system.getDepthFromRoot(rootNodeId)).toBe(1);
      expect(system.getDepthFromRoot(childNodeId)).toBe(2);
    });

    it('should throw error for non-existent node', () => {
      expect(() => system.getDepthFromRoot('non-existent')).toThrow();
    });
  });

  describe('getDeepestUnvisitedBranch', () => {
    it('should return null for empty tree', () => {
      const deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).toBeNull();
    });

    it('should return the only node in single-node tree', async () => {
      const qaPair: QAPair = {
        question: 'What is a branch?',
        answer: 'A branch is a path in a tree.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const deepestBranch = system.getDeepestUnvisitedBranch();

      expect(deepestBranch).not.toBeNull();
      expect(deepestBranch!.id).toBe(nodeId);
    });

    it('should return deepest unvisited leaf node', async () => {
      // Create a tree with multiple branches
      const rootQA: QAPair = {
        question: 'What is software?',
        answer: 'Software is computer programs.',
        timestamp: new Date(),
      };
      const rootNodeId = await system.addQAPair(rootQA);

      const child1QA: QAPair = {
        question: 'What are software applications?',
        answer: 'Software applications are user-facing programs.',
        timestamp: new Date(),
      };
      const child1NodeId = await system.addQAPair(child1QA);

      const grandchild1QA: QAPair = {
        question: 'What are mobile software applications?',
        answer: 'Mobile software applications run on smartphones.',
        timestamp: new Date(),
      };
      const grandchild1NodeId = await system.addQAPair(grandchild1QA);

      const deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).not.toBeNull();
      
      // The system should return a leaf node with the maximum depth available
      const tree = system.getTopicTree();
      const maxDepth = Math.max(...Array.from(tree.nodes.values()).map(n => n.depth));
      expect(deepestBranch!.depth).toBe(maxDepth);
    });

    it('should exclude visited branches', async () => {
      const qaPair: QAPair = {
        question: 'What is visiting?',
        answer: 'Visiting marks a node as explored.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      
      // Initially should return the node
      let deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch!.id).toBe(nodeId);

      // Mark as visited
      system.markTopicAsVisited(nodeId);

      // Should now return null
      deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).toBeNull();
    });
  });

  describe('getCurrentTopic', () => {
    it('should return null for empty tree', () => {
      const currentTopic = system.getCurrentTopic();
      expect(currentTopic).toBeNull();
    });

    it('should return current topic from path', async () => {
      const qaPair: QAPair = {
        question: 'What is current?',
        answer: 'Current is the active topic.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const currentTopic = system.getCurrentTopic();

      expect(currentTopic).not.toBeNull();
      expect(currentTopic!.id).toBe(nodeId);
    });
  });

  describe('markTopicAsVisited', () => {
    it('should mark topic as visited', async () => {
      const qaPair: QAPair = {
        question: 'What is marking?',
        answer: 'Marking is setting a flag.',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      
      // Initially not visited
      let tree = system.getTopicTree();
      let node = tree.nodes.get(nodeId);
      expect(node!.metadata.visitCount).toBe(0);
      expect(node!.metadata.lastVisited).toBeNull();

      // Mark as visited
      system.markTopicAsVisited(nodeId);

      // Should be marked as visited
      tree = system.getTopicTree();
      node = tree.nodes.get(nodeId);
      expect(node!.metadata.visitCount).toBe(1);
      expect(node!.metadata.lastVisited).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent node', () => {
      expect(() => system.markTopicAsVisited('non-existent')).toThrow('Node with ID non-existent not found');
    });
  });

  describe('setScoringStrategy', () => {
    it('should allow setting custom scoring strategy', async () => {
      const customStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockResolvedValue(95)
      };

      system.setScoringStrategy(customStrategy);

      const qaPair: QAPair = {
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);

      expect(node!.score).toBe(95);
      expect(customStrategy.calculateScore).toHaveBeenCalled();
    });
  });

  describe('setTopicAnalyzer', () => {
    it('should allow setting custom topic analyzer', async () => {
      const customAnalyzer: ITopicAnalyzer = {
        extractTopics: vi.fn().mockResolvedValue(['custom topic']),
        determineRelationship: vi.fn().mockReturnValue({
          type: 'new_root',
          confidence: 1.0
        } as TopicRelationship)
      };

      system.setTopicAnalyzer(customAnalyzer);

      const qaPair: QAPair = {
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date(),
      };

      const nodeId = await system.addQAPair(qaPair);
      const tree = system.getTopicTree();
      const node = tree.nodes.get(nodeId);

      expect(node!.topic).toBe('custom topic');
      expect(customAnalyzer.extractTopics).toHaveBeenCalledWith(qaPair);
      expect(customAnalyzer.determineRelationship).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics for empty tree', () => {
      const stats = system.getStats();

      expect(stats).toEqual({
        totalNodes: 0,
        rootNodes: 0,
        maxDepth: 0,
        leafNodes: 0,
        totalQAPairs: 0,
        averageScore: null
      });
    });

    it('should return correct statistics for populated tree', async () => {
      const qaPair1: QAPair = {
        question: 'Question 1',
        answer: 'Answer 1',
        timestamp: new Date(),
      };
      const qaPair2: QAPair = {
        question: 'Question 2',
        answer: 'Answer 2',
        timestamp: new Date(),
      };

      await system.addQAPair(qaPair1, 80);
      await system.addQAPair(qaPair2, 90);

      const stats = system.getStats();

      expect(stats.totalNodes).toBe(2);
      expect(stats.totalQAPairs).toBe(2);
      expect(stats.averageScore).toBe(85);
      expect(stats.maxDepth).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear the conversation tree', async () => {
      const qaPair: QAPair = {
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date(),
      };

      await system.addQAPair(qaPair);
      
      // Verify tree has content
      let tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(1);

      // Clear the tree
      system.clear();

      // Verify tree is empty
      tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(0);
      expect(tree.rootNodes).toHaveLength(0);
      expect(tree.currentPath).toHaveLength(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex conversation flow', async () => {
      // Start with a root topic
      const rootQA: QAPair = {
        question: 'What is web development?',
        answer: 'Web development is creating websites and web applications.',
        timestamp: new Date(),
      };
      const rootNodeId = await system.addQAPair(rootQA);

      // Add related subtopic
      const frontendQA: QAPair = {
        question: 'What is frontend web development?',
        answer: 'Frontend web development focuses on user interface and experience.',
        timestamp: new Date(),
      };
      const frontendNodeId = await system.addQAPair(frontendQA);

      // Add deeper subtopic
      const reactQA: QAPair = {
        question: 'What is React in frontend web development?',
        answer: 'React is a JavaScript library for building web user interfaces.',
        timestamp: new Date(),
      };
      const reactNodeId = await system.addQAPair(reactQA);

      // Verify tree structure
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(3);
      
      // The system should create some hierarchical structure
      const rootNode = tree.nodes.get(rootNodeId);
      expect(rootNode!.depth).toBe(1);
      
      // Verify that the system processed all Q&A pairs
      const allQAPairs = Array.from(tree.nodes.values()).reduce((total, node) => 
        total + node.metadata.qaPairs.length, 0);
      expect(allQAPairs).toBe(3);

      // Verify deepest unvisited branch exists
      const deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).not.toBeNull();
    });

    it('should handle multiple root topics', async () => {
      // Add first root topic
      const webQA: QAPair = {
        question: 'What is web development?',
        answer: 'Web development creates websites.',
        timestamp: new Date(),
      };
      const webNodeId = await system.addQAPair(webQA);

      // Add unrelated root topic
      const mobileQA: QAPair = {
        question: 'What is mobile development?',
        answer: 'Mobile development creates mobile apps.',
        timestamp: new Date(),
      };
      const mobileNodeId = await system.addQAPair(mobileQA);

      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(2);
      expect(tree.rootNodes).toHaveLength(2);
      expect(tree.rootNodes).toContain(webNodeId);
      expect(tree.rootNodes).toContain(mobileNodeId);

      const webNode = tree.nodes.get(webNodeId);
      const mobileNode = tree.nodes.get(mobileNodeId);

      expect(webNode!.depth).toBe(1);
      expect(mobileNode!.depth).toBe(1);
      expect(webNode!.parentTopic).toBeNull();
      expect(mobileNode!.parentTopic).toBeNull();
    });
  });
});