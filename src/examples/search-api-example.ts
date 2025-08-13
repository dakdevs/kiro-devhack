/**
 * Example usage of the semantic search API endpoint
 * 
 * This file demonstrates how to use the /api/search endpoint
 * to perform semantic search using Qwen3-4B embeddings.
 */

/**
 * Example: Basic semantic search
 */
export async function exampleBasicSearch() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('Performing basic semantic search...');
    
    const response = await fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'machine learning algorithms',
        k: 5,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Search completed successfully!');
      console.log(`🔍 Query: "${result.query}"`);
      console.log(`📊 Found ${result.count} results in ${result.executionTime}ms`);
      
      result.results.forEach((doc: any, index: number) => {
        console.log(`\n${index + 1}. ${doc.metadata.title || 'Untitled'} (similarity: ${doc.similarity})`);
        console.log(`   Content: ${doc.content.substring(0, 100)}...`);
        console.log(`   ID: ${doc.id}`);
      });
      
      return result;
    } else {
      console.error('❌ Search failed:', result.error);
      if (result.details) {
        console.error('📝 Details:', result.details);
      }
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    throw error;
  }
}

/**
 * Example: Search with similarity threshold
 */
export async function exampleThresholdSearch() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('Performing search with similarity threshold...');
    
    const response = await fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'vector databases and embeddings',
        k: 10,
        threshold: 0.7, // Only return results with similarity >= 0.7
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Threshold search completed!');
      console.log(`🔍 Query: "${result.query}"`);
      console.log(`📊 Found ${result.count} results above 0.7 similarity`);
      
      if (result.results.length === 0) {
        console.log('📭 No results found above the similarity threshold');
      } else {
        result.results.forEach((doc: any, index: number) => {
          console.log(`\n${index + 1}. Similarity: ${doc.similarity}`);
          console.log(`   Content: ${doc.content.substring(0, 150)}...`);
          console.log(`   Category: ${doc.metadata.category || 'Unknown'}`);
        });
      }
      
      return result;
    } else {
      console.error('❌ Threshold search failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    throw error;
  }
}

/**
 * Example: Multiple search queries comparison
 */
