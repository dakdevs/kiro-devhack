/**
 * Additional scoring strategy implementations to demonstrate the pluggable nature
 * of the scoring system
 */

import { IScoringStrategy, QAPair, ScoringContext } from '../types/conversation-grading';

/**
 * Simple scoring strategy based on answer quality indicators
 */
export class QualityScoringStrategy implements IScoringStrategy {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    const answer = qaPair.answer.toLowerCase();
    let score = 50; // Base score
    
    // Positive indicators
    if (answer.includes('because') || answer.includes('therefore') || answer.includes('since')) {
      score += 15; // Reasoning
    }
    if (answer.includes('example') || answer.includes('for instance')) {
      score += 10; // Examples
    }
    if (answer.length > 100) {
      score += 10; // Detailed answer
    }
    if (answer.includes('however') || answer.includes('although') || answer.includes('but')) {
      score += 5; // Nuanced thinking
    }
    
    // Negative indicators
    if (answer.length < 20) {
      score -= 20; // Too brief
    }
    if (answer === 'yes' || answer === 'no' || answer === 'maybe') {
      score -= 30; // Non-explanatory
    }
    
    return Math.max(0, Math.min(100, score));
  }
}

/**
 * Complexity-based scoring strategy that rewards deeper topics
 */
export class ComplexityScoringStrategy implements IScoringStrategy {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    const depthMultiplier = Math.min(3, context.topicDepth * 0.5);
    const answerLength = qaPair.answer.length;
    
    // Base score from answer length
    const baseScore = Math.min(70, answerLength / 15);
    
    // Complexity bonus based on depth
    const complexityBonus = depthMultiplier * 10;
    
    // Technical terms bonus
    const technicalTerms = ['algorithm', 'implementation', 'architecture', 'pattern', 'framework'];
    const technicalBonus = technicalTerms.reduce((bonus, term) => {
      return qaPair.answer.toLowerCase().includes(term) ? bonus + 5 : bonus;
    }, 0);
    
    const finalScore = baseScore + complexityBonus + technicalBonus;
    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }
}

/**
 * Context-aware scoring strategy that considers conversation history
 */
export class ContextAwareScoringStrategy implements IScoringStrategy {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    let score = 60; // Base score
    
    // Check if answer builds on previous conversation
    const previousAnswers = context.conversationHistory
      .slice(0, -1) // Exclude current Q&A pair
      .map(qa => qa.answer.toLowerCase());
    
    const currentAnswer = qaPair.answer.toLowerCase();
    
    // Bonus for referencing previous topics
    const referenceWords = ['as mentioned', 'previously', 'earlier', 'building on', 'following up'];
    const hasReference = referenceWords.some(word => currentAnswer.includes(word));
    if (hasReference) {
      score += 15;
    }
    
    // Bonus for consistency with conversation theme
    if (previousAnswers.length > 0) {
      const commonWords = this.findCommonWords(previousAnswers, currentAnswer);
      score += Math.min(20, commonWords.length * 2);
    }
    
    // Length-based adjustment
    const lengthScore = Math.min(20, qaPair.answer.length / 20);
    score += lengthScore;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  private findCommonWords(previousAnswers: string[], currentAnswer: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    
    const currentWords = currentAnswer.split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    const previousWords = previousAnswers.join(' ').split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    return currentWords.filter(word => previousWords.includes(word));
  }
}

/**
 * Weighted scoring strategy that combines multiple factors
 */
export class WeightedScoringStrategy implements IScoringStrategy {
  private weights = {
    length: 0.3,
    quality: 0.4,
    depth: 0.2,
    context: 0.1
  };
  
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    // Length component (0-100)
    const lengthScore = Math.min(100, qaPair.answer.length / 10);
    
    // Quality component (0-100)
    const qualityStrategy = new QualityScoringStrategy();
    const qualityScore = await qualityStrategy.calculateScore(qaPair, context);
    
    // Depth component (0-100)
    const depthScore = Math.min(100, context.topicDepth * 20);
    
    // Context component (0-100)
    const contextStrategy = new ContextAwareScoringStrategy();
    const contextScore = await contextStrategy.calculateScore(qaPair, context);
    
    // Weighted average
    const finalScore = 
      lengthScore * this.weights.length +
      qualityScore * this.weights.quality +
      depthScore * this.weights.depth +
      contextScore * this.weights.context;
    
    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }
  
  /**
   * Update the weights used in scoring calculation
   */
  setWeights(weights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...weights };
  }
}