#!/bin/bash

echo "🗑️  Stopping and removing existing database..."
docker compose down -v

echo "🚀 Starting fresh database..."
docker compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "📊 Pushing schema to database..."
pnpm db:push

echo "✅ Database reset complete!"
echo "🎯 You can now run 'pnpm db:studio' to view your database"