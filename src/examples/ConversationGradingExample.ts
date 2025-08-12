/**
 * Example implementation showing system usage
 * Demonstrates how to use the ConversationGradingSystem in various scenarios
 */

import { ConversationGradingSystem } from '../services/ConversationGradingSystem';
import { ConversationGradingSystemWithSessions } from '../services/ConversationGradingSystemWithSessions';
import { InMemoryPersistenceAdapter } from '../services/InMemoryPersistenceAdapter';
import { QAPair, IScoringStrategy, ScoringContext } from '../types/conversation-grading';

/**
 * Basic usage example - Simple conversation processing
 */
export class BasicUsageExample {
  private system: ConversationGradingSystem;

  constructor() {
    this.system = new ConversationGradingSystem('example-session');
  }

  async runExample(): Promise<void> {
    console.log('=== Basic Usage Example ===');

    // Example 1: Add Q&A pairs and build a conversation tree
    const qaPairs: QAPair[] = [
      {
        question: "What is machine learning?",
        answer: "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.",
        timestamp: new Date(),
        metadata: { difficulty: 'beginner', category: 'AI' }
      },
      {
        question: "What are the main types of machine learning?",
        answer: "The main types are supervised learning, unsupervised learning, and reinforcement learning.",
        timestamp: new Date(),
        metadata: { difficulty: 'intermediate', category: 'AI' }
      },
      {
        question: "Can you explain supervised learning?",
        answer: "Supervised learning uses labeled training data to learn a mapping from inputs to outputs, like classification and regression tasks.",
        timestamp: new Date(),
        metadata: { difficulty: 'intermediate', category: 'AI' }
      },
      {
        question: "What is a neural network?",
        answer: "A neural network is a computing system inspired by biological neural networks, consisting of interconnected nodes that process information.",
        timestamp: new Date(),
        metadata: { difficulty: 'intermediate', category: 'AI' }
      }
    ];

    // Process each Q&A pair
    for (const qaPair of qaPairs) {
      try {
        const nodeId = await this.system.addQAPair(qaPair);
        console.log(`Added Q&A pair to node: ${nodeId}`);
        console.log(`Question: ${qaPair.question}`);
        console.log(`Current tree depth: ${this.system.getDepthFromRoot(nodeId)}`);
        console.log('---');
      } catch (error) {
        console.error('Error adding Q&A pair:', error);
      }
    }

    // Display tree structure
    this.displayTreeStructure();

    // Find deepest unvisited branch
    const deepestBranch = this.system.getDeepestUnvisitedBranch();
    if (deepestBranch) {
      console.log(`Deepest unvisited branch: ${deepestBranch.topic} (depth: ${deepestBranch.depth})`);
    }

    // Get conversation statistics
    const stats = this.system.getStats();
    console.log('Conversation Statistics:', stats);
  }

  private displayTreeStructure(): void {
    console.log('\n=== Tree Structure ===');
    const tree = this.system.getTopicTree();
    
    // Display root nodes and their children
    for (const rootId of tree.rootNodes) {
      this.displayNode(rootId, 0);
    }
    console.log('');
  }

