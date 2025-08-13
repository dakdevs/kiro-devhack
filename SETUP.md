# Complete Setup Guide

This guide provides detailed step-by-step instructions for setting up the Better Profile App with Qwen3-4B semantic search capabilities.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [API Keys Setup](#api-keys-setup)
5. [Development Workflow](#development-workflow)
6. [Testing the APIs](#testing-the-apis)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version
   
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **pnpm** (v10.14.0 or higher)
   ```bash
   # Install pnpm
   npm install -g pnpm
   
   # Check version
   pnpm --version
   ```

3. **Docker and Docker Compose**
   ```bash
   # Check Docker installation
   docker --version
   docker compose version
   
   # If not installed, visit: https://docs.docker.com/get-docker/
   ```

### Required Accounts

1. **Google Cloud Console** - For OAuth authentication
2. **DashScope Account** - For Qwen3-4B embeddings

## Environment Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd better-profile-app

# Install dependencies
pnpm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.local.example .env.local
```

### 3. Generate Auth Secret

```bash
# Generate a secure random secret
openssl rand -base64 32

# Copy the output to use as BETTER_AUTH_SECRET
```

## Database Configuration

### 1. Start PostgreSQL with pgvector

```bash
# Start the database container
pnpm run dev:db
```

This command:
- Starts PostgreSQL 16 with pgvector extension
- Creates a database named "myapp"
- Exposes PostgreSQL on localhost:5432

### 2. Initialize Database Schema

```bash
# Push schema to database (creates tables and indexes)
pnpm run db:push
```

### 3. Verify Database Setup

```bash
# Open Drizzle Studio to view database
pnpm run db:studio
```

Navigate to http://localhost:4983 to see:
- `documents` table with vector(2560) embedding column
- HNSW index on embedding column
- Other application tables (user, session, etc.)

## API Keys Setup

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable APIs**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret

4. **Update .env.local**
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
   ```

### DashScope API Setup

1. **Create DashScope Account**
   - Visit: https://dashscope.console.aliyun.com/
   - Sign up or log in

2. **Generate API Key**
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with "sk-")

3. **Update .env.local**
   ```bash
   DASHSCOPE_API_KEY="sk-your-dashscope-api-key-here"
   ```

### Complete .env.local Example

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET="your-generated-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdef123456"

# PostgreSQL Database
POSTGRES_DB="myapp"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp"

# DashScope API for Qwen3-4B Embeddings
DASHSCOPE_API_KEY="sk-your-dashscope-api-key-here"
DASHSCOPE_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
QWEN_MODEL_NAME="text-embedding-v3"
```

## Development Workflow

### 1. Start Development Environment

```bash
# Start everything (database + app)
pnpm dev
```

This single command:
- Starts PostgreSQL with pgvector
- Starts Next.js development server
- Enables hot reloading

### 2. Alternative: Start Components Separately

```bash
# Terminal 1: Start database only
pnpm run dev:db

# Terminal 2: Start Next.js app only
pnpm run dev:app
```

### 3. Access Applications

- **Main App**: http://localhost:3000
- **Database Studio**: `pnpm run db:studio` → http://localhost:4983
- **API Documentation**: 
  - http://localhost:3000/api/ingest (GET)
  - http://localhost:3000/api/search (GET)

## Testing the APIs

### 1. Test Document Ingestion

```bash
# Ingest sample documents
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data without being explicitly programmed.",
        "metadata": {
          "title": "Introduction to Machine Learning",
          "category": "education",
          "tags": ["ml", "ai", "tutorial"],
          "author": "AI Researcher"
        }
      },
      {
        "content": "Vector databases enable semantic search by storing high-dimensional embeddings and supporting similarity queries using specialized indexes like HNSW.",
        "metadata": {
          "title": "Vector Databases Explained",
          "category": "technology",
          "tags": ["vectors", "search", "database"],
          "author": "Database Expert"
        }
      }
    ]
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully ingested 2 documents",
  "insertedCount": 2,
  "documentIds": ["abc123", "def456"]
}
```

### 2. Test Semantic Search

```bash
# Search for similar documents
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence and machine learning",
    "k": 5,
    "threshold": 0.7
  }'
```

Expected response:
```json
{
  "success": true,
  "query": "artificial intelligence and machine learning",
  "results": [
    {
      "id": "abc123",
      "content": "Machine learning is a subset of artificial intelligence...",
      "metadata": {
        "title": "Introduction to Machine Learning",
        "category": "education"
      },
      "similarity": 0.892456,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "executionTime": 45
}
```

### 3. Use Example Scripts

The project includes comprehensive example scripts:

```bash
# Run embedding examples
node -e "require('./src/examples/embedding-example.ts').runAllExamples()"

# Run ingest API examples
node -e "require('./src/examples/ingest-api-example.ts').runIngestExamples()"

# Run search API examples
node -e "require('./src/examples/search-api-example.ts').runSearchExamples()"
```

## Troubleshooting

### Database Issues

**Problem**: Database connection failed
```bash
# Check if Docker is running
docker ps

# Restart database
pnpm run db:stop
pnpm run dev:db

# Reset database completely
pnpm run db:reset
```

**Problem**: Migration errors
```bash
# Check migration status
pnpm run db:studio

# Reset and reapply migrations
pnpm run db:reset
```

### API Issues

**Problem**: DashScope API errors
```bash
# Test API key
curl -H "Authorization: Bearer sk-your-key" \
  https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models

# Check environment variables
echo $DASHSCOPE_API_KEY
```

**Problem**: Embedding generation fails
- Verify API key is correct
- Check internet connection
- Ensure sufficient API quota

### Authentication Issues

**Problem**: Google OAuth not working
- Verify redirect URI in Google Cloud Console
- Check Client ID and Secret in .env.local
- Ensure Google+ API is enabled

### Port Conflicts

**Problem**: Port 3000 already in use
```bash
# Use different port
pnpm run dev:app -- -p 3001
```

**Problem**: Port 5432 already in use
- Modify `docker-compose.yml` port mapping
- Or stop other PostgreSQL instances

### Performance Issues

**Problem**: Slow embedding generation
- Check DashScope API status
- Consider reducing batch size
- Monitor API rate limits

**Problem**: Slow search queries
- Verify HNSW index exists: `pnpm run db:studio`
- Check database performance
- Consider adjusting similarity threshold

## Advanced Configuration

### Custom Docker Configuration

Edit `docker-compose.yml` for custom database settings:

```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: custom_db_name
      POSTGRES_USER: custom_user
      POSTGRES_PASSWORD: custom_password
    ports:
      - "5433:5432"  # Use different port
```

### Custom Embedding Model

Edit `.env.local` to use different Qwen model:

```bash
QWEN_MODEL_NAME="text-embedding-v2"  # Different model version
```

### Production Deployment

For production deployment:

1. Use secure secrets
2. Configure proper database hosting
3. Set up SSL certificates
4. Configure rate limiting
5. Set up monitoring and logging

## Next Steps

After successful setup:

1. **Explore the codebase**: Check `src/` directory structure
2. **Read API documentation**: Visit GET endpoints for detailed docs
3. **Run example scripts**: See `src/examples/` for usage patterns
4. **Build features**: Use the semantic search APIs in your application
5. **Monitor performance**: Use database studio and API logs

## Support

If you encounter issues not covered in this guide:

1. Check the main README.md for additional information
2. Review error logs in the terminal
3. Use `pnpm run db:studio` to inspect database state
4. Test API endpoints individually
5. Verify all environment variables are set correctly