export async function exampleMultipleQueries() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const queries = [
    'artificial intelligence and machine learning',
    'database systems and data storage',
    'web development frameworks',
    'computer vision and image processing',
  ];

  console.log('Comparing multiple search queries...');

  for (const query of queries) {
    try {
      console.log(`\n🔍 Searching for: "${query}"`);
      
      const response = await fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k: 3,
          threshold: 0.5,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`   📊 ${result.count} results in ${result.executionTime}ms`);
        
        if (result.results.length > 0) {
          const topResult = result.results[0];
          console.log(`   🥇 Top result: ${topResult.similarity.toFixed(3)} similarity`);
          console.log(`      "${topResult.content.substring(0, 80)}..."`);
        } else {
          console.log('   📭 No results found');
        }
      } else {
        console.error(`   ❌ Search failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`   ❌ Network error for "${query}":`, error);
    }
  }
}

/**
 * Example: Get API documentation
 */
export async function exampleGetSearchDocumentation() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('Fetching search API documentation...');
    
    const response = await fetch(`${baseUrl}/api/search`, {
      method: 'GET',
    });

    const documentation = await response.json();

    console.log('📚 Search API Documentation:');
    console.log('🔗 Endpoint:', documentation.endpoint);
    console.log('📝 Method:', documentation.method);
    console.log('📖 Description:', documentation.description);
    console.log('📊 Limits:', documentation.limits);
    console.log('🎯 Similarity Scoring:', documentation.similarityScoring);
    console.log('💡 Tips:', documentation.tips);
    
    return documentation;
  } catch (error) {
    console.error('❌ Failed to fetch documentation:', error);
    throw error;
  }
}

/**
 * Example: Test error handling
 */
export async function exampleTestSearchErrors() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const invalidRequests = [
    {
      name: 'Empty query',
      data: { query: '' },
    },
    {
      name: 'Query too long',
      data: { query: 'x'.repeat(1001) },
    },
    {
      name: 'Invalid k value',
      data: { query: 'test', k: 0 },
    },
    {
      name: 'k value too large',
      data: { query: 'test', k: 101 },
    },
    {
      name: 'Invalid threshold',
      data: { query: 'test', threshold: -0.1 },
    },
    {
      name: 'Threshold too high',
      data: { query: 'test', threshold: 1.1 },
    },
  ];

  console.log('Testing search API error handling...');

  for (const testCase of invalidRequests) {
    try {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      const response = await fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });

      const result = await response.json();

      if (!response.ok && !result.success) {
        console.log(`✅ Correctly rejected: ${result.error}`);
        if (result.details) {
          console.log(`📝 Details: ${result.details}`);
        }
      } else {
        console.log(`❌ Unexpectedly accepted invalid data`);
      }
    } catch (error) {
      console.error(`❌ Network error for ${testCase.name}:`, error);
    }
  }
}

/**
 * Example: Performance testing with different query types
 */
export async function examplePerformanceTesting() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const testQueries = [
    { type: 'Short query', query: 'AI' },
    { type: 'Medium query', query: 'machine learning algorithms for data analysis' },
    { type: 'Long query', query: 'comprehensive guide to implementing vector databases with pgvector extension for semantic search applications using high-dimensional embeddings' },
    { type: 'Technical query', query: 'PostgreSQL pgvector cosine similarity search optimization' },
    { type: 'General query', query: 'how to build web applications with modern frameworks' },
  ];

  console.log('Performance testing with different query types...');

  const results = [];

  for (const testQuery of testQueries) {
    try {
      console.log(`\n⏱️  Testing: ${testQuery.type}`);
      console.log(`   Query: "${testQuery.query}"`);
      
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery.query,
          k: 5,
        }),
      });

      const result = await response.json();
      const totalTime = Date.now() - startTime;

      if (response.ok && result.success) {
        console.log(`   ✅ Success: ${result.count} results`);
        console.log(`   ⚡ Server time: ${result.executionTime}ms`);
        console.log(`   🌐 Total time: ${totalTime}ms`);
        
        results.push({
          type: testQuery.type,
          queryLength: testQuery.query.length,
          serverTime: result.executionTime,
          totalTime,
          resultCount: result.count,
        });
      } else {
        console.error(`   ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`   ❌ Network error:`, error);
    }
  }

  // Summary
  if (results.length > 0) {
    console.log('\n📊 Performance Summary:');
    const avgServerTime = results.reduce((sum, r) => sum + r.serverTime, 0) / results.length;
    const avgTotalTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
    
    console.log(`   Average server time: ${avgServerTime.toFixed(1)}ms`);
    console.log(`   Average total time: ${avgTotalTime.toFixed(1)}ms`);
    console.log(`   Fastest query: ${Math.min(...results.map(r => r.serverTime))}ms`);
    console.log(`   Slowest query: ${Math.max(...results.map(r => r.serverTime))}ms`);
  }

  return results;
}

/**
 * Run all search examples
 */
export async function runSearchExamples() {
  console.log('🚀 Running semantic search API examples...\n');

  try {
    // Get API documentation
    await exampleGetSearchDocumentation();
    
    console.log('\n' + '='.repeat(50));
    
    // Basic search
    await exampleBasicSearch();
    
    console.log('\n' + '='.repeat(50));
    
    // Threshold search
    await exampleThresholdSearch();
    
    console.log('\n' + '='.repeat(50));
    
    // Multiple queries
    await exampleMultipleQueries();
    
    console.log('\n' + '='.repeat(50));
    
    // Error handling
    await exampleTestSearchErrors();
    
    console.log('\n' + '='.repeat(50));
    
    // Performance testing
    await examplePerformanceTesting();
    
    console.log('\n✅ All search examples completed!');
  } catch (error) {
    console.error('\n❌ Search examples failed:', error);
  }
}

// Export all examples for easy access
export const searchApiExamples = {
  basicSearch: exampleBasicSearch,
  thresholdSearch: exampleThresholdSearch,
  multipleQueries: exampleMultipleQueries,
  getDocumentation: exampleGetSearchDocumentation,
  testErrors: exampleTestSearchErrors,
  performanceTesting: examplePerformanceTesting,
  runAll: runSearchExamples,
};