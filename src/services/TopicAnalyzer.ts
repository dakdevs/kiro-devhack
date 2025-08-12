import { QAPair, TopicNode, TopicRelationship, ITopicAnalyzer } from '../types/conversation-grading';

/**
 * Basic implementation of topic analysis for conversation grading system.
 * Extracts topics from Q&A pairs and determines relationships with existing topics.
 */
export class TopicAnalyzer implements ITopicAnalyzer {
  private readonly CHILD_SIMILARITY_THRESHOLD = 0.6; // Higher threshold for child relationships
  private readonly SIBLING_SIMILARITY_THRESHOLD = 0.4; // Moderate threshold for sibling relationships
  private readonly RELATED_SIMILARITY_THRESHOLD = 0.25; // Lower threshold for any relation
  private readonly CONTINUATION_KEYWORDS = [
    'also', 'additionally', 'furthermore', 'moreover', 'besides',
    'what about', 'how about', 'tell me more', 'can you explain',
    'what else', 'anything else', 'more details', 'elaborate',
    'follow up', 'building on', 'expanding on', 'related to'
  ];

  /**
   * Extracts primary topics from a Q&A pair using keyword analysis and content parsing.
   * @param qaPair The Q&A pair to analyze
   * @returns Array of extracted topic strings
   */
  async extractTopics(qaPair: QAPair): Promise<string[]> {
    const combinedText = `${qaPair.question} ${qaPair.answer}`.toLowerCase();
    
    // Remove common stop words and punctuation
    const cleanText = this.cleanText(combinedText);
    
    // Extract key phrases and concepts
    const topics = this.extractKeyPhrases(cleanText);
    
    // Filter and deduplicate topics
    const filteredTopics = this.filterTopics(topics);
    
    // Return at least one topic, defaulting to a generic one if none found
    return filteredTopics.length > 0 ? filteredTopics : ['general discussion'];
  }

  /**
   * Determines the relationship between a new topic and existing nodes in the tree.
   * @param newTopic The new topic to analyze
   * @param existingNodes Array of existing topic nodes
   * @returns TopicRelationship indicating how the new topic relates to existing ones
   */
  determineRelationship(newTopic: string, existingNodes: TopicNode[]): TopicRelationship {
    if (existingNodes.length === 0) {
      return {
        type: 'new_root',
        confidence: 1.0
      };
    }

    // Check for explicit continuation patterns first
    const continuationResult = this.checkForContinuation(newTopic, existingNodes);
    if (continuationResult) {
      return continuationResult;
    }

    // Calculate similarity with all existing nodes
    const similarityResults = existingNodes.map(node => ({
      node,
      similarity: this.calculateTopicSimilarity(newTopic, node.topic)
    }));

    // Sort by similarity (highest first)
    similarityResults.sort((a, b) => b.similarity - a.similarity);
    const bestMatch = similarityResults[0];

    // More precise relationship determination
    if (bestMatch.similarity >= this.CHILD_SIMILARITY_THRESHOLD) {
      // Very high similarity - this is likely a subtopic or deeper exploration
      return {
        type: 'child_of',
        parentNodeId: bestMatch.node.id,
        confidence: bestMatch.similarity
      };
    } else if (bestMatch.similarity >= this.SIBLING_SIMILARITY_THRESHOLD) {
      // Moderate similarity - could be a sibling topic
      // Check if the best match has a parent to determine sibling relationship
      if (bestMatch.node.parentTopic) {
        return {
          type: 'sibling_of',
          parentNodeId: bestMatch.node.parentTopic,
          confidence: bestMatch.similarity
        };
      } else {
        // Best match is a root node, so this could be a child of it
        return {
          type: 'child_of',
          parentNodeId: bestMatch.node.id,
          confidence: bestMatch.similarity
        };
      }
    } else if (bestMatch.similarity >= this.RELATED_SIMILARITY_THRESHOLD) {
      // Low but meaningful similarity - check context for better placement
      const contextualParent = this.findContextualParent(newTopic, existingNodes, bestMatch.node);
      if (contextualParent) {
        return {
          type: 'child_of',
          parentNodeId: contextualParent.id,
          confidence: bestMatch.similarity
        };
      } else {
        // Create as new root but note the relationship
        return {
          type: 'new_root',
          confidence: 0.8,
          relatedNodeId: bestMatch.node.id
        };
      }
    } else {
      // Very low similarity - definitely a new root topic
      return {
        type: 'new_root',
        confidence: 1.0 - bestMatch.similarity
      };
    }
  }

