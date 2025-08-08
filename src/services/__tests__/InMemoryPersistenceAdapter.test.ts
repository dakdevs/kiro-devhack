/**
 * Unit tests for InMemoryPersistenceAdapter
 * Tests persistence functionality and serialization/deserialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPersistenceAdapter } from '../InMemoryPersistenceAdapter';
import { ConversationTree, QAPair, TopicNode } from '../../types/conversation-grading';

describe('InMemoryPersistenceAdapter', () => {
  let adapter: InMemoryPersistenceAdapter;

  beforeEach(() => {
    adapter = new InMemoryPersistenceAdapter();
  });

  describe('Basic Persistence Operations', () => {
    it('should save and load a simple conversation tree', async () => {
      const sessionId = 'test-session';
      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: ['root1'],
        currentPath: ['root1'],
        sessionId,
        createdAt: new Date('2024-01-01T00:00:00Z')
      };

      await adapter.save(sessionId, tree);
      const loaded = await adapter.load(sessionId);

      expect(loaded).toEqual(tree);
    });

    it('should return null for non-existent session', async () => {
      const loaded = await adapter.load('non-existent');
      expect(loaded).toBeNull();
    });

    it('should delete sessions', async () => {
      const sessionId = 'delete-test';
      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId,
        createdAt: new Date()
      };

      await adapter.save(sessionId, tree);
      expect(await adapter.exists(sessionId)).toBe(true);

      await adapter.delete(sessionId);
      expect(await adapter.exists(sessionId)).toBe(false);
      expect(await adapter.load(sessionId)).toBeNull();
    });

    it('should list all stored sessions', async () => {
      const sessions = ['session1', 'session2', 'session3'];
      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      for (const sessionId of sessions) {
        await adapter.save(sessionId, { ...tree, sessionId });
      }

      const listed = await adapter.list();
      expect(listed.sort()).toEqual(sessions.sort());
    });

    it('should check if session exists', async () => {
      const sessionId = 'exists-test';
      expect(await adapter.exists(sessionId)).toBe(false);

      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId,
        createdAt: new Date()
      };

      await adapter.save(sessionId, tree);
      expect(await adapter.exists(sessionId)).toBe(true);
    });
  });

  describe('Complex Data Serialization', () => {
    it('should handle conversation tree with nodes and Q&A pairs', async () => {
      const sessionId = 'complex-test';
      const qaPair: QAPair = {
        question: 'What is TypeScript?',
        answer: 'TypeScript is a typed superset of JavaScript.',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        metadata: { difficulty: 'beginner', topic: 'programming' }
      };

      const node: TopicNode = {
        id: 'node1',
        topic: 'TypeScript Basics',
        parentTopic: null,
        children: ['node2'],
        depth: 1,
        score: 0.85,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
        metadata: {
          qaPairs: [qaPair],
          visitCount: 2,
          lastVisited: new Date('2024-01-01T11:30:00Z'),
          isExhausted: false
        }
      };

      const childNode: TopicNode = {
        id: 'node2',
        topic: 'TypeScript Types',
        parentTopic: 'node1',
        children: [],
        depth: 2,
        score: null,
        createdAt: new Date('2024-01-01T11:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
        metadata: {
          qaPairs: [],
          visitCount: 0,
          lastVisited: null,
          isExhausted: false
        }
      };

      const tree: ConversationTree = {
        nodes: new Map([
          ['node1', node],
          ['node2', childNode]
        ]),
        rootNodes: ['node1'],
        currentPath: ['node1', 'node2'],
        sessionId,
        createdAt: new Date('2024-01-01T09:00:00Z')
      };

      await adapter.save(sessionId, tree);
      const loaded = await adapter.load(sessionId);

      expect(loaded).toEqual(tree);
      expect(loaded!.nodes.get('node1')).toEqual(node);
      expect(loaded!.nodes.get('node2')).toEqual(childNode);
      expect(loaded!.nodes.get('node1')!.metadata.qaPairs[0]).toEqual(qaPair);
    });

    it('should handle nodes with null values correctly', async () => {
      const sessionId = 'null-values-test';
      const node: TopicNode = {
        id: 'node1',
        topic: 'Test Topic',
        parentTopic: null,
        children: [],
        depth: 1,
        score: null,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        metadata: {
          qaPairs: [],
          visitCount: 0,
          lastVisited: null,
          isExhausted: false
        }
      };

      const tree: ConversationTree = {
        nodes: new Map([['node1', node]]),
        rootNodes: ['node1'],
        currentPath: [],
        sessionId,
        createdAt: new Date('2024-01-01T09:00:00Z')
      };

      await adapter.save(sessionId, tree);
      const loaded = await adapter.load(sessionId);

      expect(loaded).toEqual(tree);
      expect(loaded!.nodes.get('node1')!.score).toBeNull();
      expect(loaded!.nodes.get('node1')!.parentTopic).toBeNull();
      expect(loaded!.nodes.get('node1')!.metadata.lastVisited).toBeNull();
    });

    it('should preserve date objects correctly', async () => {
      const sessionId = 'date-test';
      const specificDate = new Date('2024-06-15T14:30:45.123Z');
      
      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId,
        createdAt: specificDate
      };

      await adapter.save(sessionId, tree);
      const loaded = await adapter.load(sessionId);

      expect(loaded!.createdAt).toEqual(specificDate);
      expect(loaded!.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', async () => {
      const sessionId = 'error-test';
      
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = () => {
        throw new Error('Mocked serialization error');
      };

      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId,
        createdAt: new Date()
      };

      try {
        await expect(adapter.save(sessionId, tree)).rejects.toThrow(
          /Failed to save session error-test:/
        );
      } finally {
        // Restore original JSON.stringify
        JSON.stringify = originalStringify;
      }
    });

    it('should handle deserialization errors gracefully', async () => {
      const sessionId = 'corrupt-data-test';
      
      // Manually corrupt the stored data
      (adapter as any).storage.set(sessionId, 'invalid json data');

      await expect(adapter.load(sessionId)).rejects.toThrow(
        /Failed to load session corrupt-data-test:/
      );
    });
  });

  describe('Storage Statistics', () => {
    it('should provide accurate storage statistics', async () => {
      const tree1: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId: 'session1',
        createdAt: new Date()
      };

      const tree2: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId: 'session2',
        createdAt: new Date()
      };

      await adapter.save('session1', tree1);
      await adapter.save('session2', tree2);

      const stats = adapter.getStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(typeof stats.totalSize).toBe('number');
    });

    it('should handle empty storage statistics', () => {
      const stats = adapter.getStats();
      
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('Storage Management', () => {
    it('should clear all stored data', async () => {
      const tree: ConversationTree = {
        nodes: new Map(),
        rootNodes: [],
        currentPath: [],
        sessionId: 'test',
        createdAt: new Date()
      };

      await adapter.save('session1', tree);
      await adapter.save('session2', tree);
      
      expect(await adapter.list()).toHaveLength(2);
      
      adapter.clear();
      
      expect(await adapter.list()).toHaveLength(0);
      expect(adapter.getStats().totalSessions).toBe(0);
    });
  });

  describe('Map Serialization', () => {
    it('should correctly serialize and deserialize Map objects', async () => {
      const sessionId = 'map-test';
      const nodeData: TopicNode = {
        id: 'test-node',
        topic: 'Test',
        parentTopic: null,
        children: [],
        depth: 1,
        score: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          qaPairs: [],
          visitCount: 0,
          lastVisited: null,
          isExhausted: false
        }
      };

      const tree: ConversationTree = {
        nodes: new Map([['test-node', nodeData]]),
        rootNodes: ['test-node'],
        currentPath: [],
        sessionId,
        createdAt: new Date()
      };

      await adapter.save(sessionId, tree);
      const loaded = await adapter.load(sessionId);

      expect(loaded!.nodes).toBeInstanceOf(Map);
      expect(loaded!.nodes.size).toBe(1);
      expect(loaded!.nodes.has('test-node')).toBe(true);
      expect(loaded!.nodes.get('test-node')).toEqual(nodeData);
    });
  });
});