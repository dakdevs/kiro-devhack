import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { after } from 'next/server';
// Session management will be handled directly in this file
// RAG agent disabled - embeddings table removed
// import { InterviewRAGAgent } from '~/services/rag-agent';
import { db } from '~/db';
import { user, userSkills, skillMentions, interviewSessions, embeddings } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { InterviewRAGAgent } from '~/services/rag-agent';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

async function getUserIdFromAuth(req: NextRequest): Promise<string | null> {
    // TODO: Implement proper auth logic
    // For now, create a test user if it doesn't exist
    const userId = "test-user-123";

    try {
        // Check if user exists
        const existingUser = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.id, userId),
        });

        if (!existingUser) {
            // Create test user
            await db.insert(user).values({
                id: userId,
                name: "Test User",
                email: "test@example.com",
                emailVerified: true,
            });
            console.log('✅ Test user created:', userId);
        }

        return userId;
    } catch (error) {
        console.error('❌ Failed to get/create user:', error);
        return null;
    }
}

// --- Session Management ---
async function getOrCreateSession(userId: string, sessionId: string) {
    try {
        // Check if session exists
        const existing = await db.query.interviewSessions.findFirst({
            where: eq(interviewSessions.id, sessionId),
        });

        if (existing) {
            console.log(`✅ Session exists: ${existing.id}`);
            return existing;
        }

        // Create new session
        console.log('🆕 Creating new interview session...');
        const inserted = await db.insert(interviewSessions).values({
            id: sessionId,
            userId: userId,
            sessionType: 'interview',
            title: 'AI Interview Session',
            description: 'Adaptive interview session for skill assessment',
            status: 'active',
        }).returning();

        console.log('✅ Session created:', inserted[0].id);
        return inserted[0];
    } catch (error) {
        console.error('❌ Failed to get or create session:', error);
        throw error;
    }
}

async function updateSessionMetrics(sessionId: string, messageCount: number, averageEngagement: string, overallScore: number) {
    try {
        await db.update(interviewSessions)
            .set({
                messageCount,
                averageEngagement,
                overallScore: overallScore.toString(),
                updatedAt: new Date(),
            })
            .where(eq(interviewSessions.id, sessionId));

        console.log(`✅ Session metrics updated: ${sessionId}`);
    } catch (error) {
        console.error('❌ Failed to update session metrics:', error);
    }
}

// --- Adaptive Interview System Prompt ---
const INTERVIEW_SYSTEM_PROMPT = `
You are an adaptive interviewer who dynamically explores topics based on interviewee responses. Your goal is to maximize knowledge extraction while maintaining natural conversation flow.

CORE BEHAVIOR:
1. Start with broad topics and drill down when the interviewee shows knowledge/interest
2. Detect topic exhaustion signals: short answers, repetition, "I don't know", vague responses
3. Smoothly transition to explore other branches when a topic is exhausted
4. Never dwell on topics the interviewee can't elaborate on
5. Work with ANY domain - career, hobbies, technical knowledge, personal interests, etc.

CONVERSATION STRATEGY:
- Parse the current topic tree state before each response
- Analyze the interviewee's last response for depth and engagement signals
- Decide: go deeper, stay current level, or backtrack to explore other branches
- Generate smooth transitional questions that feel natural
- Keep responses concise (2-3 sentences max) to encourage interviewee talking

TOPIC NAVIGATION RULES:
- Rich, detailed responses → Go deeper into subtopics
- Brief/vague responses → Mark topic as exhausted, pivot to sibling or parent topics
- "I don't know" signals → Gracefully transition without making them feel bad
- Always maintain conversational flow with smooth transitions

You are domain-agnostic and work for any field: engineering, arts, business, sports, cooking, etc.

CURRENT TOPIC TREE STATE: {topicTreeState}
CURRENT TOPIC PATH: {currentPath}
EXHAUSTED TOPICS: {exhaustedTopics}
`;

