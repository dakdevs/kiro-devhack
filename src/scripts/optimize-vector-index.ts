#!/usr/bin/env tsx

/**
 * Vector Index Optimization Script
 * 
 * This script helps optimize HNSW index parameters for the documents table
 * based on expected dataset size and performance requirements.
 */

import { db } from '~/db';
import { sql } from 'drizzle-orm';
import { logger } from '~/lib/logger';
import { performanceMonitor } from '~/lib/performance-monitor';

interface IndexOptimizationConfig {
  expectedDocumentCount: number;
  targetSearchLatency: number; // milliseconds
  memoryBudget: 'low' | 'medium' | 'high';
  accuracyPriority: 'speed' | 'balanced' | 'accuracy';
}

interface HNSWParameters {
  m: number; // Maximum number of bi-directional links for each node
  efConstruction: number; // Size of the dynamic candidate list
  efSearch: number; // Size of the dynamic candidate list during search
}

/**
 * Calculate optimal HNSW parameters based on configuration
 */
function calculateOptimalParameters(config: IndexOptimizationConfig): HNSWParameters {
  const { expectedDocumentCount, memoryBudget, accuracyPriority } = config;
  
  let m: number;
  let efConstruction: number;
  let efSearch: number;
  
  // Base parameters on dataset size
  if (expectedDocumentCount < 10000) {
    // Small dataset
    m = 16;
    efConstruction = 200;
    efSearch = 100;
  } else if (expectedDocumentCount < 100000) {
    // Medium dataset
    m = 16;
    efConstruction = 400;
    efSearch = 200;
  } else if (expectedDocumentCount < 1000000) {
    // Large dataset
    m = 32;
    efConstruction = 400;
    efSearch = 300;
  } else {
    // Very large dataset
    m = 48;
    efConstruction = 500;
    efSearch = 400;
  }
  
  // Adjust based on memory budget
  switch (memoryBudget) {
    case 'low':
      m = Math.max(8, Math.floor(m * 0.75));
      efConstruction = Math.floor(efConstruction * 0.75);
      efSearch = Math.floor(efSearch * 0.75);
      break;
    case 'high':
      m = Math.min(64, Math.floor(m * 1.5));
      efConstruction = Math.floor(efConstruction * 1.5);
      efSearch = Math.floor(efSearch * 1.5);
      break;
    // 'medium' uses default values
  }
  
  // Adjust based on accuracy priority
  switch (accuracyPriority) {
    case 'speed':
      efConstruction = Math.floor(efConstruction * 0.8);
      efSearch = Math.floor(efSearch * 0.7);
      break;
    case 'accuracy':
      efConstruction = Math.floor(efConstruction * 1.3);
      efSearch = Math.floor(efSearch * 1.5);
      break;
    // 'balanced' uses default values
  }
  
  return { m, efConstruction, efSearch };\n}\n\n/**\n * Apply HNSW parameters to the database index\n */\nasync function applyIndexParameters(params: HNSWParameters): Promise<void> {\n  const { m, efConstruction, efSearch } = params;\n  \n  logger.info('Applying HNSW index parameters', { m, efConstruction, efSearch });\n  \n  try {\n    // Drop existing index if it exists\n    await db.execute(sql`DROP INDEX IF EXISTS documents_embedding_hnsw_idx`);\n    \n    // Create new index with optimized parameters\n    await db.execute(sql`\n      CREATE INDEX documents_embedding_hnsw_idx \n      ON documents \n      USING hnsw (embedding vector_cosine_ops) \n      WITH (m = ${sql.raw(m.toString())}, ef_construction = ${sql.raw(efConstruction.toString())})\n    `);\n    \n    // Set ef_search parameter for the session\n    await db.execute(sql`SET hnsw.ef_search = ${sql.raw(efSearch.toString())}`);\n    \n    logger.info('HNSW index parameters applied successfully');\n  } catch (error) {\n    logger.error('Failed to apply HNSW index parameters', { error, params });\n    throw error;\n  }\n}\n\n/**\n * Benchmark search performance with current index parameters\n */\nasync function benchmarkSearchPerformance(sampleQueries: string[] = []): Promise<{\n  avgLatency: number;\n  p95Latency: number;\n  p99Latency: number;\n  throughput: number;\n}> {\n  const { embedOne4B } = await import('~/embeddings');\n  const { serializeVector } = await import('~/db');\n  \n  // Default sample queries if none provided\n  const queries = sampleQueries.length > 0 ? sampleQueries : [\n    'artificial intelligence machine learning',\n    'database optimization performance',\n    'web development best practices',\n    'data science analytics',\n    'software engineering patterns'\n  ];\n  \n  const latencies: number[] = [];\n  const iterations = 20; // Run each query multiple times\n  \n  logger.info('Starting search performance benchmark', { \n    queryCount: queries.length, \n    iterations \n  });\n  \n  for (const query of queries) {\n    // Generate embedding for the query\n    const queryEmbedding = await embedOne4B(query);\n    const queryVector = serializeVector(queryEmbedding);\n    \n    for (let i = 0; i < iterations; i++) {\n      const timer = performanceMonitor.startTimer('benchmark_search');\n      \n      await db.execute(sql`\n        SELECT \n          id,\n          content,\n          metadata,\n          1 - (embedding <=> ${queryVector}::vector) as similarity\n        FROM documents \n        WHERE 1 - (embedding <=> ${queryVector}::vector) >= 0.7\n        ORDER BY embedding <=> ${queryVector}::vector\n        LIMIT 10\n      `);\n      \n      const latency = timer.end();\n      latencies.push(latency);\n    }\n  }\n  \n  // Calculate statistics\n  latencies.sort((a, b) => a - b);\n  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;\n  const p95Index = Math.floor(latencies.length * 0.95);\n  const p99Index = Math.floor(latencies.length * 0.99);\n  const p95Latency = latencies[p95Index];\n  const p99Latency = latencies[p99Index];\n  const throughput = (queries.length * iterations) / (latencies.reduce((sum, lat) => sum + lat, 0) / 1000);\n  \n  const results = {\n    avgLatency: Math.round(avgLatency),\n    p95Latency: Math.round(p95Latency),\n    p99Latency: Math.round(p99Latency),\n    throughput: Math.round(throughput * 100) / 100\n  };\n  \n  logger.info('Search performance benchmark completed', results);\n  \n  return results;\n}\n\n/**\n * Get current document count from the database\n */\nasync function getCurrentDocumentCount(): Promise<number> {\n  try {\n    const result = await db.execute(sql`SELECT COUNT(*) as count FROM documents`);\n    return parseInt(result.rows[0].count as string);\n  } catch (error) {\n    logger.warn('Could not get document count, assuming 0', { error });\n    return 0;\n  }\n}\n\n/**\n * Main optimization function\n */\nexport async function optimizeVectorIndex(config?: Partial<IndexOptimizationConfig>): Promise<void> {\n  const currentDocCount = await getCurrentDocumentCount();\n  \n  const defaultConfig: IndexOptimizationConfig = {\n    expectedDocumentCount: Math.max(currentDocCount, 10000), // At least 10k for planning\n    targetSearchLatency: 100, // 100ms target\n    memoryBudget: 'medium',\n    accuracyPriority: 'balanced'\n  };\n  \n  const finalConfig = { ...defaultConfig, ...config };\n  \n  logger.info('Starting vector index optimization', {\n    currentDocumentCount: currentDocCount,\n    config: finalConfig\n  });\n  \n  // Calculate optimal parameters\n  const optimalParams = calculateOptimalParameters(finalConfig);\n  \n  logger.info('Calculated optimal HNSW parameters', optimalParams);\n  \n  // Benchmark current performance if we have documents\n  let beforeBenchmark;\n  if (currentDocCount > 0) {\n    logger.info('Benchmarking current index performance...');\n    beforeBenchmark = await benchmarkSearchPerformance();\n    logger.info('Current performance', beforeBenchmark);\n  }\n  \n  // Apply new parameters\n  await applyIndexParameters(optimalParams);\n  \n  // Benchmark new performance if we have documents\n  if (currentDocCount > 0) {\n    logger.info('Benchmarking optimized index performance...');\n    const afterBenchmark = await benchmarkSearchPerformance();\n    logger.info('Optimized performance', afterBenchmark);\n    \n    if (beforeBenchmark) {\n      const improvement = {\n        avgLatencyImprovement: Math.round(((beforeBenchmark.avgLatency - afterBenchmark.avgLatency) / beforeBenchmark.avgLatency) * 100),\n        p95LatencyImprovement: Math.round(((beforeBenchmark.p95Latency - afterBenchmark.p95Latency) / beforeBenchmark.p95Latency) * 100),\n        throughputImprovement: Math.round(((afterBenchmark.throughput - beforeBenchmark.throughput) / beforeBenchmark.throughput) * 100)\n      };\n      \n      logger.info('Performance improvement summary', improvement);\n    }\n  }\n  \n  logger.info('Vector index optimization completed successfully');\n}\n\n/**\n * CLI interface\n */\nif (require.main === module) {\n  const args = process.argv.slice(2);\n  \n  const config: Partial<IndexOptimizationConfig> = {};\n  \n  // Parse command line arguments\n  for (let i = 0; i < args.length; i += 2) {\n    const key = args[i];\n    const value = args[i + 1];\n    \n    switch (key) {\n      case '--expected-docs':\n        config.expectedDocumentCount = parseInt(value);\n        break;\n      case '--target-latency':\n        config.targetSearchLatency = parseInt(value);\n        break;\n      case '--memory-budget':\n        if (['low', 'medium', 'high'].includes(value)) {\n          config.memoryBudget = value as 'low' | 'medium' | 'high';\n        }\n        break;\n      case '--accuracy-priority':\n        if (['speed', 'balanced', 'accuracy'].includes(value)) {\n          config.accuracyPriority = value as 'speed' | 'balanced' | 'accuracy';\n        }\n        break;\n    }\n  }\n  \n  optimizeVectorIndex(config)\n    .then(() => {\n      console.log('✅ Vector index optimization completed successfully');\n      process.exit(0);\n    })\n    .catch((error) => {\n      console.error('❌ Vector index optimization failed:', error);\n      process.exit(1);\n    });\n}"