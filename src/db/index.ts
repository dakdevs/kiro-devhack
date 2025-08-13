import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { serverConfig } from '~/config/server-config';

const pool = new Pool({
  connectionString: serverConfig.db.url,
});

export const db = drizzle(pool, { schema });

/**
 * Vector utility functions for pgvector operations
 */

/**
 * Serializes a number array to pgvector string format
 * @param vector - Array of numbers representing the embedding vector
 * @returns String in pgvector format: "[1.0,2.0,3.0]"
 * @throws Error if vector is invalid
 */
export function serializeVector(vector: number[]): string {
  try {
    if (!Array.isArray(vector)) {
      throw new Error('Vector must be an array of numbers');
    }
    
    if (vector.length === 0) {
      throw new Error('Vector cannot be empty');
    }
    
    // Validate all elements are numbers
    for (let i = 0; i < vector.length; i++) {
      if (typeof vector[i] !== 'number' || !isFinite(vector[i])) {
        throw new Error(`Invalid vector element at index ${i}: ${vector[i]}. All elements must be finite numbers.`);
      }
    }
    
    // Convert to pgvector format: [1.0,2.0,3.0]
    return `[${vector.join(',')}]`;
  } catch (error) {
    throw new Error(`Failed to serialize vector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deserializes a pgvector string to number array
 * @param vectorString - String in pgvector format: "[1.0,2.0,3.0]"
 * @returns Array of numbers representing the embedding vector
 * @throws Error if vectorString is invalid
 */
export function deserializeVector(vectorString: string): number[] {
  try {
    if (typeof vectorString !== 'string') {
      throw new Error('Vector string must be a string');
    }
    
    if (!vectorString.startsWith('[') || !vectorString.endsWith(']')) {
      throw new Error('Vector string must be in format [1.0,2.0,3.0]');
    }
    
    // Remove brackets and split by comma
    const innerString = vectorString.slice(1, -1);
    
    if (innerString.length === 0) {
      throw new Error('Vector string cannot be empty');
    }
    
    const elements = innerString.split(',');
    const vector: number[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i].trim();
      const num = parseFloat(element);
      
      if (isNaN(num) || !isFinite(num)) {
        throw new Error(`Invalid vector element at index ${i}: "${element}". All elements must be finite numbers.`);
      }
      
      vector.push(num);
    }
    
    return vector;
  } catch (error) {
    throw new Error(`Failed to deserialize vector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates vector dimensions for Qwen3-4B embeddings
 * @param vector - Array of numbers representing the embedding vector
 * @param expectedDimensions - Expected number of dimensions (default: 2560 for Qwen3-4B)
 * @throws Error if vector dimensions don't match expected
 */
export function validateVectorDimensions(vector: number[], expectedDimensions: number = 2560): void {
  if (vector.length !== expectedDimensions) {
    throw new Error(`Vector dimension mismatch: expected ${expectedDimensions}, got ${vector.length}`);
  }
}

/**
 * Calculates cosine similarity between two vectors
 * @param vectorA - First vector
 * @param vectorB - Second vector
 * @returns Cosine similarity score between -1 and 1
 * @throws Error if vectors have different dimensions or are invalid
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  try {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
      throw new Error('Both inputs must be arrays of numbers');
    }
    
    if (vectorA.length !== vectorB.length) {
      throw new Error(`Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}`);
    }
    
    if (vectorA.length === 0) {
      throw new Error('Vectors cannot be empty');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      if (typeof vectorA[i] !== 'number' || typeof vectorB[i] !== 'number' || 
          !isFinite(vectorA[i]) || !isFinite(vectorB[i])) {
        throw new Error(`Invalid vector elements at index ${i}: ${vectorA[i]}, ${vectorB[i]}`);
      }
      
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) {
      throw new Error('Cannot calculate cosine similarity for zero vectors');
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  } catch (error) {
    throw new Error(`Failed to calculate cosine similarity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Error handling wrapper for vector operations
 * @param operation - Function that performs vector operations
 * @param context - Context description for error messages
 * @returns Result of the operation or throws enhanced error
 */
export async function withVectorErrorHandling<T>(
  operation: () => Promise<T> | T,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific error types first (most specific to least specific)
      if (error.message.includes('pgvector')) {
        throw new Error(`pgvector extension error in ${context}: ${error.message}`);
      }
      if (error.message.includes('dimension')) {
        throw new Error(`Vector dimension error in ${context}: ${error.message}`);
      }
      if (error.message.includes('vector')) {
        throw new Error(`Vector operation failed in ${context}: ${error.message}`);
      }
    }
    
    throw new Error(`Database operation failed in ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}