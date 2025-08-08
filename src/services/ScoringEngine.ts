/**
 * ScoringEngine - Implements pluggable scoring strategies for Q&A pairs
 * Provides a strategy pattern implementation for flexible scoring algorithms
 */

import { IScoringEngine, IScoringStrategy, QAPair, ScoringContext } from '../types/conversation-grading';
import { ValidationUtils, ValidationError, ScoringError } from './ValidationUtils';

/**
 * Base implementation of scoring strategy interface
 * Provides a simple default scoring mechanism
 */
export class BaseScoringStrategy implements IScoringStrategy {
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    try {
      // Validate inputs
      ValidationUtils.validateQAPair(qaPair);
      ValidationUtils.validateScoringContext(context);

      // Default scoring based on answer length and topic depth
      const answerLength = qaPair.answer.length;
      const depthFactor = Math.max(1, context.topicDepth);
      
      // Simple scoring: longer answers get higher scores, adjusted by depth
      const baseScore = Math.min(100, answerLength / 10);
      const depthAdjustedScore = baseScore * (1 + (depthFactor - 1) * 0.1);
      
      const finalScore = Math.round(Math.max(0, Math.min(100, depthAdjustedScore)));
      
      // Validate the calculated score
      ValidationUtils.validateScore(finalScore);
      
      return finalScore;
    } catch (error) {
      throw new ScoringError(
        `Base scoring strategy failed: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
        error as Error
      );
    }
  }
}

/**
 * ScoringEngine class that manages scoring strategies and provides score calculation
 * Implements the strategy pattern for pluggable scoring algorithms
 */
export class ScoringEngine implements IScoringEngine {
  private strategy: IScoringStrategy;
  private fallbackStrategy: IScoringStrategy;

  constructor(strategy?: IScoringStrategy) {
    this.fallbackStrategy = new BaseScoringStrategy();
    this.strategy = strategy || this.fallbackStrategy;
  }

  /**
   * Set the scoring strategy to use for calculations
   * @param strategy The scoring strategy implementation
   */
  setStrategy(strategy: IScoringStrategy): void {
    try {
      if (!strategy || typeof strategy.calculateScore !== 'function') {
        throw new ValidationError('Strategy must implement calculateScore method', 'strategy', strategy);
      }
      this.strategy = strategy;
    } catch (error) {
      throw new ValidationError(
        `Invalid scoring strategy: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
        'strategy',
        strategy
      );
    }
  }

  /**
   * Calculate score for a Q&A pair using the current strategy
   * @param qaPair The Q&A pair to score
   * @param context The scoring context including topic and conversation history
   * @returns Promise resolving to the calculated score
   */
  async calculateScore(qaPair: QAPair, context: ScoringContext): Promise<number> {
    // Validate inputs first
    try {
      ValidationUtils.validateQAPair(qaPair);
      ValidationUtils.validateScoringContext(context);
    } catch (error) {
      throw new ScoringError(
        `Invalid input for scoring: ${ValidationUtils.createSafeErrorMessage(error as Error)}`,
        error as Error
      );
    }

    // Try primary strategy
    try {
      const score = await this.strategy.calculateScore(qaPair, context);
      ValidationUtils.validateScore(score);
      return score;
    } catch (error) {
      console.warn('Primary scoring strategy failed, trying fallback:', ValidationUtils.createSafeErrorMessage(error as Error));
      
      // Try fallback strategy
      try {
        const fallbackScore = await this.fallbackStrategy.calculateScore(qaPair, context);
        ValidationUtils.validateScore(fallbackScore);
        return fallbackScore;
      } catch (fallbackError) {
        console.error('Fallback scoring strategy also failed:', ValidationUtils.createSafeErrorMessage(fallbackError as Error));
        
        // Ultimate fallback: calculate simple score
        try {
          const simpleScore = this.calculateSimpleScore(qaPair, context);
          ValidationUtils.validateScore(simpleScore);
          return simpleScore;
        } catch (simpleError) {
          // Last resort: return neutral score
          console.error('All scoring methods failed, using neutral score:', ValidationUtils.createSafeErrorMessage(simpleError as Error));
          return 50;
        }
      }
    }
  }

  /**
   * Get the current scoring strategy
   * @returns The current scoring strategy instance
   */
  getCurrentStrategy(): IScoringStrategy {
    return this.strategy;
  }

  /**
   * Calculate a simple score as ultimate fallback
   */
  private calculateSimpleScore(qaPair: QAPair, context: ScoringContext): number {
    // Very basic scoring based on answer length only
    const answerLength = qaPair.answer.length;
    const score = Math.min(100, Math.max(10, answerLength / 20));
    return Math.round(score);
  }
}