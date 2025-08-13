#!/usr/bin/env tsx

/**
 * Test script for interview chat vectorization
 * Run with: npx tsx src/scripts/test-interview-vectorization.ts
 */

import { 
  createChatSession, 
  saveChatMessage, 
  searchChatMessages, 
  getUserChatSessions,
  getUserChatStats 
} from '~/lib/interview-chat-service';

const TEST_USER_ID = 'test-user-vectorization';

async function testVectorization() {
  console.log('🚀 Testing Interview Chat Vectorization\n');

  try {
    // 1. Create a test session
    console.log('1. Creating test session...');
    const sessionId = await createChatSession(TEST_USER_ID, 'Test Vectorization Session');
    console.log(`✅ Created session: ${sessionId}\n`);

    // 2. Add some test messages
    console.log('2. Adding test messages...');
    const testMessages = [
      {
        role: 'user' as const,
        content: 'I have experience with React and TypeScript development. I built several web applications using Next.js.',
        messageIndex: 1,
        currentTopic: 'technical_skills',
        topicDepth: 1,
        engagementLevel: 'high',
        responseScore: 1.8,
        metadata: { topics: ['React', 'TypeScript', 'Next.js'] }
      },
      {
        role: 'assistant' as const,
        content: 'That\'s great! Can you tell me more about the specific challenges you faced while building those Next.js applications?',
        messageIndex: 2,
        currentTopic: 'technical_skills',
        topicDepth: 2,
        metadata: { followUp: true }
      },
      {
        role: 'user' as const,
        content: 'One major challenge was implementing server-side rendering with dynamic data. I had to optimize the performance and handle state management properly.',
        messageIndex: 3,
        currentTopic: 'technical_challenges',
        topicDepth: 2,
        engagementLevel: 'high',
        responseScore: 1.9,
        metadata: { topics: ['SSR', 'performance', 'state management'] }
      },
      {
        role: 'user' as const,
        content: 'I also worked on database design using PostgreSQL and implemented REST APIs with proper authentication.',
        messageIndex: 4,
        currentTopic: 'backend_skills',
        topicDepth: 1,
        engagementLevel: 'medium',
        responseScore: 1.6,
        metadata: { topics: ['PostgreSQL', 'REST API', 'authentication'] }
      },
      {
        role: 'user' as const,
        content: 'In my previous role, I collaborated with a team of 5 developers using Git for version control and conducted code reviews.',
        messageIndex: 5,
        currentTopic: 'teamwork',
        topicDepth: 1,
        engagementLevel: 'medium',
        responseScore: 1.4,
        metadata: { topics: ['teamwork', 'Git', 'code reviews'] }
      }
    ];

    for (const message of testMessages) {
      await saveChatMessage(sessionId, TEST_USER_ID, message);
      console.log(`✅ Saved ${message.role} message: "${message.content.substring(0, 50)}..."`);
    }
    console.log('');

    // 3. Test vector search
    console.log('3. Testing vector search...\n');
    
    const searchQueries = [
      'React development experience',
      'database and PostgreSQL',
      'team collaboration',
      'performance optimization',
      'authentication systems'
    ];

    for (const query of searchQueries) {
      console.log(`🔍 Searching for: "${query}"`);
      const results = await searchChatMessages(TEST_USER_ID, query, 3);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. [${(result.similarity * 100).toFixed(1)}%] ${result.role}: "${result.content.substring(0, 80)}..."`);
        });
      } else {
        console.log('   No results found');
      }
      console.log('');
    }

    // 4. Get user stats
    console.log('4. Getting user statistics...');
    const stats = await getUserChatStats(TEST_USER_ID);
    console.log('📊 User Stats:');
    console.log(`   Total Sessions: ${stats.totalSessions}`);
    console.log(`   Total Messages: ${stats.totalMessages}`);
    console.log(`   Average Score: ${stats.averageSessionScore}`);
    console.log(`   Topics Explored: ${stats.totalTopicsExplored}\n`);

    // 5. List sessions
    console.log('5. Listing user sessions...');
    const sessions = await getUserChatSessions(TEST_USER_ID);
    sessions.forEach(session => {
      console.log(`📝 Session: ${session.sessionName}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Messages: ${session.totalMessages}`);
      console.log(`   Score: ${session.averageScore}`);
      console.log(`   Created: ${session.startTime.toISOString()}\n`);
    });

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testVectorization().catch(console.error);
}

export { testVectorization };