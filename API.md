# API Documentation

This document provides comprehensive documentation for the semantic search APIs powered by Qwen3-4B embeddings and pgvector.

## Table of Contents

1. [Overview](#overview)
2. [Document Ingestion API](#document-ingestion-api)
3. [Semantic Search API](#semantic-search-api)
4. [Error Handling](#error-handling)
5. [Rate Limits](#rate-limits)
6. [Examples](#examples)
7. [SDKs and Libraries](#sdks-and-libraries)

## Overview

The Better Profile App provides two main APIs for semantic search functionality:

- **Document Ingestion API** (`/api/ingest`) - Store documents with automatic embedding generation
- **Semantic Search API** (`/api/search`) - Search documents by semantic similarity

Both APIs use **Qwen3-4B embeddings** (2560 dimensions) via DashScope API and **pgvector** for efficient similarity search.

### Base URL

```
http://localhost:3000  # Development
https://your-domain.com  # Production
```

### Authentication

Currently, the APIs do not require authentication. In production, consider implementing:
- API key authentication
- Rate limiting per user
- Request logging and monitoring

## Document Ingestion API

### POST /api/ingest

Store documents with automatic Qwen3-4B embedding generation.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body Schema:**
```typescript
{
  documents: Array<{
    content: string;        // 1-50,000 characters
    metadata?: object;      // Optional metadata object
  }>;
}
```

**Constraints:**
- Maximum 100 documents per request
- Content length: 1-50,000 characters per document
- Metadata: Any valid JSON object (optional)

#### Response

**Success (201 Created):**
```json
{
  "success": true,
  "message": "Successfully ingested 2 documents",
  "insertedCount": 2,
  "documentIds": ["doc_123", "doc_456"]
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "documents.0.content: Document content cannot be empty"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to generate embeddings",
  "details": "DashScope API error: Rate limit exceeded"
}
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.",
        "metadata": {
          "title": "ML Introduction",
          "category": "education",
          "tags": ["ml", "ai", "tutorial"],
          "author": "AI Researcher",
          "source": "educational-content",
          "difficulty": "beginner"
        }
      },
      {
        "content": "Vector databases enable semantic search by storing high-dimensional embeddings and supporting similarity queries.",
        "metadata": {
          "title": "Vector Databases",
          "category": "technology",
          "tags": ["vectors", "search", "database"],
          "author": "Database Expert",
          "source": "technical-blog",
          "difficulty": "intermediate"
        }
      }
    ]
  }'
```

### GET /api/ingest

Get API documentation and usage information.

#### Response

```json
{
  "endpoint": "/api/ingest",
  "method": "POST",
  "description": "Ingest documents with automatic Qwen3-4B embedding generation",
  "requestSchema": { /* ... */ },
  "responseSchema": { /* ... */ },
  "limits": {
    "maxDocuments": 100,
    "maxContentLength": 50000
  },
  "examples": { /* ... */ }
}
```

## Semantic Search API

### POST /api/search

Perform semantic search using Qwen3-4B embeddings and pgvector cosine similarity.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body Schema:**
```typescript
{
  query: string;          // 1-1000 characters
  k?: number;             // 1-100, default: 10
  threshold?: number;     // 0-1, default: 0.0
}
```

**Parameters:**
- `query`: Search query text (required)
- `k`: Number of results to return (optional, default: 10)
- `threshold`: Minimum similarity threshold (optional, default: 0.0)

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "query": "machine learning algorithms",
  "results": [
    {
      "id": "doc_123",
      "content": "Machine learning is a subset of artificial intelligence...",
      "metadata": {
        "title": "ML Introduction",
        "category": "education",
        "tags": ["ml", "ai", "tutorial"]
      },
      "similarity": 0.892456,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "executionTime": 45
}
```

**Empty Results (200 OK):**
```json
{
  "success": true,
  "query": "nonexistent topic",
  "results": [],
  "count": 0,
  "executionTime": 23
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "query: Query cannot be empty"
}
```

#### Similarity Scoring

The API uses **cosine similarity** with the following interpretation:

| Score Range | Interpretation | Use Case |
|-------------|----------------|----------|
| 0.9 - 1.0   | Extremely similar | Near-duplicate content |
| 0.8 - 0.9   | Highly relevant | Strong semantic match |
| 0.7 - 0.8   | Moderately relevant | Good topical match |
| 0.5 - 0.7   | Somewhat relevant | Related concepts |
| 0.3 - 0.5   | Weakly relevant | Tangentially related |
| 0.0 - 0.3   | Not relevant | Different topics |

#### Example Requests

**Basic Search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence and machine learning",
    "k": 5
  }'
```

**Search with Threshold:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vector databases and embeddings",
    "k": 10,
    "threshold": 0.7
  }'
```

**Precise Search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "PostgreSQL pgvector HNSW index optimization",
    "k": 3,
    "threshold": 0.8
  }'
```

### GET /api/search

Get API documentation and usage information.

#### Response

```json
{
  "endpoint": "/api/search",
  "method": "POST",
  "description": "Perform semantic search using Qwen3-4B embeddings",
  "requestSchema": { /* ... */ },
  "responseSchema": { /* ... */ },
  "similarityScoring": {
    "description": "Uses pgvector cosine similarity",
    "range": "0.0 (completely different) to 1.0 (identical)",
    "algorithm": "Cosine similarity between query and document embeddings",
    "model": "Qwen3-4B (2560 dimensions)"
  },
  "limits": {
    "maxQueryLength": 1000,
    "maxResults": 100,
    "defaultResults": 10
  },
  "tips": [
    "Use specific queries for better results",
    "Adjust threshold to filter low-quality matches",
    "Similarity scores above 0.8 typically indicate high relevance"
  ]
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error category",
  "details": "Specific error message"
}
```

### Common Error Codes

| HTTP Status | Error Category | Description |
|-------------|----------------|-------------|
| 400 | Invalid request data | Validation errors, malformed JSON |
| 500 | Failed to generate embeddings | DashScope API issues |
| 500 | Failed to store documents | Database connection issues |
| 500 | Failed to execute search | Database query errors |
| 500 | Internal server error | Unexpected errors |

### Error Examples

**Validation Error:**
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "documents.0.content: Document content cannot be empty, k: k must be at least 1"
}
```

**Embedding API Error:**
```json
{
  "success": false,
  "error": "Failed to generate embeddings",
  "details": "DashScope API error: Rate limit exceeded. Please try again later."
}
```

**Database Error:**
```json
{
  "success": false,
  "error": "Failed to execute semantic search",
  "details": "Database connection timeout. Please try again."
}
```

## Rate Limits

### Current Limits

- **Document Ingestion**: 100 documents per request
- **Search Queries**: No explicit limit (limited by DashScope API)
- **Content Length**: 50,000 characters per document
- **Query Length**: 1,000 characters per search

### DashScope API Limits

The embedding generation is subject to DashScope API limits:
- Rate limits vary by account type
- Monitor your usage in DashScope console
- Implement retry logic with exponential backoff

### Recommendations

For production use:
- Implement API key authentication
- Add rate limiting per user/IP
- Monitor and log API usage
- Set up alerts for quota limits

## Examples

### Complete Workflow Example

```bash
# 1. Ingest documents
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Next.js is a React framework that provides server-side rendering, static site generation, and many other features for building modern web applications.",
        "metadata": {
          "title": "Next.js Framework Guide",
          "category": "web-development",
          "tags": ["nextjs", "react", "ssr"],
          "difficulty": "intermediate"
        }
      },
      {
        "content": "PostgreSQL is a powerful, open-source object-relational database system with over 35 years of active development.",
        "metadata": {
          "title": "PostgreSQL Database",
          "category": "database",
          "tags": ["postgresql", "database", "sql"],
          "difficulty": "beginner"
        }
      }
    ]
  }'

# 2. Search for related content
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "web development frameworks",
    "k": 5,
    "threshold": 0.6
  }'

# 3. Search for database content
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database systems and data storage",
    "k": 3,
    "threshold": 0.7
  }'
```

### Batch Processing Example

```bash
# Process multiple document batches
for category in "technology" "science" "education"; do
  curl -X POST http://localhost:3000/api/ingest \
    -H "Content-Type: application/json" \
    -d "{
      \"documents\": [
        {
          \"content\": \"Sample content for $category category\",
          \"metadata\": {
            \"category\": \"$category\",
            \"batch\": \"$(date +%Y%m%d)\"
          }
        }
      ]
    }"
