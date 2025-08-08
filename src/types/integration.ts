/**
 * TypeScript type definitions for conversation grading system integration
 * Provides comprehensive type safety for external integrations
 */

import { 
  QAPair, 
  TopicNode, 
  ConversationTree, 
  IScoringStrategy, 
  ITopicAnalyzer,
  ScoringContext,
  TopicRelationship
} from './conversation-grading';

/**
 * Configuration options for integrating with external conversation systems
 */
export interface ExternalSystemConfig {
  /** Unique identifier for the external system */
  systemId: string;
  /** System name for logging and identification */
  systemName: string;
  /** API version compatibility */
  apiVersion: string;
  /** Custom message format handlers */
  messageHandlers?: MessageHandlers;
  /** Authentication configuration if required */
  auth?: AuthConfig;
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
}

/**
 * Message format handlers for different conversation systems
 */
export interface MessageHandlers {
  /** Convert external message format to QAPair */
  toQAPair: (externalMessage: any) => QAPair | null;
  /** Convert QAPair to external message format */
  fromQAPair: (qaPair: QAPair) => any;
  /** Validate external message format */
  validate: (externalMessage: any) => boolean;
  /** Extract metadata from external message */
  extractMetadata: (externalMessage: any) => Record<string, any>;
}

/**
 * Authentication configuration for external systems
 */
export interface AuthConfig {
  type: 'api_key' | 'oauth' | 'jwt' | 'basic' | 'custom';
  credentials: Record<string, string>;
  refreshHandler?: () => Promise<Record<string, string>>;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
}

/**
 * Webhook configuration for real-time integration
 */
