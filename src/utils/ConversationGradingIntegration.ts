/**
 * Integration utilities for existing conversation systems
 * Provides helpers and adapters to integrate the ConversationGradingSystem
 * with various conversation platforms and frameworks
 */

import { 
  ConversationGradingSystem,
  ConversationGradingSystemWithSessions 
} from '../services';
import { 
  QAPair, 
  IScoringStrategy, 
  ITopicAnalyzer, 
  ScoringContext,
  TopicRelationship,
  TopicNode,
  ConversationTree
} from '../types/conversation-grading';

/**
 * Generic conversation message interface for integration
 */
export interface ConversationMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Configuration for conversation integration
 */
export interface IntegrationConfig {
  sessionId?: string;
  autoScore?: boolean;
  scoringStrategy?: IScoringStrategy;
  topicAnalyzer?: ITopicAnalyzer;
  enableSessions?: boolean;
  persistenceConfig?: {
    autoSave?: boolean;
    saveInterval?: number;
  };
}

/**
 * Result of processing a conversation
 */
export interface ProcessingResult {
  nodeId: string;
  topic: string;
  score: number | null;
  depth: number;
  isNewBranch: boolean;
  suggestions?: {
    nextQuestions?: string[];
    relatedTopics?: string[];
    deepestUnvisitedTopic?: string;
  };
}

/**
 * Main integration utility class
 */
