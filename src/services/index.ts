export { SpeechRecognitionService } from './SpeechRecognitionService';
export type { 
  SpeechConfig, 
  SpeechRecognitionResult, 
  SpeechRecognitionError 
} from './SpeechRecognitionService';

export { TopicNode } from './TopicNode';
export { TopicTreeManager } from './TopicTreeManager';
export { TreeNavigator } from './TreeNavigator';
export { TopicAnalyzer } from './TopicAnalyzer';
export { ScoringEngine, BaseScoringStrategy } from './ScoringEngine';
export { 
  QualityScoringStrategy, 
  ComplexityScoringStrategy, 
  ContextAwareScoringStrategy,
  WeightedScoringStrategy 
} from './ScoringStrategies';
export { ConversationGradingSystem } from './ConversationGradingSystem';
export { ConversationGradingSystemWithSessions } from './ConversationGradingSystemWithSessions';
export { SessionManager } from './SessionManager';
export { InMemoryPersistenceAdapter } from './InMemoryPersistenceAdapter';

// Interview Management Services
export { notificationService, NotificationService } from './notification';