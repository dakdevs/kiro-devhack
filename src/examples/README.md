# Conversation Grading System Examples

This directory contains comprehensive examples demonstrating how to use the Conversation Grading System in various scenarios.

## Quick Start

```typescript
import { runAllExamples } from './examples';

// Run all examples
await runAllExamples();
```

## Available Examples

### 1. Basic Usage Example

Demonstrates fundamental system usage with simple Q&A processing.

```typescript
import { BasicUsageExample } from './examples';

const example = new BasicUsageExample();
await example.runExample();
```

**Features demonstrated:**
- Creating and processing Q&A pairs
- Building conversation trees
- Retrieving tree statistics
- Finding deepest unvisited branches

### 2. Advanced Usage Example

Shows advanced features with custom scoring and topic analysis.

```typescript
import { AdvancedUsageExample } from './examples';

const example = new AdvancedUsageExample();
await example.runExample();
```

**Features demonstrated:**
- Custom scoring strategies
- Complex conversation branching
- Navigation features
- Topic relationship analysis

### 3. Session Management Example

Illustrates multi-session management and persistence.

```typescript
import { SessionManagementExample } from './examples';

const example = new SessionManagementExample();
await example.runExample();
```

**Features demonstrated:**
- Multiple concurrent sessions
- Session isolation
- Persistence and data saving
- Session switching and management

## Integration Examples

### Simple Integration

```typescript
import { createConversationGradingIntegration } from '../utils';

const integration = createConversationGradingIntegration({
  sessionId: 'my-chat',
  autoScore: true
});

// Process conversation messages
const messages = [
  { role: 'user', content: 'What is AI?', timestamp: new Date() },
  { role: 'assistant', content: 'AI is...', timestamp: new Date() }
];

const results = await integration.processConversation(messages);
```

### Custom Scoring Integration

```typescript
import { createConversationGradingIntegration, createSimpleScoringStrategy } from '../utils';

const customScoring = createSimpleScoringStrategy((qaPair, context) => {
  // Your custom scoring logic
  return Math.min(100, qaPair.answer.length / 10);
});

const integration = createConversationGradingIntegration({
  scoringStrategy: customScoring
});
```

### Analytics and Insights

```typescript
// After processing conversations
const analytics = integration.getAnalytics();

console.log('Most discussed topics:', analytics.insights.mostDiscussedTopics);
console.log('Conversation flow:', analytics.insights.conversationFlow);
console.log('Statistics:', analytics.stats);
```

## Running Examples

### Individual Examples

```bash
# Run specific example
npm run test -- --run src/test/integration/ExampleUsage.test.ts
```

### All Examples

```bash
# Run all integration tests
npm run test -- --run src/test/integration/
```

### With Output

```typescript
// In your code
import { runAllExamples } from './examples';

// This will output detailed information to console
await runAllExamples();
```

## Example Data

The examples use realistic conversation data covering topics like:

- **Artificial Intelligence**: Basic concepts, applications, ethics
- **Machine Learning**: Algorithms, evaluation, types
- **Deep Learning**: Neural networks, architectures
- **Programming**: OOP, design patterns, testing
- **Software Engineering**: Architecture, best practices

## Customization

### Custom Scoring Strategy

```typescript
import { IScoringStrategy, ScoringContext, QAPair } from '../types';

const domainSpecificScoring: IScoringStrategy = {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    let score = 50; // Base score
    
    // Domain-specific logic
    if (qaPair.answer.includes('technical term')) score += 20;
    if (context.topicDepth > 2) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }
};
```

### Custom Topic Analyzer

```typescript
import { ITopicAnalyzer, QAPair, TopicNode, TopicRelationship } from '../types';

const domainTopicAnalyzer: ITopicAnalyzer = {
  async extractTopics(qaPair: QAPair): Promise<string[]> {
    // Your topic extraction logic
    return ['extracted topic'];
  },
  
  determineRelationship(topic: string, existingNodes: TopicNode[]): TopicRelationship {
    // Your relationship logic
    return { type: 'new_root', confidence: 0.8 };
  }
};
```

## Best Practices

1. **Error Handling**: Always wrap example code in try-catch blocks
2. **Resource Management**: Clear systems after use in production
3. **Performance**: Monitor memory usage with large datasets
4. **Testing**: Use the provided integration tests as templates

## Troubleshooting

### Common Issues

1. **Memory Usage**: Large conversation trees can consume significant memory
   - Solution: Implement cleanup routines and set size limits

2. **Performance**: Deep trees may slow down operations
   - Solution: Use caching and optimize tree traversal

3. **Scoring Inconsistencies**: Custom scoring may produce unexpected results
   - Solution: Add validation and logging to scoring functions

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// Set environment variable
process.env.DEBUG = 'conversation-grading:*';

// Or add custom logging
const integration = createConversationGradingIntegration({
  // ... config
});

// Monitor processing
integration.on('processing', (event) => {
  console.log('Processing event:', event);
});
```

## Contributing

When adding new examples:

1. Follow the existing pattern of example classes
2. Include comprehensive error handling
3. Add corresponding integration tests
4. Update this README with new examples
5. Ensure examples use realistic, educational data

## License

These examples are part of the Conversation Grading System and follow the same license terms.