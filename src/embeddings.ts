import OpenAI from 'openai';
import { serverConfig } from '~/config/server-config';

/**
 * Configuration for the embedding client
 */
interface EmbeddingConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  dimensions: number;
}

/**
 * Retry configuration for API calls
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * Default retry configuration with exponential backoff
 */
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

/**
 * Custom error class for embedding operations
 */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

/**
 * OpenAI client configured for DashScope API
 */
let openaiClient: OpenAI | null = null;

/**
 * Initialize the OpenAI client with DashScope configuration
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const config = serverConfig.embeddings.dashscope;
    
    if (!config.apiKey) {
      throw new EmbeddingError(
        'DashScope API key is not configured',
        'MISSING_API_KEY'
      );
    }

    openaiClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }
  
  return openaiClient;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Execute a function with retry logic and exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }
      
      const delay = calculateDelay(attempt, config);
      console.warn(
        `${operationName} failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms:`,
        error instanceof Error ? error.message : String(error)
      );
      
      await sleep(delay);
    }
  }
  
  // If we get here, all retries failed
  throw new EmbeddingError(
    `${operationName} failed after ${config.maxRetries + 1} attempts`,
    'MAX_RETRIES_EXCEEDED',
    undefined,
    lastError
  );
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    // Retry on rate limits, server errors, and timeouts
    return (
      error.status === 429 || // Rate limit
      error.status === 500 || // Internal server error
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504    // Gateway timeout
    );
  }
  
  // Retry on network errors
  if (error instanceof Error) {
    return (
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')
    );
  }
  
  return false;
}

/**
 * Validate embedding inputs
 */
function validateInputs(inputs: string[]): void {
  if (!Array.isArray(inputs)) {
    throw new EmbeddingError(
      'Inputs must be an array of strings',
      'INVALID_INPUT_TYPE'
    );
  }
  
  if (inputs.length === 0) {
    throw new EmbeddingError(
      'Inputs array cannot be empty',
      'EMPTY_INPUT_ARRAY'
    );
  }
  
  if (inputs.length > 100) {
    throw new EmbeddingError(
      'Too many inputs. Maximum 100 texts per batch',
      'BATCH_SIZE_EXCEEDED'
    );
  }
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (typeof input !== 'string') {
      throw new EmbeddingError(
        `Input at index ${i} must be a string, got ${typeof input}`,
        'INVALID_INPUT_TYPE'
      );
    }
    
    if (input.length === 0) {
      throw new EmbeddingError(
        `Input at index ${i} cannot be empty`,
        'EMPTY_INPUT_STRING'
      );
    }
    
    // Check for reasonable text length (adjust as needed)
    if (input.length > 8192) {
      throw new EmbeddingError(
        `Input at index ${i} is too long. Maximum 8192 characters`,
        'INPUT_TOO_LONG'
      );
    }
  }
}

/**
 * Generate embeddings for multiple texts using Qwen3-4B model
 * 
 * @param inputs Array of text strings to embed
 * @param retryConfig Optional retry configuration
 * @returns Promise resolving to 2D array of 2560-dimensional embeddings
 */
