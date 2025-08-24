# Database Setup Guide

## Quick Setup

Run the automated setup script:

```bash
pnpm db:setup
```

This will:
1. Install dependencies (including pgvector)
2. Clean up old migrations
3. Start a fresh database
4. Push the schema

## Manual Setup

If the automated script doesn't work, follow these steps:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Database

```bash
pnpm dev:db
# or
docker compose up -d
```

### 3. Reset Database (if needed)

```bash
pnpm db:reset
```

### 4. Push Schema

```bash
pnpm db:push
```

## Available Scripts

- `pnpm db:setup` - Complete automated setup
- `pnpm db:reset` - Reset database and push schema
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Apply migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:stop` - Stop database container

## Troubleshooting

### Database Connection Issues

1. **Port conflicts**: Make sure port 5433 is available
2. **Docker issues**: Restart Docker and try again
3. **Environment variables**: Check your `.env.local` file

### Schema Issues

1. **Migration conflicts**: Delete `drizzle/` folder and run `pnpm db:push`
2. **pgvector errors**: Make sure the pgvector extension is enabled
3. **Permission errors**: Check database user permissions

### Common Fixes

#### Reset Everything
```bash
# Stop containers and remove volumes
docker compose down -v

# Remove migration files
rm -rf drizzle/0*.sql drizzle/meta/0*.json

# Start fresh
pnpm db:setup
```

#### Check Database Status
```bash
# Check if container is running
docker ps

# Check database logs
docker logs postgres-pgvector

# Test connection
docker exec postgres-pgvector pg_isready -U postgres
```

#### Manual Database Connection Test
```bash
# Connect to database directly
docker exec -it postgres-pgvector psql -U postgres -d myapp

# In psql, check extensions
\dx

# Should show 'vector' extension
```

## Environment Variables

Make sure your `.env.local` contains:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/myapp"
POSTGRES_DB="myapp"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
```

## Schema Overview

The database includes tables for:

- **Authentication**: `user`, `session`, `account`, `verification`
- **Job Applications**: `job_applications`, `interviews`, `user_profiles`
- **AI Features**: `embeddings`, `conversations`, `user_responses`
- **Recruiter Features**: `recruiter_profiles`, `job_postings`, `recruiter_availability`, `job_applications_from_candidates`

All tables use proper foreign key relationships with cascade deletes where appropriate.