export interface WebhookConfig {
  /** Webhook endpoint URL */
  url: string;
  /** Events to subscribe to */
  events: WebhookEvent[];
  /** Secret for webhook verification */
  secret?: string;
  /** Custom headers to include */
  headers?: Record<string, string>;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Webhook events that can be subscribed to
 */
export type WebhookEvent = 
  | 'qa_pair_added'
  | 'topic_created'
  | 'score_calculated'
  | 'branch_completed'
  | 'session_started'
  | 'session_ended'
  | 'tree_updated';

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: Date;
  sessionId: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Batch processing configuration
 */
export interface BatchConfig {
  /** Maximum batch size */
  maxBatchSize: number;
  /** Batch timeout in milliseconds */
  timeoutMs: number;
  /** Whether to process batches in parallel */
  parallel: boolean;
  /** Error handling strategy */
  errorHandling: 'fail_fast' | 'continue_on_error' | 'retry_failed';
}

/**
 * Result of batch processing operation
 */
export interface BatchProcessingResult {
  /** Total items processed */
  totalProcessed: number;
  /** Successfully processed items */
  successful: number;
  /** Failed items */
  failed: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Detailed results for each item */
  results: Array<{
    index: number;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}

/**
 * Analytics and reporting configuration
 */
export interface AnalyticsConfig {
  /** Enable detailed analytics collection */
  enabled: boolean;
  /** Metrics to collect */
  metrics: AnalyticsMetric[];
  /** Reporting interval in milliseconds */
  reportingIntervalMs: number;
  /** Custom metric collectors */
  customCollectors?: Array<{
    name: string;
    collector: () => Promise<Record<string, number>>;
  }>;
}

/**
 * Available analytics metrics
 */
export type AnalyticsMetric = 
  | 'processing_time'
  | 'topic_distribution'
  | 'score_distribution'
  | 'depth_distribution'
  | 'session_duration'
  | 'error_rate'
  | 'throughput';

/**
 * Analytics report structure
 */
export interface AnalyticsReport {
  /** Report generation timestamp */
  timestamp: Date;
  /** Reporting period */
  period: {
    start: Date;
    end: Date;
  };
  /** Collected metrics */
  metrics: Record<string, any>;
  /** Summary statistics */
  summary: {
    totalSessions: number;
    totalQAPairs: number;
    averageProcessingTime: number;
    errorRate: number;
  };
}

/**
 * Plugin interface for extending functionality
 */
export interface Plugin {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin initialization */
  initialize: (config: any) => Promise<void>;
  /** Plugin cleanup */
  cleanup: () => Promise<void>;
  /** Plugin hooks */
  hooks?: {
    beforeProcessing?: (qaPair: QAPair) => Promise<QAPair>;
    afterProcessing?: (result: any) => Promise<any>;
    onError?: (error: Error) => Promise<void>;
  };
}

/**
 * Migration utilities for upgrading between versions
 */
export interface MigrationConfig {
  /** Source version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Migration steps */
  steps: MigrationStep[];
  /** Backup configuration */
  backup?: {
    enabled: boolean;
    location: string;
  };
}

/**
 * Individual migration step
 */
export interface MigrationStep {
  /** Step name */
  name: string;
  /** Step description */
  description: string;
  /** Migration function */
  migrate: (data: any) => Promise<any>;
  /** Rollback function */
  rollback?: (data: any) => Promise<any>;
  /** Validation function */
  validate?: (data: any) => Promise<boolean>;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  /** Sampling rate (0-1) */
  samplingRate: number;
  /** Metrics to track */
  metrics: PerformanceMetric[];
  /** Alert thresholds */
  thresholds?: {
    processingTimeMs?: number;
    memoryUsageMB?: number;
    errorRate?: number;
  };
}

/**
 * Performance metrics to track
 */
export type PerformanceMetric = 
  | 'cpu_usage'
  | 'memory_usage'
  | 'processing_time'
  | 'queue_size'
  | 'throughput'
  | 'error_rate';

/**
 * Performance monitoring result
 */
export interface PerformanceMetrics {
  timestamp: Date;
  cpuUsage?: number;
  memoryUsage?: number;
  processingTime?: number;
  queueSize?: number;
  throughput?: number;
  errorRate?: number;
  customMetrics?: Record<string, number>;
}

/**
 * Caching configuration for improved performance
 */
export interface CacheConfig {
  /** Cache type */
  type: 'memory' | 'redis' | 'file' | 'custom';
  /** Cache TTL in milliseconds */
  ttlMs: number;
  /** Maximum cache size */
  maxSize: number;
  /** Cache key prefix */
  keyPrefix: string;
  /** Custom cache implementation */
  customCache?: CacheImplementation;
}

/**
 * Custom cache implementation interface
 */
export interface CacheImplementation {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, ttlMs?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
}

/**
 * Export/import configuration
 */
export interface ExportConfig {
  /** Export format */
  format: 'json' | 'csv' | 'xml' | 'yaml' | 'custom';
  /** Include metadata */
  includeMetadata: boolean;
  /** Compression settings */
  compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'deflate';
  };
  /** Custom formatter */
  customFormatter?: (data: any) => string;
}

/**
 * Import configuration
 */
export interface ImportConfig {
  /** Source format */
  format: 'json' | 'csv' | 'xml' | 'yaml' | 'custom';
  /** Validation rules */
  validation?: {
    strict: boolean;
    customRules?: Array<(data: any) => boolean>;
  };
  /** Transformation rules */
  transformation?: {
    fieldMapping?: Record<string, string>;
    customTransform?: (data: any) => any;
  };
  /** Custom parser */
  customParser?: (input: string) => any;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Enable health checks */
  enabled: boolean;
  /** Check interval in milliseconds */
  intervalMs: number;
  /** Health check endpoints */
  checks: HealthCheck[];
  /** Failure threshold */
  failureThreshold: number;
}

/**
 * Individual health check
 */
export interface HealthCheck {
  /** Check name */
  name: string;
  /** Check function */
  check: () => Promise<HealthCheckResult>;
  /** Check timeout in milliseconds */
  timeoutMs: number;
  /** Check criticality */
  critical: boolean;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Check status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Status message */
  message?: string;
  /** Additional details */
  details?: Record<string, any>;
  /** Response time in milliseconds */
  responseTimeMs: number;
}

/**
 * System health status
 */
export interface SystemHealth {
  /** Overall status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Timestamp */
  timestamp: Date;
  /** Individual check results */
  checks: Record<string, HealthCheckResult>;
  /** System uptime in milliseconds */
  uptimeMs: number;
  /** System version */
  version: string;
}