export async function embed4B(
  inputs: string[],
  retryConfig?: Partial<RetryConfig>
): Promise<number[][]> {
  validateInputs(inputs);
  
  const config = { ...defaultRetryConfig, ...retryConfig };
  const modelName = serverConfig.embeddings.dashscope.modelName;
  
  return withRetry(
    async () => {
      try {
        const client = getOpenAIClient();
        
        const response = await client.embeddings.create({
          model: modelName,
          input: inputs,
          encoding_format: 'float',
        });
        
        if (!response.data || response.data.length === 0) {
          throw new EmbeddingError(
            'No embeddings returned from API',
            'EMPTY_RESPONSE'
          );
        }
        
        if (response.data.length !== inputs.length) {
          throw new EmbeddingError(
            `Expected ${inputs.length} embeddings, got ${response.data.length}`,
            'EMBEDDING_COUNT_MISMATCH'
          );
        }
        
        const embeddings: number[][] = [];
        
        for (let i = 0; i < response.data.length; i++) {
          const embedding = response.data[i]?.embedding;
          
          if (!embedding || !Array.isArray(embedding)) {
            throw new EmbeddingError(
              `Invalid embedding at index ${i}`,
              'INVALID_EMBEDDING_FORMAT'
            );
          }
          
          // Verify embedding dimensions (Qwen3-4B should return 2560 dimensions)
          if (embedding.length !== 2560) {
            throw new EmbeddingError(
              `Expected 2560 dimensions, got ${embedding.length} at index ${i}`,
              'INVALID_EMBEDDING_DIMENSIONS'
            );
          }
          
          embeddings.push(embedding);
        }
        
        return embeddings;
        
      } catch (error) {
        if (error instanceof OpenAI.APIError) {
          throw new EmbeddingError(
            `DashScope API error: ${error.message}`,
            'API_ERROR',
            error.status,
            error
          );
        }
        
        if (error instanceof EmbeddingError) {
          throw error;
        }
        
        throw new EmbeddingError(
          `Unexpected error during embedding generation: ${error instanceof Error ? error.message : String(error)}`,
          'UNKNOWN_ERROR',
          undefined,
          error
        );
      }
    },
    config,
    'Batch embedding generation'
  );
}

/**
 * Generate embedding for a single text using Qwen3-4B model
 * 
 * @param input Text string to embed
 * @param retryConfig Optional retry configuration
 * @returns Promise resolving to 2560-dimensional embedding array
 */
export async function embedOne4B(
  input: string,
  retryConfig?: Partial<RetryConfig>
): Promise<number[]> {
  if (typeof input !== 'string') {
    throw new EmbeddingError(
      `Input must be a string, got ${typeof input}`,
      'INVALID_INPUT_TYPE'
    );
  }
  
  if (input.length === 0) {
    throw new EmbeddingError(
      'Input cannot be empty',
      'EMPTY_INPUT_STRING'
    );
  }
  
  const embeddings = await embed4B([input], retryConfig);
  return embeddings[0]!;
}

/**
 * Get embedding configuration for debugging/monitoring
 */
export function getEmbeddingConfig(): EmbeddingConfig {
  const config = serverConfig.embeddings.dashscope;
  
  return {
    apiKey: config.apiKey ? `${config.apiKey.slice(0, 8)}...` : 'NOT_SET',
    baseURL: config.baseUrl,
    model: config.modelName,
    dimensions: 2560,
  };
}

/**
 * Test the embedding client connection
 */
export async function testEmbeddingClient(): Promise<{
  success: boolean;
  config: EmbeddingConfig;
  error?: string;
}> {
  const config = getEmbeddingConfig();
  
  try {
    await embedOne4B('test connection');
    
    return {
      success: true,
      config,
    };
  } catch (error) {
    return {
      success: false,
      config,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate environment configuration for DashScope
 */
export function validateEnvironmentConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const config = serverConfig.embeddings.dashscope;
    
    // Check API key
    if (!config.apiKey || config.apiKey === 'sk-your-dashscope-api-key-here') {
      errors.push('DASHSCOPE_API_KEY is not set or using placeholder value. Get your API key from https://dashscope.console.aliyun.com/');
    }
    
    // Check base URL
    if (!config.baseUrl) {
      errors.push('DASHSCOPE_BASE_URL is not set');
    } else if (!config.baseUrl.startsWith('https://')) {
      warnings.push('DASHSCOPE_BASE_URL should use HTTPS for security');
    }
    
    // Check model name
    if (!config.modelName) {
      errors.push('QWEN_MODEL_NAME is not set');
    } else if (config.modelName !== 'text-embedding-v3') {
      warnings.push(`Using model "${config.modelName}" instead of recommended "text-embedding-v3"`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to validate environment configuration: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
    };
  }
}