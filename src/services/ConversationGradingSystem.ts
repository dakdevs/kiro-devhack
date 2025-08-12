/**
 * ConversationGradingSystem - Main system class integrating all components
 * Provides the primary API for processing Q&A pairs and managing conversation trees
 */

import { 
  IConversationGradingSystem, 
  QAPair, 
  ConversationTree, 
  TopicNode as ITopicNode,
  IScoringStrategy,
  ITopicAnalyzer,
  ScoringContext
} from '../types/conversation-grading';
import { TopicTreeManager } from './TopicTreeManager';
import { ScoringEngine } from './ScoringEngine';
import { TopicAnalyzer } from './TopicAnalyzer';
import { TopicNode } from './TopicNode';
import { ValidationUtils, ValidationError, TreeIntegrityError, ScoringError } from './ValidationUtils';

export class ConversationGradingSystem implements IConversationGradingSystem {
  private treeManager: TopicTreeManager;
  private scoringEngine: ScoringEngine;
  private topicAnalyzer: TopicAnalyzer;
  private readonly maxTreeDepth: number = 50;
  private readonly maxTreeSize: number = 10000;

  constructor(sessionId: string = 'default') {
    try {
      ValidationUtils.validateSessionId(sessionId);
      this.treeManager = new TopicTreeManager(sessionId);
      this.scoringEngine = new ScoringEngine();
      this.topicAnalyzer = new TopicAnalyzer();
    } catch (error) {
      throw new ValidationError(
        `Failed to initialize ConversationGradingSystem: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
        'sessionId',
        sessionId
      );
    }
  }

  /**
   * Add a Q&A pair to the conversation tree with complete processing pipeline
   * Requirements: 1.1, 6.1, 6.3, 6.4, 6.5, 6.6
   */
  async addQAPair(qaPair: QAPair, score?: number): Promise<string> {
    try {
      // Comprehensive input validation
      ValidationUtils.validateQAPair(qaPair);
      if (score !== undefined) {
        ValidationUtils.validateScore(score);
      }

      // Security checks
      ValidationUtils.checkSecurityConstraints(qaPair.question);
      ValidationUtils.checkSecurityConstraints(qaPair.answer);

      // Sanitize input
      const sanitizedQAPair = ValidationUtils.sanitizeQAPair(qaPair);

      // Check tree size constraints
      const currentTree = this.treeManager.getTree();
      ValidationUtils.validateTreeSize(currentTree.nodes.size + 1, this.maxTreeSize);

      // Validate tree integrity before processing
      ValidationUtils.validateTreeIntegrity(currentTree);

      // Extract topics from the Q&A pair with error handling
      let topics: string[];
      let primaryTopic: string;
      
      try {
        topics = await this.topicAnalyzer.extractTopics(sanitizedQAPair);
        if (!topics || topics.length === 0) {
          throw new Error('No topics extracted from Q&A pair');
        }
        primaryTopic = topics[0];
        ValidationUtils.validateTopicName(primaryTopic);
      } catch (error) {
        // Graceful degradation: use fallback topic extraction
        console.warn('Topic analysis failed, using fallback:', ValidationUtils.createSafeErrorMessage(error as Error));
        primaryTopic = this.extractFallbackTopic(sanitizedQAPair);
      }

      // Get existing nodes for relationship analysis
      const existingNodes = Array.from(this.treeManager.getTree().nodes.values());
      
      // Determine relationship with existing topics with error handling
      let relationship;
      try {
        relationship = this.topicAnalyzer.determineRelationship(primaryTopic, existingNodes);
      } catch (error) {
        // Graceful degradation: default to new root
        console.warn('Relationship analysis failed, defaulting to new root:', ValidationUtils.createSafeErrorMessage(error as Error));
        relationship = {
          type: 'new_root' as const,
          confidence: 0.5
        };
      }

      // Create new topic node with validation
      const nodeId = this.generateNodeId();
      let parentTopic: string | null = null;

      // Determine parent based on relationship type
      switch (relationship.type) {
        case 'child_of':
        case 'continuation':
          parentTopic = relationship.parentNodeId || null;
          break;
        case 'sibling_of':
          parentTopic = relationship.parentNodeId || null;
          break;
        case 'new_root':
          parentTopic = null;
          break;
      }

      // Validate parent exists if specified
      if (parentTopic) {
        const parentNode = this.treeManager.getNode(parentTopic);
        if (!parentNode) {
          console.warn(`Specified parent ${parentTopic} not found, creating as root node`);
          parentTopic = null;
        } else {
          // Check depth constraints
          const newDepth = parentNode.depth + 1;
          ValidationUtils.validateTreeDepth(newDepth, this.maxTreeDepth);
        }
      }

      // If no specific parent was determined but we have existing nodes,
      // and the relationship suggests it could be related, use the current topic as parent
      // Only do this if the relationship type suggests a hierarchical connection
      if (!parentTopic && existingNodes.length > 0 && 
          (relationship.type === 'child_of' || relationship.type === 'continuation') &&
          relationship.confidence > 0.4) {
        const currentTopic = this.treeManager.getCurrentTopic();
        if (currentTopic) {
          const newDepth = currentTopic.depth + 1;
          if (newDepth <= this.maxTreeDepth) {
            parentTopic = currentTopic.id;
          }
        } else {
          // Use the most recently updated node as potential parent
          const mostRecentNode = existingNodes.reduce((latest, current) => 
            current.updatedAt > latest.updatedAt ? current : latest
          );
          const newDepth = mostRecentNode.depth + 1;
          if (newDepth <= this.maxTreeDepth) {
            parentTopic = mostRecentNode.id;
          }
        }
      }

      // Calculate score if not provided with error handling
      let finalScore = score;
      if (finalScore === undefined) {
        try {
          const currentTopic = parentTopic ? this.treeManager.getNode(parentTopic) : null;
          if (currentTopic) {
            const context: ScoringContext = {
              currentTopic,
              conversationHistory: this.getConversationHistory(),
              topicDepth: currentTopic.depth + 1
            };
            ValidationUtils.validateScoringContext(context);
            finalScore = await this.scoringEngine.calculateScore(sanitizedQAPair, context);
          } else {
            // For root nodes, use minimal context
            const context: ScoringContext = {
              currentTopic: {
                id: 'temp',
                topic: primaryTopic,
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
              },
              conversationHistory: this.getConversationHistory(),
              topicDepth: 1
            };
            ValidationUtils.validateScoringContext(context);
            finalScore = await this.scoringEngine.calculateScore(sanitizedQAPair, context);
          }
        } catch (error) {
          // Graceful degradation for scoring failures
          console.warn('Scoring failed, using default score:', ValidationUtils.createSafeErrorMessage(error as Error));
          finalScore = this.calculateFallbackScore(sanitizedQAPair, parentTopic ? this.treeManager.getNode(parentTopic)?.depth || 1 : 1);
        }
      }

      // Create the topic node with validation
      const topicNode = new TopicNode(
        nodeId,
        primaryTopic,
        parentTopic,
        finalScore
      );

      // Add the Q&A pair to the node
      topicNode.addQAPair(sanitizedQAPair);

      // Add node to tree with error handling
      try {
        this.treeManager.addNode(topicNode);
      } catch (error) {
        throw new TreeIntegrityError(
          `Failed to add node to tree: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
          nodeId
        );
      }

      // Update current path to include this node with error handling
      try {
        const currentPath = this.treeManager.getCurrentPath();
        if (parentTopic && currentPath.includes(parentTopic)) {
          // Extend current path
          const parentIndex = currentPath.indexOf(parentTopic);
          const newPath = [...currentPath.slice(0, parentIndex + 1), nodeId];
          this.treeManager.setCurrentPath(newPath);
        } else if (!parentTopic) {
          // New root node becomes current path
          this.treeManager.setCurrentPath([nodeId]);
        } else {
          // Build path from root to new node
          const pathToParent = this.buildPathToNode(parentTopic);
          this.treeManager.setCurrentPath([...pathToParent, nodeId]);
        }
      } catch (error) {
        // Path update failure shouldn't prevent node creation
        console.warn('Failed to update current path:', ValidationUtils.createSafeErrorMessage(error as Error));
      }

      // Final integrity check
      try {
        const updatedTree = this.treeManager.getTree();
        ValidationUtils.validateTreeIntegrity(updatedTree);
      } catch (error) {
        // If integrity is compromised, remove the node and throw error
        try {
          this.treeManager.removeNode(nodeId);
        } catch (removeError) {
          console.error('Failed to remove corrupted node:', ValidationUtils.createSafeErrorMessage(removeError as Error));
        }
        throw new TreeIntegrityError(
          `Tree integrity compromised after adding node: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
          nodeId
        );
      }

      return nodeId;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof TreeIntegrityError || error instanceof ScoringError) {
        throw error;
      }
      throw new Error(`Failed to add Q&A pair: ${ValidationUtils.createSafeErrorMessage(error as Error)}`);
    }
  }

  /**
   * Get the complete topic tree structure
   * Requirements: 6.5
   */
  getTopicTree(): ConversationTree {
    try {
      const tree = this.treeManager.getTree();
      ValidationUtils.validateTreeIntegrity(tree);
      return tree;
    } catch (error) {
      if (error instanceof TreeIntegrityError) {
        // Log the integrity issue but still return the tree for inspection
        console.error('Tree integrity issue detected:', ValidationUtils.createSafeErrorMessage(error));
      }
      // Return the tree even if there are integrity issues for debugging
      return this.treeManager.getTree();
    }
  }

  /**
   * Calculate depth from root for a given node
   * Requirements: 6.4
   */
  getDepthFromRoot(nodeId: string): number {
    try {
      ValidationUtils.validateNodeId(nodeId);
      const depth = this.treeManager.getDepthFromRoot(nodeId);
      if (depth < 1) {
        throw new ValidationError(`Invalid depth ${depth} for node ${nodeId}`, 'depth', depth);
      }
      return depth;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to get depth for node ${nodeId}: ${ValidationUtils.createSafeErrorMessage(error as Error)}`);
    }
  }

