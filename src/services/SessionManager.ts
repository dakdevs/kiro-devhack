/**
 * SessionManager - Manages multiple conversation sessions with isolation and cleanup
 * Provides session lifecycle management and memory optimization
 */

import { 
  ISessionManager, 
  SessionInfo, 
  ConversationTree, 
  IPersistenceAdapter,
  PersistenceConfig 
} from '../types/conversation-grading';

export class SessionManager implements ISessionManager {
  private sessions: Map<string, SessionInfo> = new Map();
  private sessionTrees: Map<string, ConversationTree> = new Map();
  private persistenceAdapter?: IPersistenceAdapter;
  private autoSave: boolean;
  private saveInterval?: NodeJS.Timeout;

  constructor(config?: PersistenceConfig) {
    this.persistenceAdapter = config?.adapter;
    this.autoSave = config?.autoSave ?? false;
    
    if (this.autoSave && config?.saveInterval) {
      this.setupAutoSave(config.saveInterval);
    }
  }

  /**
   * Create a new session with optional metadata
   * Requirements: 2.1 - Session isolation for concurrent conversations
   */
  createSession(sessionId?: string, metadata?: Record<string, any>): SessionInfo {
    const id = sessionId || this.generateSessionId();
    
    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    const sessionInfo: SessionInfo = {
      sessionId: id,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      metadata: metadata || {}
    };

    this.sessions.set(id, sessionInfo);
    
    // Initialize empty conversation tree for the session
    const emptyTree: ConversationTree = {
      nodes: new Map(),
      rootNodes: [],
      currentPath: [],
      sessionId: id,
      createdAt: new Date()
    };
    
    this.sessionTrees.set(id, emptyTree);

    return sessionInfo;
  }

  /**
   * Get session information by ID
   */
  getSession(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update the last accessed time for a session
   */
  updateSessionAccess(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
    }
  }

  /**
   * Delete a session and its associated data
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.sessionTrees.delete(sessionId);
    
    // Delete from persistence if available
    if (this.persistenceAdapter) {
      this.persistenceAdapter.delete(sessionId).catch(error => {
        console.warn(`Failed to delete persisted session ${sessionId}:`, error);
      });
    }
  }

  /**
   * List all active sessions
   */
  listSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up expired sessions based on age
   * Requirements: 2.2 - Session cleanup and memory management
   */
  cleanupExpiredSessions(maxAgeMs: number): number {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const age = now.getTime() - session.lastAccessedAt.getTime();
      if (age > maxAgeMs) {
        expiredSessions.push(sessionId);
      }
    }

    // Delete expired sessions
    for (const sessionId of expiredSessions) {
      this.deleteSession(sessionId);
    }

    return expiredSessions.length;
  }

  /**
   * Get the conversation tree for a specific session
   */
  getSessionTree(sessionId: string): ConversationTree | null {
    this.updateSessionAccess(sessionId);
    return this.sessionTrees.get(sessionId) || null;
  }

  /**
   * Set the conversation tree for a specific session
   */
  setSessionTree(sessionId: string, tree: ConversationTree): void {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    this.updateSessionAccess(sessionId);
    this.sessionTrees.set(sessionId, tree);

    // Auto-save if enabled
    if (this.autoSave && this.persistenceAdapter) {
      this.persistenceAdapter.save(sessionId, tree).catch(error => {
        console.warn(`Auto-save failed for session ${sessionId}:`, error);
      });
    }
  }

  /**
   * Save a session to persistent storage
   */
  async saveSession(sessionId: string): Promise<void> {
    if (!this.persistenceAdapter) {
      throw new Error('No persistence adapter configured');
    }

    const tree = this.sessionTrees.get(sessionId);
    if (!tree) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.persistenceAdapter.save(sessionId, tree);
  }

  /**
   * Load a session from persistent storage
   */
  async loadSession(sessionId: string): Promise<ConversationTree | null> {
    if (!this.persistenceAdapter) {
      throw new Error('No persistence adapter configured');
    }

    const tree = await this.persistenceAdapter.load(sessionId);
    if (tree) {
      // Create session info if it doesn't exist
      if (!this.sessions.has(sessionId)) {
        this.createSession(sessionId);
      }
      
      this.sessionTrees.set(sessionId, tree);
      this.updateSessionAccess(sessionId);
    }

    return tree;
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    totalSessions: number;
    totalNodes: number;
    averageNodesPerSession: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  } {
    const sessions = Array.from(this.sessions.values());
    let totalNodes = 0;

    for (const tree of this.sessionTrees.values()) {
      totalNodes += tree.nodes.size;
    }

    const createdDates = sessions.map(s => s.createdAt);
    const oldestSession = createdDates.length > 0 ? new Date(Math.min(...createdDates.map(d => d.getTime()))) : null;
    const newestSession = createdDates.length > 0 ? new Date(Math.max(...createdDates.map(d => d.getTime()))) : null;

    return {
      totalSessions: sessions.length,
      totalNodes,
      averageNodesPerSession: sessions.length > 0 ? totalNodes / sessions.length : 0,
      oldestSession,
      newestSession
    };
  }

  /**
   * Dispose of the session manager and cleanup resources
   */
  dispose(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = undefined;
    }

    this.sessions.clear();
    this.sessionTrees.clear();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(intervalMs: number): void {
    this.saveInterval = setInterval(async () => {
      if (!this.persistenceAdapter) return;

      for (const sessionId of this.sessionTrees.keys()) {
        try {
          await this.saveSession(sessionId);
        } catch (error) {
          console.warn(`Auto-save failed for session ${sessionId}:`, error);
        }
      }
    }, intervalMs);
  }
}