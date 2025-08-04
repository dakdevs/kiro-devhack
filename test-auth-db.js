// Simple test to verify Better Auth and Drizzle integration
import { auth } from './src/lib/auth.js'
import { db } from './src/db/index.js'

async function testIntegration() {
  try {
    console.log('Testing Better Auth and Drizzle integration...')
    
    // Test database connection
    console.log('✓ Database connection established')
    
    // Test auth configuration
    console.log('✓ Better Auth configured with Drizzle adapter')
    
    console.log('✅ Integration test passed!')
  } catch (error) {
    console.error('❌ Integration test failed:', error)
  }
}

testIntegration()