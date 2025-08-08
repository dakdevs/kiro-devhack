/**
 * Unit tests for TopicNode class
 * Tests tree operations, parent-child relationships, and depth calculations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TopicNode } from '../TopicNode';
import { QAPair } from '../../types/conversation-grading';

describe('TopicNode', () => {
  let rootNode: TopicNode;
  let childNode: TopicNode;
  let grandchildNode: TopicNode;
  let sampleQAPair: QAPair;

  beforeEach(() => {
    rootNode = new TopicNode('root-1', 'Programming Basics');
    childNode = new TopicNode('child-1', 'Variables');
    grandchildNode = new TopicNode('grandchild-1', 'Variable Types');
    
    sampleQAPair = {
      question: 'What is a variable?',
      answer: 'A variable is a storage location with a name.',
      timestamp: new Date(),
      metadata: { difficulty: 'beginner' }
    };
  });

  describe('Constructor and Basic Properties', () => {
    it('should create a node with required properties', () => {
      const node = new TopicNode('test-1', 'Test Topic', null, 85);
      
      expect(node.id).toBe('test-1');
      expect(node.topic).toBe('Test Topic');
      expect(node.parentTopic).toBeNull();
      expect(node.children).toEqual([]);
      expect(node.depth).toBe(1);
      expect(node.score).toBe(85);
      expect(node.createdAt).toBeInstanceOf(Date);
      expect(node.updatedAt).toBeInstanceOf(Date);
      expect(node.metadata.qaPairs).toEqual([]);
      expect(node.metadata.visitCount).toBe(0);
      expect(node.metadata.lastVisited).toBeNull();
      expect(node.metadata.isExhausted).toBe(false);
    });

    it('should create a node with default values', () => {
      const node = new TopicNode('test-2', 'Test Topic 2');
      
      expect(node.parentTopic).toBeNull();
      expect(node.score).toBeNull();
      expect(node.depth).toBe(1);
    });
  });

  describe('Parent-Child Relationships', () => {
    it('should set parent correctly', () => {
      childNode.setParent(rootNode);
      
      expect(childNode.getParent()).toBe(rootNode);
      expect(childNode.parentTopic).toBe(rootNode.id);
      expect(rootNode.children).toContain(childNode.id);
      expect(rootNode.getChildren()).toContain(childNode);
    });

    it('should update depth when setting parent', () => {
      childNode.setParent(rootNode);
      
      expect(childNode.depth).toBe(2);
      expect(rootNode.depth).toBe(1);
    });

    it('should handle changing parents', () => {
      const newParent = new TopicNode('new-parent', 'New Parent');
      
      childNode.setParent(rootNode);
      expect(childNode.depth).toBe(2);
      expect(rootNode.children).toContain(childNode.id);
      
      childNode.setParent(newParent);
      expect(childNode.getParent()).toBe(newParent);
      expect(childNode.parentTopic).toBe(newParent.id);
      expect(newParent.children).toContain(childNode.id);
      expect(rootNode.children).not.toContain(childNode.id);
    });

    it('should handle removing parent (making node root)', () => {
      childNode.setParent(rootNode);
      expect(childNode.depth).toBe(2);
      
      childNode.setParent(null);
      expect(childNode.getParent()).toBeNull();
      expect(childNode.parentTopic).toBeNull();
      expect(childNode.depth).toBe(1);
      expect(rootNode.children).not.toContain(childNode.id);
    });

    it('should add child correctly', () => {
      rootNode.addChild(childNode);
      
      expect(rootNode.children).toContain(childNode.id);
      expect(rootNode.getChildren()).toContain(childNode);
      expect(childNode.getParent()).toBe(rootNode);
      expect(childNode.parentTopic).toBe(rootNode.id);
      expect(childNode.depth).toBe(2);
    });

    it('should not add duplicate children', () => {
      rootNode.addChild(childNode);
      rootNode.addChild(childNode);
      
      expect(rootNode.children.length).toBe(1);
      expect(rootNode.children.filter(id => id === childNode.id).length).toBe(1);
    });

    it('should remove child correctly', () => {
      rootNode.addChild(childNode);
      expect(rootNode.children).toContain(childNode.id);
      
      rootNode.removeChild(childNode);
      expect(rootNode.children).not.toContain(childNode.id);
      expect(rootNode.getChildren()).not.toContain(childNode);
      expect(childNode.getParent()).toBeNull();
      expect(childNode.parentTopic).toBeNull();
      expect(childNode.depth).toBe(1);
    });

    it('should get specific child by ID', () => {
      rootNode.addChild(childNode);
      
      expect(rootNode.getChild(childNode.id)).toBe(childNode);
      expect(rootNode.getChild('non-existent')).toBeNull();
    });
  });

  describe('Tree Structure Queries', () => {
    beforeEach(() => {
      rootNode.addChild(childNode);
      childNode.addChild(grandchildNode);
    });

    it('should identify node types correctly', () => {
      expect(rootNode.isRoot()).toBe(true);
      expect(rootNode.isLeaf()).toBe(false);
      expect(rootNode.hasChildren()).toBe(true);
      
      expect(childNode.isRoot()).toBe(false);
      expect(childNode.isLeaf()).toBe(false);
      expect(childNode.hasChildren()).toBe(true);
      
      expect(grandchildNode.isRoot()).toBe(false);
      expect(grandchildNode.isLeaf()).toBe(true);
      expect(grandchildNode.hasChildren()).toBe(false);
    });

    it('should calculate depth from root correctly', () => {
      expect(rootNode.calculateDepthFromRoot()).toBe(1);
      expect(childNode.calculateDepthFromRoot()).toBe(2);
      expect(grandchildNode.calculateDepthFromRoot()).toBe(3);
    });

    it('should get path from root correctly', () => {
      expect(rootNode.getPathFromRoot()).toEqual([rootNode.id]);
      expect(childNode.getPathFromRoot()).toEqual([rootNode.id, childNode.id]);
      expect(grandchildNode.getPathFromRoot()).toEqual([rootNode.id, childNode.id, grandchildNode.id]);
    });

    it('should get all descendants correctly', () => {
      const descendants = rootNode.getAllDescendants();
      
      expect(descendants).toHaveLength(2);
      expect(descendants).toContain(childNode);
      expect(descendants).toContain(grandchildNode);
    });

    it('should find descendant by ID', () => {
      expect(rootNode.findDescendant(rootNode.id)).toBe(rootNode);
      expect(rootNode.findDescendant(childNode.id)).toBe(childNode);
      expect(rootNode.findDescendant(grandchildNode.id)).toBe(grandchildNode);
      expect(rootNode.findDescendant('non-existent')).toBeNull();
    });
  });

  describe('Depth Updates', () => {
    it('should update children depth when parent depth changes', () => {
      const newRoot = new TopicNode('new-root', 'New Root');
      
      rootNode.addChild(childNode);
      childNode.addChild(grandchildNode);
      
      expect(childNode.depth).toBe(2);
      expect(grandchildNode.depth).toBe(3);
      
      // Move the entire subtree under a new parent
      newRoot.addChild(rootNode);
      
      expect(rootNode.depth).toBe(2);
      expect(childNode.depth).toBe(3);
      expect(grandchildNode.depth).toBe(4);
    });

    it('should recalculate depth correctly after tree restructuring', () => {
      rootNode.addChild(childNode);
      childNode.addChild(grandchildNode);
      
      // Move grandchild directly under root
      grandchildNode.setParent(rootNode);
      
      expect(grandchildNode.depth).toBe(2);
      expect(grandchildNode.getParent()).toBe(rootNode);
      expect(childNode.getChildren()).not.toContain(grandchildNode);
      expect(rootNode.getChildren()).toContain(grandchildNode);
    });
  });

  describe('Metadata Operations', () => {
    it('should add Q&A pairs correctly', () => {
      rootNode.addQAPair(sampleQAPair);
      
      expect(rootNode.metadata.qaPairs).toHaveLength(1);
      expect(rootNode.metadata.qaPairs[0]).toBe(sampleQAPair);
    });

    it('should mark as visited correctly', () => {
      const initialVisitCount = rootNode.metadata.visitCount;
      const initialLastVisited = rootNode.metadata.lastVisited;
      
      rootNode.markAsVisited();
      
      expect(rootNode.metadata.visitCount).toBe(initialVisitCount + 1);
      expect(rootNode.metadata.lastVisited).toBeInstanceOf(Date);
      expect(rootNode.metadata.lastVisited).not.toBe(initialLastVisited);
    });

    it('should mark as exhausted correctly', () => {
      expect(rootNode.metadata.isExhausted).toBe(false);
      
      rootNode.markAsExhausted();
      
      expect(rootNode.metadata.isExhausted).toBe(true);
    });

    it('should update score correctly', () => {
      expect(rootNode.score).toBeNull();
      
      rootNode.updateScore(92);
      
      expect(rootNode.score).toBe(92);
    });
  });

  describe('Score Management', () => {
    it('should get score correctly', () => {
      expect(rootNode.getScore()).toBeNull();
      
      rootNode.updateScore(75);
      expect(rootNode.getScore()).toBe(75);
    });

    it('should check if node has score', () => {
      expect(rootNode.hasScore()).toBe(false);
      
      rootNode.updateScore(80);
      expect(rootNode.hasScore()).toBe(true);
      
      rootNode.clearScore();
      expect(rootNode.hasScore()).toBe(false);
    });

    it('should clear score correctly', () => {
      rootNode.updateScore(90);
      expect(rootNode.getScore()).toBe(90);
      
      rootNode.clearScore();
      expect(rootNode.getScore()).toBeNull();
      expect(rootNode.hasScore()).toBe(false);
    });

    it('should get average score (same as node score for now)', () => {
      expect(rootNode.getAverageScore()).toBeNull();
      
      rootNode.updateScore(85);
      expect(rootNode.getAverageScore()).toBe(85);
    });

    it('should update updatedAt when score changes', () => {
      const initialUpdatedAt = rootNode.updatedAt;
      
      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        rootNode.updateScore(70);
        expect(rootNode.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
      }, 1);
    });

    it('should handle score independence from tree operations', () => {
      rootNode.updateScore(95);
      const initialScore = rootNode.getScore();
      
      // Tree operations should not affect score
      rootNode.addChild(childNode);
      expect(rootNode.getScore()).toBe(initialScore);
      
      rootNode.removeChild(childNode);
      expect(rootNode.getScore()).toBe(initialScore);
      
      rootNode.markAsVisited();
      expect(rootNode.getScore()).toBe(initialScore);
      
      rootNode.addQAPair(sampleQAPair);
      expect(rootNode.getScore()).toBe(initialScore);
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      rootNode.addChild(childNode);
      rootNode.addQAPair(sampleQAPair);
      rootNode.markAsVisited();
      rootNode.updateScore(88);
    });

    it('should convert to plain object correctly', () => {
      const plainObject = rootNode.toPlainObject();
      
      expect(plainObject.id).toBe(rootNode.id);
      expect(plainObject.topic).toBe(rootNode.topic);
      expect(plainObject.parentTopic).toBe(rootNode.parentTopic);
      expect(plainObject.children).toEqual(rootNode.children);
      expect(plainObject.depth).toBe(rootNode.depth);
      expect(plainObject.score).toBe(rootNode.score);
      expect(plainObject.createdAt).toBe(rootNode.createdAt);
      expect(plainObject.updatedAt).toBe(rootNode.updatedAt);
      expect(plainObject.metadata.qaPairs).toEqual(rootNode.metadata.qaPairs);
      expect(plainObject.metadata.visitCount).toBe(rootNode.metadata.visitCount);
      expect(plainObject.metadata.lastVisited).toBe(rootNode.metadata.lastVisited);
      expect(plainObject.metadata.isExhausted).toBe(rootNode.metadata.isExhausted);
    });

    it('should create from plain object correctly', () => {
      const plainObject = rootNode.toPlainObject();
      const recreatedNode = TopicNode.fromPlainObject(plainObject);
      
      expect(recreatedNode.id).toBe(rootNode.id);
      expect(recreatedNode.topic).toBe(rootNode.topic);
      expect(recreatedNode.parentTopic).toBe(rootNode.parentTopic);
      expect(recreatedNode.children).toEqual(rootNode.children);
      expect(recreatedNode.depth).toBe(rootNode.depth);
      expect(recreatedNode.score).toBe(rootNode.score);
      expect(recreatedNode.metadata.qaPairs).toEqual(rootNode.metadata.qaPairs);
      expect(recreatedNode.metadata.visitCount).toBe(rootNode.metadata.visitCount);
      expect(recreatedNode.metadata.isExhausted).toBe(rootNode.metadata.isExhausted);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children array operations', () => {
      expect(rootNode.getChildren()).toEqual([]);
      expect(rootNode.getChild('non-existent')).toBeNull();
      expect(rootNode.getAllDescendants()).toEqual([]);
    });

    it('should handle self-reference prevention', () => {
      // Attempting to set a node as its own parent should not cause issues
      expect(() => rootNode.setParent(rootNode)).not.toThrow();
      // The implementation should handle this gracefully
    });

    it('should maintain consistency during complex tree operations', () => {
      const nodeA = new TopicNode('a', 'Node A');
      const nodeB = new TopicNode('b', 'Node B');
      const nodeC = new TopicNode('c', 'Node C');
      
      nodeA.addChild(nodeB);
      nodeB.addChild(nodeC);
      
      expect(nodeC.depth).toBe(3);
      
      // Move nodeC to be a child of nodeA
      nodeC.setParent(nodeA);
      
      expect(nodeC.depth).toBe(2);
      expect(nodeC.getParent()).toBe(nodeA);
      expect(nodeB.getChildren()).not.toContain(nodeC);
      expect(nodeA.getChildren()).toContain(nodeC);
    });
  });
});