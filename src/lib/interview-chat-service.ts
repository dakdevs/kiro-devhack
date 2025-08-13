import { db } from '~/db';
import { interviewChatSessions, interviewChatMessages } from '~/db/schema';
import { embedOne4B } from '~/embeddings';
import { vectorToString } from '~/db/vector-utils';
import { eq, desc, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  messageIndex: number;
  currentTopic?: string;
  topicDepth?: number;
  engagementLevel?: string;
  responseScore?: number;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  userId: string;
  sessionName?: string;
  startTime: Date;
  endTime?: Date;
  totalMessages: number;
  maxDepthReached: number;
  averageScore: number;
  topicCoverage?: any;
}

export interface SearchResult {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  messageIndex: number;
  sessionId: string;
  similarity: number;
  metadata?: any;
  createdAt: Date;
}

/**
 * Create a new interview chat session
 */
export async function createChatSession(
  userId: string,
  sessionName?: string
): Promise<string> {
  const sessionId = nanoid();
  
  await db.insert(interviewChatSessions).values({
    id: sessionId,
    userId,
    sessionName: sessionName || `Interview Session ${new Date().toLocaleDateString()}`,
    startTime: new Date(),
    totalMessages: '0',
    maxDepthReached: '0',
    averageScore: '0',
  });
  
  return sessionId;
}

/**
 * Save a chat message and generate its embedding
 */
export async function saveChatMessage(
  sessionId: string,
  userId: string,
  message: ChatMessage
): Promise<void> {
  try {
    // Generate embedding for the message content
    const embedding = await embedOne4B(message.content);
    const embeddingString = vectorToString(embedding);
    
    // Save the message with embedding
    await db.insert(interviewChatMessages).values({
      id: nanoid(),
      sessionId,
      userId,
      messageIndex: message.messageIndex.toString(),
      role: message.role,
      content: message.content,
      embedding: embeddingString,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
      currentTopic: message.currentTopic,
      topicDepth: message.topicDepth?.toString() || '0',
      engagementLevel: message.engagementLevel,
      responseScore: message.responseScore?.toString(),
      createdAt: new Date(),
    });
    
    console.log(`✅ Saved ${message.role} message with embedding (${embedding.length} dimensions)`);
  } catch (error) {
    console.error('❌ Failed to save chat message:', error);
    throw error;
  }
}

/**
 * Update session statistics
 */
export async function updateSessionStats(
  sessionId: string,
  stats: {
    totalMessages?: number;
    maxDepthReached?: number;
    averageScore?: number;
    topicCoverage?: any;
    endTime?: Date;
  }
): Promise<void> {
  const updateData: any = {};
  
  if (stats.totalMessages !== undefined) {
    updateData.totalMessages = stats.totalMessages.toString();
  }
  if (stats.maxDepthReached !== undefined) {
    updateData.maxDepthReached = stats.maxDepthReached.toString();
  }
  if (stats.averageScore !== undefined) {
    updateData.averageScore = stats.averageScore.toString();
  }
  if (stats.topicCoverage !== undefined) {
    updateData.topicCoverage = stats.topicCoverage;
  }
  if (stats.endTime !== undefined) {
    updateData.endTime = stats.endTime;
  }
  
  updateData.updatedAt = new Date();
  
  await db
    .update(interviewChatSessions)
    .set(updateData)
    .where(eq(interviewChatSessions.id, sessionId));
}

/**
 * Get all chat sessions for a user
 */
export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  const sessions = await db
    .select()
    .from(interviewChatSessions)
    .where(eq(interviewChatSessions.userId, userId))
    .orderBy(desc(interviewChatSessions.createdAt));
  
  return sessions.map(session => ({
    id: session.id,
    userId: session.userId,
    sessionName: session.sessionName || undefined,
    startTime: session.startTime,
    endTime: session.endTime || undefined,
    totalMessages: parseInt(session.totalMessages || '0'),
    maxDepthReached: parseInt(session.maxDepthReached || '0'),
    averageScore: parseFloat(session.averageScore || '0'),
    topicCoverage: session.topicCoverage,
  }));
}

/**
 * Get all messages for a chat session
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const messages = await db
    .select()
    .from(interviewChatMessages)
    .where(eq(interviewChatMessages.sessionId, sessionId))
    .orderBy(interviewChatMessages.messageIndex);
  
  return messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    messageIndex: parseInt(msg.messageIndex),
    currentTopic: msg.currentTopic || undefined,
    topicDepth: msg.topicDepth ? parseInt(msg.topicDepth) : undefined,
    engagementLevel: msg.engagementLevel || undefined,
    responseScore: msg.responseScore ? parseFloat(msg.responseScore) : undefined,
    metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
  }));
}

/**
 * Search through chat messages using vector similarity
 */
