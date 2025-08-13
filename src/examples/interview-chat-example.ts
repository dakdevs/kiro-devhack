/**
 * Example usage of the Interview Chat Vectorization system
 * This demonstrates how to use the interview chat service programmatically
 */

import { 
  createChatSession, 
  saveChatMessage, 
  searchChatMessages, 
  getUserChatSessions,
  getUserChatStats,
  getSimilarMessages
} from '~/lib/interview-chat-service';

// Example: Complete interview session workflow
export async function exampleInterviewWorkflow() {
  const userId = 'example-user-123';
  
  console.log('🎯 Starting Interview Chat Example\n');

  // 1. Create a new interview session
  console.log('1. Creating interview session...');
  const sessionId = await createChatSession(userId, 'Frontend Developer Interview Practice');
  console.log(`✅ Created session: ${sessionId}\n`);

  // 2. Simulate an interview conversation with vectorization
  console.log('2. Simulating interview conversation...');
  
  const conversation = [
    {
      role: 'assistant' as const,
      content: "Tell me about your experience with React and modern frontend development.",
      messageIndex: 1,
      metadata: { questionType: 'technical_experience' }
    },
    {
      role: 'user' as const,
      content: "I have over 3 years of experience with React. I've built several large-scale applications using React with TypeScript, including an e-commerce platform that handles thousands of users daily. I'm particularly experienced with React hooks, context API, and performance optimization techniques like memoization and code splitting.",
      messageIndex: 2,
      currentTopic: 'react_experience',
      topicDepth: 1,
      engagementLevel: 'high',
      responseScore: 1.9,
      metadata: {
        topics: ['React', 'TypeScript', 'e-commerce', 'performance'],
        technicalDepth: 'advanced',
        specificExamples: true
      }
    },
    {
      role: 'assistant' as const,
      content: "That's impressive! Can you walk me through a specific performance optimization challenge you faced and how you solved it?",
      messageIndex: 3,
      currentTopic: 'react_experience',
      topicDepth: 2,
      metadata: { followUpQuestion: true, focusArea: 'performance' }
    },
    {
      role: 'user' as const,
      content: "One major challenge was with our product catalog page that was rendering thousands of items. Initially, it was very slow and caused browser freezing. I implemented React.memo for the product components, used React.lazy for code splitting, and implemented virtual scrolling with react-window. I also optimized our Redux selectors with reselect to prevent unnecessary re-renders. This reduced the initial load time by 70% and eliminated the freezing issues.",
      messageIndex: 4,
      currentTopic: 'performance_optimization',
      topicDepth: 3,
      engagementLevel: 'high',
      responseScore: 2.0,
      metadata: {
        topics: ['React.memo', 'code splitting', 'virtual scrolling', 'Redux', 'reselect'],
        problemSolving: true,
        quantifiedResults: true,
        technicalDepth: 'expert'
      }
    },
    {
      role: 'assistant' as const,
      content: "Excellent solution! Now let's talk about your experience with backend technologies. What databases and APIs have you worked with?",
      messageIndex: 5,
      currentTopic: 'backend_experience',
      topicDepth: 1,
      metadata: { topicTransition: true, newFocus: 'backend' }
    },
    {
      role: 'user' as const,
      content: "I've worked extensively with PostgreSQL and MongoDB. For APIs, I've built RESTful services with Node.js and Express, and more recently I've been working with GraphQL using Apollo Server. I've also implemented authentication systems using JWT and OAuth 2.0, and have experience with database optimization including indexing strategies and query optimization.",
      messageIndex: 6,
      currentTopic: 'backend_experience',
      topicDepth: 2,
      engagementLevel: 'high',
      responseScore: 1.8,
      metadata: {
        topics: ['PostgreSQL', 'MongoDB', 'Node.js', 'Express', 'GraphQL', 'Apollo', 'JWT', 'OAuth'],
        breadth: 'full-stack',
        technicalDepth: 'advanced'
      }
    }
  ];

  // Save all messages with automatic vectorization
  for (const message of conversation) {
    await saveChatMessage(sessionId, userId, message);
    console.log(`✅ Saved and vectorized: ${message.role} message`);
  }
  console.log('');

  // 3. Demonstrate vector search capabilities
  console.log('3. Testing vector search capabilities...\n');
  
  const searchQueries = [
    'React performance optimization',
    'database experience PostgreSQL',
    'authentication and security',
    'GraphQL and API development',
    'e-commerce platform development'
  ];

  for (const query of searchQueries) {
    console.log(`🔍 Searching: "${query}"`);
    const results = await searchChatMessages(userId, query, 3);
    
    results.forEach((result, index) => {
      const similarity = (result.similarity * 100).toFixed(1);
      const preview = result.content.substring(0, 100) + '...';
      console.log(`   ${index + 1}. [${similarity}% match] ${result.role}: ${preview}`);
    });
    console.log('');
  }

  // 4. Get similar messages for a specific response
  console.log('4. Finding similar messages...');
  const userMessages = await searchChatMessages(userId, 'React', 10);
  if (userMessages.length > 0) {
    const targetMessage = userMessages[0];
    console.log(`\nFinding messages similar to: "${targetMessage.content.substring(0, 80)}..."`);
    
    const similarMessages = await getSimilarMessages(targetMessage.id, userId, 3);
    similarMessages.forEach((similar, index) => {
      const similarity = (similar.similarity * 100).toFixed(1);
      const preview = similar.content.substring(0, 80) + '...';
      console.log(`   ${index + 1}. [${similarity}% similar] ${similar.role}: ${preview}`);
    });
  }
  console.log('');

  // 5. Get user statistics
  console.log('5. Getting user statistics...');
  const stats = await getUserChatStats(userId);
  console.log('📊 User Statistics:');
  console.log(`   Total Sessions: ${stats.totalSessions}`);
  console.log(`   Total Messages: ${stats.totalMessages}`);
  console.log(`   Average Score: ${stats.averageSessionScore.toFixed(2)}`);
  console.log(`   Topics Explored: ${stats.totalTopicsExplored}\n`);

  // 6. List all user sessions
  console.log('6. Listing user sessions...');
  const sessions = await getUserChatSessions(userId);
  sessions.forEach(session => {
    console.log(`📝 ${session.sessionName}`);
    console.log(`   Messages: ${session.totalMessages}, Score: ${session.averageScore.toFixed(2)}`);
    console.log(`   Created: ${session.startTime.toISOString()}`);
  });

  console.log('\n🎉 Interview Chat Example completed successfully!');
  console.log('✅ Session created and messages vectorized');
  console.log('✅ Vector search working with semantic understanding');
  console.log('✅ Similar message detection functional');
  console.log('✅ Analytics and statistics generated');
}

