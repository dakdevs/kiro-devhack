import { describe, it, expect, beforeEach } from 'vitest';
import { TopicAnalyzer } from '../TopicAnalyzer';
import { QAPair, TopicNode } from '../../types/conversation-grading';

describe('TopicAnalyzer', () => {
  let analyzer: TopicAnalyzer;

  beforeEach(() => {
    analyzer = new TopicAnalyzer();
  });

  describe('extractTopics', () => {
    it('should extract topics from a simple Q&A pair', async () => {
      const qaPair: QAPair = {
        question: 'What is machine learning?',
        answer: 'Machine learning is a subset of artificial intelligence that focuses on algorithms.',
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeGreaterThan(0);
      expect(topics.some(topic => 
        topic.includes('machine') || topic.includes('learning') || topic.includes('artificial')
      )).toBe(true);
    });

    it('should handle Q&A pairs with technical content', async () => {
      const qaPair: QAPair = {
        question: 'How does neural network backpropagation work?',
        answer: 'Backpropagation calculates gradients by applying the chain rule through network layers.',
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeGreaterThan(0);
      // Check that at least one topic contains relevant technical terms
      const hasRelevantTopic = topics.some(topic => 
        /neural|network|backpropagation|gradient/i.test(topic)
      );
      expect(hasRelevantTopic).toBe(true);
    });

    it('should return default topic for empty or unclear content', async () => {
      const qaPair: QAPair = {
        question: '',
        answer: '',
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toEqual(['general discussion']);
    });

    it('should extract multiple relevant topics', async () => {
      const qaPair: QAPair = {
        question: 'What are the differences between supervised and unsupervised learning algorithms?',
        answer: 'Supervised learning uses labeled data for training, while unsupervised learning finds patterns in unlabeled data.',
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics.length).toBeGreaterThan(1);
      expect(topics.some(topic => topic.includes('supervised'))).toBe(true);
      expect(topics.some(topic => topic.includes('learning'))).toBe(true);
    });

    it('should handle Q&A pairs with metadata', async () => {
      const qaPair: QAPair = {
        question: 'What is deep learning?',
        answer: 'Deep learning uses neural networks with multiple layers.',
        timestamp: new Date(),
        metadata: { category: 'AI', difficulty: 'intermediate' }
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeGreaterThan(0);
    });
  });

  describe('determineRelationship', () => {
    const createMockNode = (id: string, topic: string, parentTopic: string | null = null): TopicNode => ({
      id,
      topic,
      parentTopic,
      children: [],
      depth: parentTopic ? 2 : 1,
      score: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      metadata: {
        qaPairs: [],
        visitCount: 0,
        lastVisited: null,
        isExhausted: false
      }
    });

    it('should return new_root for empty existing nodes', () => {
      const relationship = analyzer.determineRelationship('machine learning', []);
      
      expect(relationship.type).toBe('new_root');
      expect(relationship.confidence).toBe(1.0);
      expect(relationship.parentNodeId).toBeUndefined();
    });

    it('should detect child relationship for similar topics', () => {
      const existingNodes = [
        createMockNode('1', 'machine learning', null)
      ];
      
      const relationship = analyzer.determineRelationship('machine learning algorithms', existingNodes);
      
      expect(relationship.type).toBe('child_of');
      expect(relationship.parentNodeId).toBe('1');
      expect(relationship.confidence).toBeGreaterThan(0);
    });

    it('should detect sibling relationship for moderately similar topics', () => {
      const existingNodes = [
        createMockNode('1', 'machine learning', null),
        createMockNode('2', 'supervised learning', '1')
      ];
      
      const relationship = analyzer.determineRelationship('reinforcement learning', existingNodes);
      
      // Should find similarity with supervised learning and suggest sibling relationship
      expect(['sibling_of', 'child_of']).toContain(relationship.type);
      expect(relationship.confidence).toBeGreaterThan(0);
    });

    it('should detect continuation relationship', () => {
      const existingNodes = [
        createMockNode('1', 'machine learning', null, )
      ];
      // Update the most recent node to have a recent timestamp
      existingNodes[0].updatedAt = new Date();
      
      const relationship = analyzer.determineRelationship('tell me more about algorithms', existingNodes);
      
      expect(relationship.type).toBe('continuation');
      expect(relationship.parentNodeId).toBe('1');
      expect(relationship.confidence).toBe(0.8);
    });

    it('should detect continuation with various keywords', () => {
      const existingNodes = [
        createMockNode('1', 'deep learning', null)
      ];
      existingNodes[0].updatedAt = new Date();

      const continuationPhrases = [
        'what about convolutional networks',
        'can you explain more details',
        'tell me additionally about training',
        'what else should I know'
      ];

      continuationPhrases.forEach(phrase => {
        const relationship = analyzer.determineRelationship(phrase, existingNodes);
        expect(relationship.type).toBe('continuation');
        expect(relationship.parentNodeId).toBe('1');
      });
    });

    it('should return new_root for completely unrelated topics', () => {
      const existingNodes = [
        createMockNode('1', 'machine learning', null),
        createMockNode('2', 'neural networks', '1')
      ];
      
      const relationship = analyzer.determineRelationship('cooking recipes', existingNodes);
      
      expect(relationship.type).toBe('new_root');
      expect(relationship.confidence).toBeGreaterThan(0.5);
    });

    it('should handle multiple existing nodes and find best match', () => {
      const existingNodes = [
        createMockNode('1', 'programming', null),
        createMockNode('2', 'machine learning', null),
        createMockNode('3', 'data science', null)
      ];
      
      const relationship = analyzer.determineRelationship('artificial intelligence', existingNodes);
      
      expect(relationship.type).toBeOneOf(['child_of', 'sibling_of', 'new_root']);
      expect(relationship.confidence).toBeGreaterThan(0);
      if (relationship.parentNodeId) {
        expect(['1', '2', '3']).toContain(relationship.parentNodeId);
      }
    });

    it('should prefer more recent nodes for continuation detection', () => {
      const olderNode = createMockNode('1', 'old topic', null);
      olderNode.updatedAt = new Date('2024-01-01');
      
      const newerNode = createMockNode('2', 'recent topic', null);
      newerNode.updatedAt = new Date('2024-12-01');
      
      const existingNodes = [olderNode, newerNode];
      
      const relationship = analyzer.determineRelationship('tell me more details', existingNodes);
      
      expect(relationship.type).toBe('continuation');
      expect(relationship.parentNodeId).toBe('2'); // Should prefer newer node
    });
  });

  describe('topic similarity calculation', () => {
    it('should calculate high similarity for related topics', async () => {
      const existingNodes = [
        {
          id: '1',
          topic: 'machine learning algorithms',
          parentTopic: null,
          children: [],
          depth: 1,
          score: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            qaPairs: [],
            visitCount: 0,
            lastVisited: null,
            isExhausted: false
          }
        } as TopicNode
      ];

      const relationship = analyzer.determineRelationship('supervised learning algorithms', existingNodes);
      
      // Should detect high similarity due to shared words
      expect(relationship.confidence).toBeGreaterThan(0.3);
    });

    it('should calculate low similarity for unrelated topics', async () => {
      const existingNodes = [
        {
          id: '1',
          topic: 'machine learning',
          parentTopic: null,
          children: [],
          depth: 1,
          score: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            qaPairs: [],
            visitCount: 0,
            lastVisited: null,
            isExhausted: false
          }
        } as TopicNode
      ];

      const relationship = analyzer.determineRelationship('cooking pasta', existingNodes);
      
      // Should detect low similarity and create new root
      expect(relationship.type).toBe('new_root');
      expect(relationship.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty topic strings', async () => {
      const qaPair: QAPair = {
        question: '',
        answer: '',
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toEqual(['general discussion']);
    });

    it('should handle very long topic strings', async () => {
      const longText = 'machine learning artificial intelligence deep learning neural networks ' +
                      'convolutional networks recurrent networks transformer models attention mechanisms ' +
                      'natural language processing computer vision reinforcement learning supervised learning';
      
      const qaPair: QAPair = {
        question: longText,
        answer: longText,
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeLessThanOrEqual(3); // Should limit to top 3 topics
    });

    it('should handle special characters and punctuation', async () => {
      const qaPair: QAPair = {
        question: 'What is C++? How does it differ from Python?',
        answer: 'C++ is a compiled language, while Python is interpreted. C++ offers more control!',
        timestamp: new Date()
      };

      const topics = await analyzer.extractTopics(qaPair);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeGreaterThan(0);
    });
  });
});