export async function searchChatMessages(
  userId: string,
  query: string,
  limit: number = 10,
  sessionId?: string
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await embedOne4B(query);
    const queryEmbeddingString = vectorToString(queryEmbedding);
    
    // Build the search query
    let searchQuery = db
      .select({
        id: interviewChatMessages.id,
        content: interviewChatMessages.content,
        role: interviewChatMessages.role,
        messageIndex: interviewChatMessages.messageIndex,
        sessionId: interviewChatMessages.sessionId,
        metadata: interviewChatMessages.metadata,
        createdAt: interviewChatMessages.createdAt,
        similarity: sql<number>`1 - (${interviewChatMessages.embedding} <=> ${queryEmbeddingString}::vector)`,
      })
      .from(interviewChatMessages)
      .where(eq(interviewChatMessages.userId, userId));
    
    // Add session filter if specified
    if (sessionId) {
      searchQuery = searchQuery.where(
        and(
          eq(interviewChatMessages.userId, userId),
          eq(interviewChatMessages.sessionId, sessionId)
        )
      );
    }
    
    // Order by similarity and limit results
    const results = await searchQuery
      .orderBy(sql`1 - (${interviewChatMessages.embedding} <=> ${queryEmbeddingString}::vector) DESC`)
      .limit(limit);
    
    return results.map(result => ({
      id: result.id,
      content: result.content,
      role: result.role as 'user' | 'assistant',
      messageIndex: parseInt(result.messageIndex),
      sessionId: result.sessionId,
      similarity: result.similarity,
      metadata: result.metadata ? JSON.parse(result.metadata as string) : undefined,
      createdAt: result.createdAt,
    }));
  } catch (error) {
    console.error('❌ Failed to search chat messages:', error);
    throw error;
  }
}

/**
 * Get similar messages to a specific message
 */
export async function getSimilarMessages(
  messageId: string,
  userId: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Get the target message
    const targetMessage = await db
      .select()
      .from(interviewChatMessages)
      .where(
        and(
          eq(interviewChatMessages.id, messageId),
          eq(interviewChatMessages.userId, userId)
        )
      )
      .limit(1);
    
    if (targetMessage.length === 0) {
      throw new Error('Message not found');
    }
    
    const target = targetMessage[0];
    
    // Find similar messages using vector similarity
    const results = await db
      .select({
        id: interviewChatMessages.id,
        content: interviewChatMessages.content,
        role: interviewChatMessages.role,
        messageIndex: interviewChatMessages.messageIndex,
        sessionId: interviewChatMessages.sessionId,
        metadata: interviewChatMessages.metadata,
        createdAt: interviewChatMessages.createdAt,
        similarity: sql<number>`1 - (${interviewChatMessages.embedding} <=> ${target.embedding})`,
      })
      .from(interviewChatMessages)
      .where(
        and(
          eq(interviewChatMessages.userId, userId),
          sql`${interviewChatMessages.id} != ${messageId}` // Exclude the target message itself
        )
      )
      .orderBy(sql`1 - (${interviewChatMessages.embedding} <=> ${target.embedding}) DESC`)
      .limit(limit);
    
    return results.map(result => ({
      id: result.id,
      content: result.content,
      role: result.role as 'user' | 'assistant',
      messageIndex: parseInt(result.messageIndex),
      sessionId: result.sessionId,
      similarity: result.similarity,
      metadata: result.metadata ? JSON.parse(result.metadata as string) : undefined,
      createdAt: result.createdAt,
    }));
  } catch (error) {
    console.error('❌ Failed to get similar messages:', error);
    throw error;
  }
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChatSession(sessionId: string, userId: string): Promise<void> {
  // Verify the session belongs to the user
  const session = await db
    .select()
    .from(interviewChatSessions)
    .where(
      and(
        eq(interviewChatSessions.id, sessionId),
        eq(interviewChatSessions.userId, userId)
      )
    )
    .limit(1);
  
  if (session.length === 0) {
    throw new Error('Session not found or access denied');
  }
  
  // Delete the session (messages will be deleted automatically due to cascade)
  await db
    .delete(interviewChatSessions)
    .where(eq(interviewChatSessions.id, sessionId));
  
  console.log(`✅ Deleted chat session ${sessionId} and all its messages`);
}

/**
 * Get chat statistics for a user
 */
export async function getUserChatStats(userId: string): Promise<{
  totalSessions: number;
  totalMessages: number;
  averageSessionScore: number;
  totalTopicsExplored: number;
}> {
  const sessions = await getUserChatSessions(userId);
  
  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((sum, session) => sum + session.totalMessages, 0);
  const averageSessionScore = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + session.averageScore, 0) / sessions.length 
    : 0;
  
  // Count unique topics across all sessions
  const allTopicCoverage = sessions
    .map(session => session.topicCoverage)
    .filter(coverage => coverage && typeof coverage === 'object');
  
  const uniqueTopics = new Set();
  allTopicCoverage.forEach(coverage => {
    if (coverage.explored) {
      uniqueTopics.add(coverage.explored);
    }
  });
  
  return {
    totalSessions,
    totalMessages,
    averageSessionScore: Math.round(averageSessionScore * 100) / 100,
    totalTopicsExplored: uniqueTopics.size,
  };
}