  /**
   * Cleans text by removing stop words, punctuation, and normalizing whitespace.
   */
  private cleanText(text: string): string {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    return text
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word))
      .join(' ')
      .trim();
  }

  /**
   * Extracts key phrases from cleaned text using simple n-gram analysis.
   */
  private extractKeyPhrases(cleanText: string): string[] {
    const words = cleanText.split(' ');
    const phrases: string[] = [];

    // Extract 1-grams (single words)
    words.forEach(word => {
      if (word.length > 3) {
        phrases.push(word);
      }
    });

    // Extract 2-grams (two-word phrases)
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length > 6) {
        phrases.push(phrase);
      }
    }

    // Extract 3-grams (three-word phrases)
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (phrase.length > 10) {
        phrases.push(phrase);
      }
    }

    return phrases;
  }

  /**
   * Filters and ranks topics by relevance and uniqueness.
   */
  private filterTopics(topics: string[]): string[] {
    if (topics.length === 0) {
      return [];
    }

    // Count frequency of each topic
    const topicCounts = new Map<string, number>();
    topics.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

    // Filter out very short or meaningless topics
    const meaningfulTopics = Array.from(topicCounts.entries())
      .filter(([topic]) => topic.length > 3 && !this.isStopWord(topic))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Take top 3 topics
      .map(([topic]) => topic);

    return meaningfulTopics;
  }

  /**
   * Checks if a topic is a stop word or meaningless phrase.
   */
  private isStopWord(topic: string): boolean {
    const stopPhrases = [
      'what', 'understand', 'what don', 'don', 'know', 'think',
      'like', 'want', 'need', 'get', 'make', 'take', 'come', 'see',
      'don understand', 'what don understand'
    ];
    return stopPhrases.includes(topic.toLowerCase());
  }

  /**
   * Checks if the new topic represents a continuation of an existing conversation.
   */
  private checkForContinuation(newTopic: string, existingNodes: TopicNode[]): TopicRelationship | null {
    const lowerTopic = newTopic.toLowerCase();
    
    // Check for continuation keywords
    const hasContinuationKeywords = this.CONTINUATION_KEYWORDS.some(keyword => 
      lowerTopic.includes(keyword)
    );

    if (hasContinuationKeywords && existingNodes.length > 0) {
      // Find the most recent node (assuming it's the current topic)
      const mostRecentNode = existingNodes.reduce((latest, current) => 
        current.updatedAt > latest.updatedAt ? current : latest
      );

      return {
        type: 'continuation',
        parentNodeId: mostRecentNode.id,
        confidence: 0.8
      };
    }

    return null;
  }

  /**
   * Calculates similarity between two topics using enhanced string similarity.
   */
  private calculateTopicSimilarity(topic1: string, topic2: string): number {
    const words1 = new Set(topic1.toLowerCase().split(' ').filter(word => word.length > 2));
    const words2 = new Set(topic2.toLowerCase().split(' ').filter(word => word.length > 2));
    
    if (words1.size === 0 && words2.size === 0) {
      return 1.0;
    }
    
    if (words1.size === 0 || words2.size === 0) {
      return 0.0;
    }
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity
    let similarity = intersection.size / union.size;
    
    // Boost similarity for related terms
    const relatedTerms = this.checkRelatedTerms(topic1, topic2);
    similarity = Math.min(1.0, similarity + relatedTerms);
    
    // Additional boost for partial word matches
    const partialMatches = this.checkPartialMatches(topic1, topic2);
    similarity = Math.min(1.0, similarity + partialMatches);
    
    return similarity;
  }

  /**
   * Checks for semantically related terms to boost similarity.
   */
  private checkRelatedTerms(topic1: string, topic2: string): number {
    const relatedTermGroups = [
      ['machine', 'learning', 'ml'],
      ['neural', 'network', 'deep'],
      ['artificial', 'intelligence', 'ai'],
      ['supervised', 'unsupervised', 'reinforcement'],
      ['algorithm', 'model', 'training'],
      ['web', 'frontend', 'backend', 'development', 'website'],
      ['programming', 'coding', 'software', 'program'],
      ['computer', 'science', 'technology'],
      ['mobile', 'app', 'application'],
      ['data', 'database', 'storage'],
      ['algorithm', 'algorithms', 'procedure'],
      ['language', 'languages', 'code']
    ];

    const words1 = topic1.toLowerCase().split(' ');
    const words2 = topic2.toLowerCase().split(' ');

    for (const termGroup of relatedTermGroups) {
      const hasTerms1 = termGroup.some(term => words1.some(word => word.includes(term)));
      const hasTerms2 = termGroup.some(term => words2.some(word => word.includes(term)));
      
      if (hasTerms1 && hasTerms2) {
        return 0.3; // Boost similarity for related terms
      }
    }

    return 0;
  }

  /**
   * Checks for partial word matches to boost similarity.
   */
  private checkPartialMatches(topic1: string, topic2: string): number {
    const words1 = topic1.toLowerCase().split(' ');
    const words2 = topic2.toLowerCase().split(' ');
    
    let partialMatches = 0;
    let totalComparisons = 0;
    
    for (const word1 of words1) {
      if (word1.length < 4) continue;
      
      for (const word2 of words2) {
        if (word2.length < 4) continue;
        
        totalComparisons++;
        
        // Check if one word contains the other
        if (word1.includes(word2) || word2.includes(word1)) {
          partialMatches++;
        }
        // Check for common prefixes/suffixes
        else if (word1.length > 4 && word2.length > 4) {
          const prefix1 = word1.substring(0, 4);
          const prefix2 = word2.substring(0, 4);
          if (prefix1 === prefix2) {
            partialMatches += 0.5;
          }
        }
      }
    }
    
    return totalComparisons > 0 ? (partialMatches / totalComparisons) * 0.2 : 0;
  }
}