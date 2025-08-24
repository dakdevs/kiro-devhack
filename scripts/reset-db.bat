@echo off
echo 🗑️  Stopping and removing existing database...
docker compose down -v

echo 🚀 Starting fresh database...
docker compose up -d

echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo 📊 Pushing schema to database...
pnpm db:push

echo ✅ Database reset complete!
echo 🎯 You can now run 'pnpm db:studio' to view your database
pause