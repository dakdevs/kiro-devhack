import { conversations, userResponses, user } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '~/db';
import { embedOne } from '~/utils/embeddings'

export async function getOrCreateConversation(userId: string, sessionId: string) {
    // First, ensure the user exists
    await ensureUserExists(userId);
    
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

async function ensureUserExists(userId: string) {
    // Check if user exists
    const existingUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
    });

    if (!existingUser) {
        // Create a temporary user for testing
        await db.insert(user).values({
            id: userId,
            name: 'Temporary User',
            email: `${userId}@temp.com`,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(`✅ Created temporary user: ${userId}`);
    }
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