done
```

### Search Comparison Example

```bash
# Compare different query approaches
queries=("machine learning" "ML algorithms" "artificial intelligence training")

for query in "${queries[@]}"; do
  echo "Searching for: $query"
  curl -s -X POST http://localhost:3000/api/search \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"k\": 3}" \
    | jq '.results[0].similarity // "No results"'
done
```

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
// Example client implementation
class SemanticSearchClient {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async ingestDocuments(documents: Array<{content: string, metadata?: any}>) {
    const response = await fetch(`${this.baseUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents })
    });
    return response.json();
  }

  async search(query: string, k: number = 10, threshold: number = 0.0) {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k, threshold })
    });
    return response.json();
  }
}

// Usage
const client = new SemanticSearchClient();

// Ingest documents
await client.ingestDocuments([
  {
    content: "Your document content here",
    metadata: { title: "Document Title" }
  }
]);

// Search
const results = await client.search("your search query", 5, 0.7);
console.log(results);
```

### Python

```python
import requests
import json

class SemanticSearchClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def ingest_documents(self, documents):
        response = requests.post(
            f"{self.base_url}/api/ingest",
            headers={"Content-Type": "application/json"},
            json={"documents": documents}
        )
        return response.json()
    
    def search(self, query, k=10, threshold=0.0):
        response = requests.post(
            f"{self.base_url}/api/search",
            headers={"Content-Type": "application/json"},
            json={"query": query, "k": k, "threshold": threshold}
        )
        return response.json()

