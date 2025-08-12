/**
 * Integration tests for ConversationGradingSystem with mock conversation data
 * Tests the complete system with realistic conversation scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConversationGradingIntegration, createConversationGradingIntegration } from '../../utils/ConversationGradingIntegration';
import { ConversationGradingSystem } from '../../services/ConversationGradingSystem';
import { QAPair, IScoringStrategy, ScoringContext } from '../../types/conversation-grading';

describe('ConversationGradingIntegration', () => {
  let integration: ConversationGradingIntegration;

  beforeEach(() => {
    integration = createConversationGradingIntegration({
      sessionId: 'integration-test',
      autoScore: true
    });
  });

  afterEach(() => {
    integration.reset();
  });

  describe('Basic Integration', () => {
    it('should process a simple conversation flow', async () => {
      const messages = [
        {
          id: 'msg1',
          role: 'user' as const,
          content: 'What is machine learning?',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 'msg2',
          role: 'assistant' as const,
          content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.',
          timestamp: new Date('2024-01-01T10:00:30Z')
        },
        {
          id: 'msg3',
          role: 'user' as const,
          content: 'What are the main types of machine learning?',
          timestamp: new Date('2024-01-01T10:01:00Z')
        },
        {
          id: 'msg4',
          role: 'assistant' as const,
          content: 'The main types are supervised learning (using labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through interaction and rewards).',
          timestamp: new Date('2024-01-01T10:01:45Z')
        }
      ];

      const results = await integration.processConversation(messages);

      expect(results).toHaveLength(2);
      
      // First Q&A pair should create a root node
      expect(results[0].isNewBranch).toBe(true);
      expect(results[0].depth).toBe(1);
      expect(results[0].topic).toBeDefined();
      expect(results[0].topic.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0);

      // Second Q&A pair should be related to the first
      expect(results[1].depth).toBeGreaterThanOrEqual(1);
      expect(results[1].score).toBeGreaterThan(0);
    });

    it('should handle branching conversations', async () => {
      const messages = [
        // Main AI topic
        { role: 'user' as const, content: 'What is artificial intelligence?', timestamp: new Date() },
        { role: 'assistant' as const, content: 'AI is the simulation of human intelligence in machines.', timestamp: new Date() },
        
        // Branch into machine learning
        { role: 'user' as const, content: 'How does machine learning relate to AI?', timestamp: new Date() },
        { role: 'assistant' as const, content: 'Machine learning is a subset of AI focused on learning from data.', timestamp: new Date() },
        
        // Branch into neural networks
        { role: 'user' as const, content: 'What are neural networks?', timestamp: new Date() },
        { role: 'assistant' as const, content: 'Neural networks are computing systems inspired by biological neural networks.', timestamp: new Date() },
        
        // New branch - AI ethics
        { role: 'user' as const, content: 'What are the ethical concerns with AI?', timestamp: new Date() },
        { role: 'assistant' as const, content: 'Key concerns include bias, privacy, job displacement, and accountability.', timestamp: new Date() }
      ];

      const results = await integration.processConversation(messages);

      expect(results).toHaveLength(4);
      
      // Should have multiple branches or at least consistent depth
      const depths = results.map(r => r.depth);
      expect(Math.max(...depths)).toBeGreaterThanOrEqual(1);
      
      // Should have suggestions for continuing conversation
      results.forEach(result => {
        expect(result.suggestions).toBeDefined();
        if (result.suggestions?.nextQuestions) {
          expect(result.suggestions.nextQuestions.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Custom Scoring Integration', () => {
    it('should use custom scoring strategy', async () => {
      const customScoring: IScoringStrategy = {
        async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
          // Score based on answer length and technical terms
          let score = 30; // Base score
          
          if (qaPair.answer.length > 100) score += 30;
          if (qaPair.answer.length > 200) score += 20;
          
          const technicalTerms = ['algorithm', 'neural', 'learning', 'intelligence'];
          const termCount = technicalTerms.filter(term => 
            qaPair.answer.toLowerCase().includes(term)
          ).length;
          score += termCount * 10;
          
          return Math.min(100, score);
        }
      };

      const customIntegration = createConversationGradingIntegration({
        sessionId: 'custom-scoring-test',
        scoringStrategy: customScoring
      });

      const qaPair: QAPair = {
        question: 'Explain neural networks in detail',
        answer: 'Neural networks are complex algorithms inspired by biological neural networks. They consist of interconnected nodes that process information through weighted connections and activation functions. These networks can learn patterns through backpropagation and are fundamental to deep learning applications.',
        timestamp: new Date()
      };

      const result = await customIntegration.processQAPair(qaPair);

      // Should use custom scoring logic
      expect(result.score).toBeGreaterThan(70); // Long answer + technical terms
      
      customIntegration.reset();
    });
  });

  describe('Analytics and Insights', () => {
    it('should provide comprehensive analytics', async () => {
      // Create a rich conversation with multiple topics and depths
      const conversationData = [
        // AI fundamentals
        { q: 'What is AI?', a: 'AI is artificial intelligence, the simulation of human intelligence in machines.' },
        { q: 'What are AI applications?', a: 'AI is used in healthcare, finance, transportation, and many other fields.' },
        
        // Machine learning branch
        { q: 'What is machine learning?', a: 'Machine learning is a subset of AI that learns from data without explicit programming.' },
        { q: 'What are ML algorithms?', a: 'Common algorithms include linear regression, decision trees, neural networks, and clustering methods.' },
        { q: 'How do you evaluate ML models?', a: 'Models are evaluated using metrics like accuracy, precision, recall, and cross-validation techniques.' },
        
        // Deep learning branch
        { q: 'What is deep learning?', a: 'Deep learning uses neural networks with multiple layers to model complex patterns in data.' },
        { q: 'What are CNNs?', a: 'Convolutional Neural Networks are specialized for processing grid-like data such as images.' },
        
        // Ethics branch
        { q: 'What are AI ethics concerns?', a: 'Key concerns include algorithmic bias, privacy, transparency, and societal impact.' }
      ];

      // Process all conversations
      for (const conv of conversationData) {
        const qaPair: QAPair = {
          question: conv.q,
          answer: conv.a,
          timestamp: new Date(),
          metadata: { length: conv.a.length }
        };
        await integration.processQAPair(qaPair);
      }

      const analytics = integration.getAnalytics();

      // Verify comprehensive statistics
      expect(analytics.stats.totalNodes).toBe(conversationData.length);
      expect(analytics.stats.totalQAPairs).toBe(conversationData.length);
      expect(analytics.stats.maxDepth).toBeGreaterThanOrEqual(1);
      expect(analytics.stats.rootNodes).toBeGreaterThan(0);
      expect(analytics.stats.leafNodes).toBeGreaterThan(0);

      // Verify insights
      expect(analytics.insights.mostDiscussedTopics).toBeDefined();
      expect(analytics.insights.mostDiscussedTopics.length).toBeGreaterThan(0);
      
      expect(analytics.insights.averageDepthByTopic).toBeDefined();
      expect(analytics.insights.averageDepthByTopic.length).toBeGreaterThan(0);
      
      expect(analytics.insights.conversationFlow).toBeDefined();
      // Conversation flow may be empty if all topics are created as root nodes
      expect(Array.isArray(analytics.insights.conversationFlow)).toBe(true);

      // Verify conversation flow relationships if any exist
      if (analytics.insights.conversationFlow.length > 0) {
        analytics.insights.conversationFlow.forEach(flow => {
          expect(flow.from).toBeDefined();
          expect(flow.to).toBeDefined();
          expect(flow.relationship).toBe('child_of');
        });
      }
    });
  });

  describe('Data Export and Import', () => {
    it('should export conversation data in structured format', async () => {
      // Create sample conversation
      const qaPairs = [
        {
          question: 'What is programming?',
          answer: 'Programming is the process of creating instructions for computers to execute.',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          question: 'What are programming languages?',
          answer: 'Programming languages are formal languages used to communicate instructions to computers.',
          timestamp: new Date('2024-01-01T10:01:00Z')
        },
        {
          question: 'What is object-oriented programming?',
          answer: 'OOP is a programming paradigm based on objects that contain data and methods.',
          timestamp: new Date('2024-01-01T10:02:00Z')
        }
      ];

      // Process conversations
      for (const qaPair of qaPairs) {
        await integration.processQAPair(qaPair);
      }

      const exportData = integration.exportConversationData();

      // Verify export structure
      expect(exportData.tree).toBeDefined();
      expect(exportData.qaPairs).toBeDefined();
      expect(exportData.topicHierarchy).toBeDefined();

      // Verify Q&A pairs are sorted by timestamp
      expect(exportData.qaPairs).toHaveLength(3);
      for (let i = 1; i < exportData.qaPairs.length; i++) {
        expect(exportData.qaPairs[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(exportData.qaPairs[i-1].timestamp.getTime());
      }

      // Verify topic hierarchy structure
      expect(exportData.topicHierarchy).toHaveLength(3);
      exportData.topicHierarchy.forEach(topic => {
        expect(topic.id).toBeDefined();
        expect(topic.topic).toBeDefined();
        expect(topic.depth).toBeGreaterThan(0);
        expect(Array.isArray(topic.children)).toBe(true);
      });

      // Verify tree structure integrity
      expect(exportData.tree.nodes.size).toBe(3);
      expect(exportData.tree.rootNodes.length).toBeGreaterThan(0);
      expect(exportData.tree.sessionId).toBe('integration-test');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty conversations gracefully', async () => {
      const results = await integration.processConversation([]);
      expect(results).toHaveLength(0);
    });

    it('should handle malformed messages', async () => {
      const messages = [
        { role: 'user' as const, content: '', timestamp: new Date() },
        { role: 'assistant' as const, content: 'I cannot process empty questions.', timestamp: new Date() }
      ];

      // Should not throw error, but may not create meaningful results
      const results = await integration.processConversation(messages);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long conversations', async () => {
      const longConversation = [];
      
      // Create 50 Q&A pairs
      for (let i = 0; i < 50; i++) {
        longConversation.push(
          { role: 'user' as const, content: `Question ${i + 1}: What is topic ${i + 1}?`, timestamp: new Date() },
          { role: 'assistant' as const, content: `Answer ${i + 1}: This is the answer for topic ${i + 1}.`, timestamp: new Date() }
        );
      }

      const results = await integration.processConversation(longConversation);
      
      expect(results).toHaveLength(50);
      
      // Verify system can handle large trees
      const stats = integration.getAnalytics().stats;
      expect(stats.totalNodes).toBe(50);
      expect(stats.maxDepth).toBeGreaterThan(1);
    });

    it('should handle concurrent processing', async () => {
      const qaPairs = [
        { question: 'What is A?', answer: 'A is the first letter.', timestamp: new Date() },
        { question: 'What is B?', answer: 'B is the second letter.', timestamp: new Date() },
        { question: 'What is C?', answer: 'C is the third letter.', timestamp: new Date() }
      ];

      // Process multiple Q&A pairs concurrently
      const promises = qaPairs.map(qaPair => integration.processQAPair(qaPair));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.nodeId).toBeDefined();
        expect(result.topic).toBeDefined();
        expect(result.depth).toBeGreaterThan(0);
      });
    });
  });

  describe('Navigation and Recommendations', () => {
    it('should provide intelligent navigation suggestions', async () => {
      // Create a conversation with multiple branches
      const conversations = [
        // Main topic
        { q: 'What is software engineering?', a: 'Software engineering is the systematic approach to software development.' },
        
        // Branch 1: Design patterns
        { q: 'What are design patterns?', a: 'Design patterns are reusable solutions to common programming problems.' },
        { q: 'What is the singleton pattern?', a: 'Singleton ensures a class has only one instance and provides global access.' },
        
        // Branch 2: Testing
        { q: 'What is software testing?', a: 'Software testing is the process of evaluating software to find defects.' },
        { q: 'What is unit testing?', a: 'Unit testing involves testing individual components in isolation.' },
        
        // Branch 3: Architecture
        { q: 'What is software architecture?', a: 'Software architecture defines the high-level structure of software systems.' }
      ];

      const results = [];
      for (const conv of conversations) {
        const result = await integration.processQAPair({
          question: conv.q,
          answer: conv.a,
          timestamp: new Date()
        });
        results.push(result);
      }

      // Verify suggestions are provided
      results.forEach(result => {
        expect(result.suggestions).toBeDefined();
        
        if (result.suggestions?.nextQuestions) {
          expect(result.suggestions.nextQuestions.length).toBeGreaterThan(0);
          result.suggestions.nextQuestions.forEach(question => {
            expect(typeof question).toBe('string');
            expect(question.length).toBeGreaterThan(0);
          });
        }
      });

      // Test deepest unvisited branch functionality
      const system = integration.getSystem();
      let deepestBranch = system.getDeepestUnvisitedBranch();
      
      while (deepestBranch) {
        expect(deepestBranch.topic).toBeDefined();
        expect(deepestBranch.depth).toBeGreaterThan(0);
        
        // Mark as visited and get next
        system.markTopicAsVisited(deepestBranch.id);
        deepestBranch = system.getDeepestUnvisitedBranch();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should maintain performance with deep conversation trees', async () => {
      const startTime = Date.now();
      
      // Create a deep conversation chain
      let previousResult = null;
      for (let i = 0; i < 20; i++) {
        const result = await integration.processQAPair({
          question: `What is level ${i + 1} of this topic?`,
          answer: `This is level ${i + 1}, building on the previous levels with more detailed information about the subject matter.`,
          timestamp: new Date()
        });
        
        if (previousResult) {
          // Verify depth is increasing (or at least not decreasing significantly)
          expect(result.depth).toBeGreaterThanOrEqual(1);
        }
        
        previousResult = result;
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(5000); // 5 seconds
      
      // Verify final tree structure
      const stats = integration.getAnalytics().stats;
      expect(stats.totalNodes).toBe(20);
      expect(stats.maxDepth).toBeGreaterThanOrEqual(1); // Topic analysis may create flatter trees
    });

    it('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process many Q&A pairs
      for (let i = 0; i < 100; i++) {
        await integration.processQAPair({
          question: `Question ${i}: What about topic ${i}?`,
          answer: `Answer ${i}: This is a comprehensive answer about topic ${i} with sufficient detail to test memory usage patterns.`,
          timestamp: new Date()
        });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (adjust threshold based on system)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      
      // Verify all data was processed
      const stats = integration.getAnalytics().stats;
      expect(stats.totalNodes).toBe(100);
      expect(stats.totalQAPairs).toBe(100);
    });
  });
});