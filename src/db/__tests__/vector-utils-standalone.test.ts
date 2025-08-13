import { describe, it, expect } from 'vitest';

/**
 * Vector utility functions for pgvector operations
 */

/**
 * Serializes a number array to pgvector string format
 * @param vector - Array of numbers representing the embedding vector
 * @returns String in pgvector format: "[1.0,2.0,3.0]"
 * @throws Error if vector is invalid
 */
function serializeVector(vector: number[]): string {
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
function deserializeVector(vectorString: string): number[] {
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
function validateVectorDimensions(vector: number[], expectedDimensions: number = 2560): void {
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
function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
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
async function withVectorErrorHandling<T>(
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

describe('Vector Utilities', () => {
  describe('serializeVector', () => {
    it('should serialize a valid vector to pgvector format', () => {
      const vector = [1.0, 2.5, -3.7, 0.0];
      const result = serializeVector(vector);
      expect(result).toBe('[1,2.5,-3.7,0]');
    });

    it('should handle empty vector with error', () => {
      expect(() => serializeVector([])).toThrow('Vector cannot be empty');
    });

    it('should handle non-array input with error', () => {
      expect(() => serializeVector('not an array' as any)).toThrow('Vector must be an array of numbers');
    });

    it('should handle invalid numbers with error', () => {
      expect(() => serializeVector([1, NaN, 3])).toThrow('Invalid vector element at index 1');
      expect(() => serializeVector([1, Infinity, 3])).toThrow('Invalid vector element at index 1');
    });
  });

  describe('deserializeVector', () => {
    it('should deserialize a valid pgvector string', () => {
      const vectorString = '[1.0,2.5,-3.7,0.0]';
      const result = deserializeVector(vectorString);
      expect(result).toEqual([1.0, 2.5, -3.7, 0.0]);
    });

    it('should handle malformed vector string with error', () => {
      expect(() => deserializeVector('1,2,3')).toThrow('Vector string must be in format [1.0,2.0,3.0]');
      expect(() => deserializeVector('[1,2,3')).toThrow('Vector string must be in format [1.0,2.0,3.0]');
      expect(() => deserializeVector('1,2,3]')).toThrow('Vector string must be in format [1.0,2.0,3.0]');
    });

    it('should handle empty vector string with error', () => {
      expect(() => deserializeVector('[]')).toThrow('Vector string cannot be empty');
    });

    it('should handle invalid elements with error', () => {
      expect(() => deserializeVector('[1,abc,3]')).toThrow('Invalid vector element at index 1');
      expect(() => deserializeVector('[1,,3]')).toThrow('Invalid vector element at index 1');
    });

    it('should handle non-string input with error', () => {
      expect(() => deserializeVector(123 as any)).toThrow('Vector string must be a string');
    });
  });

  describe('validateVectorDimensions', () => {
    it('should validate correct dimensions for Qwen3-4B (2560)', () => {
      const vector = new Array(2560).fill(0.5);
      expect(() => validateVectorDimensions(vector)).not.toThrow();
    });

    it('should validate custom dimensions', () => {
      const vector = [1, 2, 3];
      expect(() => validateVectorDimensions(vector, 3)).not.toThrow();
    });

    it('should throw error for incorrect dimensions', () => {
      const vector = [1, 2, 3];
      expect(() => validateVectorDimensions(vector)).toThrow('Vector dimension mismatch: expected 2560, got 3');
      expect(() => validateVectorDimensions(vector, 5)).toThrow('Vector dimension mismatch: expected 5, got 3');
    });
  });

  describe('calculateCosineSimilarity', () => {
    it('should calculate cosine similarity for identical vectors', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2, 3];
      const similarity = calculateCosineSimilarity(vectorA, vectorB);
      expect(similarity).toBeCloseTo(1.0, 10);
    });

    it('should calculate cosine similarity for orthogonal vectors', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];
      const similarity = calculateCosineSimilarity(vectorA, vectorB);
      expect(similarity).toBeCloseTo(0.0, 10);
    });

    it('should calculate cosine similarity for opposite vectors', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [-1, -2, -3];
      const similarity = calculateCosineSimilarity(vectorA, vectorB);
      expect(similarity).toBeCloseTo(-1.0, 10);
    });

    it('should handle dimension mismatch with error', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2];
      expect(() => calculateCosineSimilarity(vectorA, vectorB)).toThrow('Vector dimension mismatch: 3 vs 2');
    });

    it('should handle zero vectors with error', () => {
      const vectorA = [0, 0, 0];
      const vectorB = [1, 2, 3];
      expect(() => calculateCosineSimilarity(vectorA, vectorB)).toThrow('Cannot calculate cosine similarity for zero vectors');
    });

    it('should handle invalid inputs with error', () => {
      expect(() => calculateCosineSimilarity('not array' as any, [1, 2, 3])).toThrow('Both inputs must be arrays of numbers');
      expect(() => calculateCosineSimilarity([], [])).toThrow('Vectors cannot be empty');
      expect(() => calculateCosineSimilarity([1, NaN, 3], [1, 2, 3])).toThrow('Invalid vector elements at index 1');
    });
  });

  describe('withVectorErrorHandling', () => {
    it('should execute successful operations without modification', async () => {
      const result = await withVectorErrorHandling(() => 'success', 'test operation');
      expect(result).toBe('success');
    });

    it('should enhance vector-related errors', async () => {
      const operation = () => {
        throw new Error('vector dimension mismatch');
      };
      
      await expect(withVectorErrorHandling(operation, 'test operation'))
        .rejects.toThrow('Vector dimension error in test operation: vector dimension mismatch');
    });

    it('should enhance pgvector-related errors', async () => {
      const operation = () => {
        throw new Error('pgvector extension not found');
      };
      
      await expect(withVectorErrorHandling(operation, 'test operation'))
        .rejects.toThrow('pgvector extension error in test operation: pgvector extension not found');
    });

    it('should handle generic errors', async () => {
      const operation = () => {
        throw new Error('generic database error');
      };
      
      await expect(withVectorErrorHandling(operation, 'test operation'))
        .rejects.toThrow('Database operation failed in test operation: generic database error');
    });

    it('should handle async operations', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return 'async success';
      };
      
      const result = await withVectorErrorHandling(operation, 'async test');
      expect(result).toBe('async success');
    });
  });

  describe('Integration tests', () => {
    it('should serialize and deserialize vectors correctly', () => {
      const originalVector = [1.5, -2.7, 0.0, 3.14159];
      const serialized = serializeVector(originalVector);
      const deserialized = deserializeVector(serialized);
      
      expect(deserialized).toEqual(originalVector);
    });

    it('should work with Qwen3-4B dimension vectors', () => {
      // Create a 2560-dimensional vector
      const vector = Array.from({ length: 2560 }, (_, i) => Math.sin(i * 0.01));
      
      // Should not throw for correct dimensions
      expect(() => validateVectorDimensions(vector)).not.toThrow();
      
      // Should serialize and deserialize correctly
      const serialized = serializeVector(vector);
      const deserialized = deserializeVector(serialized);
      
      expect(deserialized).toHaveLength(2560);
      expect(deserialized).toEqual(vector);
    });
  });
});