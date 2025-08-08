/**
 * Unit tests for ConversationGradingSystemWithSessions
 * Tests session management integration and isolation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConversationGradingSystemWithSessions } from '../ConversationGradingSystemWithSessions';
import { InMemoryPersistenceAdapter } from '../InMemoryPersistenceAdapter';
import { QAPair } from '../../types/conversation-grading';

describe('ConversationGradingSystemWithSessions', () => {
  let system: ConversationGradingSystemWithSessions;
  let persistenceAdapter: InMemoryPersistenceAdapter;

  beforeEach(() => {
    persistenceAdapter = new InMemoryPersistenceAdapter();
    system = new ConversationGradingSystemWithSessions('test-session', {
      adapter: persistenceAdapter,
      autoSave: false
    });
  });

  afterEach(() => {
    system.dispose();
  });

  describe('Session Creation and Management', () => {
    it('should create system with initial session', () => {
      expect(system.getCurrentSessionId()).toBe('test-session');
      
      const sessions = system.listSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe('test-session');
    });

    it('should create additional sessions', () => {
      const newSessionId = system.createSession('additional-session', { type: 'interview' });
      
      expect(newSessionId).toBe('additional-session');
      
      const sessions = system.listSessions();
      expect(sessions).toHaveLength(2);
      
      const additionalSession = sessions.find(s => s.sessionId === 'additional-session');
      expect(additionalSession).toBeDefined();
      expect(additionalSession!.metadata).toEqual({ type: 'interview' });
    });

    it('should switch between sessions', () => {
      const session2Id = system.createSession('session-2');
      
      expect(system.getCurrentSessionId()).toBe('test-session');
      
      system.switchSession(session2Id);
      expect(system.getCurrentSessionId()).toBe(session2Id);
    });

    it('should throw error when switching to non-existent session', () => {
      expect(() => {
        system.switchSession('non-existent');
      }).toThrow('Session non-existent does not exist');
    });

    it('should delete sessions', () => {
      const session2Id = system.createSession('session-to-delete');
      
      expect(system.listSessions()).toHaveLength(2);
      
      system.deleteSession(session2Id);
      
      expect(system.listSessions()).toHaveLength(1);
      expect(system.listSessions()[0].sessionId).toBe('test-session');
    });

    it('should not allow deleting current active session', () => {
      expect(() => {
        system.deleteSession('test-session');
      }).toThrow('Cannot delete the current active session');
    });
  });

  describe('Session Isolation', () => {
    it('should maintain separate conversation trees for different sessions', async () => {
      const session2Id = system.createSession('session-2');
      
      // Add Q&A to first session
      const qa1: QAPair = {
        question: 'What is JavaScript?',
        answer: 'A programming language',
        timestamp: new Date()
      };
      
      await system.addQAPair(qa1);
      const tree1 = system.getTopicTree();
      
      // Switch to second session and add different Q&A
      system.switchSession(session2Id);
      
      const qa2: QAPair = {
        question: 'What is Python?',
        answer: 'Another programming language',
        timestamp: new Date()
      };
      
      await system.addQAPair(qa2);
      const tree2 = system.getTopicTree();
      
      // Verify isolation
      expect(tree1.nodes.size).toBe(1);
      expect(tree2.nodes.size).toBe(1);
      expect(tree1.sessionId).toBe('test-session');
      expect(tree2.sessionId).toBe(session2Id);
      
      // Switch back and verify first session is unchanged
      system.switchSession('test-session');
      const tree1Again = system.getTopicTree();
      
      expect(tree1Again.nodes.size).toBe(1);
      expect(tree1Again.sessionId).toBe('test-session');
    });

    it('should maintain separate scoring and topic analysis per session', async () => {
      const session2Id = system.createSession('session-2');
      
      // Add Q&A to both sessions
      const qa: QAPair = {
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date()
      };
      
      await system.addQAPair(qa, 0.8);
      const stats1 = system.getStats();
      
      system.switchSession(session2Id);
      await system.addQAPair(qa, 0.6);
      const stats2 = system.getStats();
      
      // Verify separate statistics
      expect(stats1.averageScore).toBe(0.8);
      expect(stats2.averageScore).toBe(0.6);
      expect(stats1.totalNodes).toBe(1);
      expect(stats2.totalNodes).toBe(1);
    });
  });

  describe('Persistence Operations', () => {
    it('should save and load sessions', async () => {
      const qa: QAPair = {
        question: 'What is persistence?',
        answer: 'Storing data permanently',
        timestamp: new Date()
      };
      
      await system.addQAPair(qa, 0.9);
      const originalTree = system.getTopicTree();
      
      // Save session
      await system.saveSession();
      
      // Create new system instance and load
      const newSystem = new ConversationGradingSystemWithSessions('different-session', {
        adapter: persistenceAdapter
      });
      
      await newSystem.loadSession('test-session');
      newSystem.switchSession('test-session');
      
      const loadedTree = newSystem.getTopicTree();
      
      expect(loadedTree.nodes.size).toBe(originalTree.nodes.size);
      expect(loadedTree.sessionId).toBe(originalTree.sessionId);
      
      newSystem.dispose();
    });

    it('should save specific session by ID', async () => {
      const session2Id = system.createSession('session-2');
      
      const qa: QAPair = {
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date()
      };
      
      system.switchSession(session2Id);
      await system.addQAPair(qa);
      
      // Save specific session while current session is different
      system.switchSession('test-session');
      await system.saveSession(session2Id);
      
      // Verify it was saved
      expect(await persistenceAdapter.exists(session2Id)).toBe(true);
    });

    it('should handle loading non-existent session', async () => {
      await system.loadSession('non-existent');
      
      // Should not create the session if it doesn't exist in persistence
      const sessions = system.listSessions();
      expect(sessions.find(s => s.sessionId === 'non-existent')).toBeUndefined();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up expired sessions', async () => {
      const session2Id = system.createSession('old-session');
      const session3Id = system.createSession('new-session');
      
      // Mock old session
      const sessions = system.listSessions();
      const oldSession = sessions.find(s => s.sessionId === session2Id)!;
      oldSession.lastAccessedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const maxAge = 60 * 60 * 1000; // 1 hour
      const cleanedCount = system.cleanupExpiredSessions(maxAge);
      
      expect(cleanedCount).toBe(1);
      
      const remainingSessions = system.listSessions();
      expect(remainingSessions).toHaveLength(2); // test-session and new-session
      expect(remainingSessions.find(s => s.sessionId === session2Id)).toBeUndefined();
      expect(remainingSessions.find(s => s.sessionId === session3Id)).toBeDefined();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide comprehensive statistics for all sessions', async () => {
      const session2Id = system.createSession('session-2');
      
      // Add data to both sessions
      const qa1: QAPair = {
        question: 'Question 1',
        answer: 'Answer 1',
        timestamp: new Date()
      };
      
      const qa2: QAPair = {
        question: 'Question 2',
        answer: 'Answer 2',
        timestamp: new Date()
      };
      
      await system.addQAPair(qa1, 0.8);
      
      system.switchSession(session2Id);
      await system.addQAPair(qa2, 0.6);
      
      const allStats = system.getAllSessionsStats();
      
      expect(allStats.totalSessions).toBe(2);
      expect(allStats.currentSession).toBe(session2Id);
      expect(allStats.sessionStats).toHaveLength(2);
      
      const session1Stats = allStats.sessionStats.find(s => s.sessionId === 'test-session');
      const session2Stats = allStats.sessionStats.find(s => s.sessionId === session2Id);
      
      expect(session1Stats!.stats.averageScore).toBe(0.8);
      expect(session2Stats!.stats.averageScore).toBe(0.6);
      
      expect(allStats.memoryStats.totalSessions).toBe(2);
      expect(allStats.memoryStats.totalNodes).toBe(2);
    });

    it('should provide current session statistics', async () => {
      const qa: QAPair = {
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date()
      };
      
      await system.addQAPair(qa, 0.75);
      const stats = system.getStats();
      
      expect(stats.totalNodes).toBe(1);
      expect(stats.averageScore).toBe(0.75);
      expect(stats.totalQAPairs).toBe(1);
    });
  });

  describe('Delegation to Current Session', () => {
    it('should delegate all operations to current session system', async () => {
      const qa: QAPair = {
        question: 'What is delegation?',
        answer: 'Passing responsibility to another object',
        timestamp: new Date()
      };
      
      const nodeId = await system.addQAPair(qa, 0.85);
      
      expect(nodeId).toBeDefined();
      expect(system.getTopicTree().nodes.size).toBe(1);
      expect(system.getDepthFromRoot(nodeId)).toBe(1);
      expect(system.getCurrentTopic()).not.toBeNull();
      expect(system.getDeepestUnvisitedBranch()).not.toBeNull();
      
      system.markTopicAsVisited(nodeId);
      expect(system.getDeepestUnvisitedBranch()).toBeNull();
    });

    it('should clear current session only', async () => {
      const session2Id = system.createSession('session-2');
      
      const qa: QAPair = {
        question: 'Test',
        answer: 'Test',
        timestamp: new Date()
      };
      
      // Add data to both sessions
      await system.addQAPair(qa);
      
      system.switchSession(session2Id);
      await system.addQAPair(qa);
      
      // Clear current session (session-2)
      system.clear();
      
      expect(system.getTopicTree().nodes.size).toBe(0);
      
      // Switch back and verify first session is intact
      system.switchSession('test-session');
      expect(system.getTopicTree().nodes.size).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when operating on non-existent current session', () => {
      // Manually corrupt the current session ID
      (system as any).currentSessionId = 'non-existent';
      
      expect(() => {
        system.getTopicTree();
      }).toThrow('No system found for current session non-existent');
    });

    it('should handle persistence errors gracefully', async () => {
      // Create a mock adapter that throws errors
      const errorAdapter = {
        save: async () => { throw new Error('Save failed'); },
        load: async () => { throw new Error('Load failed'); },
        delete: async () => { throw new Error('Delete failed'); },
        list: async () => { throw new Error('List failed'); },
        exists: async () => { throw new Error('Exists failed'); }
      };
      
      const errorSystem = new ConversationGradingSystemWithSessions('test', {
        adapter: errorAdapter as any
      });
      
      await expect(errorSystem.saveSession()).rejects.toThrow('Save failed');
      await expect(errorSystem.loadSession('test')).rejects.toThrow('Load failed');
      
      errorSystem.dispose();
    });
  });

  describe('Resource Management', () => {
    it('should dispose of all resources properly', () => {
      const session2Id = system.createSession('session-2');
      
      expect(system.listSessions()).toHaveLength(2);
      
      system.dispose();
      
      // After disposal, the system should be in a clean state
      // Note: We can't easily test internal cleanup without exposing internals
      expect(() => system.dispose()).not.toThrow();
    });
  });
});