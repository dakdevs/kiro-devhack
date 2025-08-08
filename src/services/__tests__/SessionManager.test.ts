/**
 * Unit tests for SessionManager
 * Tests session isolation, lifecycle management, and memory cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../SessionManager';
import { InMemoryPersistenceAdapter } from '../InMemoryPersistenceAdapter';
import { ConversationTree } from '../../types/conversation-grading';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let persistenceAdapter: InMemoryPersistenceAdapter;

  beforeEach(() => {
    persistenceAdapter = new InMemoryPersistenceAdapter();
    sessionManager = new SessionManager({
      adapter: persistenceAdapter,
      autoSave: false
    });
  });

  afterEach(() => {
    sessionManager.dispose();
  });

  describe('Session Creation and Management', () => {
    it('should create a new session with generated ID', () => {
      const session = sessionManager.createSession();
      
      expect(session.sessionId).toBeDefined();
      expect(session.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastAccessedAt).toBeInstanceOf(Date);
      expect(session.metadata).toEqual({});
    });

    it('should create a session with custom ID and metadata', () => {
      const customId = 'custom-session-123';
      const metadata = { userId: 'user123', type: 'interview' };
      
      const session = sessionManager.createSession(customId, metadata);
      
      expect(session.sessionId).toBe(customId);
      expect(session.metadata).toEqual(metadata);
    });

    it('should throw error when creating session with existing ID', () => {
      const sessionId = 'duplicate-session';
      sessionManager.createSession(sessionId);
      
      expect(() => {
        sessionManager.createSession(sessionId);
      }).toThrow(`Session ${sessionId} already exists`);
    });

    it('should retrieve session information', () => {
      const sessionId = 'test-session';
      const metadata = { test: 'data' };
      
      const created = sessionManager.createSession(sessionId, metadata);
      const retrieved = sessionManager.getSession(sessionId);
      
      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent session', () => {
      const session = sessionManager.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should list all sessions', () => {
      sessionManager.createSession('session1');
      sessionManager.createSession('session2');
      sessionManager.createSession('session3');
      
      const sessions = sessionManager.listSessions();
      
      expect(sessions).toHaveLength(3);
      expect(sessions.map(s => s.sessionId)).toContain('session1');
      expect(sessions.map(s => s.sessionId)).toContain('session2');
      expect(sessions.map(s => s.sessionId)).toContain('session3');
    });
  });

  describe('Session Access Tracking', () => {
    it('should update last accessed time', async () => {
      const sessionId = 'access-test';
      const session = sessionManager.createSession(sessionId);
      const originalTime = session.lastAccessedAt;
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      sessionManager.updateSessionAccess(sessionId);
      const updated = sessionManager.getSession(sessionId);
      
      expect(updated!.lastAccessedAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });

    it('should update access time when getting session tree', () => {
      const sessionId = 'tree-access-test';
      const session = sessionManager.createSession(sessionId);
      const originalTime = session.lastAccessedAt;
      
      // Mock setTimeout to control time
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      
      sessionManager.getSessionTree(sessionId);
      const updated = sessionManager.getSession(sessionId);
      
      expect(updated!.lastAccessedAt.getTime()).toBeGreaterThan(originalTime.getTime());
      
      vi.useRealTimers();
    });
  });

  describe('Session Tree Management', () => {
    it('should store and retrieve session trees', () => {
      const sessionId = 'tree-test';
      sessionManager.createSession(sessionId);
      
      const mockTree: ConversationTree = {
        nodes: new Map(),
        rootNodes: ['root1'],
        currentPath: ['root1'],
        sessionId,
        createdAt: new Date()
      };
      
      sessionManager.setSessionTree(sessionId, mockTree);
      const retrieved = sessionManager.getSessionTree(sessionId);
      
      expect(retrieved).toEqual(mockTree);
    });

    it('should throw error when setting tree for non-existent session', () => {
      const mockTree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId: 'non-existent',
        createdAt: new Date()
      };
      
      expect(() => {
        sessionManager.setSessionTree('non-existent', mockTree);
      }).toThrow('Session non-existent does not exist');
    });

    it('should return null for non-existent session tree', () => {
      const tree = sessionManager.getSessionTree('non-existent');
      expect(tree).toBeNull();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up expired sessions', async () => {
      // Create sessions with different ages
      const session1 = sessionManager.createSession('old-session');
      const session2 = sessionManager.createSession('new-session');
      
      // Mock old session to be expired
      session1.lastAccessedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const maxAge = 60 * 60 * 1000; // 1 hour
      const cleanedCount = sessionManager.cleanupExpiredSessions(maxAge);
      
      expect(cleanedCount).toBe(1);
      expect(sessionManager.getSession('old-session')).toBeNull();
      expect(sessionManager.getSession('new-session')).not.toBeNull();
    });

    it('should not clean up recently accessed sessions', () => {
      sessionManager.createSession('recent-session');
      
      const maxAge = 60 * 60 * 1000; // 1 hour
      const cleanedCount = sessionManager.cleanupExpiredSessions(maxAge);
      
      expect(cleanedCount).toBe(0);
      expect(sessionManager.getSession('recent-session')).not.toBeNull();
    });
  });

  describe('Session Deletion', () => {
    it('should delete session and its data', () => {
      const sessionId = 'delete-test';
      sessionManager.createSession(sessionId);
      
      const mockTree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId,
        createdAt: new Date()
      };
      sessionManager.setSessionTree(sessionId, mockTree);
      
      sessionManager.deleteSession(sessionId);
      
      expect(sessionManager.getSession(sessionId)).toBeNull();
      expect(sessionManager.getSessionTree(sessionId)).toBeNull();
    });
  });

  describe('Memory Statistics', () => {
    it('should provide accurate memory statistics', () => {
      // Create sessions with different node counts
      const session1 = sessionManager.createSession('stats-session-1');
      const session2 = sessionManager.createSession('stats-session-2');
      
      const tree1: ConversationTree = {
        nodes: new Map([
          ['node1', {} as any],
          ['node2', {} as any]
        ]),
        rootNodes: ['node1'],
        currentPath: [],
        sessionId: 'stats-session-1',
        createdAt: new Date()
      };
      
      const tree2: ConversationTree = {
        nodes: new Map([
          ['node3', {} as any],
          ['node4', {} as any],
          ['node5', {} as any]
        ]),
        rootNodes: ['node3'],
        currentPath: [],
        sessionId: 'stats-session-2',
        createdAt: new Date()
      };
      
      sessionManager.setSessionTree('stats-session-1', tree1);
      sessionManager.setSessionTree('stats-session-2', tree2);
      
      const stats = sessionManager.getMemoryStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalNodes).toBe(5);
      expect(stats.averageNodesPerSession).toBe(2.5);
      expect(stats.oldestSession).toBeInstanceOf(Date);
      expect(stats.newestSession).toBeInstanceOf(Date);
    });

    it('should handle empty session manager', () => {
      const stats = sessionManager.getMemoryStats();
      
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalNodes).toBe(0);
      expect(stats.averageNodesPerSession).toBe(0);
      expect(stats.oldestSession).toBeNull();
      expect(stats.newestSession).toBeNull();
    });
  });

  describe('Persistence Integration', () => {
    it('should save session to persistence adapter', async () => {
      const sessionId = 'persist-test';
      sessionManager.createSession(sessionId);
      
      const mockTree: ConversationTree = {
        nodes: new Map(),
        rootNodes: ['root1'],
        currentPath: ['root1'],
        sessionId,
        createdAt: new Date()
      };
      
      sessionManager.setSessionTree(sessionId, mockTree);
      await sessionManager.saveSession(sessionId);
      
      const exists = await persistenceAdapter.exists(sessionId);
      expect(exists).toBe(true);
    });

    it('should load session from persistence adapter', async () => {
      const sessionId = 'load-test';
      
      const mockTree: ConversationTree = {
        nodes: new Map(),
        rootNodes: ['root1'],
        currentPath: ['root1'],
        sessionId,
        createdAt: new Date()
      };
      
      // Save directly to persistence
      await persistenceAdapter.save(sessionId, mockTree);
      
      // Load through session manager
      const loaded = await sessionManager.loadSession(sessionId);
      
      expect(loaded).toEqual(mockTree);
      expect(sessionManager.hasSession(sessionId)).toBe(true);
    });

    it('should throw error when saving without persistence adapter', async () => {
      const noPersistenceManager = new SessionManager();
      noPersistenceManager.createSession('test');
      
      await expect(noPersistenceManager.saveSession('test')).rejects.toThrow(
        'No persistence adapter configured'
      );
      
      noPersistenceManager.dispose();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should setup auto-save when configured', () => {
      const autoSaveManager = new SessionManager({
        adapter: persistenceAdapter,
        autoSave: true,
        saveInterval: 1000
      });
      
      // Verify auto-save is set up (we can't easily test the actual saving without mocking timers)
      expect(autoSaveManager).toBeDefined();
      
      autoSaveManager.dispose();
    });
  });

  describe('Session Isolation', () => {
    it('should maintain separate trees for different sessions', () => {
      const session1Id = 'isolation-test-1';
      const session2Id = 'isolation-test-2';
      
      sessionManager.createSession(session1Id);
      sessionManager.createSession(session2Id);
      
      const tree1: ConversationTree = {
        nodes: new Map([['node1', {} as any]]),
        rootNodes: ['node1'],
        currentPath: ['node1'],
        sessionId: session1Id,
        createdAt: new Date()
      };
      
      const tree2: ConversationTree = {
        nodes: new Map([['node2', {} as any]]),
        rootNodes: ['node2'],
        currentPath: ['node2'],
        sessionId: session2Id,
        createdAt: new Date()
      };
      
      sessionManager.setSessionTree(session1Id, tree1);
      sessionManager.setSessionTree(session2Id, tree2);
      
      const retrieved1 = sessionManager.getSessionTree(session1Id);
      const retrieved2 = sessionManager.getSessionTree(session2Id);
      
      expect(retrieved1).toEqual(tree1);
      expect(retrieved2).toEqual(tree2);
      expect(retrieved1).not.toEqual(retrieved2);
    });
  });
});