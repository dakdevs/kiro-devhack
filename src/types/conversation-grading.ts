/**
 * Core data models and interfaces for the Conversation Grading System
 */

// Core data model for Q&A pairs
export interface QAPair {
  question: string;
  answer: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Topic node structure for the conversation tree
export interface TopicNode {
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

// Complete conversation tree structure
export interface ConversationTree {
  nodes: Map<string, TopicNode>;
  rootNodes: string[];
  currentPath: string[];
  sessionId: string;
  createdAt: Date;
}

// Topic relationship analysis result
export interface TopicRelationship {
  type: 'new_root' | 'child_of' | 'sibling_of' | 'continuation';
  parentNodeId?: string;
  confidence: number;
}

// Context for scoring calculations
export interface ScoringContext {
  currentTopic: TopicNode;
  conversationHistory: QAPair[];
  topicDepth: number;
}

// Main system interface for the conversation grading system
export interface IConversationGradingSystem {
  // Core operations
  addQAPair(qaPair: QAPair, score?: number): Promise<string>;
  getTopicTree(): ConversationTree;
  getDepthFromRoot(nodeId: string): number;
  getDeepestUnvisitedBranch(): TopicNode | null;
  
  // Navigation
  getCurrentTopic(): TopicNode | null;
  markTopicAsVisited(nodeId: string): void;
  
  // Configuration
  setScoringStrategy(strategy: IScoringStrategy): void;
  setTopicAnalyzer(analyzer: ITopicAnalyzer): void;
}

// Interface for topic analysis functionality
export interface ITopicAnalyzer {
  extractTopics(qaPair: QAPair): Promise<string[]>;
  determineRelationship(newTopic: string, existingNodes: TopicNode[]): TopicRelationship;
}

// Interface for scoring strategies
export interface IScoringStrategy {
  calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number>;
}

// Interface for scoring engine
export interface IScoringEngine {
  setStrategy(strategy: IScoringStrategy): void;
  calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number>;
}

// Interface for tree management operations
export interface ITopicTreeManager {
  addNode(node: TopicNode): void;
  getNode(nodeId: string): TopicNode | null;
  updateNode(nodeId: string, updates: Partial<TopicNode>): void;
  removeNode(nodeId: string): void;
  getRootNodes(): TopicNode[];
  getChildren(nodeId: string): TopicNode[];
  getParent(nodeId: string): TopicNode | null;
  calculateDepth(nodeId: string): number;
  findDeepestUnvisitedBranch(): TopicNode | null;
}

// Interface for tree navigation utilities
export interface ITreeNavigator {
  getDepthFromRoot(nodeId: string, tree: ConversationTree): number;
  findPath(fromNodeId: string, toNodeId: string, tree: ConversationTree): string[];
  getLeafNodes(tree: ConversationTree): TopicNode[];
  getUnvisitedBranches(tree: ConversationTree): TopicNode[];
  getDeepestUnvisitedBranch(tree: ConversationTree): TopicNode | null;
}

// Session management interfaces
export interface SessionInfo {
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, any>;
}

export interface ISessionManager {
  createSession(sessionId?: string, metadata?: Record<string, any>): SessionInfo;
  getSession(sessionId: string): SessionInfo | null;
  updateSessionAccess(sessionId: string): void;
  deleteSession(sessionId: string): void;
  listSessions(): SessionInfo[];
  cleanupExpiredSessions(maxAgeMs: number): number;
  getSessionTree(sessionId: string): ConversationTree | null;
  setSessionTree(sessionId: string, tree: ConversationTree): void;
}

// Persistence interfaces
export interface IPersistenceAdapter {
  save(sessionId: string, tree: ConversationTree): Promise<void>;
  load(sessionId: string): Promise<ConversationTree | null>;
  delete(sessionId: string): Promise<void>;
  list(): Promise<string[]>;
  exists(sessionId: string): Promise<boolean>;
}

export interface PersistenceConfig {
  adapter?: IPersistenceAdapter;
  autoSave?: boolean;
  saveInterval?: number; // milliseconds
}

// Extended main system interface with session management
export interface IConversationGradingSystemWithSessions extends IConversationGradingSystem {
  // Session management
  createSession(sessionId?: string, metadata?: Record<string, any>): string;
  switchSession(sessionId: string): void;
  getCurrentSessionId(): string;
  deleteSession(sessionId: string): void;
  listSessions(): SessionInfo[];
  
  // Persistence
  saveSession(sessionId?: string): Promise<void>;
  loadSession(sessionId: string): Promise<void>;
  
  // Cleanup
  cleanupExpiredSessions(maxAgeMs: number): number;
}