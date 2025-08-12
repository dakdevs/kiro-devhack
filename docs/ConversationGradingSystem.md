# Conversation Grading System Documentation

## Overview

The Conversation Grading System is a standalone TypeScript module that processes Q&A pairs from ongoing conversations and maintains a hierarchical topic tree structure. It provides intelligent topic tracking, optional scoring capabilities, and navigation features to guide continued learning.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Integration Guide](#integration-guide)
5. [Examples](#examples)
6. [Advanced Usage](#advanced-usage)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

```typescript
import { ConversationGradingSystem } from './services/ConversationGradingSystem';
import { QAPair } from './types/conversation-grading';
```

### Basic Usage

```typescript
// Initialize the system
const system = new ConversationGradingSystem('my-session');

// Create a Q&A pair
const qaPair: QAPair = {
  question: "What is machine learning?",
  answer: "Machine learning is a subset of AI that enables computers to learn from data.",
  timestamp: new Date(),
  metadata: { difficulty: 'beginner' }
};

// Process the Q&A pair
const nodeId = await system.addQAPair(qaPair);

// Get the topic tree
const tree = system.getTopicTree();

// Find the deepest unvisited branch
const deepestBranch = system.getDeepestUnvisitedBranch();
```

## Core Concepts

### Topic Tree Structure

The system organizes conversations into a hierarchical tree where:
- **Root nodes** represent main conversation topics
- **Child nodes** represent subtopics or follow-up questions
- **Depth** indicates how deep a topic is in the conversation hierarchy
- **Branches** can be marked as visited to track conversation progress

### Q&A Pair Processing

Each Q&A pair goes through:
1. **Topic extraction** - Identifying the main topic from the content
2. **Relationship analysis** - Determining how it relates to existing topics
3. **Tree placement** - Adding it to the appropriate location in the tree
4. **Scoring** (optional) - Assigning a quality or relevance score

### Session Management

The system supports:
- **Single sessions** for simple use cases
- **Multi-session management** for concurrent conversations
- **Persistence** for saving and loading conversation state

## API Reference

### ConversationGradingSystem

#### Constructor

```typescript
constructor(sessionId: string = 'default')
```

Creates a new conversation grading system instance.

#### Core Methods

##### addQAPair(qaPair, score?)

```typescript
async addQAPair(qaPair: QAPair, score?: number): Promise<string>
```

Processes a Q&A pair and adds it to the conversation tree.

**Parameters:**
- `qaPair`: The question-answer pair to process
- `score` (optional): Manual score override

**Returns:** Node ID of the created topic node

**Example:**
```typescript
const nodeId = await system.addQAPair({
  question: "How do neural networks work?",
  answer: "Neural networks process information through interconnected nodes...",
  timestamp: new Date()
});
```

##### getTopicTree()

```typescript
getTopicTree(): ConversationTree
```

Returns the complete conversation tree structure.

**Returns:** ConversationTree object containing all nodes and metadata

##### getDepthFromRoot(nodeId)

```typescript
getDepthFromRoot(nodeId: string): number
```

Calculates the depth of a specific node from the root.

**Parameters:**
- `nodeId`: ID of the node to calculate depth for

**Returns:** Depth value (1 for root nodes)

##### getDeepestUnvisitedBranch()

```typescript
getDeepestUnvisitedBranch(): TopicNode | null
```

Finds the deepest unvisited branch for continued conversation.

**Returns:** TopicNode of the deepest unvisited branch, or null if all branches are visited

#### Navigation Methods

##### getCurrentTopic()

```typescript
getCurrentTopic(): TopicNode | null
```

Gets the current topic (last node in the current path).

##### markTopicAsVisited(nodeId)

```typescript
markTopicAsVisited(nodeId: string): void
```

Marks a topic as visited to exclude it from future deepest branch queries.

#### Configuration Methods

##### setScoringStrategy(strategy)

```typescript
setScoringStrategy(strategy: IScoringStrategy): void
```

Sets a custom scoring strategy for Q&A pair evaluation.

**Example:**
```typescript
const customStrategy: IScoringStrategy = {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    // Custom scoring logic
    return Math.min(100, qaPair.answer.length / 10);
  }
};

system.setScoringStrategy(customStrategy);
```

##### setTopicAnalyzer(analyzer)

```typescript
setTopicAnalyzer(analyzer: ITopicAnalyzer): void
```

Sets a custom topic analyzer for topic extraction and relationship detection.

#### Utility Methods

##### getStats()

```typescript
getStats(): {
  totalNodes: number;
  rootNodes: number;
  maxDepth: number;
  leafNodes: number;
  totalQAPairs: number;
  averageScore: number | null;
}
```

Returns comprehensive statistics about the conversation.

##### clear()

```typescript
clear(): void
```

Clears the conversation tree (useful for testing or reset).

### Data Types

#### QAPair

```typescript
interface QAPair {
  question: string;
  answer: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

#### TopicNode

```typescript
interface TopicNode {
  id: string;
  topic: string;
  parentTopic: string | null;
  children: string[];
  depth: number;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    qaPairs: QAPair[];
    visitCount: number;
    lastVisited: Date | null;
    isExhausted: boolean;
  };
}
```

#### ConversationTree

```typescript
interface ConversationTree {
  nodes: Map<string, TopicNode>;
  rootNodes: string[];
  currentPath: string[];
  sessionId: string;
  createdAt: Date;
}
```

## Integration Guide

### Using the Integration Utility

The `ConversationGradingIntegration` class provides a high-level interface for integrating with existing conversation systems:

```typescript
import { ConversationGradingIntegration } from './utils/ConversationGradingIntegration';

// Create integration instance
const integration = new ConversationGradingIntegration({
  sessionId: 'chat-session-1',
  autoScore: true,
  enableSessions: false
});

// Process conversation messages
const messages = [
  { role: 'user', content: 'What is AI?', timestamp: new Date() },
  { role: 'assistant', content: 'AI is...', timestamp: new Date() }
];

const results = await integration.processConversation(messages);
```

### Custom Scoring Strategies

Create custom scoring logic based on your specific needs:

```typescript
const domainSpecificScoring: IScoringStrategy = {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    let score = 50; // Base score
    
    // Score based on answer completeness
    if (qaPair.answer.length > 200) score += 20;
    
    // Score based on technical depth
    if (context.topicDepth > 2) score += 15;
    
    // Score based on domain-specific keywords
    const technicalTerms = ['algorithm', 'neural network', 'machine learning'];
    const termCount = technicalTerms.filter(term => 
      qaPair.answer.toLowerCase().includes(term)
    ).length;
    score += termCount * 10;
    
    return Math.max(0, Math.min(100, score));
  }
};
```

### Custom Topic Analyzers

Implement domain-specific topic extraction:

```typescript
const domainTopicAnalyzer: ITopicAnalyzer = {
  async extractTopics(qaPair: QAPair): Promise<string[]> {
    const question = qaPair.question.toLowerCase();
    const answer = qaPair.answer.toLowerCase();
    
    // Domain-specific topic extraction logic
    if (question.includes('machine learning') || answer.includes('ml')) {
      return ['machine learning'];
    }
    
    if (question.includes('neural network') || answer.includes('neural')) {
      return ['neural networks'];
    }
    
    // Fallback to simple keyword extraction
    const keywords = question.split(' ').slice(0, 3);
    return [keywords.join(' ')];
  },
  
  determineRelationship(topic: string, existingNodes: TopicNode[]): TopicRelationship {
    // Custom relationship logic
    const relatedNode = existingNodes.find(node => 
      this.calculateSimilarity(topic, node.topic) > 0.7
    );
    
    if (relatedNode) {
      return {
        type: 'child_of',
        parentNodeId: relatedNode.id,
        confidence: 0.8
      };
    }
    
    return { type: 'new_root', confidence: 0.6 };
  }
};
```

## Examples

### Basic Conversation Processing

```typescript
import { BasicUsageExample } from './examples/ConversationGradingExample';

const example = new BasicUsageExample();
await example.runExample();
```

### Advanced Features with Custom Strategies

```typescript
import { AdvancedUsageExample } from './examples/ConversationGradingExample';

const example = new AdvancedUsageExample();
await example.runExample();
```

### Multi-Session Management

```typescript
import { SessionManagementExample } from './examples/ConversationGradingExample';

const example = new SessionManagementExample();
await example.runExample();
```

### Real-time Integration

```typescript
// WebSocket integration example
const integration = new ConversationGradingIntegration({
  sessionId: 'websocket-session',
  autoScore: true
});

websocket.on('message', async (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'qa_pair') {
    const result = await integration.processQAPair({
      question: message.question,
      answer: message.answer,
      timestamp: new Date(),
      metadata: message.metadata
    });
    
    // Send back processing results
    websocket.send(JSON.stringify({
      type: 'processing_result',
      result: result
    }));
  }
});
```

## Advanced Usage

### Batch Processing

```typescript
const qaPairs = [
  // ... multiple Q&A pairs
];