  private displayNode(nodeId: string, indent: number): void {
    const tree = this.system.getTopicTree();
    const node = tree.nodes.get(nodeId);
    if (!node) return;

    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}- ${node.topic} (depth: ${node.depth}, score: ${node.score})`);
    
    // Display children
    for (const childId of node.children) {
      this.displayNode(childId, indent + 1);
    }
  }
}

/**
 * Advanced usage example - Custom scoring and topic analysis
 */
export class AdvancedUsageExample {
  private system: ConversationGradingSystem;

  constructor() {
    this.system = new ConversationGradingSystem('advanced-example');
    this.setupCustomStrategies();
  }

  private setupCustomStrategies(): void {
    // Custom scoring strategy based on answer quality
    const customScoringStrategy: IScoringStrategy = {
      async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
        let score = 50; // Base score

        // Score based on answer length (more detailed = higher score)
        const answerLength = qaPair.answer.length;
        if (answerLength > 200) score += 20;
        else if (answerLength > 100) score += 10;

        // Score based on depth (deeper topics get bonus)
        if (context.topicDepth > 2) score += 15;
        else if (context.topicDepth > 1) score += 5;

        // Score based on metadata
        if (qaPair.metadata?.difficulty === 'advanced') score += 25;
        else if (qaPair.metadata?.difficulty === 'intermediate') score += 15;

        // Ensure score is within valid range
        return Math.max(0, Math.min(100, score));
      }
    };

    this.system.setScoringStrategy(customScoringStrategy);
  }

  async runExample(): Promise<void> {
    console.log('\n=== Advanced Usage Example ===');

    // Complex conversation with branching topics
    const conversations = [
      // Main AI topic
      {
        question: "What is artificial intelligence?",
        answer: "Artificial intelligence is the simulation of human intelligence in machines that are programmed to think and learn like humans.",
        metadata: { difficulty: 'beginner', category: 'AI', importance: 'high' }
      },
      // Branch into machine learning
      {
        question: "How does machine learning relate to AI?",
        answer: "Machine learning is a subset of AI that focuses on the ability of machines to receive data and learn for themselves without being explicitly programmed for every task.",
        metadata: { difficulty: 'intermediate', category: 'ML', importance: 'high' }
      },
      // Deep dive into ML algorithms
      {
        question: "What are some popular machine learning algorithms?",
        answer: "Popular algorithms include linear regression, decision trees, random forests, support vector machines, neural networks, and k-means clustering. Each has different strengths for different types of problems.",
        metadata: { difficulty: 'advanced', category: 'ML', importance: 'medium' }
      },
      // Branch into neural networks
      {
        question: "How do neural networks work?",
        answer: "Neural networks consist of layers of interconnected nodes (neurons) that process information. Each connection has a weight, and the network learns by adjusting these weights based on training data through backpropagation.",
        metadata: { difficulty: 'advanced', category: 'NN', importance: 'high' }
      },
      // New branch - AI ethics
      {
        question: "What are the ethical concerns with AI?",
        answer: "Key ethical concerns include bias in algorithms, job displacement, privacy issues, autonomous weapons, and the need for transparency and accountability in AI decision-making.",
        metadata: { difficulty: 'intermediate', category: 'Ethics', importance: 'high' }
      }
    ];

    // Process conversations with custom scoring
    for (const conv of conversations) {
      const qaPair: QAPair = {
        question: conv.question,
        answer: conv.answer,
        timestamp: new Date(),
        metadata: conv.metadata
      };

      try {
        const nodeId = await this.system.addQAPair(qaPair);
        const node = this.system.getTopicTree().nodes.get(nodeId);
        console.log(`Added: ${conv.question}`);
        console.log(`Topic: ${node?.topic}, Score: ${node?.score}, Depth: ${node?.depth}`);
        console.log('---');
      } catch (error) {
        console.error('Error processing conversation:', error);
      }
    }

    // Demonstrate navigation features
    this.demonstrateNavigation();
  }

  private demonstrateNavigation(): void {
    console.log('\n=== Navigation Features ===');

    // Get current topic
    const currentTopic = this.system.getCurrentTopic();
    if (currentTopic) {
      console.log(`Current topic: ${currentTopic.topic}`);
    }

    // Find and mark topics as visited
    let deepestBranch = this.system.getDeepestUnvisitedBranch();
    while (deepestBranch) {
      console.log(`Visiting: ${deepestBranch.topic} (depth: ${deepestBranch.depth})`);
      this.system.markTopicAsVisited(deepestBranch.id);
      deepestBranch = this.system.getDeepestUnvisitedBranch();
    }

    console.log('All branches have been visited!');
  }
}

/**
 * Session management example - Multiple concurrent conversations
 */
export class SessionManagementExample {
  private system: ConversationGradingSystemWithSessions;

  constructor() {
    const persistenceAdapter = new InMemoryPersistenceAdapter();
    this.system = new ConversationGradingSystemWithSessions(
      'session-management-example',
      {
        adapter: persistenceAdapter,
        autoSave: true,
        saveInterval: 5000
      }
    );
  }

  async runExample(): Promise<void> {
    console.log('\n=== Session Management Example ===');

    // Create multiple sessions for different conversation contexts
    const session1 = this.system.createSession('ai-basics', { topic: 'AI Fundamentals' });
    const session2 = this.system.createSession('programming', { topic: 'Programming Concepts' });

    console.log(`Created sessions: ${session1}, ${session2}`);

    // Work with first session
    this.system.switchSession(session1);
    await this.addAIConversation();

    // Work with second session
    this.system.switchSession(session2);
    await this.addProgrammingConversation();

    // Save sessions
    await this.system.saveSession(session1);
    await this.system.saveSession(session2);

    // List all sessions
    const sessions = this.system.listSessions();
    console.log('Active sessions:', sessions.map(s => `${s.sessionId} (${s.metadata?.topic})`));

    // Demonstrate session switching and data isolation
    this.demonstrateSessionIsolation();
  }

  private async addAIConversation(): Promise<void> {
    const qaPairs: QAPair[] = [
      {
        question: "What is deep learning?",
        answer: "Deep learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns in data.",
        timestamp: new Date()
      },
      {
        question: "What are convolutional neural networks?",
        answer: "CNNs are deep learning models particularly effective for image processing, using convolutional layers to detect features like edges and patterns.",
        timestamp: new Date()
      }
    ];

    for (const qaPair of qaPairs) {
      await this.system.addQAPair(qaPair);
    }
  }

  private async addProgrammingConversation(): Promise<void> {
    const qaPairs: QAPair[] = [
      {
        question: "What is object-oriented programming?",
        answer: "OOP is a programming paradigm based on the concept of objects, which contain data (attributes) and code (methods) that manipulates that data.",
        timestamp: new Date()
      },
      {
        question: "What are the main principles of OOP?",
        answer: "The four main principles are encapsulation, inheritance, polymorphism, and abstraction.",
        timestamp: new Date()
      }
    ];

    for (const qaPair of qaPairs) {
      await this.system.addQAPair(qaPair);
    }
  }

  private demonstrateSessionIsolation(): void {
    console.log('\n=== Session Isolation Demo ===');

    // Switch between sessions and show different trees
    this.system.switchSession('ai-basics');
    const aiStats = this.system.getStats();
    console.log('AI Session stats:', aiStats);

    this.system.switchSession('programming');
    const progStats = this.system.getStats();
    console.log('Programming Session stats:', progStats);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  try {
    // Basic usage
    const basicExample = new BasicUsageExample();
    await basicExample.runExample();

    // Advanced usage
    const advancedExample = new AdvancedUsageExample();
    await advancedExample.runExample();

    // Session management
    const sessionExample = new SessionManagementExample();
    await sessionExample.runExample();

    console.log('\n=== All Examples Completed Successfully ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Classes are already exported above, no need to re-export