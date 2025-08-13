/**
 * Example usage of the document ingestion API endpoint
 * 
 * This file demonstrates how to use the /api/ingest endpoint
 * to store documents with automatic Qwen3-4B embedding generation.
 */

/**
 * Example: Ingest documents using the API endpoint
 */
export async function exampleIngestDocuments() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const documents = [
    {
      content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.',
      metadata: {
        title: 'Introduction to Machine Learning',
        category: 'education',
        tags: ['ml', 'ai', 'tutorial'],
        author: 'AI Researcher',
        source: 'educational-content',
      },
    },
    {
      content: 'Vector databases enable semantic search by storing high-dimensional embeddings and supporting similarity queries.',
      metadata: {
        title: 'Vector Databases Explained',
        category: 'technology',
        tags: ['vectors', 'search', 'database', 'embeddings'],
        author: 'Database Expert',
        source: 'technical-blog',
      },
    },
    {
      content: 'Next.js is a React framework that provides server-side rendering, static site generation, and many other features.',
      metadata: {
        title: 'Next.js Framework Overview',
        category: 'web-development',
        tags: ['nextjs', 'react', 'framework', 'ssr'],
        author: 'Web Developer',
        source: 'documentation',
      },
    },
  ];

  try {
    console.log('Ingesting documents...');
    
    const response = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documents }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Documents ingested successfully!');
      console.log(`📊 Inserted ${result.insertedCount} documents`);
      console.log(`🆔 Document IDs: ${result.documentIds.join(', ')}`);
      return result;
    } else {
      console.error('❌ Ingestion failed:', result.error);
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
 * Example: Get API documentation
 */
export async function exampleGetApiDocumentation() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('Fetching API documentation...');
    
    const response = await fetch(`${baseUrl}/api/ingest`, {
      method: 'GET',
    });

    const documentation = await response.json();

    console.log('📚 API Documentation:');
    console.log('🔗 Endpoint:', documentation.endpoint);
    console.log('📝 Method:', documentation.method);
    console.log('📖 Description:', documentation.description);
    console.log('📊 Limits:', documentation.limits);
    
    return documentation;
  } catch (error) {
    console.error('❌ Failed to fetch documentation:', error);
    throw error;
  }
}

/**
 * Example: Test error handling with invalid data
 */
export async function exampleTestErrorHandling() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const invalidRequests = [
    {
      name: 'Empty documents array',
      data: { documents: [] },
    },
    {
      name: 'Document with empty content',
      data: {
        documents: [
          {
            content: '',
            metadata: { title: 'Empty Content' },
          },
        ],
      },
    },
    {
      name: 'Too many documents',
      data: {
        documents: new Array(101).fill({
          content: 'Test document',
          metadata: {},
        }),
      },
    },
    {
      name: 'Document with too long content',
      data: {
        documents: [
          {
            content: 'x'.repeat(50001), // Exceeds 50,000 character limit
            metadata: {},
          },
        ],
      },
    },
  ];

  console.log('Testing error handling...');

  for (const testCase of invalidRequests) {
    try {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      const response = await fetch(`${baseUrl}/api/ingest`, {
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
 * Example: Batch processing with different content types
 */
export async function exampleBatchProcessing() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const batches = [
    {
      name: 'Technical Documentation',
      documents: [
        {
          content: 'PostgreSQL is a powerful, open source object-relational database system with over 35 years of active development.',
          metadata: { category: 'database', type: 'documentation' },
        },
        {
          content: 'Docker containers wrap a piece of software in a complete filesystem that contains everything needed to run.',
          metadata: { category: 'devops', type: 'documentation' },
        },
      ],
    },
    {
      name: 'Educational Content',
      documents: [
        {
          content: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy.',
          metadata: { category: 'science', type: 'education', subject: 'biology' },
        },
        {
          content: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.',
          metadata: { category: 'mathematics', type: 'education', subject: 'geometry' },
        },
      ],
    },
  ];

  console.log('Processing document batches...');

  for (const batch of batches) {
    try {
      console.log(`\n📦 Processing batch: ${batch.name}`);
      
      const response = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: batch.documents }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ Batch processed: ${result.insertedCount} documents`);
      } else {
        console.error(`❌ Batch failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error processing batch ${batch.name}:`, error);
    }
  }
}

/**
 * Run all examples
 */
export async function runIngestExamples() {
  console.log('🚀 Running document ingestion API examples...\n');

  try {
    // Get API documentation
    await exampleGetApiDocumentation();
    
    console.log('\n' + '='.repeat(50));
    
    // Test basic ingestion
    await exampleIngestDocuments();
    
    console.log('\n' + '='.repeat(50));
    
    // Test error handling
    await exampleTestErrorHandling();
    
    console.log('\n' + '='.repeat(50));
    
    // Test batch processing
    await exampleBatchProcessing();
    
    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('\n❌ Examples failed:', error);
  }
}

// Export all examples for easy access
export const ingestApiExamples = {
  ingestDocuments: exampleIngestDocuments,
  getDocumentation: exampleGetApiDocumentation,
  testErrorHandling: exampleTestErrorHandling,
  batchProcessing: exampleBatchProcessing,
  runAll: runIngestExamples,
};