/**
 * ValidationUtils - Comprehensive validation utilities for the Conversation Grading System
 * Provides input validation, error handling, and data integrity checks
 */

import { QAPair, TopicNode, ConversationTree, ScoringContext } from '../types/conversation-grading';

/**
 * Custom error classes for specific validation failures
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TreeIntegrityError extends Error {
  constructor(message: string, public nodeId?: string) {
    super(message);
    this.name = 'TreeIntegrityError';
  }
}

export class ScoringError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ScoringError';
  }
}

/**
 * Validation utilities class
 */
export class ValidationUtils {
  /**
   * Validate Q&A pair structure and content
   */
  static validateQAPair(qaPair: any): asserts qaPair is QAPair {
    if (!qaPair || typeof qaPair !== 'object') {
      throw new ValidationError('Q&A pair must be an object', 'qaPair', qaPair);
    }

    // Validate question
    if (qaPair.question === undefined || qaPair.question === null) {
      throw new ValidationError('Question is required', 'question', qaPair.question);
    }
    if (typeof qaPair.question !== 'string') {
      throw new ValidationError('Question must be a string', 'question', qaPair.question);
    }
    if (!qaPair.question.trim()) {
      throw new ValidationError('Question cannot be empty', 'question', qaPair.question);
    }
    if (qaPair.question.length > 10000) {
      throw new ValidationError('Question exceeds maximum length of 10000 characters', 'question', qaPair.question);
    }

    // Validate answer
    if (qaPair.answer === undefined || qaPair.answer === null) {
      throw new ValidationError('Answer is required', 'answer', qaPair.answer);
    }
    if (typeof qaPair.answer !== 'string') {
      throw new ValidationError('Answer must be a string', 'answer', qaPair.answer);
    }
    if (!qaPair.answer.trim()) {
      throw new ValidationError('Answer cannot be empty', 'answer', qaPair.answer);
    }
    if (qaPair.answer.length > 50000) {
      throw new ValidationError('Answer exceeds maximum length of 50000 characters', 'answer', qaPair.answer);
    }

    // Validate timestamp
    if (!qaPair.timestamp) {
      throw new ValidationError('Timestamp is required', 'timestamp', qaPair.timestamp);
    }
    if (!(qaPair.timestamp instanceof Date)) {
      throw new ValidationError('Timestamp must be a Date object', 'timestamp', qaPair.timestamp);
    }
    if (isNaN(qaPair.timestamp.getTime())) {
      throw new ValidationError('Timestamp must be a valid Date', 'timestamp', qaPair.timestamp);
    }

    // Validate metadata if present
    if (qaPair.metadata !== undefined) {
      if (typeof qaPair.metadata !== 'object' || qaPair.metadata === null) {
        throw new ValidationError('Metadata must be an object', 'metadata', qaPair.metadata);
      }
      if (Array.isArray(qaPair.metadata)) {
        throw new ValidationError('Metadata cannot be an array', 'metadata', qaPair.metadata);
      }
    }
  }

  /**
   * Validate node ID format and constraints
   */
  static validateNodeId(nodeId: any): asserts nodeId is string {
    if (!nodeId) {
      throw new ValidationError('Node ID is required', 'nodeId', nodeId);
    }
    if (typeof nodeId !== 'string') {
      throw new ValidationError('Node ID must be a string', 'nodeId', nodeId);
    }
    if (!nodeId.trim()) {
      throw new ValidationError('Node ID cannot be empty or whitespace only', 'nodeId', nodeId);
    }
    if (nodeId.length > 255) {
      throw new ValidationError('Node ID exceeds maximum length of 255 characters', 'nodeId', nodeId);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(nodeId)) {
      throw new ValidationError('Node ID can only contain alphanumeric characters, underscores, and hyphens', 'nodeId', nodeId);
    }
  }

