/**
 * Example implementations index
 * Exports all example classes and utilities for easy import
 */

export {
  BasicUsageExample,
  AdvancedUsageExample,
  SessionManagementExample,
  runAllExamples
} from './ConversationGradingExample';

// Re-export types for convenience
export type {
  QAPair,
  IScoringStrategy,
  ITopicAnalyzer,
  ScoringContext,
  TopicRelationship,
  TopicNode,
  ConversationTree
} from '../types/conversation-grading';

// Re-export integration utilities
export {
  ConversationGradingIntegration,
  createConversationGradingIntegration,
  convertChatMessagesToQAPairs,
  createSimpleScoringStrategy,
  createSimpleTopicAnalyzer
} from '../utils/ConversationGradingIntegration';

export type {
  ConversationMessage,
  IntegrationConfig,
  ProcessingResult
} from '../utils/ConversationGradingIntegration';