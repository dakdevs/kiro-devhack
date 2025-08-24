import { embedOne } from '~/utils/embeddings';
import { db } from '~/db';
import { embeddings } from '~/db/schema';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';

interface RAGResponse {
  isRelevant: boolean;
  response?: string;
  enhancedPrompt?: string;
}

export class InterviewRAGAgent {
  private openRouterKey = process.env.OPENROUTER_API_KEY;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  async processQuery(userQuery: string, userId: string): Promise<RAGResponse> {
    console.log('\n\n\n🤖 RAG AGENT PROCESSING');
    console.log('📝 User Query:', userQuery);
    console.log('👤 User ID:', userId);

    // Step 1: Quick relevance check
    console.log('\n\n\n🔍 STEP 1: Checking relevance...');
    const relevanceCheck = await this.checkRelevance(userQuery);

    if (!relevanceCheck.isRelevant) {
      console.log('❌ Query deemed OFF-TOPIC');
      console.log('🚫 Blocking query and responding directly');
      return {
        isRelevant: false,
        response: "Let's stay focused on the interview. Please continue with interview-related questions."
      };
    }

    console.log('✅ Query is INTERVIEW-RELEVANT');

    // Step 2: Get relevant conversation context
    console.log('\n\n\n🧠 STEP 2: Retrieving conversation context...');
    const context = await this.getRelevantContext(userQuery, userId);

    // Step 3: Generate enhanced prompt
    console.log('\n\n\n⚡ STEP 3: Creating enhanced prompt...');
    const enhancedPrompt = this.createEnhancedPrompt(userQuery, context);
    console.log('📤 Enhanced prompt ready for main LLM');
    console.log('🎯 RAG AGENT COMPLETE');

    return {
      isRelevant: true,
      enhancedPrompt
    };
  }

  private async checkRelevance(query: string): Promise<{ isRelevant: boolean }> {
    console.log('🔎 Sending relevance check to moonshotai/kimi-k2:free...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2:free',
          messages: [{
            role: 'user',
            content: `Is this query relevant to a job interview context? Answer only "YES" or "NO": "${query}"`
          }],
          max_tokens: 5
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('⚠️ API response not OK, assuming relevant');
        return { isRelevant: true };
      }

      const result = await response.json();
      const answer = result.choices[0]?.message?.content?.trim().toUpperCase();

      console.log('🤖 LLM Response:', answer);
      console.log('📊 Relevance Decision:', answer === 'YES' ? '✅ RELEVANT' : '❌ NOT RELEVANT');

      return { isRelevant: answer === 'YES' };
    } catch (error) {
      console.log('⚠️ Relevance check failed, assuming relevant:', error.message);
      return { isRelevant: true }; // Default to relevant if check fails
    }
  }

  private async getRelevantContext(query: string, userId: string): Promise<string[]> {
    try {
      console.log('🔄 Generating embedding for context search...');
      const queryEmbedding = await embedOne(query);

      if (!queryEmbedding.length) {
        console.log('⚠️ No embedding generated, skipping context retrieval');
        return [];
      }

      console.log('🔍 Searching vector DB for similar conversations...');
      console.log('📏 Similarity threshold: 0.7');
      console.log('📊 Max results: 3');

      const similarConversations = await db
        .select({
          content: embeddings.content,
          similarity: sql<number>`1 - (${cosineDistance(embeddings.embedding, queryEmbedding)})`
        })
        .from(embeddings)
        .where(gt(sql`1 - (${cosineDistance(embeddings.embedding, queryEmbedding)})`, 0.7))
        .orderBy(desc(sql`1 - (${cosineDistance(embeddings.embedding, queryEmbedding)})`))
        .limit(3);

      console.log(`📋 Found ${similarConversations.length} relevant conversations`);

      if (similarConversations.length > 0) {
        console.log('🎯 Context matches:');
        similarConversations.forEach((item, index) => {
          console.log(`  ${index + 1}. Similarity: ${item.similarity?.toFixed(3)} - "${item.content.substring(0, 60)}..."`);
        });
      } else {
        console.log('🔍 No similar conversations found above threshold');
      }

      return similarConversations.map(item => item.content);
    } catch (error) {
      console.log('⚠️ Context retrieval failed, continuing without context:', error.message);
      return [];
    }
  }

  private createEnhancedPrompt(userQuery: string, context: string[]): string {
    const contextText = context.length > 0
      ? `Previous conversation context:\n${context.join('\n---\n')}\n\n`
      : '';

    const enhancedPrompt = `${contextText}Current user input: ${userQuery}\n\nRespond as an experienced interviewer, maintaining conversation flow and referencing previous context when relevant.`;

    console.log('📝 Enhanced prompt structure:');
    console.log(`  📚 Context pieces: ${context.length}`);
    console.log(`  📏 Total prompt length: ${enhancedPrompt.length} characters`);

    if (context.length > 0) {
      console.log('  🧠 Using conversation history for context-aware response');
    } else {
      console.log('  🆕 No previous context - treating as fresh conversation');
    }

    return enhancedPrompt;
  }
}