  /**
   * Validate topic name
   */
  static validateTopicName(topic: any): asserts topic is string {
    if (!topic) {
      throw new ValidationError('Topic name is required', 'topic', topic);
    }
    if (typeof topic !== 'string') {
      throw new ValidationError('Topic name must be a string', 'topic', topic);
    }
    if (!topic.trim()) {
      throw new ValidationError('Topic name cannot be empty or whitespace only', 'topic', topic);
    }
    if (topic.length > 500) {
      throw new ValidationError('Topic name exceeds maximum length of 500 characters', 'topic', topic);
    }
  }

  /**
   * Validate score value
   */
  static validateScore(score: any): asserts score is number {
    if (score === null || score === undefined) {
      return; // Null scores are allowed
    }
    if (typeof score !== 'number') {
      throw new ValidationError('Score must be a number', 'score', score);
    }
    if (isNaN(score) || !isFinite(score)) {
      throw new ValidationError('Score must be a finite number', 'score', score);
    }
    if (score < 0 || score > 100) {
      throw new ValidationError('Score must be between 0 and 100', 'score', score);
    }
  }

  /**
   * Validate session ID
   */
  static validateSessionId(sessionId: any): asserts sessionId is string {
    if (!sessionId) {
      throw new ValidationError('Session ID is required', 'sessionId', sessionId);
    }
    if (typeof sessionId !== 'string') {
      throw new ValidationError('Session ID must be a string', 'sessionId', sessionId);
    }
    if (!sessionId.trim()) {
      throw new ValidationError('Session ID cannot be empty or whitespace only', 'sessionId', sessionId);
    }
    if (sessionId.length > 255) {
      throw new ValidationError('Session ID exceeds maximum length of 255 characters', 'sessionId', sessionId);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      throw new ValidationError('Session ID can only contain alphanumeric characters, underscores, and hyphens', 'sessionId', sessionId);
    }
  }

  /**
   * Validate tree depth constraints
   */
  static validateTreeDepth(depth: number, maxDepth: number = 50): void {
    if (depth > maxDepth) {
      throw new ValidationError(`Tree depth ${depth} exceeds maximum allowed depth of ${maxDepth}`, 'depth', depth);
    }
  }

  /**
   * Validate tree size constraints
   */
  static validateTreeSize(nodeCount: number, maxNodes: number = 10000): void {
    if (nodeCount > maxNodes) {
      throw new ValidationError(`Tree size ${nodeCount} exceeds maximum allowed nodes of ${maxNodes}`, 'nodeCount', nodeCount);
    }
  }

  /**
   * Validate scoring context
   */
  static validateScoringContext(context: any): asserts context is ScoringContext {
    if (!context || typeof context !== 'object') {
      throw new ValidationError('Scoring context must be an object', 'context', context);
    }

    if (!context.currentTopic) {
      throw new ValidationError('Scoring context must include currentTopic', 'currentTopic', context.currentTopic);
    }

    if (!Array.isArray(context.conversationHistory)) {
      throw new ValidationError('Scoring context conversationHistory must be an array', 'conversationHistory', context.conversationHistory);
    }

    if (typeof context.topicDepth !== 'number' || context.topicDepth < 1) {
      throw new ValidationError('Scoring context topicDepth must be a positive number', 'topicDepth', context.topicDepth);
    }
  }

  /**
   * Sanitize and normalize input strings
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove null bytes and control characters except newlines and tabs
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }

  /**
   * Validate and sanitize Q&A pair
   */
  static sanitizeQAPair(qaPair: QAPair): QAPair {
    this.validateQAPair(qaPair);
    
    return {
      ...qaPair,
      question: this.sanitizeString(qaPair.question),
      answer: this.sanitizeString(qaPair.answer),
      metadata: qaPair.metadata ? { ...qaPair.metadata } : undefined
    };
  }

