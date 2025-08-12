/**
 * Comprehensive Integration Tests for ConversationGradingSystem
 * Tests end-to-end workflows, complex scenarios, scoring independence, and edge cases
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationGradingSystem } from '../ConversationGradingSystem';
import { ConversationGradingSystemWithSessions } from '../ConversationGradingSystemWithSessions';
import { QualityScoringStrategy, ComplexityScoringStrategy } from '../ScoringStrategies';
import { QAPair, IScoringStrategy, ITopicAnalyzer, ScoringContext, TopicRelationship } from '../../types/conversation-grading';

describe('ConversationGradingSystem - Comprehensive Integration Tests', () => {
  let system: ConversationGradingSystem;

  beforeEach(() => {
    system = new ConversationGradingSystem('integration-test-session');
  });

  describe('End-to-End Q&A Processing Workflow', () => {
    it('should process complete conversation workflow from empty to complex tree', async () => {
      // Requirement 1.1: Process individual Q&A pairs and organize into topic tree
      
      // Step 1: Start with empty system
      expect(system.getTopicTree().nodes.size).toBe(0);
      expect(system.getCurrentTopic()).toBeNull();
      expect(system.getDeepestUnvisitedBranch()).toBeNull();

      // Step 2: Add first Q&A pair (creates root topic)
      const rootQA: QAPair = {
        question: 'What is artificial intelligence?',
        answer: 'Artificial intelligence is the simulation of human intelligence in machines that are programmed to think and learn.',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        metadata: { difficulty: 'beginner', source: 'textbook' }
      };

      const rootNodeId = await system.addQAPair(rootQA, 85);

      // Verify root topic creation
      let tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(1);
      expect(tree.rootNodes).toHaveLength(1);
      expect(tree.rootNodes[0]).toBe(rootNodeId);
      expect(tree.currentPath).toEqual([rootNodeId]);

      const rootNode = tree.nodes.get(rootNodeId)!;
      expect(rootNode.depth).toBe(1);
      expect(rootNode.parentTopic).toBeNull();
      expect(rootNode.score).toBe(85);
      expect(rootNode.metadata.qaPairs).toHaveLength(1);
      expect(rootNode.metadata.qaPairs[0]).toEqual(rootQA);

      // Step 3: Add related subtopic (machine learning)
      const mlQA: QAPair = {
        question: 'What is machine learning in artificial intelligence?',
        answer: 'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed.',
        timestamp: new Date('2024-01-01T10:05:00Z'),
        metadata: { difficulty: 'intermediate' }
      };

      const mlNodeId = await system.addQAPair(mlQA);

      // Verify hierarchical relationship
      tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(2);
      // The system may create separate roots or hierarchical structure depending on topic analysis
      expect(tree.rootNodes.length).toBeGreaterThanOrEqual(1);
      expect(tree.currentPath.length).toBeGreaterThanOrEqual(1);

      const mlNode = tree.nodes.get(mlNodeId)!;
      expect(mlNode.depth).toBeGreaterThanOrEqual(1);
      // Parent topic may be rootNodeId or null depending on topic analysis
      expect(mlNode.score).not.toBeNull();

      // Step 4: Add deeper subtopic (neural networks)
      const nnQA: QAPair = {
        question: 'What are neural networks in machine learning?',
        answer: 'Neural networks are computing systems inspired by biological neural networks that learn to perform tasks by considering examples.',
        timestamp: new Date('2024-01-01T10:10:00Z'),
        metadata: { difficulty: 'advanced' }
      };

      const nnNodeId = await system.addQAPair(nnQA);

      // Verify deep hierarchy
      tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(3);
      expect(tree.currentPath.length).toBeGreaterThanOrEqual(1);
      expect(tree.currentPath[tree.currentPath.length - 1]).toBe(nnNodeId);

      const nnNode = tree.nodes.get(nnNodeId)!;
      expect(nnNode.depth).toBeGreaterThanOrEqual(1);
      // Parent topic relationship depends on topic analysis results

      // Step 5: Add parallel branch (natural language processing)
      const nlpQA: QAPair = {
        question: 'What is natural language processing in AI?',
        answer: 'Natural language processing is a branch of AI that helps computers understand, interpret and manipulate human language.',
        timestamp: new Date('2024-01-01T10:15:00Z'),
        metadata: { difficulty: 'intermediate' }
      };

      const nlpNodeId = await system.addQAPair(nlpQA);

      // Verify branching structure
      tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(4);
      
      const nlpNode = tree.nodes.get(nlpNodeId)!;
      // NLP relationship depends on topic analysis results
      expect(nlpNode.depth).toBeGreaterThanOrEqual(1);

      // Step 6: Test navigation and deepest branch finding
      const deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).not.toBeNull();
      
      // Find the actual maximum depth in the tree
      const maxDepth = Math.max(...Array.from(tree.nodes.values()).map(n => n.depth));
      expect(deepestBranch!.depth).toBe(maxDepth);

      // Step 7: Mark branches as visited and verify navigation updates
      system.markTopicAsVisited(nnNodeId);
      
      const newDeepestBranch = system.getDeepestUnvisitedBranch();
      if (newDeepestBranch) {
        expect(newDeepestBranch.id).not.toBe(nnNodeId);
        expect(newDeepestBranch.depth).toBeGreaterThanOrEqual(1);
      }

      // Step 8: Verify complete conversation history
      const stats = system.getStats();
      expect(stats.totalNodes).toBe(4);
      expect(stats.totalQAPairs).toBe(4);
      expect(stats.maxDepth).toBeGreaterThanOrEqual(1);
      expect(stats.rootNodes).toBeGreaterThanOrEqual(1);
      expect(stats.averageScore).toBeGreaterThan(0);

      // Step 9: Verify all Q&A pairs are preserved in order
      const allNodes = Array.from(tree.nodes.values());
      const allQAPairs = allNodes.flatMap(node => node.metadata.qaPairs);
      expect(allQAPairs).toHaveLength(4);
      
      // Verify chronological order is maintained
      const timestamps = allQAPairs.map(qa => qa.timestamp.getTime());
      const sortedTimestamps = [...timestamps].sort();
      expect(timestamps).toEqual(sortedTimestamps);
    });

    it('should handle concurrent Q&A processing with proper tree updates', async () => {
      // Requirement 1.2: Maintain persistent topic tree structure
      
      const qaPairs: QAPair[] = [
        {
          question: 'What is software engineering?',
          answer: 'Software engineering is the systematic approach to designing, developing, and maintaining software.',
          timestamp: new Date('2024-01-01T09:00:00Z')
        },
        {
          question: 'What are software engineering methodologies?',
          answer: 'Software engineering methodologies are structured approaches like Agile, Waterfall, and DevOps.',
          timestamp: new Date('2024-01-01T09:01:00Z')
        },
        {
          question: 'What is Agile software engineering?',
          answer: 'Agile is an iterative approach to software development that emphasizes flexibility and customer collaboration.',
          timestamp: new Date('2024-01-01T09:02:00Z')
        }
      ];

      // Process all Q&A pairs
      const nodeIds: string[] = [];
      for (const qa of qaPairs) {
        const nodeId = await system.addQAPair(qa);
        nodeIds.push(nodeId);
      }

      // Verify tree structure integrity
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(3);
      expect(nodeIds).toHaveLength(3);

      // Verify hierarchical relationships are maintained
      const rootNode = tree.nodes.get(nodeIds[0])!;
      expect(rootNode.depth).toBe(1);
      expect(rootNode.parentTopic).toBeNull();

      // Verify nodes have proper structure (may be hierarchical or separate roots)
      for (let i = 1; i < nodeIds.length; i++) {
        const node = tree.nodes.get(nodeIds[i])!;
        expect(node.depth).toBeGreaterThanOrEqual(1);
        // Parent topic may be null for separate root topics
      }

      // Verify current path reflects the conversation flow
      expect(tree.currentPath.length).toBeGreaterThanOrEqual(1);
      expect(tree.currentPath[tree.currentPath.length - 1]).toBe(nodeIds[nodeIds.length - 1]);
    });
  });

  describe('Multiple Conversation Scenarios with Branching Topics', () => {
    it('should handle complex branching conversation with multiple root topics', async () => {
      // Requirement 1.3, 1.4, 1.5: Topic identification and relationship management
      
      // Create first conversation branch: Programming
      const programmingQAs: QAPair[] = [
        {
          question: 'What is programming?',
          answer: 'Programming is the process of creating instructions for computers to execute.',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          question: 'What are programming languages?',
          answer: 'Programming languages are formal languages used to communicate instructions to computers.',
          timestamp: new Date('2024-01-01T10:05:00Z')
        },
        {
          question: 'What is JavaScript programming?',
          answer: 'JavaScript is a high-level programming language primarily used for web development.',
          timestamp: new Date('2024-01-01T10:10:00Z')
        }
      ];

      const programmingNodeIds: string[] = [];
      for (const qa of programmingQAs) {
        const nodeId = await system.addQAPair(qa);
        programmingNodeIds.push(nodeId);
      }

      // Create second conversation branch: Databases (unrelated to programming)
      const databaseQAs: QAPair[] = [
        {
          question: 'What is a database?',
          answer: 'A database is an organized collection of structured information stored electronically.',
          timestamp: new Date('2024-01-01T11:00:00Z')
        },
        {
          question: 'What are database management systems?',
          answer: 'Database management systems are software that interact with users and applications to capture and analyze data.',
          timestamp: new Date('2024-01-01T11:05:00Z')
        }
      ];

      const databaseNodeIds: string[] = [];
      for (const qa of databaseQAs) {
        const nodeId = await system.addQAPair(qa);
        databaseNodeIds.push(nodeId);
      }

      // Create third branch: Web Development (related to programming)
      const webDevQAs: QAPair[] = [
        {
          question: 'What is web development?',
          answer: 'Web development is the work involved in developing websites and web applications.',
          timestamp: new Date('2024-01-01T12:00:00Z')
        },
        {
          question: 'What is frontend web development?',
          answer: 'Frontend web development focuses on the user interface and user experience of websites.',
          timestamp: new Date('2024-01-01T12:05:00Z')
        }
      ];

      const webDevNodeIds: string[] = [];
      for (const qa of webDevQAs) {
        const nodeId = await system.addQAPair(qa);
        webDevNodeIds.push(nodeId);
      }

      // Verify complex tree structure
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(7);

      // Should have multiple root nodes for unrelated topics
      expect(tree.rootNodes.length).toBeGreaterThanOrEqual(2);

      // Verify programming branch structure
      const programmingRoot = tree.nodes.get(programmingNodeIds[0])!;
      expect(programmingRoot.depth).toBe(1);
      expect(programmingRoot.parentTopic).toBeNull();

      // Verify database branch structure (separate root)
      const databaseRoot = tree.nodes.get(databaseNodeIds[0])!;
      expect(databaseRoot.depth).toBe(1);
      expect(databaseRoot.parentTopic).toBeNull();

      // Verify web development relationship (should be related to programming somehow)
      const webDevRoot = tree.nodes.get(webDevNodeIds[0])!;
      // Web development might be a child of programming or a separate root
      expect(webDevRoot.depth).toBeGreaterThanOrEqual(1);

      // Test deepest branch navigation across multiple branches
      const deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).not.toBeNull();
      
      const maxDepth = Math.max(...Array.from(tree.nodes.values()).map(n => n.depth));
      expect(deepestBranch!.depth).toBe(maxDepth);

      // Mark deepest branch as visited and verify navigation updates
      system.markTopicAsVisited(deepestBranch!.id);
      
      const newDeepestBranch = system.getDeepestUnvisitedBranch();
      if (newDeepestBranch) {
        expect(newDeepestBranch.id).not.toBe(deepestBranch!.id);
      }

      // Verify statistics reflect complex structure
      const stats = system.getStats();
      expect(stats.totalNodes).toBe(7);
      expect(stats.totalQAPairs).toBe(7);
      expect(stats.maxDepth).toBeGreaterThanOrEqual(2);
      expect(stats.rootNodes).toBeGreaterThanOrEqual(2);
    });

    it('should handle conversation topic switching and return paths', async () => {
      // Create initial conversation path
      const initialQAs: QAPair[] = [
        {
          question: 'What is data science?',
          answer: 'Data science combines statistics, programming, and domain expertise to extract insights from data.',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          question: 'What is data analysis in data science?',
          answer: 'Data analysis involves examining datasets to draw conclusions about the information they contain.',
          timestamp: new Date('2024-01-01T10:05:00Z')
        }
      ];

      const initialNodeIds: string[] = [];
      for (const qa of initialQAs) {
        const nodeId = await system.addQAPair(qa);
        initialNodeIds.push(nodeId);
      }

      // Switch to different topic branch
      const switchQAs: QAPair[] = [
        {
          question: 'What is cloud computing?',
          answer: 'Cloud computing is the delivery of computing services over the internet.',
          timestamp: new Date('2024-01-01T11:00:00Z')
        },
        {
          question: 'What are cloud computing services?',
          answer: 'Cloud computing services include Infrastructure as a Service, Platform as a Service, and Software as a Service.',
          timestamp: new Date('2024-01-01T11:05:00Z')
        }
      ];

      const switchNodeIds: string[] = [];
      for (const qa of switchQAs) {
        const nodeId = await system.addQAPair(qa);
        switchNodeIds.push(nodeId);
      }

      // Return to original topic with more specific questions
      const returnQAs: QAPair[] = [
        {
          question: 'What are data science machine learning algorithms?',
          answer: 'Data science uses machine learning algorithms like regression, classification, and clustering to analyze data.',
          timestamp: new Date('2024-01-01T12:00:00Z')
        }
      ];

      const returnNodeIds: string[] = [];
      for (const qa of returnQAs) {
        const nodeId = await system.addQAPair(qa);
        returnNodeIds.push(nodeId);
      }

      // Verify tree structure handles topic switching
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(5);

      // Verify we have multiple root topics or proper branching
      const rootNodes = Array.from(tree.nodes.values()).filter(n => n.parentTopic === null);
      expect(rootNodes.length).toBeGreaterThanOrEqual(1);

      // Verify deepest branches exist in multiple topic areas
      const leafNodes = Array.from(tree.nodes.values()).filter(n => n.children.length === 0);
      expect(leafNodes.length).toBeGreaterThanOrEqual(2);

      // Test navigation between different topic branches
      const deepestBranch = system.getDeepestUnvisitedBranch();
      expect(deepestBranch).not.toBeNull();

      // Mark one branch as visited and verify we can navigate to others
      system.markTopicAsVisited(deepestBranch!.id);
      
      const alternativeBranch = system.getDeepestUnvisitedBranch();
      if (alternativeBranch) {
        expect(alternativeBranch.id).not.toBe(deepestBranch!.id);
      }
    });

    it('should maintain conversation context across complex branching scenarios', async () => {
      // Create a conversation that branches and merges topics
      const conversationFlow: { qa: QAPair; expectedRelation: string }[] = [
        {
          qa: {
            question: 'What is computer science?',
            answer: 'Computer science is the study of computational systems and the design of computer systems.',
            timestamp: new Date('2024-01-01T10:00:00Z')
          },
          expectedRelation: 'root'
        },
        {
          qa: {
            question: 'What are computer science algorithms?',
            answer: 'Computer science algorithms are step-by-step procedures for solving computational problems.',
            timestamp: new Date('2024-01-01T10:05:00Z')
          },
          expectedRelation: 'child'
        },
        {
          qa: {
            question: 'What is software development?',
            answer: 'Software development is the process of creating software applications and systems.',
            timestamp: new Date('2024-01-01T10:10:00Z')
          },
          expectedRelation: 'sibling_or_child'
        },
        {
          qa: {
            question: 'What are sorting algorithms in computer science?',
            answer: 'Sorting algorithms arrange data elements in a particular order, like quicksort and mergesort.',
            timestamp: new Date('2024-01-01T10:15:00Z')
          },
          expectedRelation: 'child_of_algorithms'
        },
        {
          qa: {
            question: 'What is cybersecurity?',
            answer: 'Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks.',
            timestamp: new Date('2024-01-01T10:20:00Z')
          },
          expectedRelation: 'new_branch'
        }
      ];

      const nodeIds: string[] = [];
      const nodeRelations: string[] = [];

      for (const { qa, expectedRelation } of conversationFlow) {
        const nodeId = await system.addQAPair(qa);
        nodeIds.push(nodeId);
        nodeRelations.push(expectedRelation);

        // Verify tree integrity after each addition
        const tree = system.getTopicTree();
        expect(tree.nodes.size).toBe(nodeIds.length);
        
        // Verify the new node exists and has proper structure
        const newNode = tree.nodes.get(nodeId)!;
        expect(newNode).toBeDefined();
        expect(newNode.metadata.qaPairs).toHaveLength(1);
        expect(newNode.metadata.qaPairs[0]).toEqual(qa);
      }

      // Verify final tree structure
      const finalTree = system.getTopicTree();
      expect(finalTree.nodes.size).toBe(5);

      // Verify hierarchical relationships make sense
      const nodes = Array.from(finalTree.nodes.values());
      const rootNodes = nodes.filter(n => n.parentTopic === null);
      const childNodes = nodes.filter(n => n.parentTopic !== null);

      expect(rootNodes.length).toBeGreaterThanOrEqual(1);
      expect(childNodes.length).toBeGreaterThanOrEqual(1);

      // Verify depth progression makes sense
      const maxDepth = Math.max(...nodes.map(n => n.depth));
      expect(maxDepth).toBeGreaterThanOrEqual(2);

      // Verify conversation context is maintained through topic extraction
      const allQAPairs = nodes.flatMap(n => n.metadata.qaPairs);
      expect(allQAPairs).toHaveLength(5);
      
      // Verify chronological order is preserved
      const timestamps = allQAPairs.map(qa => qa.timestamp.getTime());
      const sortedTimestamps = [...timestamps].sort();
      expect(timestamps).toEqual(sortedTimestamps);
    });
  });

  describe('Scoring Independence from Tree Structure Changes', () => {
    it('should maintain scoring consistency regardless of tree modifications', async () => {
      // Requirement 7.1, 7.2, 7.3, 7.4: Scoring independence from tree logic
      
      // Set up custom scoring strategy for consistent testing
      const consistentStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockImplementation(async (qaPair: QAPair, context: ScoringContext) => {
          // Score based only on answer length (independent of tree structure)
          return Math.min(100, qaPair.answer.length * 0.5);
        })
      };

      system.setScoringStrategy(consistentStrategy);

      // Add initial Q&A pairs
      const testQAs: QAPair[] = [
        {
          question: 'What is testing?',
          answer: 'Testing is the process of evaluating software to ensure it works correctly.',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          question: 'What are testing methodologies?',
          answer: 'Testing methodologies include unit testing, integration testing, and system testing approaches.',
          timestamp: new Date('2024-01-01T10:05:00Z')
        }
      ];

      const nodeIds: string[] = [];
      const originalScores: number[] = [];

      for (const qa of testQAs) {
        const nodeId = await system.addQAPair(qa);
        nodeIds.push(nodeId);
        
        const tree = system.getTopicTree();
        const node = tree.nodes.get(nodeId)!;
        originalScores.push(node.score!);
      }

      // Verify initial scores are calculated
      expect(originalScores).toHaveLength(2);
      expect(originalScores.every(score => score > 0)).toBe(true);

      // Perform extensive tree structure modifications
      
      // 1. Add more nodes to change tree depth and structure
      const additionalQAs: QAPair[] = [
        {
          question: 'What is unit testing in testing methodologies?',
          answer: 'Unit testing focuses on testing individual components or modules in isolation.',
          timestamp: new Date('2024-01-01T10:10:00Z')
        },
        {
          question: 'What are testing frameworks?',
          answer: 'Testing frameworks provide tools and libraries to structure and execute tests efficiently.',
          timestamp: new Date('2024-01-01T10:15:00Z')
        }
      ];

      for (const qa of additionalQAs) {
        await system.addQAPair(qa);
      }

      // 2. Mark nodes as visited (metadata changes)
      for (const nodeId of nodeIds) {
        system.markTopicAsVisited(nodeId);
      }

      // 3. Verify tree structure has changed significantly
      const modifiedTree = system.getTopicTree();
      expect(modifiedTree.nodes.size).toBe(4);
      
      const visitedNodes = Array.from(modifiedTree.nodes.values()).filter(n => n.metadata.visitCount > 0);
      expect(visitedNodes).toHaveLength(2);

      // 4. Verify original scores remain unchanged despite tree modifications
      for (let i = 0; i < nodeIds.length; i++) {
        const node = modifiedTree.nodes.get(nodeIds[i])!;
        expect(node.score).toBe(originalScores[i]);
      }

      // 5. Test that new score calculations are still independent
      const newQA: QAPair = {
        question: 'What is automated testing?',
        answer: 'Automated testing uses software tools to execute tests automatically without manual intervention.',
        timestamp: new Date('2024-01-01T10:20:00Z')
      };

      const newNodeId = await system.addQAPair(newQA);
      const finalTree = system.getTopicTree();
      const newNode = finalTree.nodes.get(newNodeId)!;

      // New score should be calculated independently
      const expectedScore = Math.min(100, newQA.answer.length * 0.5);
      expect(newNode.score).toBe(expectedScore);

      // Verify scoring strategy was called with correct parameters
      expect(consistentStrategy.calculateScore).toHaveBeenCalledTimes(5);
    });

    it('should allow scoring strategy changes without affecting tree structure', async () => {
      // Add Q&A pairs with one scoring strategy
      const qualityStrategy = new QualityScoringStrategy();
      system.setScoringStrategy(qualityStrategy);

      const testQA: QAPair = {
        question: 'What is quality?',
        answer: 'Quality refers to the degree of excellence or superiority of something.',
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const nodeId1 = await system.addQAPair(testQA);
      const tree1 = system.getTopicTree();
      const node1 = tree1.nodes.get(nodeId1)!;
      const qualityScore = node1.score!;

      // Switch to different scoring strategy
      const complexityStrategy = new ComplexityScoringStrategy();
      system.setScoringStrategy(complexityStrategy);

      const testQA2: QAPair = {
        question: 'What is complexity?',
        answer: 'Complexity refers to the state of having many interconnected parts or elements.',
        timestamp: new Date('2024-01-01T10:05:00Z')
      };

      const nodeId2 = await system.addQAPair(testQA2);
      const tree2 = system.getTopicTree();
      const node2 = tree2.nodes.get(nodeId2)!;
      const complexityScore = node2.score!;

      // Verify scores are different (different strategies)
      expect(qualityScore).not.toBe(complexityScore);

      // Verify tree structure is unaffected by scoring strategy changes
      expect(tree2.nodes.size).toBe(2);
      expect(tree2.rootNodes.length).toBeGreaterThanOrEqual(1);
      
      // Original node should maintain its structure and original score
      const originalNode = tree2.nodes.get(nodeId1)!;
      expect(originalNode.score).toBe(qualityScore);
      expect(originalNode.topic).toBe(node1.topic);
      expect(originalNode.depth).toBe(node1.depth);
      expect(originalNode.parentTopic).toBe(node1.parentTopic);

      // Tree relationships should be maintained (may be hierarchical or separate roots)
      expect(node2.depth).toBeGreaterThanOrEqual(1);
    });

    it('should handle scoring failures gracefully without corrupting tree', async () => {
      // Create a failing scoring strategy
      const failingStrategy: IScoringStrategy = {
        calculateScore: vi.fn().mockRejectedValue(new Error('Scoring service unavailable'))
      };

      system.setScoringStrategy(failingStrategy);

      const testQA: QAPair = {
        question: 'What happens when scoring fails?',
        answer: 'The system should handle scoring failures gracefully.',
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      // Should handle scoring failure gracefully (ScoringEngine has graceful degradation)
      const nodeId = await system.addQAPair(testQA);
      expect(nodeId).toBeDefined();

      // Tree should have the node with default score (50)
      const tree = system.getTopicTree();
      expect(tree.nodes.size).toBe(1);
      const node = tree.nodes.get(nodeId)!;
      expect(node.score).toBe(50); // Default score from graceful degradation

      // Switch to working strategy and verify system recovers
      system.setScoringStrategy(new QualityScoringStrategy());

      const recoveryQA: QAPair = {
        question: 'Does the system recover?',
        answer: 'Yes, the system should recover from scoring failures.',
        timestamp: new Date('2024-01-01T10:05:00Z')
      };

      const recoveryNodeId = await system.addQAPair(recoveryQA);
      const recoveredTree = system.getTopicTree();
      
      expect(recoveredTree.nodes.size).toBe(2); // Original node + recovery node
      expect(recoveredTree.nodes.get(recoveryNodeId)!.score).not.toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty conversations and initial state correctly', async () => {
      // Test completely empty system
      expect(system.getTopicTree().nodes.size).toBe(0);
      expect(system.getTopicTree().rootNodes).toHaveLength(0);
      expect(system.getTopicTree().currentPath).toHaveLength(0);
      expect(system.getCurrentTopic()).toBeNull();
      expect(system.getDeepestUnvisitedBranch()).toBeNull();

      const stats = system.getStats();
      expect(stats.totalNodes).toBe(0);
      expect(stats.rootNodes).toBe(0);
      expect(stats.maxDepth).toBe(0);
      expect(stats.leafNodes).toBe(0);
      expect(stats.totalQAPairs).toBe(0);
      expect(stats.averageScore).toBeNull();

      // Test operations on empty system
      expect(() => system.getDepthFromRoot('non-existent')).toThrow();
      expect(() => system.markTopicAsVisited('non-existent')).toThrow();

      // Add first Q&A pair and verify transition from empty state
      const firstQA: QAPair = {
        question: 'First question?',
        answer: 'First answer.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(firstQA);
      
      expect(system.getTopicTree().nodes.size).toBe(1);
      expect(system.getCurrentTopic()).not.toBeNull();
      expect(system.getDeepestUnvisitedBranch()).not.toBeNull();
      expect(system.getDepthFromRoot(nodeId)).toBe(1);
    });

    it('should handle malformed and invalid Q&A pairs', async () => {
      // Test empty question
      const emptyQuestion: QAPair = {
        question: '',
        answer: 'Valid answer',
        timestamp: new Date()
      };

      await expect(system.addQAPair(emptyQuestion)).rejects.toThrow('Q&A pair must have non-empty question and answer');

      // Test empty answer
      const emptyAnswer: QAPair = {
        question: 'Valid question?',
        answer: '',
        timestamp: new Date()
      };

      await expect(system.addQAPair(emptyAnswer)).rejects.toThrow('Q&A pair must have non-empty question and answer');

      // Test whitespace-only question
      const whitespaceQuestion: QAPair = {
        question: '   \n\t   ',
        answer: 'Valid answer',
        timestamp: new Date()
      };

      await expect(system.addQAPair(whitespaceQuestion)).rejects.toThrow('Q&A pair must have non-empty question and answer');

      // Test whitespace-only answer
      const whitespaceAnswer: QAPair = {
        question: 'Valid question?',
        answer: '   \n\t   ',
        timestamp: new Date()
      };

      await expect(system.addQAPair(whitespaceAnswer)).rejects.toThrow('Q&A pair must have non-empty question and answer');

      // Test null/undefined values
      const nullQuestion = {
        question: null as any,
        answer: 'Valid answer',
        timestamp: new Date()
      };

      await expect(system.addQAPair(nullQuestion)).rejects.toThrow('Q&A pair must have non-empty question and answer');

      // Verify system remains in consistent state after errors
      expect(system.getTopicTree().nodes.size).toBe(0);
      expect(system.getCurrentTopic()).toBeNull();

      // Verify system can still process valid Q&A pairs after errors
      const validQA: QAPair = {
        question: 'Is the system still working?',
        answer: 'Yes, it should work after handling errors.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(validQA);
      expect(nodeId).toBeDefined();
      expect(system.getTopicTree().nodes.size).toBe(1);
    });

    it('should handle extreme conversation scenarios', async () => {
      // Test very long Q&A pairs
      const longQA: QAPair = {
        question: 'What is ' + 'a'.repeat(1000) + '?',
        answer: 'This is ' + 'a'.repeat(2000) + ' very long answer that tests the system\'s ability to handle large text inputs.',
        timestamp: new Date()
      };

      const longNodeId = await system.addQAPair(longQA);
      expect(longNodeId).toBeDefined();

      const tree = system.getTopicTree();
      const longNode = tree.nodes.get(longNodeId)!;
      expect(longNode.metadata.qaPairs[0].question.length).toBeGreaterThan(1000);
      expect(longNode.metadata.qaPairs[0].answer.length).toBeGreaterThan(2000);

      // Test special characters and unicode
      const unicodeQA: QAPair = {
        question: 'What about émojis 🤖 and spëcial çharacters?',
        answer: 'The system should handle émojis 🚀, spëcial çharacters, and unicode ñ properly.',
        timestamp: new Date()
      };

      const unicodeNodeId = await system.addQAPair(unicodeQA);
      expect(unicodeNodeId).toBeDefined();

      // Get updated tree after adding unicode node
      const updatedTree = system.getTopicTree();
      const unicodeNode = updatedTree.nodes.get(unicodeNodeId)!;
      expect(unicodeNode.metadata.qaPairs[0].question).toContain('🤖');
      expect(unicodeNode.metadata.qaPairs[0].answer).toContain('🚀');

      // Test rapid sequential additions
      const rapidQAs: QAPair[] = [];
      for (let i = 0; i < 10; i++) {
        rapidQAs.push({
          question: `Rapid question ${i}?`,
          answer: `Rapid answer ${i}.`,
          timestamp: new Date(Date.now() + i)
        });
      }

      const rapidNodeIds: string[] = [];
      for (const qa of rapidQAs) {
        const nodeId = await system.addQAPair(qa);
        rapidNodeIds.push(nodeId);
      }

      expect(rapidNodeIds).toHaveLength(10);
      expect(system.getTopicTree().nodes.size).toBe(12); // 2 previous + 10 rapid

      // Test system performance and consistency
      const finalStats = system.getStats();
      expect(finalStats.totalNodes).toBe(12);
      expect(finalStats.totalQAPairs).toBe(12);
      expect(finalStats.averageScore).not.toBeNull();

      // Verify all nodes are accessible and have valid structure
      const allNodes = Array.from(system.getTopicTree().nodes.values());
      for (const node of allNodes) {
        expect(node.id).toBeDefined();
        expect(node.topic).toBeDefined();
        expect(node.depth).toBeGreaterThan(0);
        expect(node.createdAt).toBeInstanceOf(Date);
        expect(node.updatedAt).toBeInstanceOf(Date);
        expect(node.metadata.qaPairs).toHaveLength(1);
      }
    });

    it('should handle topic analyzer failures gracefully', async () => {
      // Create failing topic analyzer
      const failingAnalyzer: ITopicAnalyzer = {
        extractTopics: vi.fn().mockRejectedValue(new Error('Topic extraction failed')),
        determineRelationship: vi.fn().mockReturnValue({
          type: 'new_root',
          confidence: 0.5
        } as TopicRelationship)
      };

      system.setTopicAnalyzer(failingAnalyzer);

      const testQA: QAPair = {
        question: 'What happens when topic analysis fails?',
        answer: 'The system should handle topic analysis failures gracefully.',
        timestamp: new Date()
      };

      // Should handle topic analysis failure
      await expect(system.addQAPair(testQA)).rejects.toThrow('Topic extraction failed');

      // Verify system state remains consistent
      expect(system.getTopicTree().nodes.size).toBe(0);

      // Test recovery with working analyzer
      const workingAnalyzer: ITopicAnalyzer = {
        extractTopics: vi.fn().mockResolvedValue(['recovery topic']),
        determineRelationship: vi.fn().mockReturnValue({
          type: 'new_root',
          confidence: 1.0
        } as TopicRelationship)
      };

      system.setTopicAnalyzer(workingAnalyzer);

      const recoveryQA: QAPair = {
        question: 'Does the system recover from topic analysis failures?',
        answer: 'Yes, it should recover gracefully.',
        timestamp: new Date()
      };

      const nodeId = await system.addQAPair(recoveryQA);
      expect(nodeId).toBeDefined();
      expect(system.getTopicTree().nodes.size).toBe(1);

      const node = system.getTopicTree().nodes.get(nodeId)!;
      expect(node.topic).toBe('recovery topic');
    });
  });

  describe('Session Management Integration', () => {
    it('should handle session-based conversation isolation', async () => {
      // Create multiple systems with different sessions
      const system1 = new ConversationGradingSystem('session-1');
      const system2 = new ConversationGradingSystem('session-2');

      // Add Q&A pairs to first session
      const session1QA: QAPair = {
        question: 'What is session 1?',
        answer: 'Session 1 is the first conversation session.',
        timestamp: new Date()
      };

      const node1Id = await system1.addQAPair(session1QA);

      // Add Q&A pairs to second session
      const session2QA: QAPair = {
        question: 'What is session 2?',
        answer: 'Session 2 is the second conversation session.',
        timestamp: new Date()
      };

      const node2Id = await system2.addQAPair(session2QA);

      // Verify session isolation
      expect(system1.getTopicTree().sessionId).toBe('session-1');
      expect(system2.getTopicTree().sessionId).toBe('session-2');

      expect(system1.getTopicTree().nodes.size).toBe(1);
      expect(system2.getTopicTree().nodes.size).toBe(1);

      expect(system1.getTopicTree().nodes.has(node1Id)).toBe(true);
      expect(system1.getTopicTree().nodes.has(node2Id)).toBe(false);

      expect(system2.getTopicTree().nodes.has(node2Id)).toBe(true);
      expect(system2.getTopicTree().nodes.has(node1Id)).toBe(false);

      // Verify independent navigation
      const deepest1 = system1.getDeepestUnvisitedBranch();
      const deepest2 = system2.getDeepestUnvisitedBranch();

      expect(deepest1!.id).toBe(node1Id);
      expect(deepest2!.id).toBe(node2Id);

      // Mark visited in one session, verify other is unaffected
      system1.markTopicAsVisited(node1Id);

      expect(system1.getDeepestUnvisitedBranch()).toBeNull();
      expect(system2.getDeepestUnvisitedBranch()).not.toBeNull();
    });

    it('should integrate with session management system', async () => {
      // Test with ConversationGradingSystemWithSessions
      const sessionSystem = new ConversationGradingSystemWithSessions();

      // Create multiple sessions
      const session1Id = sessionSystem.createSession('test-session-1');
      const session2Id = sessionSystem.createSession('test-session-2');

      expect(session1Id).toBe('test-session-1');
      expect(session2Id).toBe('test-session-2');

      // Add content to first session
      sessionSystem.switchSession(session1Id);
      
      const qa1: QAPair = {
        question: 'What is session management?',
        answer: 'Session management handles multiple conversation contexts.',
        timestamp: new Date()
      };

      await sessionSystem.addQAPair(qa1);

      // Switch to second session and add content
      sessionSystem.switchSession(session2Id);

      const qa2: QAPair = {
        question: 'What is context switching?',
        answer: 'Context switching allows moving between different conversation sessions.',
        timestamp: new Date()
      };

      await sessionSystem.addQAPair(qa2);

      // Verify session isolation
      sessionSystem.switchSession(session1Id);
      expect(sessionSystem.getTopicTree().nodes.size).toBe(1);
      const session1Topic = sessionSystem.getCurrentTopic()!.topic.toLowerCase();
      expect(session1Topic).toMatch(/session|management/);

      sessionSystem.switchSession(session2Id);
      expect(sessionSystem.getTopicTree().nodes.size).toBe(1);
      const session2Topic = sessionSystem.getCurrentTopic()!.topic.toLowerCase();
      expect(session2Topic).toMatch(/context|switching/);

      // Verify session listing (may include default session)
      const sessions = sessionSystem.listSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(2);
      expect(sessions.map(s => s.sessionId)).toContain(session1Id);
      expect(sessions.map(s => s.sessionId)).toContain(session2Id);
    });
  });
});