  /**
   * Get the deepest unvisited branch for continued conversation
   * Requirements: 6.4
   */
  getDeepestUnvisitedBranch(): ITopicNode | null {
    return this.treeManager.getDeepestUnvisitedBranch();
  }

  /**
   * Get the current topic (last node in current path)
   * Requirements: 6.5
   */
  getCurrentTopic(): ITopicNode | null {
    const currentTopic = this.treeManager.getCurrentTopic();
    return currentTopic ? currentTopic.toPlainObject() : null;
  }

  /**
   * Mark a topic as visited to exclude it from future deepest branch queries
   * Requirements: 6.5
   */
  markTopicAsVisited(nodeId: string): void {
    try {
      ValidationUtils.validateNodeId(nodeId);
      const node = this.treeManager.getNode(nodeId);
      if (!node) {
        throw new ValidationError(`Node with ID ${nodeId} not found`, 'nodeId', nodeId);
      }

      node.markAsVisited();
      this.treeManager.updateNode(nodeId, {
        metadata: node.metadata,
        updatedAt: new Date()
      });

      // Verify the update was successful
      const updatedNode = this.treeManager.getNode(nodeId);
      if (!updatedNode || updatedNode.metadata.visitCount === 0) {
        throw new TreeIntegrityError(`Failed to mark node ${nodeId} as visited`, nodeId);
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof TreeIntegrityError) {
        throw error;
      }
      throw new Error(`Failed to mark topic as visited: ${ValidationUtils.createSafeErrorMessage(error as Error)}`);
    }
  }