// Example: Advanced search scenarios
export async function exampleAdvancedSearch() {
  const userId = 'example-user-123';
  
  console.log('🔍 Advanced Search Examples\n');

  // Search for technical concepts
  console.log('1. Technical Concept Search:');
  const technicalResults = await searchChatMessages(userId, 'performance optimization techniques', 5);
  technicalResults.forEach(result => {
    console.log(`   - ${result.content.substring(0, 100)}... (${(result.similarity * 100).toFixed(1)}% match)`);
  });

  // Search for problem-solving examples
  console.log('\n2. Problem-Solving Examples:');
  const problemSolvingResults = await searchChatMessages(userId, 'challenge I faced and solved', 5);
  problemSolvingResults.forEach(result => {
    console.log(`   - ${result.content.substring(0, 100)}... (${(result.similarity * 100).toFixed(1)}% match)`);
  });

  // Search for specific technologies
  console.log('\n3. Technology-Specific Search:');
  const techResults = await searchChatMessages(userId, 'database and API experience', 5);
  techResults.forEach(result => {
    console.log(`   - ${result.content.substring(0, 100)}... (${(result.similarity * 100).toFixed(1)}% match)`);
  });
}

// Example: Session management
export async function exampleSessionManagement() {
  const userId = 'example-user-123';
  
  console.log('📋 Session Management Examples\n');

  // Create multiple sessions for different interview types
  const sessionTypes = [
    'Technical Frontend Interview',
    'System Design Interview',
    'Behavioral Interview Practice',
    'Full-Stack Developer Interview'
  ];

  const createdSessions = [];
  for (const sessionName of sessionTypes) {
    const sessionId = await createChatSession(userId, sessionName);
    createdSessions.push({ id: sessionId, name: sessionName });
    console.log(`✅ Created: ${sessionName}`);
  }

  // Get all sessions and display them
  console.log('\n📊 All User Sessions:');
  const allSessions = await getUserChatSessions(userId);
  allSessions.forEach((session, index) => {
    console.log(`${index + 1}. ${session.sessionName}`);
    console.log(`   ID: ${session.id}`);
    console.log(`   Created: ${session.startTime.toLocaleDateString()}`);
    console.log(`   Messages: ${session.totalMessages}`);
    console.log(`   Score: ${session.averageScore || 'N/A'}`);
    console.log('');
  });
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🚀 Running Interview Chat Examples...\n');
  
  exampleInterviewWorkflow()
    .then(() => exampleAdvancedSearch())
    .then(() => exampleSessionManagement())
    .then(() => {
      console.log('\n🎉 All examples completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Example failed:', error);
      process.exit(1);
    });
}