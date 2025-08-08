/**
 * TopicTreeManager class implementation for the Conversation Grading System
 * Manages tree storage, node operations, and maintains tree integrity
 */

import { TopicNode as ITopicNode, ConversationTree, ITopicTreeManager } from '../types/conversation-grading';
import { TopicNode } from './TopicNode';
import { TreeNavigator } from './TreeNavigator';
import { ValidationUtils, ValidationError, TreeIntegrityError } from './ValidationUtils';

export class TopicTreeManager implements ITopicTreeManager {
  private _tree: ConversationTree;
  private _navigator: TreeNavigator;

  constructor(sessionId: string = 'default') {
    try {
      ValidationUtils.validateSessionId(sessionId);
      this._tree = {
        nodes: new Map<string, TopicNode>(),
        rootNodes: [],
        currentPath: [],
        sessionId,
        createdAt: new Date()
      };
      this._navigator = new TreeNavigator();
    } catch (error) {
      throw new ValidationError(
        `Failed to initialize TopicTreeManager: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
        'sessionId',
        sessionId
      );
    }
  }

  /**
   * Add a node to the tree
   */
  addNode(node: ITopicNode): void {
    try {
      // Validate node structure
      if (!node || typeof node !== 'object') {
        throw new ValidationError('Node must be an object', 'node', node);
      }

      ValidationUtils.validateNodeId(node.id);
      ValidationUtils.validateTopicName(node.topic);
      
      if (node.parentTopic) {
        ValidationUtils.validateNodeId(node.parentTopic);
      }

      if (node.score !== null && node.score !== undefined) {
        ValidationUtils.validateScore(node.score);
      }

      // Convert to TopicNode instance if it's a plain object
      const topicNode = node instanceof TopicNode ? node : TopicNode.fromPlainObject(node);
      
      // Check if node already exists
      if (this._tree.nodes.has(topicNode.id)) {
        throw new ValidationError(`Node with ID ${topicNode.id} already exists`, 'nodeId', topicNode.id);
      }

      // Validate tree size constraints
      ValidationUtils.validateTreeSize(this._tree.nodes.size + 1);

      // Add to nodes map
      this._tree.nodes.set(topicNode.id, topicNode);

      // Handle parent-child relationships
      if (topicNode.parentTopic) {
        const parentNode = this._tree.nodes.get(topicNode.parentTopic);
        if (!parentNode) {
          // Remove the node we just added since parent doesn't exist
          this._tree.nodes.delete(topicNode.id);
          throw new ValidationError(`Parent node ${topicNode.parentTopic} not found`, 'parentTopic', topicNode.parentTopic);
        }
        
        // Validate depth constraints
        ValidationUtils.validateTreeDepth(parentNode.depth + 1);
        
        // Set up parent-child relationship
        topicNode.setParent(parentNode);
      } else {
        // This is a root node
        if (!this._tree.rootNodes.includes(topicNode.id)) {
          this._tree.rootNodes.push(topicNode.id);
        }
        topicNode.setParent(null);
      }

      // Validate tree integrity after adding
      this._validateTreeIntegrity();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof TreeIntegrityError) {
        throw error;
      }
      throw new TreeIntegrityError(
        `Failed to add node: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
        node?.id
      );
    }
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): TopicNode | null {
    return this._tree.nodes.get(nodeId) || null;
  }

  /**
   * Update a node with partial updates
   */
  updateNode(nodeId: string, updates: Partial<ITopicNode>): void {
    const node = this._tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Handle parent changes specially to maintain tree integrity
    if (updates.parentTopic !== undefined && updates.parentTopic !== node.parentTopic) {
      if (updates.parentTopic === null) {
        // Moving to root
        this._moveNodeToRoot(nodeId);
      } else {
        // Moving to different parent
        this._moveNodeToParent(nodeId, updates.parentTopic);
      }
    }

    // Apply other updates
    Object.assign(node, updates);
    node.updatedAt = new Date();

    // Validate tree integrity after updates
    this._validateTreeIntegrity();
  }

  /**
   * Remove a node and handle children
   */
  removeNode(nodeId: string): void {
    const node = this._tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Handle children - promote them to root or reassign to grandparent
    const children = node.getChildren();
    const parent = node.getParent();

    for (const child of children) {
      if (parent) {
        // Reassign children to grandparent
        child.setParent(parent);
      } else {
        // Promote children to root nodes
        child.setParent(null);
        if (!this._tree.rootNodes.includes(child.id)) {
          this._tree.rootNodes.push(child.id);
        }
      }
    }

    // Remove from parent's children list
    if (parent) {
      parent.removeChild(node);
    } else {
      // Remove from root nodes
      const rootIndex = this._tree.rootNodes.indexOf(nodeId);
      if (rootIndex > -1) {
        this._tree.rootNodes.splice(rootIndex, 1);
      }
    }

    // Remove from current path if present
    const pathIndex = this._tree.currentPath.indexOf(nodeId);
    if (pathIndex > -1) {
      this._tree.currentPath.splice(pathIndex);
    }

    // Remove from nodes map
    this._tree.nodes.delete(nodeId);

    // Validate tree integrity after removal
    this._validateTreeIntegrity();
  }

