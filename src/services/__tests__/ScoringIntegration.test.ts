/**
 * Integration tests demonstrating the scoring system with strategy pattern
 * Shows how different strategies can be plugged in and used independently of tree operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine, BaseScoringStrategy } from '../ScoringEngine';
import { QualityScoringStrategy, ComplexityScoringStrategy } from '../ScoringStrategies';
import { TopicNode } from '../TopicNode';
import { QAPair, ScoringContext } from '../../types/conversation-grading';

describe('Scoring System Integration', () => {
  let scoringEngine: ScoringEngine;
  let topicNode: TopicNode;
  let qaPairs: QAPair[];

  beforeEach(() => {
    scoringEngine = new ScoringEngine();
    topicNode = new TopicNode('root', 'Programming Concepts');
    
    qaPairs = [
      {
        question: 'What is a variable?',
        answer: 'A variable is a storage location with a name.',
        timestamp: new Date()
      },
      {
        question: 'Why use functions?',
        answer: 'Functions are used because they provide reusability and modularity. For example, you can define a function once and call it multiple times.',
        timestamp: new Date()
      },
      {
        question: 'What is OOP?',
        answer: 'Object-oriented programming is a programming paradigm that uses objects and classes to structure code.',
        timestamp: new Date()
      }
    ];
  });

  describe('Strategy Pattern Implementation', () => {
    it('should allow switching between different scoring strategies', async () => {
      const context: ScoringContext = {
        currentTopic: topicNode.toPlainObject(),
        conversationHistory: qaPairs,
        topicDepth: 2
      };

      // Test with default strategy
      const defaultScore = await scoringEngine.calculateScore(qaPairs[1], context);
      
      // Switch to quality strategy
      scoringEngine.setStrategy(new QualityScoringStrategy());
      const qualityScore = await scoringEngine.calculateScore(qaPairs[1], context);
      
      // Switch to complexity strategy
      scoringEngine.setStrategy(new ComplexityScoringStrategy());
      const complexityScore = await scoringEngine.calculateScore(qaPairs[1], context);
      
      // Scores should be different with different strategies
      expect(defaultScore).not.toBe(qualityScore);
      expect(qualityScore).not.toBe(complexityScore);
      expect(defaultScore).not.toBe(complexityScore);
    });

    it('should maintain strategy independence from tree structure', async () => {
      const qualityStrategy = new QualityScoringStrategy();
      scoringEngine.setStrategy(qualityStrategy);
      
      const context: ScoringContext = {
        currentTopic: topicNode.toPlainObject(),
        conversationHistory: qaPairs,
        topicDepth: 2
      };

      const initialScore = await scoringEngine.calculateScore(qaPairs[1], context);
      
      // Modify tree structure extensively
      const child1 = new TopicNode('child1', 'Variables');
      const child2 = new TopicNode('child2', 'Functions');
      const grandchild = new TopicNode('grandchild', 'Function Parameters');
      
      topicNode.addChild(child1);
      topicNode.addChild(child2);
      child2.addChild(grandchild);
      
      // Update scores on nodes
      topicNode.updateScore(85);
      child1.updateScore(90);
      child2.updateScore(75);
      
      // Add metadata
      topicNode.markAsVisited();
      child1.markAsExhausted();
      
      // Scoring should remain consistent
      const scoreAfterTreeChanges = await scoringEngine.calculateScore(qaPairs[1], context);
      expect(scoreAfterTreeChanges).toBe(initialScore);
    });
  });

  describe('Score Storage and Retrieval', () => {
    it('should store and retrieve scores independently of scoring calculations', async () => {
      const context: ScoringContext = {
        currentTopic: topicNode.toPlainObject(),
        conversationHistory: qaPairs,
        topicDepth: 1
      };

      // Calculate a score using the engine
      const calculatedScore = await scoringEngine.calculateScore(qaPairs[0], context);
      
      // Store a different score on the node
      topicNode.updateScore(95);
      
      // The stored score should be independent of calculated score
      expect(topicNode.getScore()).toBe(95);
      expect(topicNode.getScore()).not.toBe(calculatedScore);
      
      // Calculating again should give the same result (not affected by stored score)
      const recalculatedScore = await scoringEngine.calculateScore(qaPairs[0], context);
      expect(recalculatedScore).toBe(calculatedScore);
    });

    it('should handle score operations independently of tree operations', () => {
      // Initial state
      expect(topicNode.hasScore()).toBe(false);
      expect(topicNode.getScore()).toBeNull();
      
      // Add children and modify tree
      const child = new TopicNode('child', 'Child Topic');
      topicNode.addChild(child);
      
      // Score operations should work independently
      topicNode.updateScore(80);
      expect(topicNode.hasScore()).toBe(true);
      expect(topicNode.getScore()).toBe(80);
      
      // Tree operations should not affect score
      const grandchild = new TopicNode('grandchild', 'Grandchild Topic');
      child.addChild(grandchild);
      
      expect(topicNode.getScore()).toBe(80);
      
      // Clear score
      topicNode.clearScore();
      expect(topicNode.hasScore()).toBe(false);
      expect(topicNode.getScore()).toBeNull();
      
      // Tree structure should remain intact
      expect(topicNode.getChildren()).toHaveLength(1);
      expect(child.getChildren()).toHaveLength(1);
    });
  });

  describe('End-to-End Scoring Workflow', () => {
    it('should demonstrate complete scoring workflow with multiple strategies', async () => {
      // Create a conversation tree
      const variablesNode = new TopicNode('variables', 'Variables');
      const functionsNode = new TopicNode('functions', 'Functions');
      
      topicNode.addChild(variablesNode);
      topicNode.addChild(functionsNode);
      
      // Create contexts for different depths
      const rootContext: ScoringContext = {
        currentTopic: topicNode.toPlainObject(),
        conversationHistory: qaPairs.slice(0, 1),
        topicDepth: 1
      };
      
      const childContext: ScoringContext = {
        currentTopic: functionsNode.toPlainObject(),
        conversationHistory: qaPairs.slice(0, 2),
        topicDepth: 2
      };
      
      // Test with different strategies
      const strategies = [
        { name: 'Base', strategy: new BaseScoringStrategy() },
        { name: 'Quality', strategy: new QualityScoringStrategy() },
        { name: 'Complexity', strategy: new ComplexityScoringStrategy() }
      ];
      
      const results: Record<string, { root: number; child: number }> = {};
      
      for (const { name, strategy } of strategies) {
        scoringEngine.setStrategy(strategy);
        
        const rootScore = await scoringEngine.calculateScore(qaPairs[0], rootContext);
        const childScore = await scoringEngine.calculateScore(qaPairs[1], childContext);
        
        results[name] = { root: rootScore, child: childScore };
        
        // Store scores on nodes
        topicNode.updateScore(rootScore);
        functionsNode.updateScore(childScore);
      }
      
      // Verify that different strategies produce different results
      expect(results.Base.root).not.toBe(results.Quality.root);
      expect(results.Quality.child).not.toBe(results.Complexity.child);
      
      // Verify that scores are stored correctly
      expect(topicNode.hasScore()).toBe(true);
      expect(functionsNode.hasScore()).toBe(true);
      
      // Verify tree structure is maintained
      expect(topicNode.getChildren()).toHaveLength(2);
      expect(functionsNode.getParent()).toBe(topicNode);
    });
  });
});