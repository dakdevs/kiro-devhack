/**
 * Unit tests for TreeNavigator class
 * Tests depth calculation and navigation utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TreeNavigator } from '../TreeNavigator';
import { TopicTreeManager } from '../TopicTreeManager';
import { TopicNode } from '../TopicNode';
import { ConversationTree } from '../../types/conversation-grading';

describe('TreeNavigator', () => {
  let navigator: TreeNavigator;
  let manager: TopicTreeManager;
  let tree: ConversationTree;

  beforeEach(() => {
    navigator = new TreeNavigator();
    manager = new TopicTreeManager('test-session');
    
    // Create a complex tree structure for testing
    // Root level
    const programming = new TopicNode('programming', 'Programming Basics');
    const webDev = new TopicNode('webdev', 'Web Development');
    
    // Second level
    const typescript = new TopicNode('typescript', 'TypeScript', 'programming');
    const javascript = new TopicNode('javascript', 'JavaScript', 'programming');
    const react = new TopicNode('react', 'React', 'webdev');
    const vue = new TopicNode('vue', 'Vue.js', 'webdev');
    
    // Third level
    const tsAdvanced = new TopicNode('ts-advanced', 'Advanced TypeScript', 'typescript');
    const tsTypes = new TopicNode('ts-types', 'TypeScript Types', 'typescript');
    const reactHooks = new TopicNode('react-hooks', 'React Hooks', 'react');
    
    // Fourth level
    const reactCustomHooks = new TopicNode('react-custom-hooks', 'Custom Hooks', 'react-hooks');
    
    // Add all nodes to manager
    manager.addNode(programming);
    manager.addNode(webDev);
    manager.addNode(typescript);
    manager.addNode(javascript);
    manager.addNode(react);
    manager.addNode(vue);
    manager.addNode(tsAdvanced);
    manager.addNode(tsTypes);
    manager.addNode(reactHooks);
    manager.addNode(reactCustomHooks);
    
    tree = manager.getTree();
  });

  describe('Depth Calculation', () => {
    it('should calculate correct depth for root nodes', () => {
      expect(navigator.getDepthFromRoot('programming', tree)).toBe(1);
      expect(navigator.getDepthFromRoot('webdev', tree)).toBe(1);
    });

    it('should calculate correct depth for second level nodes', () => {
      expect(navigator.getDepthFromRoot('typescript', tree)).toBe(2);
      expect(navigator.getDepthFromRoot('javascript', tree)).toBe(2);
      expect(navigator.getDepthFromRoot('react', tree)).toBe(2);
      expect(navigator.getDepthFromRoot('vue', tree)).toBe(2);
    });

    it('should calculate correct depth for third level nodes', () => {
      expect(navigator.getDepthFromRoot('ts-advanced', tree)).toBe(3);
      expect(navigator.getDepthFromRoot('ts-types', tree)).toBe(3);
      expect(navigator.getDepthFromRoot('react-hooks', tree)).toBe(3);
    });

    it('should calculate correct depth for fourth level nodes', () => {
      expect(navigator.getDepthFromRoot('react-custom-hooks', tree)).toBe(4);
    });

    it('should throw error for non-existent node', () => {
      expect(() => navigator.getDepthFromRoot('non-existent', tree))
        .toThrow('Node with ID non-existent not found');
    });

    it('should handle depth calculation after tree modifications', () => {
      // Move typescript under webdev
      manager.updateNode('typescript', { parentTopic: 'webdev' });
      const updatedTree = manager.getTree();
      
      expect(navigator.getDepthFromRoot('typescript', updatedTree)).toBe(2);
      expect(navigator.getDepthFromRoot('ts-advanced', updatedTree)).toBe(3);
      expect(navigator.getDepthFromRoot('ts-types', updatedTree)).toBe(3);
    });
  });

  describe('Path Finding', () => {
    it('should find path between nodes in same branch', () => {
      const path = navigator.findPath('programming', 'ts-advanced', tree);
      expect(path).toEqual(['programming', 'typescript', 'ts-advanced']);
    });

    it('should find path between nodes in different branches of same tree', () => {
      const path = navigator.findPath('ts-advanced', 'ts-types', tree);
      expect(path).toEqual(['ts-advanced', 'typescript', 'ts-types']);
    });

    it('should throw error for nodes in different trees', () => {
      expect(() => navigator.findPath('ts-advanced', 'react-hooks', tree))
        .toThrow('No common ancestor found - nodes may be in different trees');
    });

    it('should return single node path for same node', () => {
      const path = navigator.findPath('typescript', 'typescript', tree);
      expect(path).toEqual(['typescript']);
    });

    it('should find path between sibling nodes', () => {
      const path = navigator.findPath('typescript', 'javascript', tree);
      expect(path).toEqual(['typescript', 'programming', 'javascript']);
    });

    it('should throw error for non-existent nodes', () => {
      expect(() => navigator.findPath('non-existent', 'typescript', tree))
        .toThrow('One or both nodes not found');
      
      expect(() => navigator.findPath('typescript', 'non-existent', tree))
        .toThrow('One or both nodes not found');
    });
  });

  describe('Leaf Node Detection', () => {
    it('should identify all leaf nodes correctly', () => {
      const leafNodes = navigator.getLeafNodes(tree);
      const leafIds = leafNodes.map(node => node.id).sort();
      
      expect(leafIds).toEqual([
        'javascript',
        'react-custom-hooks',
        'ts-advanced',
        'ts-types',
        'vue'
      ]);
    });

    it('should update leaf nodes after tree modifications', () => {
      // Add a child to javascript (making it no longer a leaf)
      const jsFrameworks = new TopicNode('js-frameworks', 'JS Frameworks', 'javascript');
      manager.addNode(jsFrameworks);
      
      const updatedTree = manager.getTree();
      const leafNodes = navigator.getLeafNodes(updatedTree);
      const leafIds = leafNodes.map(node => node.id).sort();
      
      expect(leafIds).toEqual([
        'js-frameworks',
        'react-custom-hooks',
        'ts-advanced',
        'ts-types',
        'vue'
      ]);
    });
  });

  describe('Unvisited Branch Detection', () => {
    it('should identify all unvisited branches initially', () => {
      const unvisitedBranches = navigator.getUnvisitedBranches(tree);
      const unvisitedIds = unvisitedBranches.map(node => node.id).sort();
      
      expect(unvisitedIds).toEqual([
        'javascript',
        'react-custom-hooks',
        'ts-advanced',
        'ts-types',
        'vue'
      ]);
    });

    it('should exclude visited branches', () => {
      // Mark some nodes as visited
      const jsNode = manager.getNode('javascript');
      const vueNode = manager.getNode('vue');
      
      jsNode?.markAsVisited();
      vueNode?.markAsVisited();
      
      const updatedTree = manager.getTree();
      const unvisitedBranches = navigator.getUnvisitedBranches(updatedTree);
      const unvisitedIds = unvisitedBranches.map(node => node.id).sort();
      
      expect(unvisitedIds).toEqual([
        'react-custom-hooks',
        'ts-advanced',
        'ts-types'
      ]);
    });

    it('should exclude exhausted branches', () => {
      // Mark some nodes as exhausted
      const tsAdvancedNode = manager.getNode('ts-advanced');
      const tsTypesNode = manager.getNode('ts-types');
      
      tsAdvancedNode?.markAsExhausted();
      tsTypesNode?.markAsExhausted();
      
      const updatedTree = manager.getTree();
      const unvisitedBranches = navigator.getUnvisitedBranches(updatedTree);
      const unvisitedIds = unvisitedBranches.map(node => node.id).sort();
      
      expect(unvisitedIds).toEqual([
        'javascript',
        'react-custom-hooks',
        'vue'
      ]);
    });
  });

  describe('Deepest Unvisited Branch', () => {
    it('should find the deepest unvisited branch', () => {
      const deepest = navigator.getDeepestUnvisitedBranch(tree);
      expect(deepest?.id).toBe('react-custom-hooks');
      expect(deepest?.depth).toBe(4);
    });

    it('should return null when all branches are visited', () => {
      // Mark all leaf nodes as visited
      const leafNodes = navigator.getLeafNodes(tree);
      leafNodes.forEach(node => {
        const actualNode = manager.getNode(node.id);
        actualNode?.markAsVisited();
      });
      
      const updatedTree = manager.getTree();
      const deepest = navigator.getDeepestUnvisitedBranch(updatedTree);
      expect(deepest).toBeNull();
    });

    it('should return null when all branches are exhausted', () => {
      // Mark all leaf nodes as exhausted
      const leafNodes = navigator.getLeafNodes(tree);
      leafNodes.forEach(node => {
        const actualNode = manager.getNode(node.id);
        actualNode?.markAsExhausted();
      });
      
      const updatedTree = manager.getTree();
      const deepest = navigator.getDeepestUnvisitedBranch(updatedTree);
      expect(deepest).toBeNull();
    });

    it('should find next deepest after marking deepest as visited', () => {
      // Mark the deepest as visited
      const reactCustomHooksNode = manager.getNode('react-custom-hooks');
      reactCustomHooksNode?.markAsVisited();
      
      const updatedTree = manager.getTree();
      const deepest = navigator.getDeepestUnvisitedBranch(updatedTree);
      
      // Should now return one of the depth-3 nodes
      expect(deepest?.depth).toBe(3);
      expect(['ts-advanced', 'ts-types']).toContain(deepest?.id);
    });
  });

  describe('Nodes at Depth', () => {
    it('should get all nodes at depth 1 (root nodes)', () => {
      const nodesAtDepth1 = navigator.getNodesAtDepth(1, tree);
      const nodeIds = nodesAtDepth1.map(node => node.id).sort();
      
      expect(nodeIds).toEqual(['programming', 'webdev']);
    });

    it('should get all nodes at depth 2', () => {
      const nodesAtDepth2 = navigator.getNodesAtDepth(2, tree);
      const nodeIds = nodesAtDepth2.map(node => node.id).sort();
      
      expect(nodeIds).toEqual(['javascript', 'react', 'typescript', 'vue']);
    });

    it('should get all nodes at depth 3', () => {
      const nodesAtDepth3 = navigator.getNodesAtDepth(3, tree);
      const nodeIds = nodesAtDepth3.map(node => node.id).sort();
      
      expect(nodeIds).toEqual(['react-hooks', 'ts-advanced', 'ts-types']);
    });

    it('should return empty array for non-existent depth', () => {
      const nodesAtDepth10 = navigator.getNodesAtDepth(10, tree);
      expect(nodesAtDepth10).toEqual([]);
    });
  });

  describe('Maximum Depth', () => {
    it('should calculate correct maximum depth', () => {
      const maxDepth = navigator.getMaxDepth(tree);
      expect(maxDepth).toBe(4);
    });

    it('should update maximum depth after adding deeper nodes', () => {
      // Add a fifth level node
      const advancedCustomHooks = new TopicNode('advanced-custom-hooks', 'Advanced Custom Hooks', 'react-custom-hooks');
      manager.addNode(advancedCustomHooks);
      
      const updatedTree = manager.getTree();
      const maxDepth = navigator.getMaxDepth(updatedTree);
      expect(maxDepth).toBe(5);
    });

    it('should return 0 for empty tree', () => {
      const emptyManager = new TopicTreeManager();
      const emptyTree = emptyManager.getTree();
      const maxDepth = navigator.getMaxDepth(emptyTree);
      expect(maxDepth).toBe(0);
    });
  });

  describe('Ancestor and Descendant Relationships', () => {
    it('should get all ancestors of a node', () => {
      const ancestors = navigator.getAncestors('react-custom-hooks', tree);
      const ancestorIds = ancestors.map(node => node.id);
      
      expect(ancestorIds).toEqual(['react-hooks', 'react', 'webdev']);
    });

    it('should return empty array for root node ancestors', () => {
      const ancestors = navigator.getAncestors('programming', tree);
      expect(ancestors).toEqual([]);
    });

    it('should get all descendants of a node', () => {
      const descendants = navigator.getDescendants('programming', tree);
      const descendantIds = descendants.map(node => node.id).sort();
      
      expect(descendantIds).toEqual(['javascript', 'ts-advanced', 'ts-types', 'typescript']);
    });

    it('should return empty array for leaf node descendants', () => {
      const descendants = navigator.getDescendants('javascript', tree);
      expect(descendants).toEqual([]);
    });

    it('should correctly identify ancestor relationships', () => {
      expect(navigator.isAncestor('programming', 'typescript', tree)).toBe(true);
      expect(navigator.isAncestor('webdev', 'react-custom-hooks', tree)).toBe(true);
      expect(navigator.isAncestor('typescript', 'programming', tree)).toBe(false);
      expect(navigator.isAncestor('typescript', 'typescript', tree)).toBe(false);
    });

    it('should correctly identify descendant relationships', () => {
      expect(navigator.isDescendant('typescript', 'programming', tree)).toBe(true);
      expect(navigator.isDescendant('react-custom-hooks', 'webdev', tree)).toBe(true);
      expect(navigator.isDescendant('programming', 'typescript', tree)).toBe(false);
      expect(navigator.isDescendant('typescript', 'typescript', tree)).toBe(false);
    });
  });

  describe('Sibling Relationships', () => {
    it('should get siblings of a node', () => {
      const siblings = navigator.getSiblings('typescript', tree);
      const siblingIds = siblings.map(node => node.id);
      
      expect(siblingIds).toEqual(['javascript']);
    });

    it('should get siblings of root nodes', () => {
      const siblings = navigator.getSiblings('programming', tree);
      const siblingIds = siblings.map(node => node.id);
      
      expect(siblingIds).toEqual(['webdev']);
    });

    it('should return empty array for only child', () => {
      const siblings = navigator.getSiblings('react-custom-hooks', tree);
      expect(siblings).toEqual([]);
    });

    it('should get multiple siblings', () => {
      const siblings = navigator.getSiblings('react', tree);
      const siblingIds = siblings.map(node => node.id);
      
      expect(siblingIds).toEqual(['vue']);
    });
  });

  describe('Current Position Tracking', () => {
    it('should return empty position for empty path', () => {
      const position = navigator.getCurrentPosition(tree);
      
      expect(position.currentNode).toBeNull();
      expect(position.depth).toBe(0);
      expect(position.pathFromRoot).toEqual([]);
      expect(position.availableChildren).toEqual([]);
      expect(position.siblings).toEqual([]);
    });

    it('should get current position with path set', () => {
      manager.setCurrentPath(['programming', 'typescript']);
      const updatedTree = manager.getTree();
      const position = navigator.getCurrentPosition(updatedTree);
      
      expect(position.currentNode?.id).toBe('typescript');
      expect(position.depth).toBe(2);
      expect(position.pathFromRoot).toEqual(['programming', 'typescript']);
      
      const childIds = position.availableChildren.map(child => child.id).sort();
      expect(childIds).toEqual(['ts-advanced', 'ts-types']);
      
      const siblingIds = position.siblings.map(sibling => sibling.id);
      expect(siblingIds).toEqual(['javascript']);
    });

    it('should handle position at leaf node', () => {
      manager.setCurrentPath(['webdev', 'react', 'react-hooks', 'react-custom-hooks']);
      const updatedTree = manager.getTree();
      const position = navigator.getCurrentPosition(updatedTree);
      
      expect(position.currentNode?.id).toBe('react-custom-hooks');
      expect(position.depth).toBe(4);
      expect(position.availableChildren).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid node in depth calculation', () => {
      expect(() => navigator.getDepthFromRoot('invalid', tree))
        .toThrow('Node with ID invalid not found');
    });

    it('should throw error for invalid node in ancestors', () => {
      expect(() => navigator.getAncestors('invalid', tree))
        .toThrow('Node with ID invalid not found');
    });

    it('should throw error for invalid node in descendants', () => {
      expect(() => navigator.getDescendants('invalid', tree))
        .toThrow('Node with ID invalid not found');
    });

    it('should throw error for invalid node in siblings', () => {
      expect(() => navigator.getSiblings('invalid', tree))
        .toThrow('Node with ID invalid not found');
    });

    it('should handle corrupted tree structure gracefully', () => {
      // Create a tree with missing parent reference
      const corruptedTree: ConversationTree = {
        nodes: new Map([
          ['child', {
            id: 'child',
            topic: 'Child',
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
      
      expect(() => navigator.getDepthFromRoot('child', corruptedTree))
        .toThrow('Node with ID missing-parent not found during traversal');
    });
  });
});