# Usage
client = SemanticSearchClient()

# Ingest documents
client.ingest_documents([
    {
        "content": "Your document content here",
        "metadata": {"title": "Document Title"}
    }
])

# Search
results = client.search("your search query", k=5, threshold=0.7)
print(results)
```

### cURL Scripts

Create reusable shell scripts:

```bash
#!/bin/bash
# ingest.sh - Document ingestion script

API_BASE="http://localhost:3000"
CONTENT_FILE="$1"
METADATA_FILE="$2"

if [ -z "$CONTENT_FILE" ]; then
    echo "Usage: $0 <content_file> [metadata_file]"
    exit 1
fi

# Build JSON payload
PAYLOAD=$(jq -n --arg content "$(cat "$CONTENT_FILE")" \
    --argjson metadata "$(cat "$METADATA_FILE" 2>/dev/null || echo '{}')" \
    '{documents: [{content: $content, metadata: $metadata}]}')

# Send request
curl -X POST "$API_BASE/api/ingest" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
```

```bash
#!/bin/bash
# search.sh - Semantic search script

API_BASE="http://localhost:3000"
QUERY="$1"
K="${2:-10}"
THRESHOLD="${3:-0.0}"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 <query> [k] [threshold]"
    exit 1
fi

curl -X POST "$API_BASE/api/search" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\", \"k\": $K, \"threshold\": $THRESHOLD}" \
    | jq '.'
```

## Performance Considerations

### Optimization Tips

1. **Batch Processing**: Ingest multiple documents in single requests (up to 100)
2. **Similarity Thresholds**: Use appropriate thresholds to filter irrelevant results
3. **Result Limits**: Request only the number of results you need
4. **Caching**: Consider caching frequent search results
5. **Indexing**: Ensure HNSW index is properly configured for your dataset size

### Monitoring

Monitor these metrics:
- API response times
- Embedding generation latency
- Database query performance
- Error rates and types
- DashScope API usage and quotas

### Scaling Considerations

For high-volume usage:
- Implement connection pooling
- Consider read replicas for search queries
- Monitor and optimize HNSW index parameters
- Implement proper error handling and retries
- Set up monitoring and alerting