import { conversations, userResponses } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '~/db';
import { embedOne } from '~/utils/embeddings'

export async function getOrCreateConversation(userId: string, sessionId: string) {
    const existingConversation = await db.query.conversations.findFirst({
        where: and(eq(conversations.userId, userId), eq(conversations.id, sessionId)),
    });

    if (existingConversation) {
        return existingConversation;
    }

    const newConversation = await db.insert(conversations).values({
        id: sessionId,
        userId: userId
    }).returning();

    return newConversation[0];
}

export async function saveUserResponse(
    userId: string,
    conversationId: string,
    responseText: string,
    embedding: number[]
) {
    const savedResponse = await db.insert(userResponses).values({
        userId,
        conversationId,
        content: responseText,
        embedding: embedding
    }).returning();
    console.log(`3. Saved responses with ID: ${savedResponse[0].id}`)
    return savedResponse[0];
}


