/**
 * InMemoryPersistenceAdapter - Simple in-memory persistence implementation
 * Useful for testing and as a reference implementation
 */

import { IPersistenceAdapter, ConversationTree, TopicNode } from '../types/conversation-grading';

export class InMemoryPersistenceAdapter implements IPersistenceAdapter {
  private storage: Map<string, string> = new Map();

  /**
   * Save a conversation tree to memory storage
   */
  async save(sessionId: string, tree: ConversationTree): Promise<void> {
    try {
      // Convert the tree to a serializable format
      const serializable = this.treeToSerializable(tree);
      const serialized = JSON.stringify(serializable);
      this.storage.set(sessionId, serialized);
    } catch (error) {
      throw new Error(`Failed to save session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a conversation tree from memory storage
   */
  async load(sessionId: string): Promise<ConversationTree | null> {
    try {
      const serialized = this.storage.get(sessionId);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized);
      return this.serializableToTree(parsed);
    } catch (error) {
      throw new Error(`Failed to load session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a session from memory storage
   */
  async delete(sessionId: string): Promise<void> {
    this.storage.delete(sessionId);
  }

  /**
   * List all stored session IDs
   */
  async list(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  /**
   * Check if a session exists in storage
   */
  async exists(sessionId: string): Promise<boolean> {
    return this.storage.has(sessionId);
  }

  /**
   * Clear all stored data (useful for testing)
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalSessions: number;
    totalSize: number; // approximate size in characters
  } {
    let totalSize = 0;
    for (const data of this.storage.values()) {
      totalSize += data.length;
    }

    return {
      totalSessions: this.storage.size,
      totalSize
    };
  }

  /**
   * Convert ConversationTree to a serializable format
   */
  private treeToSerializable(tree: ConversationTree): any {
    return {
      nodes: Array.from(tree.nodes.entries()).map(([id, node]) => [id, {
        id: node.id,
        topic: node.topic,
        parentTopic: node.parentTopic,
        children: node.children,
        depth: node.depth,
        score: node.score,
        createdAt: node.createdAt.toISOString(),
        updatedAt: node.updatedAt.toISOString(),
        metadata: {
          qaPairs: node.metadata.qaPairs.map(qa => ({
            question: qa.question,
            answer: qa.answer,
            timestamp: qa.timestamp.toISOString(),
            metadata: qa.metadata
          })),
          visitCount: node.metadata.visitCount,
          lastVisited: node.metadata.lastVisited?.toISOString() || null,
          isExhausted: node.metadata.isExhausted
        }
      }]),
      rootNodes: tree.rootNodes,
      currentPath: tree.currentPath,
      sessionId: tree.sessionId,
      createdAt: tree.createdAt.toISOString()
    };
  }

  /**
   * Convert serializable format back to ConversationTree
   */
  private serializableToTree(data: any): ConversationTree {
    const nodes = new Map<string, TopicNode>();
    
    for (const [id, nodeData] of data.nodes) {
      const node: TopicNode = {
        id: nodeData.id,
        topic: nodeData.topic,
        parentTopic: nodeData.parentTopic,
        children: nodeData.children,
        depth: nodeData.depth,
        score: nodeData.score,
        createdAt: new Date(nodeData.createdAt),
        updatedAt: new Date(nodeData.updatedAt),
        metadata: {
          qaPairs: nodeData.metadata.qaPairs.map((qa: any) => ({
            question: qa.question,
            answer: qa.answer,
            timestamp: new Date(qa.timestamp),
            metadata: qa.metadata
          })),
          visitCount: nodeData.metadata.visitCount,
          lastVisited: nodeData.metadata.lastVisited ? new Date(nodeData.metadata.lastVisited) : null,
          isExhausted: nodeData.metadata.isExhausted
        }
      };
      nodes.set(id, node);
    }

    return {
      nodes,
      rootNodes: data.rootNodes,
      currentPath: data.currentPath,
      sessionId: data.sessionId,
      createdAt: new Date(data.createdAt)
    };
  }
}