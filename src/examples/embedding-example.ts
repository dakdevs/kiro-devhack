/**
 * Example usage of the Qwen3-4B embedding client
 * 
 * This file demonstrates how to use the embedding functions
 * for generating 2560-dimensional embeddings using DashScope API.
 */

import { embed4B, embedOne4B, getEmbeddingConfig, testEmbeddingClient, EmbeddingError } from '../embeddings';

/**
 * Example: Generate embeddings for multiple texts
 */
export async function exampleBatchEmbedding() {
  try {
    console.log('Generating embeddings for multiple texts...');
    
    const texts = [
      'The quick brown fox jumps over the lazy dog',
      'Machine learning is a subset of artificial intelligence',
      'Vector databases enable semantic search capabilities',
    ];
    
    const embeddings = await embed4B(texts);
    
    console.log(`Generated ${embeddings.length} embeddings`);
    console.log(`Each embedding has ${embeddings[0]?.length} dimensions`);
    
    return embeddings;
  } catch (error) {
    if (error instanceof EmbeddingError) {
      console.error(`Embedding error [${error.code}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

/**
 * Example: Generate embedding for a single text
 */
export async function exampleSingleEmbedding() {
  try {
    console.log('Generating embedding for single text...');
    
    const text = 'This is a sample text for embedding generation';
    const embedding = await embedOne4B(text);
    
    console.log(`Generated embedding with ${embedding.length} dimensions`);
    console.log(`First few values: [${embedding.slice(0, 5).join(', ')}...]`);
    
    return embedding;
  } catch (error) {
    if (error instanceof EmbeddingError) {
      console.error(`Embedding error [${error.code}]:`, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

/**
 * Example: Test the embedding client configuration
 */
export async function exampleTestConnection() {
  try {
    console.log('Testing embedding client connection...');
    
    const result = await testEmbeddingClient();
    
    if (result.success) {
      console.log('✅ Connection successful!');
      console.log('Configuration:', result.config);
    } else {
      console.log('❌ Connection failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
}

/**
 * Example: Get current configuration
 */
export function exampleGetConfig() {
  console.log('Current embedding configuration:');
  
  const config = getEmbeddingConfig();
  console.log('- API Key:', config.apiKey);
  console.log('- Base URL:', config.baseURL);
  console.log('- Model:', config.model);
  console.log('- Dimensions:', config.dimensions);
  
  return config;
}

/**
 * Example: Error handling with retry configuration
 */
export async function exampleWithRetryConfig() {
  try {
    console.log('Generating embedding with custom retry configuration...');
    
    const text = 'Sample text with custom retry settings';
    
    // Custom retry configuration
    const retryConfig = {
      maxRetries: 5,
      baseDelay: 2000, // 2 seconds
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2,
    };
    
    const embedding = await embedOne4B(text, retryConfig);
    
    console.log(`Generated embedding with ${embedding.length} dimensions`);
    
    return embedding;
  } catch (error) {
    if (error instanceof EmbeddingError) {
      console.error(`Embedding error [${error.code}]:`, error.message);
      if (error.originalError) {
        console.error('Original error:', error.originalError);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

/**
 * Example: Calculate cosine similarity between two embeddings
 */
export function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i]! * embedding2[i]!;
    norm1 += embedding1[i]! * embedding1[i]!;
    norm2 += embedding2[i]! * embedding2[i]!;
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Example: Compare similarity between texts
 */
export async function exampleSimilarityComparison() {
  try {
    console.log('Comparing similarity between texts...');
    
    const texts = [
      'The cat sits on the mat',
      'A feline rests on the rug',
      'The weather is sunny today',
    ];
    
    const embeddings = await embed4B(texts);
    
    // Compare first two texts (similar meaning)
    const similarity1 = calculateCosineSimilarity(embeddings[0]!, embeddings[1]!);
    console.log(`Similarity between "${texts[0]}" and "${texts[1]}": ${similarity1.toFixed(4)}`);
    
    // Compare first and third texts (different meaning)
    const similarity2 = calculateCosineSimilarity(embeddings[0]!, embeddings[2]!);
    console.log(`Similarity between "${texts[0]}" and "${texts[2]}": ${similarity2.toFixed(4)}`);
    
    return {
      texts,
      embeddings,
      similarities: [similarity1, similarity2],
    };
  } catch (error) {
    console.error('Error in similarity comparison:', error);
    throw error;
  }
}

/**
 * Run all examples (for testing purposes)
 */
export async function runAllExamples() {
  console.log('🚀 Running all embedding examples...\n');
  
  try {
    // Test configuration
    console.log('1. Configuration:');
    exampleGetConfig();
    console.log();
    
    // Test connection
    console.log('2. Connection test:');
    await exampleTestConnection();
    console.log();
    
    // Single embedding
    console.log('3. Single embedding:');
    await exampleSingleEmbedding();
    console.log();
    
    // Batch embedding
    console.log('4. Batch embedding:');
    await exampleBatchEmbedding();
    console.log();
    
    // Custom retry config
    console.log('5. Custom retry configuration:');
    await exampleWithRetryConfig();
    console.log();
    
    // Similarity comparison
    console.log('6. Similarity comparison:');
    await exampleSimilarityComparison();
    console.log();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
    throw error;
  }
}

// Export all examples for easy access
export const embeddingExamples = {
  batchEmbedding: exampleBatchEmbedding,
  singleEmbedding: exampleSingleEmbedding,
  testConnection: exampleTestConnection,
  getConfig: exampleGetConfig,
  withRetryConfig: exampleWithRetryConfig,
  similarityComparison: exampleSimilarityComparison,
  runAll: runAllExamples,
};