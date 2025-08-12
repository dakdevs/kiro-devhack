/**
 * Unit tests for TopicTreeManager
 * Tests tree storage, node operations, and tree integrity maintenance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TopicTreeManager } from '../TopicTreeManager';
import { TopicNode } from '../TopicNode';
import { QAPair } from '../../types/conversation-grading';

describe('TopicTreeManager', () => {
  let manager: TopicTreeManager;
  let sampleQAPair: QAPair;

  beforeEach(() => {
    manager = new TopicTreeManager('test-session');
    sampleQAPair = {
      question: 'What is TypeScript?',
      answer: 'TypeScript is a typed superset of JavaScript.',
      timestamp: new Date(),
      metadata: { source: 'test' }
    };
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty tree structure', () => {
      const tree = manager.getTree();
      expect(tree.nodes.size).toBe(0);
      expect(tree.rootNodes).toEqual([]);
      expect(tree.currentPath).toEqual([]);
      expect(tree.sessionId).toBe('test-session');
      expect(tree.createdAt).toBeInstanceOf(Date);
    });

    it('should use default session ID when none provided', () => {
      const defaultManager = new TopicTreeManager();
      const tree = defaultManager.getTree();
      expect(tree.sessionId).toBe('default');
    });
  });

  describe('Node Addition', () => {
    it('should add a root node successfully', () => {
      const rootNode = new TopicNode('root1', 'Programming Basics');
      
      manager.addNode(rootNode);
      
      const tree = manager.getTree();
      expect(tree.nodes.size).toBe(1);
      expect(tree.rootNodes).toEqual(['root1']);
      expect(manager.getNode('root1')).toBeTruthy();
    });

    it('should add a child node successfully', () => {
      const rootNode = new TopicNode('root1', 'Programming Basics');
      const childNode = new TopicNode('child1', 'TypeScript Basics', 'root1');
      
      manager.addNode(rootNode);
      manager.addNode(childNode);
      
      const tree = manager.getTree();
      expect(tree.nodes.size).toBe(2);
      expect(tree.rootNodes).toEqual(['root1']);
      
      const retrievedRoot = manager.getNode('root1');
      const retrievedChild = manager.getNode('child1');
      
      expect(retrievedRoot?.children).toContain('child1');
      expect(retrievedChild?.parentTopic).toBe('root1');
      expect(retrievedChild?.depth).toBe(2);
    });

    it('should throw error when adding node with duplicate ID', () => {
      const node1 = new TopicNode('duplicate', 'Topic 1');
      const node2 = new TopicNode('duplicate', 'Topic 2');
      
      manager.addNode(node1);
      
      expect(() => manager.addNode(node2)).toThrow('Node with ID duplicate already exists');
    });

    it('should throw error when adding node with non-existent parent', () => {
      const childNode = new TopicNode('child1', 'Child Topic', 'non-existent');
      
      expect(() => manager.addNode(childNode)).toThrow('Parent node non-existent not found');
    });

    it('should handle adding nodes from plain objects', () => {
      const plainNode = {
        id: 'plain1',
        topic: 'Plain Topic',
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
      };
      
      manager.addNode(plainNode);
      
      const retrievedNode = manager.getNode('plain1');
      expect(retrievedNode).toBeTruthy();
      expect(retrievedNode?.topic).toBe('Plain Topic');
    });
  });

  describe('Node Retrieval', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const child2 = new TopicNode('child2', 'JavaScript', 'root1');
      const grandchild = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(child2);
      manager.addNode(grandchild);
    });

    it('should retrieve existing nodes', () => {
      const node = manager.getNode('root1');
      expect(node).toBeTruthy();
      expect(node?.topic).toBe('Programming');
    });

    it('should return null for non-existent nodes', () => {
      const node = manager.getNode('non-existent');
      expect(node).toBeNull();
    });

    it('should get all root nodes', () => {
      const rootNodes = manager.getRootNodes();
      expect(rootNodes).toHaveLength(1);
      expect(rootNodes[0].id).toBe('root1');
    });

    it('should get children of a node', () => {
      const children = manager.getChildren('root1');
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toContain('child1');
      expect(children.map(c => c.id)).toContain('child2');
    });

    it('should get parent of a node', () => {
      const parent = manager.getParent('child1');
      expect(parent).toBeTruthy();
      expect(parent?.id).toBe('root1');
    });

    it('should return null for parent of root node', () => {
      const parent = manager.getParent('root1');
      expect(parent).toBeNull();
    });

    it('should return empty array for children of leaf node', () => {
      const children = manager.getChildren('child2');
      expect(children).toEqual([]);
    });
  });

  describe('Node Updates', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
    });

    it('should update node properties', () => {
      manager.updateNode('root1', { topic: 'Advanced Programming', score: 85 });
      
      const node = manager.getNode('root1');
      expect(node?.topic).toBe('Advanced Programming');
      expect(node?.score).toBe(85);
    });

    it('should move node to root', () => {
      manager.updateNode('child1', { parentTopic: null });
      
      const tree = manager.getTree();
      expect(tree.rootNodes).toContain('child1');
      
      const child = manager.getNode('child1');
      expect(child?.parentTopic).toBeNull();
      expect(child?.depth).toBe(1);
    });

    it('should move node to different parent', () => {
      const newParent = new TopicNode('parent2', 'Web Development');
      manager.addNode(newParent);
      
      manager.updateNode('child1', { parentTopic: 'parent2' });
      
      const child = manager.getNode('child1');
      expect(child?.parentTopic).toBe('parent2');
      
      const oldParent = manager.getNode('root1');
      const newParentNode = manager.getNode('parent2');
      
      expect(oldParent?.children).not.toContain('child1');
      expect(newParentNode?.children).toContain('child1');
    });

    it('should throw error when updating non-existent node', () => {
      expect(() => manager.updateNode('non-existent', { topic: 'New Topic' }))
        .toThrow('Node with ID non-existent not found');
    });
  });

  describe('Node Removal', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const child2 = new TopicNode('child2', 'JavaScript', 'root1');
      const grandchild = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(child2);
      manager.addNode(grandchild);
    });

    it('should remove leaf node', () => {
      manager.removeNode('child2');
      
      expect(manager.getNode('child2')).toBeNull();
      
      const parent = manager.getNode('root1');
      expect(parent?.children).not.toContain('child2');
    });

    it('should remove node with children and reassign to grandparent', () => {
      manager.removeNode('child1');
      
      expect(manager.getNode('child1')).toBeNull();
      
      const grandchild = manager.getNode('grandchild1');
      expect(grandchild?.parentTopic).toBe('root1');
      
      const root = manager.getNode('root1');
      expect(root?.children).toContain('grandchild1');
    });

    it('should remove root node and promote children to root', () => {
      manager.removeNode('root1');
      
      expect(manager.getNode('root1')).toBeNull();
      
      const tree = manager.getTree();
      expect(tree.rootNodes).toContain('child1');
      expect(tree.rootNodes).toContain('child2');
      
      const child1 = manager.getNode('child1');
      expect(child1?.parentTopic).toBeNull();
      expect(child1?.depth).toBe(1);
    });

    it('should remove node from current path', () => {
      manager.setCurrentPath(['root1', 'child1', 'grandchild1']);
      manager.removeNode('child1');
      
      const currentPath = manager.getCurrentPath();
      expect(currentPath).toEqual(['root1']);
    });

    it('should throw error when removing non-existent node', () => {
      expect(() => manager.removeNode('non-existent'))
        .toThrow('Node with ID non-existent not found');
    });
  });

  describe('Depth Calculation', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const grandchild = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(grandchild);
    });

    it('should calculate correct depth for root node', () => {
      const depth = manager.calculateDepth('root1');
      expect(depth).toBe(1);
    });

    it('should calculate correct depth for child node', () => {
      const depth = manager.calculateDepth('child1');
      expect(depth).toBe(2);
    });

    it('should calculate correct depth for grandchild node', () => {
      const depth = manager.calculateDepth('grandchild1');
      expect(depth).toBe(3);
    });

    it('should throw error for non-existent node', () => {
      expect(() => manager.calculateDepth('non-existent'))
        .toThrow('Node with ID non-existent not found');
    });
  });

  describe('Deepest Unvisited Branch Finding', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const child2 = new TopicNode('child2', 'JavaScript', 'root1');
      const grandchild1 = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      const grandchild2 = new TopicNode('grandchild2', 'React', 'child2');
      const greatGrandchild = new TopicNode('greatgrand1', 'React Hooks', 'grandchild2');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(child2);
      manager.addNode(grandchild1);
      manager.addNode(grandchild2);
      manager.addNode(greatGrandchild);
    });

    it('should find deepest unvisited branch', () => {
      const deepest = manager.findDeepestUnvisitedBranch();
      expect(deepest).toBeTruthy();
      expect(deepest?.id).toBe('greatgrand1');
      expect(deepest?.depth).toBe(4);
    });

    it('should return null when all branches are visited', () => {
      // Mark all leaf nodes as visited
      const grandchild1 = manager.getNode('grandchild1');
      const greatGrandchild = manager.getNode('greatgrand1');
      
      grandchild1?.markAsVisited();
      greatGrandchild?.markAsVisited();
      
      const deepest = manager.findDeepestUnvisitedBranch();
      expect(deepest).toBeNull();
    });

    it('should return null when all branches are exhausted', () => {
      // Mark all leaf nodes as exhausted
      const grandchild1 = manager.getNode('grandchild1');
      const greatGrandchild = manager.getNode('greatgrand1');
      
      grandchild1?.markAsExhausted();
      greatGrandchild?.markAsExhausted();
      
      const deepest = manager.findDeepestUnvisitedBranch();
      expect(deepest).toBeNull();
    });

    it('should find first deepest when multiple nodes have same depth', () => {
      // Both grandchild1 and grandchild2 are at depth 3, but greatgrand1 is at depth 4
      // Remove greatgrand1 to make grandchild2 a leaf at depth 3
      manager.removeNode('greatgrand1');
      
      const deepest = manager.findDeepestUnvisitedBranch();
      expect(deepest).toBeTruthy();
      expect(deepest?.depth).toBe(3);
      // Should return one of the grandchildren
      expect(['grandchild1', 'grandchild2']).toContain(deepest?.id);
    });
  });

  describe('Current Path Management', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const grandchild = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(grandchild);
    });

    it('should set valid current path', () => {
      manager.setCurrentPath(['root1', 'child1', 'grandchild1']);
      
      const path = manager.getCurrentPath();
      expect(path).toEqual(['root1', 'child1', 'grandchild1']);
    });

    it('should get current topic from path', () => {
      manager.setCurrentPath(['root1', 'child1']);
      
      const currentTopic = manager.getCurrentTopic();
      expect(currentTopic?.id).toBe('child1');
    });

    it('should return null for current topic when path is empty', () => {
      const currentTopic = manager.getCurrentTopic();
      expect(currentTopic).toBeNull();
    });

    it('should throw error for invalid path with non-existent node', () => {
      expect(() => manager.setCurrentPath(['root1', 'non-existent']))
        .toThrow('Node non-existent in path not found');
    });

    it('should throw error for invalid parent-child relationship in path', () => {
      const root2 = new TopicNode('root2', 'Web Development');
      manager.addNode(root2);
      
      expect(() => manager.setCurrentPath(['root1', 'root2']))
        .toThrow('Invalid path: root2 is not a child of root1');
    });
  });

  describe('Tree Statistics', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const child2 = new TopicNode('child2', 'JavaScript', 'root1');
      const grandchild = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(child2);
      manager.addNode(grandchild);
    });

    it('should provide correct tree statistics', () => {
      const stats = manager.getStats();
      
      expect(stats.totalNodes).toBe(4);
      expect(stats.rootNodes).toBe(1);
      expect(stats.maxDepth).toBe(3);
      expect(stats.leafNodes).toBe(2); // child2 and grandchild1
    });

    it('should handle empty tree statistics', () => {
      const emptyManager = new TopicTreeManager();
      const stats = emptyManager.getStats();
      
      expect(stats.totalNodes).toBe(0);
      expect(stats.rootNodes).toBe(0);
      expect(stats.maxDepth).toBe(0);
      expect(stats.leafNodes).toBe(0);
    });
  });

  describe('Tree Integrity Validation', () => {
    it('should maintain tree integrity after operations', () => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      
      // Tree should be valid after normal operations
      expect(() => manager.getTree()).not.toThrow();
    });

    it('should prevent circular references', () => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      
      // Try to create circular reference
      expect(() => manager.updateNode('root1', { parentTopic: 'child1' }))
        .toThrow('Cannot move node: would create circular reference');
    });
  });

  describe('Navigation Utilities', () => {
    beforeEach(() => {
      const rootNode = new TopicNode('root1', 'Programming');
      const child1 = new TopicNode('child1', 'TypeScript', 'root1');
      const child2 = new TopicNode('child2', 'JavaScript', 'root1');
      const grandchild = new TopicNode('grandchild1', 'Advanced TypeScript', 'child1');
      
      manager.addNode(rootNode);
      manager.addNode(child1);
      manager.addNode(child2);
      manager.addNode(grandchild);
    });

    it('should get depth from root using navigator', () => {
      expect(manager.getDepthFromRoot('root1')).toBe(1);
      expect(manager.getDepthFromRoot('child1')).toBe(2);
      expect(manager.getDepthFromRoot('grandchild1')).toBe(3);
    });

    it('should find path between nodes', () => {
      const path = manager.findPath('child2', 'grandchild1');
      expect(path).toEqual(['child2', 'root1', 'child1', 'grandchild1']);
    });

    it('should get leaf nodes', () => {
      const leafNodes = manager.getLeafNodes();
      const leafIds = leafNodes.map(node => node.id).sort();
      expect(leafIds).toEqual(['child2', 'grandchild1']);
    });

    it('should get unvisited branches', () => {
      const unvisitedBranches = manager.getUnvisitedBranches();
      const unvisitedIds = unvisitedBranches.map(node => node.id).sort();
      expect(unvisitedIds).toEqual(['child2', 'grandchild1']);
    });

    it('should get deepest unvisited branch', () => {
      const deepest = manager.getDeepestUnvisitedBranch();
      expect(deepest?.id).toBe('grandchild1');
      expect(deepest?.depth).toBe(3);
    });

    it('should get nodes at specific depth', () => {
      const nodesAtDepth2 = manager.getNodesAtDepth(2);
      const nodeIds = nodesAtDepth2.map(node => node.id).sort();
      expect(nodeIds).toEqual(['child1', 'child2']);
    });

    it('should get maximum depth', () => {
      expect(manager.getMaxDepth()).toBe(3);
    });

    it('should get ancestors', () => {
      const ancestors = manager.getAncestors('grandchild1');
      const ancestorIds = ancestors.map(node => node.id);
      expect(ancestorIds).toEqual(['child1', 'root1']);
    });

    it('should get descendants', () => {
      const descendants = manager.getDescendants('root1');
      const descendantIds = descendants.map(node => node.id).sort();
      expect(descendantIds).toEqual(['child1', 'child2', 'grandchild1']);
    });

    it('should get siblings', () => {
      const siblings = manager.getSiblings('child1');
      const siblingIds = siblings.map(node => node.id);
      expect(siblingIds).toEqual(['child2']);
    });

    it('should check ancestor relationships', () => {
      expect(manager.isAncestor('root1', 'grandchild1')).toBe(true);
      expect(manager.isAncestor('grandchild1', 'root1')).toBe(false);
    });

    it('should check descendant relationships', () => {
      expect(manager.isDescendant('grandchild1', 'root1')).toBe(true);
      expect(manager.isDescendant('root1', 'grandchild1')).toBe(false);
    });

    it('should get current position', () => {
      manager.setCurrentPath(['root1', 'child1']);
      const position = manager.getCurrentPosition();
      
      expect(position.currentNode?.id).toBe('child1');
      expect(position.depth).toBe(2);
      expect(position.pathFromRoot).toEqual(['root1', 'child1']);
      
      const childIds = position.availableChildren.map(child => child.id);
      expect(childIds).toEqual(['grandchild1']);
      
      const siblingIds = position.siblings.map(sibling => sibling.id);
      expect(siblingIds).toEqual(['child2']);
    });

    it('should get navigator instance', () => {
      const navigator = manager.getNavigator();
      expect(navigator).toBeDefined();
      expect(typeof navigator.getDepthFromRoot).toBe('function');
    });
  });

  describe('Clear Operation', () => {
    it('should clear all tree data', () => {
      const rootNode = new TopicNode('root1', 'Programming');
      manager.addNode(rootNode);
      
      manager.clear();
      
      const tree = manager.getTree();
      expect(tree.nodes.size).toBe(0);
      expect(tree.rootNodes).toEqual([]);
      expect(tree.currentPath).toEqual([]);
    });
  });
});