  /**
   * Get all root nodes
   */
  getRootNodes(): TopicNode[] {
    return this._tree.rootNodes
      .map(id => this._tree.nodes.get(id))
      .filter((node): node is TopicNode => node !== undefined);
  }

  /**
   * Get children of a node
   */
  getChildren(nodeId: string): TopicNode[] {
    const node = this._tree.nodes.get(nodeId);
    return node ? node.getChildren() : [];
  }

  /**
   * Get parent of a node
   */
  getParent(nodeId: string): TopicNode | null {
    const node = this._tree.nodes.get(nodeId);
    return node ? node.getParent() : null;
  }

  /**
   * Calculate depth of a node from root
   */
  calculateDepth(nodeId: string): number {
    const node = this._tree.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }
    return node.calculateDepthFromRoot();
  }

  /**
   * Find the deepest unvisited branch
   */
  findDeepestUnvisitedBranch(): TopicNode | null {
    const leafNodes = this._getLeafNodes();
    const unvisitedLeaves = leafNodes.filter(node => 
      !node.metadata.isExhausted && node.metadata.visitCount === 0
    );

    if (unvisitedLeaves.length === 0) {
      return null;
    }

    // Find the leaf with maximum depth
    return unvisitedLeaves.reduce((deepest, current) => 
      current.depth > deepest.depth ? current : deepest
    );
  }

  /**
   * Get the complete conversation tree
   */
  getTree(): ConversationTree {
    // Return a copy with plain objects instead of class instances
    return {
      nodes: new Map(Array.from(this._tree.nodes.entries()).map(([id, node]) => 
        [id, node.toPlainObject()]
      )),
      rootNodes: [...this._tree.rootNodes],
      currentPath: [...this._tree.currentPath],
      sessionId: this._tree.sessionId,
      createdAt: this._tree.createdAt
    };
  }

  /**
   * Set the current path in the conversation
   */
  setCurrentPath(path: string[]): void {
    // Validate that all nodes in path exist and form a valid path
    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];
      const node = this._tree.nodes.get(nodeId);
      
      if (!node) {
        throw new Error(`Node ${nodeId} in path not found`);
      }

      // Check parent-child relationship for consecutive nodes
      if (i > 0) {
        const parentId = path[i - 1];
        if (node.parentTopic !== parentId) {
          throw new Error(`Invalid path: ${nodeId} is not a child of ${parentId}`);
        }
      }
    }

    this._tree.currentPath = [...path];
  }

  /**
   * Get the current path
   */
  getCurrentPath(): string[] {
    return [...this._tree.currentPath];
  }

  /**
   * Get the current topic (last node in current path)
   */
  getCurrentTopic(): TopicNode | null {
    if (this._tree.currentPath.length === 0) {
      return null;
    }
    
    const currentId = this._tree.currentPath[this._tree.currentPath.length - 1];
    return this._tree.nodes.get(currentId) || null;
  }

  /**
   * Clear the tree (for testing or reset)
   */
  clear(): void {
    this._tree.nodes.clear();
    this._tree.rootNodes = [];
    this._tree.currentPath = [];
  }

  /**
   * Get tree statistics
   */
  getStats(): {
    totalNodes: number;
    rootNodes: number;
    maxDepth: number;
    leafNodes: number;
  } {
    const nodes = Array.from(this._tree.nodes.values());
    const leafNodes = this._getLeafNodes();
    const maxDepth = nodes.length > 0 ? Math.max(...nodes.map(n => n.depth)) : 0;

    return {
      totalNodes: nodes.length,
      rootNodes: this._tree.rootNodes.length,
      maxDepth,
      leafNodes: leafNodes.length
    };
  }

  /**
   * Private method to get all leaf nodes
   */
  private _getLeafNodes(): TopicNode[] {
    return Array.from(this._tree.nodes.values()).filter(node => node.isLeaf());
  }

  /**
   * Private method to move a node to root
   */
  private _moveNodeToRoot(nodeId: string): void {
    const node = this._tree.nodes.get(nodeId);
    if (!node) return;

    // Remove from current parent
    const parent = node.getParent();
    if (parent) {
      parent.removeChild(node);
    }

    // Add to root nodes
    node.setParent(null);
    if (!this._tree.rootNodes.includes(nodeId)) {
      this._tree.rootNodes.push(nodeId);
    }
  }

  /**
   * Private method to move a node to a different parent
   */
  private _moveNodeToParent(nodeId: string, newParentId: string): void {
    const node = this._tree.nodes.get(nodeId);
    const newParent = this._tree.nodes.get(newParentId);
    
    if (!node || !newParent) {
      throw new Error('Node or new parent not found');
    }

    // Check for circular reference
    if (node.findDescendant(newParentId)) {
      throw new Error('Cannot move node: would create circular reference');
    }

    // Remove from root nodes if it was a root
    const rootIndex = this._tree.rootNodes.indexOf(nodeId);
    if (rootIndex > -1) {
      this._tree.rootNodes.splice(rootIndex, 1);
    }

    // Set new parent
    node.setParent(newParent);
  }

  /**
   * Private method to validate tree integrity
   */
  private _validateTreeIntegrity(): void {
    // Check that all root nodes have no parent
    for (const rootId of this._tree.rootNodes) {
      const rootNode = this._tree.nodes.get(rootId);
      if (rootNode && rootNode.parentTopic !== null) {
        throw new Error(`Tree integrity violation: root node ${rootId} has a parent`);
      }
    }

    // Check that all non-root nodes have valid parents
    for (const [nodeId, node] of this._tree.nodes) {
      if (node.parentTopic) {
        const parent = this._tree.nodes.get(node.parentTopic);
        if (!parent) {
          throw new Error(`Tree integrity violation: node ${nodeId} has invalid parent ${node.parentTopic}`);
        }
        if (!parent.children.includes(nodeId)) {
          throw new Error(`Tree integrity violation: parent ${node.parentTopic} doesn't list ${nodeId} as child`);
        }
      }
    }

    // Check for circular references
    for (const [nodeId, node] of this._tree.nodes) {
      if (this._hasCircularReference(node, new Set())) {
        throw new Error(`Tree integrity violation: circular reference detected starting from ${nodeId}`);
      }
    }
  }

  /**
   * Get navigation utilities for advanced tree operations
   */
  getNavigator(): TreeNavigator {
    return this._navigator;
  }

  /**
   * Get depth from root using navigator (enhanced version)
   */
  getDepthFromRoot(nodeId: string): number {
    const tree = this.getTree();
    return this._navigator.getDepthFromRoot(nodeId, tree);
  }

  /**
   * Find path between two nodes
   */
  findPath(fromNodeId: string, toNodeId: string): string[] {
    const tree = this.getTree();
    return this._navigator.findPath(fromNodeId, toNodeId, tree);
  }

  /**
   * Get all leaf nodes
   */
  getLeafNodes(): ITopicNode[] {
    const tree = this.getTree();
    return this._navigator.getLeafNodes(tree);
  }

  /**
   * Get all unvisited branches
   */
  getUnvisitedBranches(): ITopicNode[] {
    const tree = this.getTree();
    return this._navigator.getUnvisitedBranches(tree);
  }

  /**
   * Get deepest unvisited branch using navigator
   */
  getDeepestUnvisitedBranch(): ITopicNode | null {
    const tree = this.getTree();
    return this._navigator.getDeepestUnvisitedBranch(tree);
  }

  /**
   * Get all nodes at a specific depth
   */
  getNodesAtDepth(depth: number): ITopicNode[] {
    const tree = this.getTree();
    return this._navigator.getNodesAtDepth(depth, tree);
  }

  /**
   * Get maximum depth in the tree
   */
  getMaxDepth(): number {
    const tree = this.getTree();
    return this._navigator.getMaxDepth(tree);
  }

  /**
   * Get ancestors of a node
   */
  getAncestors(nodeId: string): ITopicNode[] {
    const tree = this.getTree();
    return this._navigator.getAncestors(nodeId, tree);
  }

  /**
   * Get descendants of a node
   */
  getDescendants(nodeId: string): ITopicNode[] {
    const tree = this.getTree();
    return this._navigator.getDescendants(nodeId, tree);
  }

  /**
   * Get siblings of a node
   */
  getSiblings(nodeId: string): ITopicNode[] {
    const tree = this.getTree();
    return this._navigator.getSiblings(nodeId, tree);
  }

  /**
   * Check if one node is ancestor of another
   */
  isAncestor(ancestorId: string, descendantId: string): boolean {
    const tree = this.getTree();
    return this._navigator.isAncestor(ancestorId, descendantId, tree);
  }

  /**
   * Check if one node is descendant of another
   */
  isDescendant(descendantId: string, ancestorId: string): boolean {
    const tree = this.getTree();
    return this._navigator.isDescendant(descendantId, ancestorId, tree);
  }

  /**
   * Get current position information
   */
  getCurrentPosition(): {
    currentNode: ITopicNode | null;
    depth: number;
    pathFromRoot: string[];
    availableChildren: ITopicNode[];
    siblings: ITopicNode[];
  } {
    const tree = this.getTree();
    return this._navigator.getCurrentPosition(tree);
  }

  /**
   * Private method to detect circular references
   */
  private _hasCircularReference(node: TopicNode, visited: Set<string>): boolean {
    if (visited.has(node.id)) {
      return true;
    }

    visited.add(node.id);
    
    for (const child of node.getChildren()) {
      if (this._hasCircularReference(child, new Set(visited))) {
        return true;
      }
    }

    return false;
  }
}