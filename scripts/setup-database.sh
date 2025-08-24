#!/bin/bash

echo "🔧 Setting up Drizzle Database..."
echo "=================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with the following variables:"
    echo "DATABASE_URL=\"postgresql://postgres:password@localhost:5433/myapp\""
    echo "POSTGRES_DB=\"myapp\""
    echo "POSTGRES_USER=\"postgres\""
    echo "POSTGRES_PASSWORD=\"password\""
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🗑️  Cleaning up old database and migrations..."
docker compose down -v
rm -rf drizzle/0*.sql
rm -rf drizzle/meta/0*.json

echo "🚀 Starting fresh database container..."
docker compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 15

# Test database connection
echo "🔍 Testing database connection..."
if ! docker exec postgres-pgvector pg_isready -U postgres > /dev/null 2>&1; then
    echo "❌ Database is not ready. Waiting longer..."
    sleep 10
    if ! docker exec postgres-pgvector pg_isready -U postgres > /dev/null 2>&1; then
        echo "❌ Database failed to start. Please check Docker logs:"
        echo "docker logs postgres-pgvector"
        exit 1
    fi
fi

echo "📊 Pushing schema to database..."
if pnpm db:push; then
    echo "✅ Schema pushed successfully!"
else
    echo "❌ Failed to push schema. Trying to generate and migrate instead..."
    pnpm db:generate
    pnpm db:migrate
fi

echo ""
echo "🎉 Database setup complete!"
echo "=================================="
echo "📊 Run 'pnpm db:studio' to view your database"
echo "🔄 Run 'pnpm db:reset' to reset the database"
echo "🛠️  Run 'pnpm db:generate' to create new migrations"
echo ""