/**
 * ConversationGradingSystemWithSessions - Enhanced system with session management and persistence
 * Extends the base system to support multiple concurrent conversations with isolation
 */

import { 
  IConversationGradingSystemWithSessions,
  QAPair, 
  ConversationTree, 
  TopicNode as ITopicNode,
  IScoringStrategy,
  ITopicAnalyzer,
  SessionInfo,
  PersistenceConfig
} from '../types/conversation-grading';
import { ConversationGradingSystem } from './ConversationGradingSystem';
import { SessionManager } from './SessionManager';

export class ConversationGradingSystemWithSessions implements IConversationGradingSystemWithSessions {
  private sessionManager: SessionManager;
  private currentSessionId: string;
  private sessionSystems: Map<string, ConversationGradingSystem> = new Map();

  constructor(
    initialSessionId?: string, 
    persistenceConfig?: PersistenceConfig
  ) {
    this.sessionManager = new SessionManager(persistenceConfig);
    
    // Create initial session
    const sessionId = initialSessionId || 'default';
    this.currentSessionId = sessionId;
    this.createSession(sessionId);
  }

  /**
   * Create a new session with optional metadata
   * Requirements: 2.1 - Session isolation for concurrent conversations
   */
  createSession(sessionId?: string, metadata?: Record<string, any>): string {
    const sessionInfo = this.sessionManager.createSession(sessionId, metadata);
    const system = new ConversationGradingSystem(sessionInfo.sessionId);
    this.sessionSystems.set(sessionInfo.sessionId, system);
    
    return sessionInfo.sessionId;
  }

  /**
   * Switch to a different session
   */
  switchSession(sessionId: string): void {
    if (!this.sessionManager.hasSession(sessionId)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }
    
    this.currentSessionId = sessionId;
    this.sessionManager.updateSessionAccess(sessionId);
  }

