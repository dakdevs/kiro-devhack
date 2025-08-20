import { conversations, userResponses, user } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '~/db';
import { embedOne } from '~/utils/embeddings'

export async function getOrCreateConversation(userId: string, sessionId: string) {
    try {
        // First, ensure the user exists
        console.log('🔍 Ensuring user exists...');
        await ensureUserExists(userId);
        console.log('✅ User exists or created');
        
        console.log('🔍 Looking for existing conversation...');
        console.log('🔍 Query params - userId:', userId, 'sessionId:', sessionId);
        const existingConversation = await db.query.conversations.findFirst({
            where: and(eq(conversations.userId, userId), eq(conversations.id, sessionId)),
        });
        console.log('🔍 Query result:', existingConversation);

        if (existingConversation) {
            console.log('✅ Found existing conversation:', existingConversation.id);
            return existingConversation;
        }

        console.log('🆕 Creating new conversation...');
        const newConversation = await db.insert(conversations).values({
            id: sessionId,
            userId: userId
        }).returning();

        console.log('✅ New conversation created:', newConversation[0].id);
        return newConversation[0];
    } catch (error) {
        console.error('❌ Error in getOrCreateConversation:', error);
        throw error;
    }
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
    console.log('💾 saveUserResponse called with:');
    console.log('  - userId:', userId);
    console.log('  - conversationId:', conversationId);
    console.log('  - responseText length:', responseText.length);
    console.log('  - embedding length:', embedding.length);
    console.log('  - embedding dimensions check:', embedding.length === 768 ? '✅ Correct (768)' : `❌ Wrong (${embedding.length}, expected 768)`);
    
    try {
        console.log('💾 Attempting database insert...');
        const savedResponse = await db.insert(userResponses).values({
            userId,
            conversationId,
            content: responseText,
            embedding: embedding
        }).returning();
        
        console.log('✅ Database insert successful!');
        console.log('✅ Saved response with ID:', savedResponse[0].id);
        return savedResponse[0];
    } catch (error) {
        console.error('❌ Database insert failed:', error);
        throw error;
    }
}