// --- Response Analysis Prompt ---
const RESPONSE_ANALYSIS_PROMPT = `
Analyze this user response for engagement signals and topic extraction.

Return JSON with this structure:
{
  "engagementLevel": "high|medium|low",
  "exhaustionSignals": ["short_answer", "repetition", "dont_know", "vague"],
  "newTopics": ["topic1", "topic2"],
  "subtopics": ["subtopic1", "subtopic2"],
  "responseLength": "detailed|moderate|brief",
  "confidenceLevel": "confident|uncertain|struggling"
  "buzzwords": ["term1", "term2", "multi word term 3"]
}

Instructions for "buzzwords":
- Return 3-15 concise, domain-relevant terms/phrases from the response.
- Prefer multi-word technical terms, jargon, or key concepts.
- Include acronyms, frameworks, libraries, methodologies, tools, companies, roles, and metrics if present.
- lowercase all items, remove duplicates, and avoid generic stopwords.

RESPOND WITH ONLY THE JSON OBJECT.
`;

// --- Models ---
const INTERVIEW_MODEL = 'moonshotai/kimi-k2:free';
const ANALYSIS_MODEL = 'moonshotai/kimi-k2:free';

// --- Topic Tree Data Structure ---
interface TopicNode {
    id: string;
    name: string;
    depth: number;
    parentId: string | null;
    children: string[];
    status: 'unexplored' | 'exploring' | 'exhausted' | 'rich';
    context: string;
    mentions: Array<{
        messageIndex: number;
        timestamp: string;
        response: string;
        engagementLevel: string;
    }>;
    createdAt: string;
}

interface ConversationState {
    topicTree: Map<string, TopicNode>;
    currentPath: string[];
    exhaustedTopics: string[];
    grades: Array<{
        messageIndex: number;
        score: number;
        timestamp: string;
        content: string;
        engagementLevel: string;
    }>;
    startTime: string;
    totalDepth: number;
    maxDepthReached: number;

    // NEW PROPERTY FOR BUZZWORDS
    buzzwords?: Map<string, { count: number; sources: Set<number> }>;
}

// Global conversation state (use Redis/database in production)
const conversationStates = new Map<string, ConversationState>();

// --- Initialize Topic Tree ---
function initializeTopicTree(sessionId: string): ConversationState {
    // edited to include buzzwords:
    const state: ConversationState = {
        topicTree: new Map(),
        currentPath: [],
        exhaustedTopics: [],
        grades: [],
        startTime: new Date().toISOString(),
        totalDepth: 0,
        maxDepthReached: 0,
        buzzwords: new Map(), // NEW BUZZWORDS MAP
    };

    // Create root node
    const rootNode: TopicNode = {
        id: 'root',
        name: 'General Background',
        depth: 0,
        parentId: null,
        children: [],
        status: 'exploring',
        context: 'Starting conversation',
        mentions: [],
        createdAt: new Date().toISOString()
    };

    state.topicTree.set('root', rootNode);
    state.currentPath = ['root'];

    conversationStates.set(sessionId, state);
    return state;
}

// --- Analyze User Response ---
async function analyzeResponse(userResponse: string): Promise<any> {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return null;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: ANALYSIS_MODEL,
                messages: [
                    { role: 'system', content: RESPONSE_ANALYSIS_PROMPT },
                    { role: 'user', content: userResponse }
                ],
            }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const analysisText = data.choices?.[0]?.message?.content?.trim();

        try {
            const parsed = JSON.parse(analysisText);
            if (!Array.isArray(parsed.buzzwords)) parsed.buzzwords = [];
            return parsed;
        } catch {
            // Fallback analysis
            return analyzeResponseFallback(userResponse);
        }
    } catch (error) {
        console.error('❌ Failed to analyze response:', error);
        return analyzeResponseFallback(userResponse);
    }
}

// --- Fallback Response Analysis ---
function analyzeResponseFallback(userResponse: string): any {
    const text = userResponse.toLowerCase();
    const wordCount = text.split(' ').length;

    const exhaustionSignals = [];
    if (wordCount < 10) exhaustionSignals.push('short_answer');
    if (text.includes("don't know") || text.includes("not sure")) exhaustionSignals.push('dont_know');
    if (text.includes('i guess') || text.includes('maybe')) exhaustionSignals.push('vague');

    return {
        engagementLevel: wordCount > 30 ? 'high' : wordCount > 15 ? 'medium' : 'low',
        exhaustionSignals,
        newTopics: extractTopicsFromText(text),
        subtopics: [],
        responseLength: wordCount > 30 ? 'detailed' : wordCount > 15 ? 'moderate' : 'brief',
        confidenceLevel: exhaustionSignals.length === 0 ? 'confident' : 'uncertain',
        buzzwords: [] // ADD
    };
}