export class ConversationGradingIntegration {
  private system: ConversationGradingSystem | ConversationGradingSystemWithSessions;
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig = {}) {
    this.config = {
      sessionId: 'default',
      autoScore: true,
      enableSessions: false,
      ...config
    };

    // Initialize appropriate system based on configuration
    if (this.config.enableSessions) {
      this.system = new ConversationGradingSystemWithSessions(
        this.config.persistenceConfig || {}
      );
    } else {
      this.system = new ConversationGradingSystem(this.config.sessionId);
    }

    // Apply custom strategies if provided
    if (this.config.scoringStrategy) {
      this.system.setScoringStrategy(this.config.scoringStrategy);
    }

    if (this.config.topicAnalyzer) {
      this.system.setTopicAnalyzer(this.config.topicAnalyzer);
    }
  }

  /**
   * Process a conversation from message pairs
   */
  async processConversation(messages: ConversationMessage[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const qaPairs = this.extractQAPairs(messages);

    for (const qaPair of qaPairs) {
      try {
        const result = await this.processQAPair(qaPair);
        results.push(result);
      } catch (error) {
        console.error('Error processing Q&A pair:', error);
        // Continue processing other pairs
      }
    }

    return results;
  }

  /**
   * Process a single Q&A pair and return detailed results
   */
  async processQAPair(qaPair: QAPair): Promise<ProcessingResult> {
    const treeBefore = this.system.getTopicTree();
    const nodeCountBefore = treeBefore.nodes.size;

    const nodeId = await this.system.addQAPair(
      qaPair, 
      this.config.autoScore ? undefined : null
    );

    const treeAfter = this.system.getTopicTree();
    const node = treeAfter.nodes.get(nodeId);

    if (!node) {
      throw new Error(`Failed to retrieve created node ${nodeId}`);
    }

    const isNewBranch = treeAfter.nodes.size > nodeCountBefore;
    const suggestions = await this.generateSuggestions(node, treeAfter);

    return {
      nodeId,
      topic: node.topic,
      score: node.score,
      depth: node.depth,
      isNewBranch,
      suggestions
    };
  }

  /**
   * Extract Q&A pairs from conversation messages
   */
  private extractQAPairs(messages: ConversationMessage[]): QAPair[] {
    const qaPairs: QAPair[] = [];
    
    for (let i = 0; i < messages.length - 1; i++) {
      const userMessage = messages[i];
      const assistantMessage = messages[i + 1];

      // Look for user question followed by assistant answer
      if (userMessage.role === 'user' && assistantMessage.role === 'assistant') {
        qaPairs.push({
          question: userMessage.content,
          answer: assistantMessage.content,
          timestamp: userMessage.timestamp || new Date(),
          metadata: {
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id,
            ...userMessage.metadata,
            ...assistantMessage.metadata
          }
        });
      }
    }

    return qaPairs;
  }

  /**
   * Generate suggestions for continuing the conversation
   */
  private async generateSuggestions(
    currentNode: TopicNode, 
    tree: ConversationTree
  ): Promise<ProcessingResult['suggestions']> {
    const suggestions: ProcessingResult['suggestions'] = {};

    // Find deepest unvisited topic
    const deepestUnvisited = this.system.getDeepestUnvisitedBranch();
    if (deepestUnvisited) {
      suggestions.deepestUnvisitedTopic = deepestUnvisited.topic;
    }

    // Generate related topics from siblings and children
    const relatedTopics: string[] = [];
    
    // Add sibling topics
    if (currentNode.parentTopic) {
      const parent = tree.nodes.get(currentNode.parentTopic);
      if (parent) {
        for (const siblingId of parent.children) {
          if (siblingId !== currentNode.id) {
            const sibling = tree.nodes.get(siblingId);
            if (sibling) {
              relatedTopics.push(sibling.topic);
            }
          }
        }
      }
    }

    // Add child topics
    for (const childId of currentNode.children) {
      const child = tree.nodes.get(childId);
      if (child) {
        relatedTopics.push(child.topic);
      }
    }

    if (relatedTopics.length > 0) {
      suggestions.relatedTopics = relatedTopics;
    }

    // Generate potential next questions based on topic
    suggestions.nextQuestions = this.generateNextQuestions(currentNode);

    return suggestions;
  }

  /**
   * Generate potential follow-up questions for a topic
   */
  private generateNextQuestions(node: TopicNode): string[] {
    const questions: string[] = [];
    const topic = node.topic.toLowerCase();

    // Generic follow-up patterns
    questions.push(`Can you provide more details about ${node.topic}?`);
    questions.push(`What are some examples of ${node.topic}?`);
    questions.push(`How does ${node.topic} work in practice?`);

    // Topic-specific questions based on common patterns
    if (topic.includes('machine learning') || topic.includes('ml')) {
      questions.push('What are the different types of machine learning algorithms?');
      questions.push('How do you evaluate machine learning models?');
    }

    if (topic.includes('neural network') || topic.includes('deep learning')) {
      questions.push('What are the different types of neural network architectures?');
      questions.push('How do you train neural networks effectively?');
    }

    if (topic.includes('programming') || topic.includes('code')) {
      questions.push('What are the best practices for this approach?');
      questions.push('Can you show an example implementation?');
    }

    // Limit to most relevant questions
    return questions.slice(0, 3);
  }

  /**
   * Get conversation analytics and insights
   */
  getAnalytics(): {
    stats: ReturnType<ConversationGradingSystem['getStats']>;
    insights: {
      mostDiscussedTopics: Array<{ topic: string; qaPairCount: number }>;
      averageDepthByTopic: Array<{ topic: string; averageDepth: number }>;
      highestScoredTopics: Array<{ topic: string; score: number }>;
      conversationFlow: Array<{ from: string; to: string; relationship: string }>;
    };
  } {
    const stats = this.system.getStats();
    const tree = this.system.getTopicTree();
    
    // Calculate insights
    const topicStats = new Map<string, { qaPairCount: number; totalDepth: number; scores: number[] }>();
    const conversationFlow: Array<{ from: string; to: string; relationship: string }> = [];

    for (const [nodeId, node] of tree.nodes) {
      // Topic statistics
      const existing = topicStats.get(node.topic) || { qaPairCount: 0, totalDepth: 0, scores: [] };
      existing.qaPairCount += node.metadata.qaPairs.length;
      existing.totalDepth += node.depth;
      if (node.score !== null) {
        existing.scores.push(node.score);
      }
      topicStats.set(node.topic, existing);

      // Conversation flow
      if (node.parentTopic) {
        const parent = tree.nodes.get(node.parentTopic);
        if (parent) {
          conversationFlow.push({
            from: parent.topic,
            to: node.topic,
            relationship: 'child_of'
          });
        }
      }
    }

    // Generate insights
    const mostDiscussedTopics = Array.from(topicStats.entries())
      .map(([topic, stats]) => ({ topic, qaPairCount: stats.qaPairCount }))
      .sort((a, b) => b.qaPairCount - a.qaPairCount)
      .slice(0, 5);

    const averageDepthByTopic = Array.from(topicStats.entries())
      .map(([topic, stats]) => ({ 
        topic, 
        averageDepth: stats.totalDepth / Math.max(1, stats.qaPairCount) 
      }))
      .sort((a, b) => b.averageDepth - a.averageDepth)
      .slice(0, 5);

    const highestScoredTopics = Array.from(topicStats.entries())
      .filter(([, stats]) => stats.scores.length > 0)
      .map(([topic, stats]) => ({ 
        topic, 
        score: stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length 
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      stats,
      insights: {
        mostDiscussedTopics,
        averageDepthByTopic,
        highestScoredTopics,
        conversationFlow
      }
    };
  }

  /**
   * Export conversation data for external analysis
   */
  exportConversationData(): {
    tree: ConversationTree;
    qaPairs: QAPair[];
    topicHierarchy: Array<{
      id: string;
      topic: string;
      parentId: string | null;
      depth: number;
      children: string[];
    }>;
  } {
    const tree = this.system.getTopicTree();
    const qaPairs: QAPair[] = [];
    const topicHierarchy: Array<{
      id: string;
      topic: string;
      parentId: string | null;
      depth: number;
      children: string[];
    }> = [];

    for (const [nodeId, node] of tree.nodes) {
      // Collect all Q&A pairs
      qaPairs.push(...node.metadata.qaPairs);

      // Build topic hierarchy
      topicHierarchy.push({
        id: nodeId,
        topic: node.topic,
        parentId: node.parentTopic,
        depth: node.depth,
        children: [...node.children]
      });
    }

    // Sort Q&A pairs by timestamp
    qaPairs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      tree,
      qaPairs,
      topicHierarchy
    };
  }

  /**
   * Reset the conversation system
   */
  reset(): void {
    this.system.clear();
  }

  /**
   * Get the underlying system instance for advanced usage
   */
  getSystem(): ConversationGradingSystem | ConversationGradingSystemWithSessions {
    return this.system;
  }
}

/**
 * Factory function for creating integration instances
 */
export function createConversationGradingIntegration(
  config?: IntegrationConfig
): ConversationGradingIntegration {
  return new ConversationGradingIntegration(config);
}

/**
 * Utility function to convert chat messages to Q&A pairs
 */
export function convertChatMessagesToQAPairs(messages: ConversationMessage[]): QAPair[] {
  const integration = new ConversationGradingIntegration();
  return (integration as any).extractQAPairs(messages);
}

/**
 * Utility function to create a simple scoring strategy
 */
export function createSimpleScoringStrategy(
  scoreFunction: (qaPair: QAPair, context: ScoringContext) => number
): IScoringStrategy {
  return {
    async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
      return scoreFunction(qaPair, context);
    }
  };
}

/**
 * Utility function to create a simple topic analyzer
 */
export function createSimpleTopicAnalyzer(
  extractFunction: (qaPair: QAPair) => string[],
  relationshipFunction?: (topic: string, existingNodes: TopicNode[]) => TopicRelationship
): ITopicAnalyzer {
  return {
    async extractTopics(qaPair: QAPair): Promise<string[]> {
      return extractFunction(qaPair);
    },
    determineRelationship(topic: string, existingNodes: TopicNode[]): TopicRelationship {
      if (relationshipFunction) {
        return relationshipFunction(topic, existingNodes);
      }
      
      // Default relationship logic
      if (existingNodes.length === 0) {
        return { type: 'new_root', confidence: 1.0 };
      }
      
      // Simple similarity check
      const similarNode = existingNodes.find(node => 
        node.topic.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(node.topic.toLowerCase())
      );
      
      if (similarNode) {
        return { 
          type: 'child_of', 
          parentNodeId: similarNode.id, 
          confidence: 0.7 
        };
      }
      
      return { type: 'new_root', confidence: 0.6 };
    }
  };
}