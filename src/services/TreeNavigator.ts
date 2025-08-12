/**
 * TreeNavigator class implementation for the Conversation Grading System
 * Provides depth calculation and navigation utilities for the topic tree
 */

import { ConversationTree, TopicNode as ITopicNode, ITreeNavigator } from '../types/conversation-grading';
import { TopicNode } from './TopicNode';

export class TreeNavigator implements ITreeNavigator {
  /**
   * Calculate depth from root for a given node
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  getDepthFromRoot(nodeId: string, tree: ConversationTree): number {
    const node = tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // If it's a root node, depth is 1
    if (!node.parentTopic) {
      return 1;
    }

    // Traverse up the tree to calculate depth
    let depth = 1;
    let currentNodeId: string | null = nodeId;

    while (currentNodeId) {
      const currentNode = tree.nodes.get(currentNodeId);
      if (!currentNode) {
        throw new Error(`Node with ID ${currentNodeId} not found during traversal`);
      }

      if (currentNode.parentTopic) {
        depth++;
        currentNodeId = currentNode.parentTopic;
      } else {
        // Reached root
        break;
      }
    }

    return depth;
  }

  /**
   * Find path between two nodes in the tree
   * Returns array of node IDs representing the path from fromNodeId to toNodeId
   */
  findPath(fromNodeId: string, toNodeId: string, tree: ConversationTree): string[] {
    if (fromNodeId === toNodeId) {
      return [fromNodeId];
    }

    const fromNode = tree.nodes.get(fromNodeId);
    const toNode = tree.nodes.get(toNodeId);

    if (!fromNode || !toNode) {
      throw new Error('One or both nodes not found');
    }

    // Get paths from both nodes to root
    const fromPath = this.getPathToRoot(fromNodeId, tree);
    const toPath = this.getPathToRoot(toNodeId, tree);

    // Find common ancestor
    const commonAncestor = this.findCommonAncestor(fromPath, toPath);
    if (!commonAncestor) {
      throw new Error('No common ancestor found - nodes may be in different trees');
    }

    // Build path: from -> common ancestor -> to
    const fromToAncestorIndex = fromPath.indexOf(commonAncestor);
    const toToAncestorIndex = toPath.indexOf(commonAncestor);
    
    const fromToAncestor = fromPath.slice(0, fromToAncestorIndex + 1);
    const ancestorToTo = toPath.slice(0, toToAncestorIndex).reverse();

    return [...fromToAncestor, ...ancestorToTo];
  }

  /**
   * Get all leaf nodes (nodes with no children)
   */
  getLeafNodes(tree: ConversationTree): ITopicNode[] {
    const leafNodes: ITopicNode[] = [];

    for (const [, node] of tree.nodes) {
      if (node.children.length === 0) {
        leafNodes.push(node);
      }
    }

    return leafNodes;
  }

  /**
   * Get all unvisited branches (leaf nodes that haven't been visited or exhausted)
   */
  getUnvisitedBranches(tree: ConversationTree): ITopicNode[] {
    const leafNodes = this.getLeafNodes(tree);
    
    return leafNodes.filter(node => 
      !node.metadata.isExhausted && node.metadata.visitCount === 0
    );
  }

  /**
   * Get the deepest unvisited branch
   * Returns the leaf node with maximum depth that hasn't been visited
   */
  getDeepestUnvisitedBranch(tree: ConversationTree): ITopicNode | null {
    const unvisitedBranches = this.getUnvisitedBranches(tree);

    if (unvisitedBranches.length === 0) {
      return null;
    }

    // Find the branch with maximum depth
    return unvisitedBranches.reduce((deepest, current) => 
      current.depth > deepest.depth ? current : deepest
    );
  }

  /**
   * Get all nodes at a specific depth level
   */
  getNodesAtDepth(depth: number, tree: ConversationTree): ITopicNode[] {
    const nodesAtDepth: ITopicNode[] = [];

    for (const [, node] of tree.nodes) {
      if (node.depth === depth) {
        nodesAtDepth.push(node);
      }
    }

    return nodesAtDepth;
  }

  /**
   * Get the maximum depth in the tree
   */
  getMaxDepth(tree: ConversationTree): number {
    let maxDepth = 0;

    for (const [, node] of tree.nodes) {
      if (node.depth > maxDepth) {
        maxDepth = node.depth;
      }
    }

    return maxDepth;
  }