const results = [];
for (const qaPair of qaPairs) {
  try {
    const result = await integration.processQAPair(qaPair);
    results.push(result);
  } catch (error) {
    console.error('Processing failed:', error);
  }
}
```

### Analytics and Insights

```typescript
const analytics = integration.getAnalytics();

console.log('Most discussed topics:', analytics.insights.mostDiscussedTopics);
console.log('Conversation flow:', analytics.insights.conversationFlow);
console.log('Statistics:', analytics.stats);
```

### Data Export

```typescript
const exportData = integration.exportConversationData();

// Export to JSON
const jsonData = JSON.stringify(exportData, null, 2);

// Export topic hierarchy
const hierarchy = exportData.topicHierarchy;
```

## Best Practices

### Performance Optimization

1. **Batch Processing**: Process multiple Q&A pairs in batches when possible
2. **Caching**: Cache frequently accessed nodes and calculations
3. **Memory Management**: Clear unused sessions and implement cleanup routines
4. **Async Processing**: Use async/await for all operations

### Error Handling

1. **Graceful Degradation**: Handle scoring and topic analysis failures gracefully
2. **Input Validation**: Always validate Q&A pairs before processing
3. **Tree Integrity**: Monitor and maintain tree structure integrity
4. **Logging**: Implement comprehensive logging for debugging

### Security Considerations

1. **Input Sanitization**: Sanitize all user input to prevent injection attacks
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Session Isolation**: Ensure proper session isolation in multi-tenant environments
4. **Data Privacy**: Handle sensitive conversation data appropriately

### Scalability

1. **Horizontal Scaling**: Design for multiple instances with shared persistence
2. **Database Optimization**: Use appropriate indexing for persistence layers
3. **Memory Limits**: Set reasonable limits on tree size and depth
4. **Load Balancing**: Distribute sessions across multiple instances

## Troubleshooting

### Common Issues

#### Tree Integrity Errors

**Problem**: Tree structure becomes corrupted
**Solution**: 
- Implement regular integrity checks
- Use transaction-like operations for tree modifications
- Provide recovery mechanisms for corrupted trees

#### Memory Usage

**Problem**: High memory usage with large conversations
**Solution**:
- Implement tree pruning for old conversations
- Use pagination for large tree traversals
- Set maximum tree size limits

#### Performance Issues

**Problem**: Slow processing with deep trees
**Solution**:
- Cache depth calculations
- Optimize tree traversal algorithms
- Consider tree rebalancing for very deep structures

#### Scoring Inconsistencies

**Problem**: Inconsistent or unexpected scores
**Solution**:
- Validate scoring strategy implementations
- Add logging to scoring calculations
- Implement score normalization

### Debug Mode

Enable debug logging for detailed troubleshooting:

```typescript
// Enable debug logging (implementation-specific)
const system = new ConversationGradingSystem('debug-session');

// Add custom logging
system.on('debug', (event) => {
  console.log('Debug:', event);
});
```

### Health Checks

Implement health checks for production systems:

```typescript
function performHealthCheck() {
  const stats = system.getStats();
  
  // Check for reasonable tree size
  if (stats.totalNodes > 10000) {
    console.warn('Tree size exceeding recommended limits');
  }
  
  // Check for tree depth
  if (stats.maxDepth > 50) {
    console.warn('Tree depth exceeding recommended limits');
  }
  
  // Check for memory usage
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected');
  }
}
```

## Support and Contributing

For issues, questions, or contributions, please refer to the project repository and documentation.

### Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added session management and persistence
- **v1.2.0**: Enhanced integration utilities and examples

### License

This project is licensed under the MIT License. See LICENSE file for details.