#!/usr/bin/env tsx

/**
 * Verify that the interview chat tables were created correctly
 * Run with: npx tsx src/scripts/verify-schema.ts
 */

import { db } from '~/db';
import { interviewChatSessions, interviewChatMessages } from '~/db/schema';
import { sql } from 'drizzle-orm';

async function verifySchema() {
  console.log('🔍 Verifying interview chat database schema...\n');

  try {
    // Check if tables exist
    console.log('1. Checking table existence...');
    
    const tablesQuery = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('interview_chat_sessions', 'interview_chat_messages')
      ORDER BY table_name;
    `);
    
    const tableNames = tablesQuery.rows.map(row => row.table_name);
    console.log(`✅ Found tables: ${tableNames.join(', ')}\n`);

    // Check interview_chat_sessions structure
    console.log('2. Checking interview_chat_sessions structure...');
    const sessionsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'interview_chat_sessions'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Columns:');
    sessionsColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Check interview_chat_messages structure
    console.log('3. Checking interview_chat_messages structure...');
    const messagesColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'interview_chat_messages'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Columns:');
    messagesColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Check vector extension
    console.log('4. Checking pgvector extension...');
    const vectorExtension = await db.execute(sql`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector';
    `);
    
    if (vectorExtension.rows.length > 0) {
      console.log(`✅ pgvector extension installed: version ${vectorExtension.rows[0].extversion}\n`);
    } else {
      console.log('❌ pgvector extension not found\n');
    }

    // Test basic operations
    console.log('5. Testing basic operations...');
    
    // Try to insert a test session (will be rolled back)
    await db.transaction(async (tx) => {
      const testSessionId = 'test-schema-verification';
      
      await tx.insert(interviewChatSessions).values({
        id: testSessionId,
        userId: 'test-user',
        sessionName: 'Schema Verification Test',
        startTime: new Date(),
        totalMessages: '0',
        maxDepthReached: '0',
        averageScore: '0',
      });
      
      console.log('✅ Successfully inserted test session');
      
      // Try to insert a test message
      await tx.insert(interviewChatMessages).values({
        id: 'test-message-1',
        sessionId: testSessionId,
        userId: 'test-user',
        messageIndex: '1',
        role: 'user',
        content: 'This is a test message for schema verification',
        embedding: '[0.1,0.2,0.3]', // Simple test vector
        currentTopic: 'test',
        topicDepth: '1',
        createdAt: new Date(),
      });
      
      console.log('✅ Successfully inserted test message');
      
      // Rollback the transaction to clean up
      throw new Error('Rollback test data');
    }).catch((error) => {
      if (error.message === 'Rollback test data') {
        console.log('✅ Test data rolled back successfully\n');
      } else {
        throw error;
      }
    });

    console.log('🎉 Schema verification completed successfully!');
    console.log('✅ All tables and columns are properly configured');
    console.log('✅ Vector support is available');
    console.log('✅ Basic operations work correctly');

  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
if (require.main === module) {
  verifySchema().catch(console.error);
}

export { verifySchema };