  /**
   * Get all ancestors of a node (path from node to root, excluding the node itself)
   */
  getAncestors(nodeId: string, tree: ConversationTree): ITopicNode[] {
    const node = tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const ancestors: ITopicNode[] = [];
    let currentNodeId = node.parentTopic;

    while (currentNodeId) {
      const currentNode = tree.nodes.get(currentNodeId);
      if (!currentNode) {
        throw new Error(`Ancestor node with ID ${currentNodeId} not found`);
      }

      ancestors.push(currentNode);
      currentNodeId = currentNode.parentTopic;
    }

    return ancestors;
  }

  /**
   * Get all descendants of a node (all children, grandchildren, etc.)
   */
  getDescendants(nodeId: string, tree: ConversationTree): ITopicNode[] {
    const node = tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const descendants: ITopicNode[] = [];
    const queue: string[] = [...node.children];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = tree.nodes.get(currentId);
      
      if (currentNode) {
        descendants.push(currentNode);
        queue.push(...currentNode.children);
      }
    }

    return descendants;
  }

  /**
   * Get siblings of a node (nodes with the same parent)
   */
  getSiblings(nodeId: string, tree: ConversationTree): ITopicNode[] {
    const node = tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Root nodes don't have siblings in the traditional sense
    if (!node.parentTopic) {
      // Return other root nodes as siblings
      return tree.rootNodes
        .filter(rootId => rootId !== nodeId)
        .map(rootId => tree.nodes.get(rootId))
        .filter((n): n is ITopicNode => n !== undefined);
    }

    const parent = tree.nodes.get(node.parentTopic);
    if (!parent) {
      throw new Error(`Parent node with ID ${node.parentTopic} not found`);
    }

    return parent.children
      .filter(childId => childId !== nodeId)
      .map(childId => tree.nodes.get(childId))
      .filter((n): n is ITopicNode => n !== undefined);
  }

  /**
   * Check if one node is an ancestor of another
   */
  isAncestor(ancestorId: string, descendantId: string, tree: ConversationTree): boolean {
    if (ancestorId === descendantId) {
      return false; // A node is not its own ancestor
    }

    const ancestors = this.getAncestors(descendantId, tree);
    return ancestors.some(ancestor => ancestor.id === ancestorId);
  }

  /**
   * Check if one node is a descendant of another
   */
  isDescendant(descendantId: string, ancestorId: string, tree: ConversationTree): boolean {
    return this.isAncestor(ancestorId, descendantId, tree);
  }

  /**
   * Get the current position in the tree based on the current path
   */
  getCurrentPosition(tree: ConversationTree): {
    currentNode: ITopicNode | null;
    depth: number;
    pathFromRoot: string[];
    availableChildren: ITopicNode[];
    siblings: ITopicNode[];
  } {
    if (tree.currentPath.length === 0) {
      return {
        currentNode: null,
        depth: 0,
        pathFromRoot: [],
        availableChildren: [],
        siblings: []
      };
    }

    const currentNodeId = tree.currentPath[tree.currentPath.length - 1];
    const currentNode = tree.nodes.get(currentNodeId);

    if (!currentNode) {
      throw new Error(`Current node with ID ${currentNodeId} not found`);
    }

    const availableChildren = currentNode.children
      .map(childId => tree.nodes.get(childId))
      .filter((n): n is ITopicNode => n !== undefined);

    const siblings = this.getSiblings(currentNodeId, tree);

    return {
      currentNode,
      depth: currentNode.depth,
      pathFromRoot: [...tree.currentPath],
      availableChildren,
      siblings
    };
  }

  /**
   * Private helper: Get path from node to root
   */
  private getPathToRoot(nodeId: string, tree: ConversationTree): string[] {
    const path: string[] = [];
    let currentNodeId: string | null = nodeId;

    while (currentNodeId) {
      path.push(currentNodeId);
      const currentNode = tree.nodes.get(currentNodeId);
      
      if (!currentNode) {
        throw new Error(`Node with ID ${currentNodeId} not found during path traversal`);
      }

      currentNodeId = currentNode.parentTopic;
    }

    return path;
  }

  /**
   * Private helper: Find common ancestor between two paths
   * Paths are from node to root, so we need to find the first common node
   */
  private findCommonAncestor(path1: string[], path2: string[]): string | null {
    // Convert paths to sets for efficient lookup
    const set1 = new Set(path1);
    
    // Look for the first common node in path2
    // Since paths go from node to root, the first common node found is the lowest common ancestor
    for (const nodeId of path2) {
      if (set1.has(nodeId)) {
        return nodeId;
      }
    }

    return null;
  }
}