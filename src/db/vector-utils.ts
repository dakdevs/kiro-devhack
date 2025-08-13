/**
 * Utility functions for converting between JavaScript arrays and pgvector string format
 */

/**
 * Convert a number array to pgvector string format
 * @param vector - Array of numbers representing the vector
 * @returns String in pgvector format: "[1.0,2.0,3.0]"
 */
export function vectorToString(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

/**
 * Convert a pgvector string to number array
 * @param vectorString - String in pgvector format: "[1.0,2.0,3.0]"
 * @returns Array of numbers
 * @throws Error if the string format is invalid
 */
export function stringToVector(vectorString: string): number[] {
  // Remove whitespace and validate format
  const cleaned = vectorString.trim();
  
  if (!cleaned.startsWith('[') || !cleaned.endsWith(']')) {
    throw new Error('Invalid vector string format: must start with [ and end with ]');
  }
  
  const content = cleaned.slice(1, -1).trim();
  
  // Handle empty vector
  if (content === '') {
    return [];
  }
  
  try {
    const values = content.split(',').map(s => {
      const num = parseFloat(s.trim());
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${s.trim()}`);
      }
      return num;
    });
    
    return values;
  } catch (error) {
    throw new Error(`Invalid vector string format: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (magnitude === 0) {
    return 0;
  }
  
  return dotProduct / magnitude;
}