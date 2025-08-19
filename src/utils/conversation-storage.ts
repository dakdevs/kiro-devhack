import { embedOne } from '~/utils/embeddings';
import { db } from '~/db';
import { embeddings } from '~/db/schema';
import { nanoid } from 'nanoid';

export async function storeConversation(
  content: string, 
  type: 'user' | 'assistant' = 'user'
): Promise<void> {
  try {
    console.log(`\n\n\n💾 STORING ${type.toUpperCase()} MESSAGE`);
    console.log(`📝 Content: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
    
    console.log('🔄 Generating embedding...');
    const embedding = await embedOne(content);
    
    if (!embedding.length) {
      console.log('⚠️ No embedding generated, skipping storage');
      return;
    }

    console.log(`✅ Embedding generated (${embedding.length} dimensions)`);
    
    const id = nanoid();
    await db.insert(embeddings).values({
      id,
      content: `${type}: ${content}`,
      embedding
    });
    
    console.log(`💾 Stored in vector DB with ID: ${id}`);
    console.log('🎯 STORAGE COMPLETE');
  } catch (error) {
    console.error('❌ Failed to store conversation:', error);
  }
}