// --- Extract Topics from Text ---
function extractTopicsFromText(text: string): string[] {
    const topics: string[] = [];

    // Domain-agnostic topic indicators
    const topicPatterns = [
        /work(?:ing)?\s+(?:on|with|in)\s+([^,.!?]+)/g,
        /experience\s+(?:with|in)\s+([^,.!?]+)/g,
        /involved\s+in\s+([^,.!?]+)/g,
        /focus(?:ed)?\s+on\s+([^,.!?]+)/g,
        /specialize\s+in\s+([^,.!?]+)/g,
        /background\s+in\s+([^,.!?]+)/g
    ];

    topicPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const topic = match[1].trim();
            if (topic.length > 2 && topic.length < 50) {
                topics.push(topic);
            }
        }
    });

    return topics;
}
// --- Update Topic Tree ---
function updateTopicTree(sessionId: string, analysis: any, userResponse: string, messageIndex: number) {
    const state = conversationStates.get(sessionId);
    if (!state) return;

    const currentNodeId = state.currentPath[state.currentPath.length - 1];
    const currentNode = state.topicTree.get(currentNodeId);
    if (!currentNode) return;

    // Update current node with new mention
    currentNode.mentions.push({
        messageIndex,
        timestamp: new Date().toISOString(),
        response: userResponse,
        engagementLevel: analysis.engagementLevel
    });

    // Determine next action based on analysis
    const hasExhaustionSignals = analysis.exhaustionSignals && analysis.exhaustionSignals.length > 0;
    const isHighEngagement = analysis.engagementLevel === 'high';
    const hasNewTopics = analysis.newTopics && analysis.newTopics.length > 0;

    if (hasExhaustionSignals || analysis.engagementLevel === 'low') {
        // Mark current topic as exhausted and backtrack
        currentNode.status = 'exhausted';
        state.exhaustedTopics.push(currentNodeId);

        console.log(`🔄 Topic "${currentNode.name}" marked as exhausted, backtracking...`);

        // Navigate to parent or sibling
        navigateToNextTopic(state);

    } else if (isHighEngagement && hasNewTopics) {
        // Create subtopics and go deeper
        currentNode.status = 'rich';

        analysis.newTopics.forEach((topicName: string) => {
            createSubtopic(state, currentNodeId, topicName, userResponse);
        });

        // Navigate to first new subtopic
        if (currentNode.children.length > 0) {
            const firstChild = currentNode.children[0];
            state.currentPath.push(firstChild);
            state.maxDepthReached = Math.max(state.maxDepthReached, state.currentPath.length - 1);

            console.log(`🔍 Going deeper: ${state.currentPath.map(id => state.topicTree.get(id)?.name).join(' → ')}`);
        }
    }

    // Update depth tracking
    state.totalDepth = state.currentPath.length - 1;
}

