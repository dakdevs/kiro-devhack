/**
 * Example usage of vector utilities for Qwen3-4B embeddings
 * This file demonstrates how to use the vector utilities in practice
 */

import {
  serializeVector,
  deserializeVector,
  validateVectorDimensions,
  calculateCosineSimilarity,
  withVectorErrorHandling,
} from './index';

// Example: Working with Qwen3-4B embeddings (2560 dimensions)
export async function exampleVectorOperations() {
  // Create a sample 2560-dimensional vector (normally this would come from the embedding API)
  const sampleEmbedding = Array.from({ length: 2560 }, (_, i) => Math.sin(i * 0.01));
  
  console.log('=== Vector Utilities Example ===');
  
  // 1. Validate dimensions
  try {
    validateVectorDimensions(sampleEmbedding);
    console.log('✓ Vector dimensions are valid for Qwen3-4B (2560)');
  } catch (error) {
    console.error('✗ Vector dimension validation failed:', error);
  }
  
  // 2. Serialize vector for database storage
  const serialized = serializeVector(sampleEmbedding);
  console.log('✓ Vector serialized for pgvector storage');
  console.log(`  Format: ${serialized.substring(0, 50)}...${serialized.substring(serialized.length - 10)}`);
  
  // 3. Deserialize vector from database
  const deserialized = deserializeVector(serialized);
  console.log('✓ Vector deserialized from pgvector format');
  console.log(`  Length: ${deserialized.length} dimensions`);
  
  // 4. Verify round-trip accuracy
  const isAccurate = sampleEmbedding.every((val, idx) => Math.abs(val - deserialized[idx]) < 1e-10);
  console.log(`✓ Round-trip accuracy: ${isAccurate ? 'Perfect' : 'Loss detected'}`);
  
  // 5. Calculate similarity between vectors
  const similarVector = sampleEmbedding.map(val => val * 0.9 + 0.1); // Slightly modified
  const similarity = calculateCosineSimilarity(sampleEmbedding, similarVector);
  console.log(`✓ Cosine similarity calculated: ${similarity.toFixed(6)}`);
  
  // 6. Error handling example
  await withVectorErrorHandling(async () => {
    // Simulate a vector operation that might fail
    const result = serializeVector(sampleEmbedding);
    return result;
  }, 'example vector serialization');
  console.log('✓ Error handling wrapper works correctly');
  
  console.log('=== Example completed successfully ===');
}

// Example: Database integration (pseudo-code)
export async function exampleDatabaseIntegration() {
  console.log('\n=== Database Integration Example ===');
  
  // This would be the typical workflow:
  
  // 1. Get embedding from Qwen3-4B API (this would be implemented in task 5)
  const mockEmbedding = Array.from({ length: 2560 }, () => Math.random());
  
  // 2. Validate and serialize for database
  validateVectorDimensions(mockEmbedding);
  const serializedEmbedding = serializeVector(mockEmbedding);
  
  console.log('✓ Ready for database insertion');
  console.log(`  Serialized length: ${serializedEmbedding.length} characters`);
  
  // 3. When retrieving from database, deserialize
  const retrievedEmbedding = deserializeVector(serializedEmbedding);
  
  // 4. Use for similarity search
  const queryEmbedding = Array.from({ length: 2560 }, () => Math.random());
  const similarity = calculateCosineSimilarity(retrievedEmbedding, queryEmbedding);
  
  console.log(`✓ Similarity search ready: ${similarity.toFixed(6)}`);
  console.log('=== Database integration example completed ===');
}

// Run examples if this file is executed directly
if (require.main === module) {
  exampleVectorOperations()
    .then(() => exampleDatabaseIntegration())
    .catch(console.error);
}