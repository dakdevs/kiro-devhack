/**
 * TopicNode class implementation for the Conversation Grading System
 * Handles tree operations, parent-child relationships, and depth calculations
 */

import { QAPair, TopicNode as ITopicNode } from '../types/conversation-grading';

export class TopicNode implements ITopicNode {
  public readonly id: string;
  public topic: string;
  public parentTopic: string | null;
  public children: string[];
  public depth: number;
  public score: number | null;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public metadata: {
    qaPairs: QAPair[];
    visitCount: number;
    lastVisited: Date | null;
    isExhausted: boolean;
  };

  // Reference to parent and children nodes for tree operations
  private _parentNode: TopicNode | null = null;
  private _childNodes: Map<string, TopicNode> = new Map();

  constructor(
    id: string,
    topic: string,
    parentTopic: string | null = null,
    score: number | null = null
  ) {
    this.id = id;
    this.topic = topic;
    this.parentTopic = parentTopic;
    this.children = [];
    this.depth = 1; // Will be recalculated when parent is set
    this.score = score;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.metadata = {
      qaPairs: [],
      visitCount: 0,
      lastVisited: null,
      isExhausted: false
    };
  }

  /**
   * Set the parent node and update depth accordingly
   */
  setParent(parentNode: TopicNode | null): void {
    // Prevent self-reference and circular references
    if (parentNode === this) {
      return; // Cannot set self as parent
    }
    
    if (parentNode && this.findDescendant(parentNode.id)) {
      return; // Cannot set a descendant as parent (would create circular reference)
    }

    // Remove from old parent if exists
    if (this._parentNode) {
      this._parentNode.removeChild(this);
    }

    this._parentNode = parentNode;
    this.parentTopic = parentNode ? parentNode.id : null;

    // Add to new parent if exists
    if (parentNode) {
      parentNode.addChild(this);
      this.depth = parentNode.depth + 1;
    } else {
      this.depth = 1; // Root node
    }

    this.updatedAt = new Date();
    this._updateChildrenDepth();
  }

  /**
   * Get the parent node
   */
  getParent(): TopicNode | null {
    return this._parentNode;
  }

  /**
   * Add a child node
   */
  addChild(childNode: TopicNode): void {
    if (!this.children.includes(childNode.id)) {
      this.children.push(childNode.id);
      this._childNodes.set(childNode.id, childNode);
      childNode._parentNode = this;
      childNode.parentTopic = this.id;
      childNode.depth = this.depth + 1;
      childNode.updatedAt = new Date();
      childNode._updateChildrenDepth();
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a child node
   */
  removeChild(childNode: TopicNode): void {
    const index = this.children.indexOf(childNode.id);
    if (index > -1) {
      this.children.splice(index, 1);
      this._childNodes.delete(childNode.id);
      childNode._parentNode = null;
      childNode.parentTopic = null;
      childNode.depth = 1; // Reset to root level
      childNode.updatedAt = new Date();
      childNode._updateChildrenDepth();
      this.updatedAt = new Date();
    }
  }

  /**
   * Get all child nodes
   */
  getChildren(): TopicNode[] {
    return Array.from(this._childNodes.values());
  }

  /**
   * Get a specific child node by ID
   */
  getChild(childId: string): TopicNode | null {
    return this._childNodes.get(childId) || null;
  }

  /**
   * Check if this node has children
   */
  hasChildren(): boolean {
    return this.children.length > 0;
  }

  /**
   * Check if this node is a leaf (no children)
   */
  isLeaf(): boolean {
    return this.children.length === 0;
  }

  /**
   * Check if this node is a root (no parent)
   */
  isRoot(): boolean {
    return this._parentNode === null;
  }

  /**
   * Calculate depth from root by traversing up the tree
   */
  calculateDepthFromRoot(): number {
    let depth = 1;
    let current: TopicNode | null = this;
    
    while (current._parentNode !== null) {
      depth++;
      current = current._parentNode;
    }
    
    this.depth = depth;
    this.updatedAt = new Date();
    return depth;
  }

  /**
   * Get the path from root to this node
   */
  getPathFromRoot(): string[] {
    const path: string[] = [];
    let current: TopicNode | null = this;
    
    while (current !== null) {
      path.unshift(current.id);
      current = current._parentNode;
    }
    
    return path;
  }

  /**
   * Get all descendant nodes (children, grandchildren, etc.)
   */
  getAllDescendants(): TopicNode[] {
    const descendants: TopicNode[] = [];
    
    const traverse = (node: TopicNode) => {
      for (const child of node.getChildren()) {
        descendants.push(child);
        traverse(child);
      }
    };
    
    traverse(this);
    return descendants;
  }

  /**
   * Find a descendant node by ID
   */
  findDescendant(nodeId: string): TopicNode | null {
    if (this.id === nodeId) {
      return this;
    }
    
    for (const child of this.getChildren()) {
      const found = child.findDescendant(nodeId);
      if (found) {
        return found;
      }
    }
    
    return null;
  }

  /**
   * Add a Q&A pair to this node
   */
  addQAPair(qaPair: QAPair): void {
    this.metadata.qaPairs.push(qaPair);
    this.updatedAt = new Date();
  }

  /**
   * Mark this node as visited
   */
  markAsVisited(): void {
    this.metadata.visitCount++;
    this.metadata.lastVisited = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Mark this node as exhausted (no more questions needed)
   */
  markAsExhausted(): void {
    this.metadata.isExhausted = true;
    this.updatedAt = new Date();
  }

  /**
   * Update the score for this node
   */
  updateScore(score: number): void {
    this.score = score;
    this.updatedAt = new Date();
  }

  /**
   * Get the current score for this node
   */
  getScore(): number | null {
    return this.score;
  }

  /**
   * Check if this node has a score
   */
  hasScore(): boolean {
    return this.score !== null;
  }

  /**
   * Clear the score for this node
   */
  clearScore(): void {
    this.score = null;
    this.updatedAt = new Date();
  }

  /**
   * Get the average score of all Q&A pairs if individual scores were tracked
   * For now, returns the node score since we store one score per node
   */
  getAverageScore(): number | null {
    return this.score;
  }

  /**
   * Get a plain object representation (for serialization)
   */
  toPlainObject(): ITopicNode {
    return {
      id: this.id,
      topic: this.topic,
      parentTopic: this.parentTopic,
      children: [...this.children],
      depth: this.depth,
      score: this.score,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        qaPairs: [...this.metadata.qaPairs],
        visitCount: this.metadata.visitCount,
        lastVisited: this.metadata.lastVisited,
        isExhausted: this.metadata.isExhausted
      }
    };
  }

  /**
   * Create a TopicNode from a plain object
   */
  static fromPlainObject(obj: ITopicNode): TopicNode {
    const node = new TopicNode(obj.id, obj.topic, obj.parentTopic, obj.score);
    node.children = [...obj.children];
    node.depth = obj.depth;
    node.updatedAt = obj.updatedAt;
    node.metadata = {
      qaPairs: [...obj.metadata.qaPairs],
      visitCount: obj.metadata.visitCount,
      lastVisited: obj.metadata.lastVisited,
      isExhausted: obj.metadata.isExhausted
    };
    return node;
  }

  /**
   * Private method to update depth of all children recursively
   */
  private _updateChildrenDepth(): void {
    for (const child of this.getChildren()) {
      child.depth = this.depth + 1;
      child.updatedAt = new Date();
      child._updateChildrenDepth();
    }
  }
}