// --- Create Subtopic ---
function createSubtopic(state: ConversationState, parentId: string, topicName: string, context: string) {
    const parentNode = state.topicTree.get(parentId);
    if (!parentNode) return;

    const subtopicId = `${parentId}_${topicName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const subtopic: TopicNode = {
        id: subtopicId,
        name: topicName,
        depth: parentNode.depth + 1,
        parentId: parentId,
        children: [],
        status: 'unexplored',
        context: context.substring(0, 100),
        mentions: [],
        createdAt: new Date().toISOString()
    };

    state.topicTree.set(subtopicId, subtopic);
    parentNode.children.push(subtopicId);

    console.log(`🌱 New subtopic created: "${topicName}" (depth ${subtopic.depth})`);
}

// --- Navigate to Next Topic ---
function navigateToNextTopic(state: ConversationState) {
    // Try to find unexplored sibling
    const currentNodeId = state.currentPath[state.currentPath.length - 1];
    const currentNode = state.topicTree.get(currentNodeId);

    if (currentNode?.parentId) {
        const parent = state.topicTree.get(currentNode.parentId);
        if (parent) {
            const unexploredSibling = parent.children.find(childId => {
                const child = state.topicTree.get(childId);
                return child && child.status === 'unexplored';
            });

            if (unexploredSibling) {
                // Navigate to sibling
                state.currentPath[state.currentPath.length - 1] = unexploredSibling;
                const siblingNode = state.topicTree.get(unexploredSibling);
                console.log(`↔️ Moving to sibling: "${siblingNode?.name}"`);
                return;
            }
        }

        // No unexplored siblings, backtrack to parent
        state.currentPath.pop();
        if (state.currentPath.length === 0) {
            state.currentPath = ['root'];
        }

        const newCurrentNode = state.topicTree.get(state.currentPath[state.currentPath.length - 1]);
        console.log(`⬆️ Backtracked to: "${newCurrentNode?.name}"`);
    }
}

// --- Grade Response ---
async function gradeResponse(userResponse: string, analysis: any): Promise<number> {
    // Simple scoring based on engagement and depth
    let score = 1.0; // Base score

    if (analysis.engagementLevel === 'high') score += 0.5;
    else if (analysis.engagementLevel === 'low') score -= 0.3;

    if (analysis.responseLength === 'detailed') score += 0.3;
    else if (analysis.responseLength === 'brief') score -= 0.2;

    if (analysis.confidenceLevel === 'confident') score += 0.2;
    else if (analysis.confidenceLevel === 'struggling') score -= 0.3;

    return Math.max(0, Math.min(2.0, score));
}

// --- Generate Topic Tree State for Prompt ---
function generateTopicTreeState(state: ConversationState): string {
    const treeRepresentation: string[] = [];

    function traverseNode(nodeId: string, indent: string = '') {
        const node = state.topicTree.get(nodeId);
        if (!node) return;

        const statusEmoji = {
            'unexplored': '⚪',
            'exploring': '🔵',
            'exhausted': '🔴',
            'rich': '🟢'
        }[node.status];

        const isCurrentNode = state.currentPath[state.currentPath.length - 1] === nodeId;
        const marker = isCurrentNode ? ' ← CURRENT' : '';

        treeRepresentation.push(`${indent}${statusEmoji} ${node.name} (depth: ${node.depth})${marker}`);

        node.children.forEach(childId => {
            traverseNode(childId, indent + '  ');
        });
    }

    traverseNode('root');
    return treeRepresentation.join('\n');
}

// NEW HELPER FUNCTION FOR BUZZWORDS ROLLUP HELPER WOOHOO!!!:
function topBuzzwords(state: ConversationState, limit = 50) {
    if (!state.buzzwords) return [];
    const arr = [...state.buzzwords.entries()].map(([term, v]) => ({
        term, count: v.count,
        sources: [...v.sources].sort((a, b) => a - b),
    }));
    arr.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
    return arr.slice(0, limit);
}

// --- Generate Summary Tree ---
function generateSummaryTree(sessionId: string) {
    const state = conversationStates.get(sessionId);
    if (!state) return null;

    const summary = {
        sessionId,
        startTime: state.startTime,
        endTime: new Date().toISOString(),
        totalNodes: state.topicTree.size,
        maxDepthReached: state.maxDepthReached,
        exhaustedTopics: state.exhaustedTopics.length,
        averageScore: state.grades.reduce((sum, g) => sum + g.score, 0) / state.grades.length || 0,
        topicCoverage: {
            explored: Array.from(state.topicTree.values()).filter(n => n.status !== 'unexplored').length,
            rich: Array.from(state.topicTree.values()).filter(n => n.status === 'rich').length,
            exhausted: Array.from(state.topicTree.values()).filter(n => n.status === 'exhausted').length
        },
        // ADD NEW TOP BUZZWORDS woohoo!!
        buzzwords: topBuzzwords(state),
    };

    console.log('\n🌟 === ADAPTIVE INTERVIEW SUMMARY ===');
    console.log(`📅 Duration: ${state.startTime} → ${summary.endTime}`);
    console.log(`📊 Average Score: ${summary.averageScore.toFixed(2)}/2.0`);
    console.log(`🌳 Topic Tree: ${summary.totalNodes} nodes, max depth ${summary.maxDepthReached}`);
    console.log(`📈 Coverage: ${summary.topicCoverage.explored} explored, ${summary.topicCoverage.rich} rich, ${summary.topicCoverage.exhausted} exhausted`);
    //ADDING CONSOLE LOG FOR BUZZWORDS SUMMARY SO FAR:
    console.log('🧠 Top Buzzwords:', summary.buzzwords.slice(0, 20));
    console.log('\n🗺️ TOPIC TREE STRUCTURE:');
    console.log(generateTopicTreeState(state));
    console.log('=====================================\n');

    return summary;
}

// --- User-centric skill tracking helpers ---
async function upsertUserSkill(userId: string, skillName: string, confidence: number, engagementLevel: string, topicDepth: number) {
    const norm = skillName.trim();
    const userSkillId = `${userId}_${norm.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')}`;

    console.log(`🔎 upsertUserSkill called for user "${userId}" skill "${norm}"`);

    try {
        // Check if user already has this skill
        const existing = await db.query.userSkills.findFirst({
            where: eq(userSkills.id, userSkillId),
        });

        if (existing) {
            // Update existing skill metrics
            const newMentionCount = existing.mentionCount + 1;
            const currentAvgConfidence = parseFloat(existing.averageConfidence);
            const currentAvgDepth = parseFloat(existing.topicDepthAverage);

            // Calculate new averages
            const newAvgConfidence = ((currentAvgConfidence * (newMentionCount - 1)) + confidence) / newMentionCount;
            const newAvgDepth = ((currentAvgDepth * (newMentionCount - 1)) + topicDepth) / newMentionCount;

            // Calculate proficiency score (0-100) based on confidence, engagement, and frequency
            const engagementScore = engagementLevel === 'high' ? 1.0 : engagementLevel === 'medium' ? 0.7 : 0.4;
            const frequencyScore = Math.min(newMentionCount / 10, 1.0); // Max out at 10 mentions
            const proficiencyScore = Math.round((newAvgConfidence * 0.4 + engagementScore * 0.4 + frequencyScore * 0.2) * 100);

            const updated = await db.update(userSkills)
                .set({
                    mentionCount: newMentionCount,
                    lastMentioned: new Date(),
                    averageConfidence: newAvgConfidence.toFixed(3),
                    averageEngagement: calculateAverageEngagement(existing.averageEngagement, engagementLevel, newMentionCount),
                    topicDepthAverage: newAvgDepth.toFixed(2),
                    proficiencyScore: proficiencyScore.toString(),
                    updatedAt: new Date(),
                })
                .where(eq(userSkills.id, userSkillId))
                .returning();

            console.log(`✅ User skill updated: ${updated[0].skillName} (mentions: ${newMentionCount}, proficiency: ${proficiencyScore})`);
            return updated[0].id;
        } else {
            // Create new user skill
            const proficiencyScore = Math.round((confidence * 0.4 + (engagementLevel === 'high' ? 1.0 : engagementLevel === 'medium' ? 0.7 : 0.4) * 0.4 + 0.1 * 0.2) * 100);

            const inserted = await db.insert(userSkills).values({
                id: userSkillId,
                userId: userId,
                skillName: norm,
                mentionCount: 1,
                lastMentioned: new Date(),
                proficiencyScore: proficiencyScore.toString(),
                averageConfidence: confidence.toFixed(3),
                averageEngagement: engagementLevel,
                topicDepthAverage: topicDepth.toFixed(2),
                firstMentioned: new Date(),
                synonyms: null,
            }).returning();

            console.log(`✅ New user skill created: ${inserted[0].skillName} (proficiency: ${proficiencyScore})`);
            return inserted[0].id;
        }
    } catch (error) {
        console.error('❌ Failed to upsert user skill:', error);
        throw error;
    }
}

function calculateAverageEngagement(currentAvg: string, newEngagement: string, totalCount: number): string {
    const engagementToScore = { 'high': 3, 'medium': 2, 'low': 1 };
    const scoreToEngagement = { 3: 'high', 2: 'medium', 1: 'low' };

    const currentScore = engagementToScore[currentAvg as keyof typeof engagementToScore] || 2;
    const newScore = engagementToScore[newEngagement as keyof typeof engagementToScore] || 2;

    const avgScore = ((currentScore * (totalCount - 1)) + newScore) / totalCount;
    const roundedScore = Math.round(avgScore) as keyof typeof scoreToEngagement;

    return scoreToEngagement[roundedScore] || 'medium';
}

async function createSkillMention(params: {
    userSkillId: string;
    userId: string;
    sessionId?: string | null;
    messageIndex?: number | null;
    mentionText?: string | null;
    confidence?: number | null;
    engagementLevel?: string | null;
    topicDepth?: number | null;
    conversationContext?: string | null;
}) {
    try {
        console.log('💾 Inserting skill mention for user skill:', params.userSkillId);
        const inserted = await db.insert(skillMentions).values({
            userSkillId: params.userSkillId,
            userId: params.userId,
            sessionId: params.sessionId ?? null,
            messageIndex: params.messageIndex ?? null,
            mentionText: params.mentionText ?? null,
            confidence: params.confidence != null ? String(params.confidence) : null,
            engagementLevel: params.engagementLevel ?? null,
            topicDepth: params.topicDepth != null ? String(params.topicDepth) : null,
            conversationContext: params.conversationContext ?? null,
        }).returning();

        console.log('✅ Skill mention inserted with id:', inserted[0].id);
        return inserted[0];
    } catch (error) {
        console.error('❌ Failed to insert skill mention:', error);
        throw error;
    }
}

async function extractSkillsFromText(text: string): Promise<Array<{ skill: string; evidence: string; confidence: number }>> {
    try {
        // Import the new comprehensive skill extraction service
        const { skillExtractionService } = await import('~/services/skill-extraction');
        
        // Use the comprehensive skill extraction
        const result = await skillExtractionService.extractSkills(text, 'interview');
        
        // Convert to the expected format
        return result.skills.map(skill => ({
            skill: skill.name,
            evidence: skill.evidence,
            confidence: skill.confidence
        }));
    } catch (error) {
        console.warn('⚠️ Comprehensive skill extraction failed, using fallback:', error);
        
        // Fallback to basic extraction if the service fails
        return extractSkillsFromTextFallback(text);
    }
}

function extractSkillsFromTextFallback(text: string): Array<{ skill: string; evidence: string; confidence: number }> {
    const knownSkills = [
        'react', 'reactjs', 'typescript', 'node', 'next', 'tailwind', 'sql', 'postgres', 'docker', 'graphql', 'jest'
    ];

    const normalized = text.toLowerCase();
    const results: Array<{ skill: string; evidence: string; confidence: number }> = [];

    // First, check known skills by simple word boundary match
    for (const s of knownSkills) {
        const pattern = new RegExp(`\\b${s}\\b`, 'i');
        if (pattern.test(normalized)) {
            results.push({ skill: s === 'reactjs' ? 'react' : s, evidence: s, confidence: 0.9 });
        }
    }

    // Also include heuristic topics discovered by extractTopicsFromText (if any)
    try {
        const topics = extractTopicsFromText(normalized);
        for (const t of topics) {
            // avoid duplicates
            if (!results.find(r => r.skill === t)) {
                results.push({ skill: t, evidence: t, confidence: 0.7 });
            }
        }
    } catch (err) {
        console.warn('⚠️ extractTopicsFromText failed during skill extraction:', err);
    }

    return results;
}

// --- Store Conversation Embedding for RAG ---
async function storeConversationEmbedding(content: string, userId: string, sessionId: string, messageIndex: number) {
    try {
        console.log('💾 Storing conversation embedding for RAG...');
        
        // Import embedOne function
        const { embedOne } = await import('~/utils/embeddings');
        
        // Generate embedding
        const embedding = await embedOne(content);
        
        if (!embedding || embedding.length === 0) {
            console.log('⚠️ No embedding generated, skipping storage');
            return;
        }

        // Store in database
        await db.insert(embeddings).values({
            userId,
            sessionId,
            content,
            embedding,
            messageIndex,
        });

        console.log('✅ Conversation embedding stored successfully');
    } catch (error) {
        console.log('⚠️ Failed to store conversation embedding:', error.message);
        throw error;
    }
}

//  --- Main Handler-- -
export async function POST(req: NextRequest) {
    try {
        console.log('🚀 API Route called');

        // we store boolean value for storage/embedding flag for RAG agent
        let allowEmbeddingAndStorage: boolean = true;

        // Check if API key is available
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('❌ OPENROUTER_API_KEY is not set');
            return NextResponse.json(
                { reply: 'Server configuration error: API key not found' },
                { status: 500 }
            );
        }

        console.log('✅ API key is available');

        const body = await req.json();
        console.log('📝 Request body:', JSON.stringify(body, null, 2));

        let messages = Array.isArray(body.messages) ? body.messages : [];
        if (!messages.length && typeof body.message === "string") {
            messages = [{ role: "user", content: body.message }];
        }

        console.log('💬 Processed messages:', JSON.stringify(messages, null, 2));

        const sessionId = body.sessionId || `session-${Date.now()}`;
        const latestUserMessage = messages.filter(m => m.role === 'user').pop();
        const messageIndex = messages.filter(m => m.role === 'user').length;

        // user and session db logic
        console.log('🔐 Getting user ID from auth...');
        const userId = await getUserIdFromAuth(req);
        if (!userId) {
            return NextResponse.json({ reply: 'Auth Error: User not found the auth logic is not implemented' }, { status: 401 });
        }
        console.log('✅ User ID obtained:', userId);

        // Get or create interview session in database
        console.log('💾 Getting or creating interview session...');
        const session = await getOrCreateSession(userId, sessionId);
        console.log('✅ Session obtained:', session.id);

        // Initialize or get conversation state
        let state = conversationStates.get(sessionId);
        if (!state) {
            state = initializeTopicTree(sessionId);
        }

        console.log(`📝 Processing adaptive interview message ${messageIndex} for session ${sessionId}`);

        // Generate topic tree state for prompt
        const topicTreeState = generateTopicTreeState(state);
        const currentPath = state.currentPath.map(id => state.topicTree.get(id)?.name).join(' → ');
        const exhaustedTopics = state.exhaustedTopics.map(id => state.topicTree.get(id)?.name).join(', ');

        // Create dynamic system prompt with current state
        const dynamicPrompt = INTERVIEW_SYSTEM_PROMPT
            .replace('{topicTreeState}', topicTreeState)
            .replace('{currentPath}', currentPath)
            .replace('{exhaustedTopics}', exhaustedTopics);

        // RAG AGENT PROCESSING - Intercept user message
        let finalMessages = messages;
        if (latestUserMessage?.content) {
            try {
                const ragAgent = new InterviewRAGAgent();
                const ragResult = await ragAgent.processQuery(latestUserMessage.content, userId);

                // CHANGING LOGIC SO IF RAG DEEMS NOT RELEVANT NOTHING STORED:
                if (!ragResult.isRelevant) {
                    //off topic, do not embed or store anything embedding-related
                    allowEmbeddingAndStorage = false;

                    return NextResponse.json({
                        reply: ragResult.response,
                        sessionId
                    });
                }

                // RAG agent enhanced the prompt, use enhanced version
                if (ragResult.enhancedPrompt) {
                    // Replace the latest user message with enhanced prompt
                    finalMessages = [...messages];
                    const userMessageIndex = finalMessages.map(m => m.role).lastIndexOf('user');
                    if (userMessageIndex !== -1) {
                        finalMessages[userMessageIndex] = {
                            role: 'user',
                            content: ragResult.enhancedPrompt
                        };
                    }
                }
            } catch (ragError) {
                console.error('\n\n\n❌ RAG AGENT ERROR:', ragError);
                console.log('🔄 Falling back to original message processing');
                // Continue with original messages if RAG fails
            }
        }

        // NEW BLOCK FOR COMPUTE ANALYIS BLOCK WOOHOO!
        let analysis: any = null;
        if (latestUserMessage?.content) {
            try {
                analysis = await analyzeResponse(latestUserMessage.content);
            } catch {
                analysis = analyzeResponseFallback(latestUserMessage.content);
            }
        }

        // Generate AI response
        const result = await generateText({
            system: dynamicPrompt,
            messages: finalMessages,
            model: openrouter.chat(INTERVIEW_MODEL),
            temperature: 0.7,
        });

        // Background processing with after()
        after(async () => {
            if (!latestUserMessage?.content) return;

            console.log(`🔄 Starting adaptive analysis for message ${messageIndex}...`);

            try {
                // REUSE THE CAPTURED ANALYIS AND GAURD IT WOOHOO:
                if (!analysis) {
                    analysis = analyzeResponseFallback(latestUserMessage.content);
                }

                // Update topic tree based on analysis
                updateTopicTree(sessionId, analysis, latestUserMessage.content, messageIndex);

                // Grade the response
                const score = await gradeResponse(latestUserMessage.content, analysis);

                // Enhanced grading display
                const scoreEmoji = score >= 1.8 ? '🌟' : score >= 1.5 ? '🎯' : score >= 1.0 ? '👍' : '📝';
                const performance = score >= 1.8 ? 'EXCELLENT' : score >= 1.5 ? 'STRONG' : score >= 1.0 ? 'GOOD' : 'NEEDS WORK';

                console.log('\n' + '='.repeat(60));
                console.log(`${scoreEmoji} ADAPTIVE INTERVIEW GRADE - Response #${messageIndex}`);
                console.log('='.repeat(60));
                console.log(`📊 SCORE: ${score.toFixed(2)}/2.0 (${performance})`);
                console.log(`🎯 ENGAGEMENT: ${analysis.engagementLevel.toUpperCase()}`);
                console.log(`📏 LENGTH: ${analysis.responseLength.toUpperCase()}`);
                console.log(`🎪 CONFIDENCE: ${analysis.confidenceLevel.toUpperCase()}`);
                console.log(`💬 RESPONSE: "${latestUserMessage.content.substring(0, 80)}${latestUserMessage.content.length > 80 ? '...' : ''}"`);
                console.log(`🗺️ CURRENT PATH: ${currentPath}`);
                console.log(`⏰ TIMESTAMP: ${new Date().toLocaleTimeString()}`);
                console.log('='.repeat(60) + '\n');

                // Store grade
                state.grades.push({
                    messageIndex,
                    score,
                    timestamp: new Date().toISOString(),
                    content: latestUserMessage.content,
                    engagementLevel: analysis.engagementLevel
                });

                // INSERT BUZZWORDS AGGREGATION WOOHOO!!!:
                const buzz = Array.isArray(analysis?.buzzwords) ? analysis.buzzwords : [];
                for (const raw of buzz) {
                    const term = String(raw).trim().toLowerCase();
                    if (!term) continue;
                    const existing = state.buzzwords!.get(term) ?? { count: 0, sources: new Set<number>() };
                    existing.count += 1;
                    existing.sources.add(messageIndex);
                    state.buzzwords!.set(term, existing);
                }
                console.log('🧩 Buzzwords for message', messageIndex, buzz);

                // Update session metrics
                const avgScore = state.grades.reduce((sum, g) => sum + g.score, 0) / state.grades.length || 0;
                await updateSessionMetrics(sessionId, messageIndex, analysis.engagementLevel, avgScore * 50); // Convert to 0-100 scale

                // Skill extraction and persistence
                console.log('🔍 Extracting skills from user response...');
                const skills = await extractSkillsFromText(latestUserMessage.content);
                for (const { skill, evidence, confidence } of skills) {
                    console.log(`📌 Detected skill: ${skill} (confidence: ${confidence})`);

                    // Upsert user skill (creates or updates aggregated skill data)
                    const userSkillId = await upsertUserSkill(
                        userId,
                        skill,
                        confidence,
                        analysis.engagementLevel,
                        state.totalDepth
                    );

                    // Create detailed skill mention record for audit trail
                    await createSkillMention({
                        userSkillId,
                        userId,
                        sessionId: session.id,
                        messageIndex: messageIndex,
                        mentionText: evidence,
                        confidence,
                        engagementLevel: analysis.engagementLevel,
                        topicDepth: state.totalDepth,
                        conversationContext: `Topic: ${state.currentPath.map(id => state.topicTree.get(id)?.name).join(' → ')}`
                    });
                }

                // Store conversation for RAG if allowed
                if (allowEmbeddingAndStorage) {
                    try {
                        await storeConversationEmbedding(latestUserMessage.content, userId, sessionId, messageIndex);
                        console.log('✅ Conversation stored for RAG');
                    } catch (error) {
                        console.log('⚠️ Failed to store conversation embedding:', error.message);
                    }
                }

                // Generate summary every 5 messages
                if (messageIndex >= 5 && messageIndex % 5 === 0) {
                    console.log(`🎯 Generating adaptive interview summary at message ${messageIndex}...`);
                    generateSummaryTree(sessionId);
                }

                console.log(`✅ Adaptive processing completed for message ${messageIndex}`);

            } catch (error) {
                console.error('❌ Adaptive processing failed:', error);
            }
        });

        // Session response logged automatically through metrics

        return NextResponse.json({
            reply: result.text,
            sessionId,
            messageIndex,
            currentTopic: state.currentPath[state.currentPath.length - 1],
            topicDepth: state.totalDepth,
            buzzwords: Array.isArray(analysis?.buzzwords) ? analysis.buzzwords : [], // NEW BUZZWORDS RETURN WOOHOO!!!
        });

    } catch (error: any) {
        console.trace();
        return NextResponse.json(
            { reply: `Error: ${error?.message ?? 'Unknown error occurred.'}` },
            { status: 500 }
        );
    }
}