  /**
   * Set the scoring strategy for Q&A pair evaluation
   * Requirements: 6.6
   */
  setScoringStrategy(strategy: IScoringStrategy): void {
    try {
      if (!strategy || typeof strategy.calculateScore !== 'function') {
        throw new ValidationError('Scoring strategy must implement calculateScore method', 'strategy', strategy);
      }
      this.scoringEngine.setStrategy(strategy);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to set scoring strategy: ${ValidationUtils.createSafeErrorMessage(error as Error)}`);
    }
  }

  /**
   * Set the topic analyzer for topic extraction and relationship detection
   * Requirements: 6.6
   */
  setTopicAnalyzer(analyzer: ITopicAnalyzer): void {
    try {
      if (!analyzer || 
          typeof analyzer.extractTopics !== 'function' || 
          typeof analyzer.determineRelationship !== 'function') {
        throw new ValidationError('Topic analyzer must implement extractTopics and determineRelationship methods', 'analyzer', analyzer);
      }
      this.topicAnalyzer = analyzer;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to set topic analyzer: ${ValidationUtils.createSafeErrorMessage(error as Error)}`);
    }
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    totalNodes: number;
    rootNodes: number;
    maxDepth: number;
    leafNodes: number;
    totalQAPairs: number;
    averageScore: number | null;
  } {
    const treeStats = this.treeManager.getStats();
    const tree = this.treeManager.getTree();
    
    let totalQAPairs = 0;
    let totalScore = 0;
    let scoredNodes = 0;

    for (const [, node] of tree.nodes) {
      totalQAPairs += node.metadata.qaPairs.length;
      if (node.score !== null) {
        totalScore += node.score;
        scoredNodes++;
      }
    }

    return {
      ...treeStats,
      totalQAPairs,
      averageScore: scoredNodes > 0 ? totalScore / scoredNodes : null
    };
  }

  /**
   * Clear the conversation tree (useful for testing or reset)
   */
  clear(): void {
    this.treeManager.clear();
  }

  /**
   * Get all Q&A pairs from the conversation history
   */
  private getConversationHistory(): QAPair[] {
    const tree = this.treeManager.getTree();
    const allQAPairs: QAPair[] = [];

    for (const [, node] of tree.nodes) {
      allQAPairs.push(...node.metadata.qaPairs);
    }

    // Sort by timestamp
    return allQAPairs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build path from root to a given node
   */
  private buildPathToNode(nodeId: string): string[] {
    try {
      ValidationUtils.validateNodeId(nodeId);
      const node = this.treeManager.getNode(nodeId);
      if (!node) {
        throw new ValidationError(`Node with ID ${nodeId} not found`, 'nodeId', nodeId);
      }

      const path: string[] = [];
      let currentNode: TopicNode | null = node;
      const visited = new Set<string>();

      while (currentNode) {
        // Prevent infinite loops
        if (visited.has(currentNode.id)) {
          throw new TreeIntegrityError(`Circular reference detected in path to node ${nodeId}`, currentNode.id);
        }
        visited.add(currentNode.id);

        path.unshift(currentNode.id);
        currentNode = currentNode.getParent();
      }

      return path;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof TreeIntegrityError) {
        throw error;
      }
      throw new Error(`Failed to build path to node ${nodeId}: ${ValidationUtils.createSafeErrorMessage(error as Error)}`);
    }
  }

  /**
   * Extract fallback topic when primary topic analysis fails
   */
  private extractFallbackTopic(qaPair: QAPair): string {
    try {
      // Simple fallback: use first few words of question
      const words = qaPair.question.trim().split(/\s+/).slice(0, 3);
      const topic = words.join(' ').toLowerCase();
      
      if (topic.length === 0) {
        return 'general discussion';
      }
      
      // Ensure topic meets validation requirements
      ValidationUtils.validateTopicName(topic);
      return topic;
    } catch (error) {
      // Ultimate fallback
      return 'conversation topic';
    }
  }

  /**
   * Calculate fallback score when primary scoring fails
   */
  private calculateFallbackScore(qaPair: QAPair, depth: number): number {
    try {
      // Simple scoring based on answer length and depth
      const answerLength = qaPair.answer.length;
      const baseScore = Math.min(100, Math.max(10, answerLength / 10));
      const depthAdjustment = Math.max(0.5, 1 - (depth - 1) * 0.1);
      const finalScore = Math.round(baseScore * depthAdjustment);
      
      ValidationUtils.validateScore(finalScore);
      return finalScore;
    } catch (error) {
      // Ultimate fallback score
      return 50;
    }
  }}