  /**
   * Check for potential security issues in input
   */
  static checkSecurityConstraints(input: string): void {
    // Check for potential script injection
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
      throw new ValidationError('Input contains potentially malicious script content', 'input', input);
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/|;)/g
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        throw new ValidationError('Input contains potentially malicious SQL patterns', 'input', input);
      }
    }

    // Check for excessive special characters that might indicate injection attempts
    const specialCharCount = (input.match(/[<>'";&|`$(){}[\]\\]/g) || []).length;
    if (specialCharCount > input.length * 0.1) {
      throw new ValidationError('Input contains excessive special characters', 'input', input);
    }
  }

  /**
   * Validate tree integrity
   */
  static validateTreeIntegrity(tree: ConversationTree): void {
    const { nodes, rootNodes } = tree;

    // Check that all root nodes exist and have no parent
    for (const rootId of rootNodes) {
      const rootNode = nodes.get(rootId);
      if (!rootNode) {
        throw new TreeIntegrityError(`Root node ${rootId} not found in nodes map`, rootId);
      }
      if (rootNode.parentTopic !== null) {
        throw new TreeIntegrityError(`Root node ${rootId} has a parent topic`, rootId);
      }
    }

    // Check parent-child relationships
    for (const [nodeId, node] of nodes) {
      // Validate node structure
      if (!node.id || node.id !== nodeId) {
        throw new TreeIntegrityError(`Node ID mismatch: map key ${nodeId} vs node.id ${node.id}`, nodeId);
      }

      // Check parent relationship
      if (node.parentTopic) {
        const parent = nodes.get(node.parentTopic);
        if (!parent) {
          throw new TreeIntegrityError(`Node ${nodeId} references non-existent parent ${node.parentTopic}`, nodeId);
        }
        if (!parent.children.includes(nodeId)) {
          throw new TreeIntegrityError(`Parent ${node.parentTopic} doesn't list ${nodeId} as child`, nodeId);
        }
      }

      // Check children relationships
      for (const childId of node.children) {
        const child = nodes.get(childId);
        if (!child) {
          throw new TreeIntegrityError(`Node ${nodeId} references non-existent child ${childId}`, nodeId);
        }
        if (child.parentTopic !== nodeId) {
          throw new TreeIntegrityError(`Child ${childId} doesn't reference ${nodeId} as parent`, nodeId);
        }
      }

      // Check for circular references
      if (this.hasCircularReference(nodeId, nodes, new Set())) {
        throw new TreeIntegrityError(`Circular reference detected starting from node ${nodeId}`, nodeId);
      }

      // Validate depth consistency
      const calculatedDepth = this.calculateNodeDepth(nodeId, nodes);
      if (node.depth !== calculatedDepth) {
        throw new TreeIntegrityError(`Node ${nodeId} depth mismatch: stored ${node.depth} vs calculated ${calculatedDepth}`, nodeId);
      }
    }
  }

  /**
   * Check for circular references in tree
   */
  private static hasCircularReference(nodeId: string, nodes: Map<string, TopicNode>, visited: Set<string>): boolean {
    if (visited.has(nodeId)) {
      return true;
    }

    const node = nodes.get(nodeId);
    if (!node) {
      return false;
    }

    visited.add(nodeId);

    for (const childId of node.children) {
      if (this.hasCircularReference(childId, nodes, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate node depth from root
   */
  private static calculateNodeDepth(nodeId: string, nodes: Map<string, TopicNode>): number {
    const node = nodes.get(nodeId);
    if (!node) {
      throw new TreeIntegrityError(`Node ${nodeId} not found`, nodeId);
    }

    if (node.parentTopic === null) {
      return 1; // Root node
    }

    return 1 + this.calculateNodeDepth(node.parentTopic, nodes);
  }

  /**
   * Create safe error message for logging
   */
  static createSafeErrorMessage(error: Error, context?: string): string {
    const baseMessage = context ? `${context}: ${error.message}` : error.message;
    
    // Remove potentially sensitive information
    return baseMessage
      .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\b/g, '[TIMESTAMP]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '[CARD]');
  }
}