  /**
   * Get the current session ID
   */
  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Delete a session and its associated data
   */
  deleteSession(sessionId: string): void {
    if (sessionId === this.currentSessionId) {
      throw new Error('Cannot delete the current active session');
    }
    
    this.sessionSystems.delete(sessionId);
    this.sessionManager.deleteSession(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(): SessionInfo[] {
    return this.sessionManager.listSessions();
  }

  /**
   * Save a session to persistent storage
   */
  async saveSession(sessionId?: string): Promise<void> {
    const targetSessionId = sessionId || this.currentSessionId;
    const system = this.sessionSystems.get(targetSessionId);
    
    if (!system) {
      throw new Error(`Session ${targetSessionId} not found`);
    }

    const tree = system.getTopicTree();
    this.sessionManager.setSessionTree(targetSessionId, tree);
    await this.sessionManager.saveSession(targetSessionId);
  }

  /**
   * Load a session from persistent storage
   */
  async loadSession(sessionId: string): Promise<void> {
    const tree = await this.sessionManager.loadSession(sessionId);
    
    if (tree) {
      // Create a new system instance and restore its state
      const system = new ConversationGradingSystem(sessionId);
      
      // Clear the system and rebuild from the loaded tree
      system.clear();
      
      // Restore nodes in dependency order (parents before children)
      const sortedNodes = this.sortNodesByDependency(Array.from(tree.nodes.values()));
      
      for (const nodeData of sortedNodes) {
        // Reconstruct Q&A pairs for the node
        for (const qaPair of nodeData.metadata.qaPairs) {
          await system.addQAPair(qaPair, nodeData.score || undefined);
        }
      }
      
      this.sessionSystems.set(sessionId, system);
      this.sessionManager.setSessionTree(sessionId, tree);
    }
  }

  /**
   * Clean up expired sessions
   * Requirements: 2.2 - Session cleanup and memory management
   */
  cleanupExpiredSessions(maxAgeMs: number): number {
    const expiredCount = this.sessionManager.cleanupExpiredSessions(maxAgeMs);
    
    // Clean up corresponding system instances
    const activeSessions = new Set(this.sessionManager.listSessions().map(s => s.sessionId));
    for (const [sessionId] of this.sessionSystems) {
      if (!activeSessions.has(sessionId)) {
        this.sessionSystems.delete(sessionId);
      }
    }
    
    return expiredCount;
  }

  // Delegate methods to current session's system
  
  /**
   * Add a Q&A pair to the current session
   */
  async addQAPair(qaPair: QAPair, score?: number): Promise<string> {
    const system = this.getCurrentSystem();
    const nodeId = await system.addQAPair(qaPair, score);
    
    // Update session tree in manager
    const tree = system.getTopicTree();
    this.sessionManager.setSessionTree(this.currentSessionId, tree);
    
    return nodeId;
  }

  /**
   * Get the topic tree for the current session
   */
  getTopicTree(): ConversationTree {
    return this.getCurrentSystem().getTopicTree();
  }

  /**
   * Get depth from root for a node in the current session
   */
  getDepthFromRoot(nodeId: string): number {
    return this.getCurrentSystem().getDepthFromRoot(nodeId);
  }

  /**
   * Get the deepest unvisited branch in the current session
   */
  getDeepestUnvisitedBranch(): ITopicNode | null {
    return this.getCurrentSystem().getDeepestUnvisitedBranch();
  }

  /**
   * Get the current topic in the current session
   */
  getCurrentTopic(): ITopicNode | null {
    return this.getCurrentSystem().getCurrentTopic();
  }

  /**
   * Mark a topic as visited in the current session
   */
  markTopicAsVisited(nodeId: string): void {
    const system = this.getCurrentSystem();
    system.markTopicAsVisited(nodeId);
    
    // Update session tree in manager
    const tree = system.getTopicTree();
    this.sessionManager.setSessionTree(this.currentSessionId, tree);
  }

  /**
   * Set scoring strategy for the current session
   */
  setScoringStrategy(strategy: IScoringStrategy): void {
    this.getCurrentSystem().setScoringStrategy(strategy);
  }

  /**
   * Set topic analyzer for the current session
   */
  setTopicAnalyzer(analyzer: ITopicAnalyzer): void {
    this.getCurrentSystem().setTopicAnalyzer(analyzer);
  }

  /**
   * Get statistics for the current session
   */
  getStats(): {
    totalNodes: number;
    rootNodes: number;
    maxDepth: number;
    leafNodes: number;
    totalQAPairs: number;
    averageScore: number | null;
  } {
    return this.getCurrentSystem().getStats();
  }

  /**
   * Get statistics for all sessions
   */
  getAllSessionsStats(): {
    totalSessions: number;
    currentSession: string;
    memoryStats: ReturnType<SessionManager['getMemoryStats']>;
    sessionStats: Array<{
      sessionId: string;
      stats: ReturnType<ConversationGradingSystem['getStats']>;
      sessionInfo: SessionInfo;
    }>;
  } {
    const sessionStats = [];
    const sessions = this.sessionManager.listSessions();
    
    for (const sessionInfo of sessions) {
      const system = this.sessionSystems.get(sessionInfo.sessionId);
      if (system) {
        sessionStats.push({
          sessionId: sessionInfo.sessionId,
          stats: system.getStats(),
          sessionInfo
        });
      }
    }

    return {
      totalSessions: sessions.length,
      currentSession: this.currentSessionId,
      memoryStats: this.sessionManager.getMemoryStats(),
      sessionStats
    };
  }

  /**
   * Clear the current session
   */
  clear(): void {
    this.getCurrentSystem().clear();
    
    // Update session tree in manager
    const tree = this.getCurrentSystem().getTopicTree();
    this.sessionManager.setSessionTree(this.currentSessionId, tree);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.sessionSystems.clear();
    this.sessionManager.dispose();
  }

  /**
   * Get the system instance for the current session
   */
  private getCurrentSystem(): ConversationGradingSystem {
    const system = this.sessionSystems.get(this.currentSessionId);
    if (!system) {
      throw new Error(`No system found for current session ${this.currentSessionId}`);
    }
    
    this.sessionManager.updateSessionAccess(this.currentSessionId);
    return system;
  }

  /**
   * Sort nodes by dependency order (parents before children)
   */
  private sortNodesByDependency(nodes: ITopicNode[]): ITopicNode[] {
    const sorted: ITopicNode[] = [];
    const processed = new Set<string>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const processNode = (node: ITopicNode) => {
      if (processed.has(node.id)) {
        return;
      }

      // Process parent first if it exists
      if (node.parentTopic && nodeMap.has(node.parentTopic)) {
        const parent = nodeMap.get(node.parentTopic)!;
        if (!processed.has(parent.id)) {
          processNode(parent);
        }
      }

      sorted.push(node);
      processed.add(node.id);
    };

    for (const node of nodes) {
      processNode(node);
    }

    return sorted;
  }
}