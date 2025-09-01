#!/usr/bin/env node

// Simple test to debug availability issues
const { execSync } = require('child_process');

console.log('🔍 Debugging Availability Issue...\n');

// Check if the database is running
console.log('1. Checking database connection...');
try {
  const dbStatus = execSync('docker ps | grep postgres', { encoding: 'utf8' });
  if (dbStatus.trim()) {
    console.log('✅ Database container is running');
  } else {
    console.log('❌ Database container not found');
  }
} catch (error) {
  console.log('❌ Error checking database:', error.message);
}

// Check if the Next.js server is running
console.log('\n2. Checking Next.js server...');
try {
  const nextStatus = execSync('ps aux | grep next', { encoding: 'utf8' });
  if (nextStatus.includes('next dev') || nextStatus.includes('next start')) {
    console.log('✅ Next.js server appears to be running');
  } else {
    console.log('❌ Next.js server not found');
  }
} catch (error) {
  console.log('❌ Error checking Next.js server:', error.message);
}

// Check for recent database migrations
console.log('\n3. Checking database schema...');
try {
  const migrationFiles = execSync('ls -la drizzle/*.sql 2>/dev/null | tail -5', { encoding: 'utf8' });
  console.log('Recent migration files:');
  console.log(migrationFiles);
} catch (error) {
  console.log('❌ Error checking migrations:', error.message);
}

console.log('\n4. Common issues to check:');
console.log('   - Authentication: Make sure user is logged in');
console.log('   - Database: Check if candidate_availability table exists');
console.log('   - API Route: Verify /api/availability is accessible');
console.log('   - Form Validation: Check if form data passes validation');
console.log('   - Network: Check browser dev tools for failed requests');

console.log('\n5. Debugging steps:');
console.log('   1. Open browser dev tools (F12)');
console.log('   2. Go to Network tab');
console.log('   3. Try to add availability');
console.log('   4. Check if POST request to /api/availability is made');
console.log('   5. Check response status and body');
console.log('   6. Check Console tab for JavaScript errors');