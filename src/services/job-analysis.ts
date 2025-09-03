import { serverConfig } from '~/config/server-config';
import { 
  JobAnalysisResult, 
  ExtractedSkill, 
  Skill, 
  ExperienceLevel, 
  SkillCategory 
} from '~/types/interview-management';
import { 
  AIProcessingError, 
  ValidationError, 
  ExternalServiceError 
} from '~/lib/errors';
import { logger, withLogging } from '~/lib/logger';
import { withRetry, CircuitBreaker } from '~/lib/error-handler';
import { cache, cacheKeys, cacheTTL, cacheUtils } from '~/lib/cache';
import { rateLimiters, rateLimit, batchUtils } from '~/lib/rate-limiter';

/**
 * Service for analyzing job postings using AI to extract skills, requirements, and other metadata
 */
export class JobAnalysisService {
  private readonly aiModel = 'gpt-3.5-turbo';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second
  private readonly circuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30s recovery
  private readonly batchProcessor = batchUtils.createAIBatcher(
    this.processBatchAnalysis.bind(this),
    3, // batch size
    2000 // max wait time
  );

  constructor() {
    if (!serverConfig.ai.openRouterApiKey) {
      logger.warn('OpenRouter API key not configured. Job analysis will use fallback mode.', {
        operation: 'job-analysis.init',
      });
    }
  }

  /**
   * Analyze a job posting to extract skills, requirements, and metadata
   */
  async analyzeJobPosting(jobDescription: string, jobTitle?: string, userId?: string): Promise<JobAnalysisResult> {
    // Apply rate limiting
    const identifier = userId || 'default';
    const limitInfo = await rateLimiters.aiApi.checkLimit(identifier);
    
    if (limitInfo.isBlocked) {
      throw new Error(`Rate limit exceeded for AI analysis. Try again in ${Math.ceil(limitInfo.msBeforeNext / 1000)} seconds.`);
    }
    // Validate input
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      throw new ValidationError('Job description is required and cannot be empty', 'jobDescription', jobDescription);
    }

    if (jobDescription.length > 50000) {
      throw new ValidationError('Job description is too long (max 50,000 characters)', 'jobDescription', jobDescription.length);
    }

    // Check cache first
    const contentHash = cacheUtils.generateContentHash(jobDescription + (jobTitle || ''));
    const cacheKey = cacheKeys.aiAnalysis(contentHash);
    
    const cachedResult = await cache.get<JobAnalysisResult>(cacheKey);
    if (cachedResult) {
      logger.debug('Job analysis cache hit', {
        operation: 'job-analysis.analyze',
        metadata: { contentHash, fromCache: true },
      });
      return cachedResult;
    }

    return withLogging('job-analysis.analyze', async () => {
      if (!serverConfig.ai.openRouterApiKey) {
        logger.warn('AI analysis unavailable, using fallback extraction', {
          operation: 'job-analysis.analyze',
          metadata: { fallbackMode: true },
        });
        return await this.fallbackAnalysis(jobDescription, jobTitle);
      }

      try {
        const prompt = this.buildAnalysisPrompt(jobDescription, jobTitle);
        const response = await this.circuitBreaker.execute(() => 
          this.callAIWithRetry(prompt)
        );
        const result = this.parseAIResponse(response);
        
        // Validate and enhance the result
        const finalResult = await this.validateAndEnhanceResult(result, jobDescription);
        
        // Cache the result
        await cache.set(cacheKey, finalResult, cacheTTL.long);
        
        logger.logAIOperation('job-analysis', 0, true, {
          metadata: { 
            skillsExtracted: finalResult.extractedSkills.length,
            confidence: finalResult.confidence,
            hasTitle: !!jobTitle,
            cached: true
          },
        });
        
        // Record successful rate limit usage
        await rateLimiters.aiApi.recordRequest(identifier, true);
        
        return finalResult;
      } catch (error) {
        const aiError = error instanceof Error ? error : new Error(String(error));
        
        logger.logAIOperation('job-analysis', 0, false, {
          metadata: { 
            fallbackUsed: true,
            hasTitle: !!jobTitle 
          },
        }, aiError);

        // If it's a circuit breaker error or external service error, provide fallback
        if (error instanceof ExternalServiceError || error instanceof AIProcessingError) {
          const fallbackResult = await this.fallbackAnalysis(jobDescription, jobTitle);
          
          // Wrap in AIProcessingError with fallback data
          throw new AIProcessingError(
            'AI analysis failed, fallback data available',
            fallbackResult,
            true,
            aiError
          );
        }
        
        // For other errors, still provide fallback but log as error
        logger.error('Unexpected error in job analysis, using fallback', {
          operation: 'job-analysis.analyze',
        }, aiError);
        
        const fallbackResult = await this.fallbackAnalysis(jobDescription, jobTitle);
        
        // Cache fallback result with shorter TTL
        await cache.set(cacheKey, fallbackResult, cacheTTL.short);
        
        // Record failed rate limit usage
        await rateLimiters.aiApi.recordRequest(identifier, false);
        
        return fallbackResult;
      }
    });
  }

  /**
   * Build the analysis prompt for the AI model
   */
  private buildAnalysisPrompt(jobDescription: string, jobTitle?: string): string {
    return `
You are an expert job analysis system. Analyze the following job posting and extract structured information in JSON format.

${jobTitle ? `Job Title: ${jobTitle}` : ''}

Job Description:
${jobDescription}

Please extract and return the following information in valid JSON format:

{
  "extractedSkills": [
    {
      "name": "skill name",
      "confidence": 0.0-1.0,
      "category": "technical|soft|domain|language|certification",
      "synonyms": ["alternative names"],
      "context": "how it appears in the job description"
    }
  ],
  "requiredSkills": [
    {
      "name": "skill name",
      "required": true,
      "category": "technical|soft|domain|language|certification"
    }
  ],
  "preferredSkills": [
    {
      "name": "skill name",
      "required": false,
      "category": "technical|soft|domain|language|certification"
    }
  ],
  "experienceLevel": "entry|mid|senior|executive|intern",
  "salaryRange": {
    "min": number or null,
    "max": number or null
  },
  "keyTerms": ["important", "terms", "and", "buzzwords"],
  "confidence": 0.0-1.0,
  "summary": "Brief summary of the role and key requirements"
}

Guidelines:
1. Extract ALL technical skills, programming languages, frameworks, tools, and technologies mentioned
2. Identify soft skills like communication, leadership, teamwork
3. Distinguish between required (must-have) and preferred (nice-to-have) skills
4. Look for experience level indicators (years of experience, seniority level)
5. Extract salary information if mentioned (convert to annual USD if possible)
6. Include relevant buzzwords and industry terms
7. Provide a confidence score based on how clear and detailed the job description is
8. Be conservative with confidence scores - only use high scores for very clear requirements

Return ONLY the JSON object, no additional text or formatting.
    `.trim();
  }

  /**
   * Call the AI API with retry logic
   */
  private async callAIWithRetry(prompt: string): Promise<any> {
    return withRetry(
      async () => {
        const startTime = Date.now();
        
        try {
          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serverConfig.ai.openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.BETTER_AUTH_URL || 'http://localhost:3000',
              'X-Title': 'Interview Management System',
            },
            body: JSON.stringify({
              model: this.aiModel,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.1,
              max_tokens: 2000,
            }),
          });

          const duration = Date.now() - startTime;

          if (!response.ok) {
            const errorText = await response.text();
            
            // Handle specific HTTP status codes
            if (response.status === 429) {
              const retryAfter = response.headers.get('retry-after');
              throw new ExternalServiceError(
                `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : ''}`,
                'openrouter-ai',
                true
              );
            } else if (response.status >= 500) {
              throw new ExternalServiceError(
                `AI service temporarily unavailable: ${response.status} ${response.statusText}`,
                'openrouter-ai',
                true
              );
            } else if (response.status === 401) {
              throw new ExternalServiceError(
                'AI service authentication failed. Please check API key.',
                'openrouter-ai',
                false
              );
            } else {
              throw new ExternalServiceError(
                `AI API call failed: ${response.status} ${response.statusText} - ${errorText}`,
                'openrouter-ai',
                response.status >= 500
              );
            }
          }

          const data = await response.json();
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new AIProcessingError(
              'Invalid AI API response structure',
              undefined,
              false
            );
          }

          logger.debug('AI API call successful', {
            operation: 'ai.openrouter.call',
            duration,
            metadata: { 
              model: this.aiModel,
              tokensUsed: data.usage?.total_tokens 
            },
          });

          return data.choices[0].message.content;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          if (error instanceof ExternalServiceError || error instanceof AIProcessingError) {
            throw error;
          }
          
          // Handle network errors
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new ExternalServiceError(
              'Network error connecting to AI service',
              'moonshot-ai',
              true,
              error as Error
            );
          }
          
          throw new AIProcessingError(
            'Unexpected error during AI API call',
            undefined,
            false,
            error as Error
          );
        }
      },
      {
        maxAttempts: this.maxRetries,
        delayMs: this.retryDelay,
        backoffMultiplier: 2,
        retryCondition: (error) => {
          return error instanceof ExternalServiceError && error.retryable;
        }
      }
    );
  }

  /**
   * Parse the AI response and extract structured data
   */
  private parseAIResponse(response: string): Partial<JobAnalysisResult> {
    if (!response || typeof response !== 'string') {
      throw new AIProcessingError('AI response is empty or invalid');
    }

    try {
      // Clean the response - remove any markdown formatting or extra text
      const cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      if (!cleanedResponse) {
        throw new AIProcessingError('AI response is empty after cleaning');
      }

      const parsed = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new AIProcessingError('AI response is not a valid object');
      }

      logger.debug('AI response parsed successfully', {
        operation: 'job-analysis.parse',
        metadata: { 
          hasExtractedSkills: Array.isArray(parsed.extractedSkills),
          hasRequiredSkills: Array.isArray(parsed.requiredSkills),
          confidence: parsed.confidence 
        },
      });

      return parsed;
    } catch (error) {
      logger.error('Failed to parse AI response', {
        operation: 'job-analysis.parse',
        metadata: { 
          responseLength: response.length,
          responsePreview: response.substring(0, 200) 
        },
      }, error as Error);
      
      if (error instanceof SyntaxError) {
        throw new AIProcessingError(
          'AI returned invalid JSON format',
          undefined,
          true,
          error
        );
      }
      
      throw error;
    }
  }

  /**
   * Validate and enhance the AI analysis result
   */
  private async validateAndEnhanceResult(
    aiResult: Partial<JobAnalysisResult>, 
    originalDescription: string
  ): Promise<JobAnalysisResult> {
    // Ensure all required fields exist with defaults
    const result: JobAnalysisResult = {
      extractedSkills: this.validateExtractedSkills(aiResult.extractedSkills || []),
      requiredSkills: this.validateSkills(aiResult.requiredSkills || []),
      preferredSkills: this.validateSkills(aiResult.preferredSkills || []),
      experienceLevel: this.validateExperienceLevel(aiResult.experienceLevel),
      salaryRange: this.validateSalaryRange(aiResult.salaryRange),
      keyTerms: Array.isArray(aiResult.keyTerms) ? aiResult.keyTerms.slice(0, 20) : [],
      confidence: this.validateConfidence(aiResult.confidence),
      summary: typeof aiResult.summary === 'string' ? aiResult.summary.slice(0, 500) : undefined,
    };

    // Enhance with fallback analysis if AI result is sparse
    if (result.extractedSkills.length === 0 || result.confidence < 0.3) {
      const fallback = await this.fallbackAnalysis(originalDescription);
      result.extractedSkills = result.extractedSkills.length > 0 ? result.extractedSkills : fallback.extractedSkills;
      result.keyTerms = result.keyTerms.length > 0 ? result.keyTerms : fallback.keyTerms;
      result.confidence = Math.max(result.confidence, fallback.confidence * 0.7); // Reduce confidence for fallback
    }

    return result;
  }

  /**
   * Validate extracted skills array
   */
  private validateExtractedSkills(skills: any[]): ExtractedSkill[] {
    if (!Array.isArray(skills)) return [];

    return skills
      .filter(skill => skill && typeof skill.name === 'string' && skill.name.trim())
      .map(skill => ({
        name: skill.name.trim(),
        confidence: this.validateConfidence(skill.confidence),
        category: this.validateSkillCategory(skill.category),
        synonyms: Array.isArray(skill.synonyms) ? skill.synonyms.slice(0, 5) : [],
        context: typeof skill.context === 'string' ? skill.context.slice(0, 200) : undefined,
      }))
      .slice(0, 100); // Increased limit to 100 skills to capture more comprehensive extraction
  }

  /**
   * Validate skills array
   */
  private validateSkills(skills: any[]): Skill[] {
    if (!Array.isArray(skills)) return [];

    return skills
      .filter(skill => skill && typeof skill.name === 'string' && skill.name.trim())
      .map(skill => ({
        name: skill.name.trim(),
        required: Boolean(skill.required),
        category: this.validateSkillCategory(skill.category),
      }))
      .slice(0, 30); // Limit to 30 skills
  }

  /**
   * Validate skill category
   */
  private validateSkillCategory(category: any): SkillCategory {
    const validCategories: SkillCategory[] = ['technical', 'soft', 'domain', 'language', 'certification'];
    return validCategories.includes(category) ? category : 'technical';
  }

  /**
   * Validate experience level
   */
  private validateExperienceLevel(level: any): ExperienceLevel | undefined {
    const validLevels: ExperienceLevel[] = ['entry', 'mid', 'senior', 'executive', 'intern'];
    return validLevels.includes(level) ? level : undefined;
  }

  /**
   * Validate salary range
   */
  private validateSalaryRange(range: any): { min?: number; max?: number } | undefined {
    if (!range || typeof range !== 'object') return undefined;

    const result: { min?: number; max?: number } = {};
    
    if (typeof range.min === 'number' && range.min > 0) {
      result.min = Math.round(range.min);
    }
    
    if (typeof range.max === 'number' && range.max > 0) {
      result.max = Math.round(range.max);
    }

    // Validate that max >= min
    if (result.min && result.max && result.max < result.min) {
      result.max = result.min;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Validate confidence score
   */
  private validateConfidence(confidence: any): number {
    if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
      return confidence;
    }
    return 0.5; // Default confidence
  }

  /**
   * Fallback analysis when AI is unavailable or fails
   */
  private async fallbackAnalysis(jobDescription: string, jobTitle?: string): Promise<JobAnalysisResult> {
    try {
      // Try to use the comprehensive skill extraction service for better fallback
      const { skillExtractionService } = await import('./skill-extraction');
      const skillResult = await skillExtractionService.extractSkills(
        `${jobTitle || ''} ${jobDescription}`, 
        'job_posting'
      );

      // Convert extracted skills to the expected format
      const extractedSkills: ExtractedSkill[] = skillResult.skills.map(skill => ({
        name: skill.name,
        confidence: skill.confidence,
        category: skill.category as SkillCategory,
        synonyms: [],
        context: skill.context,
      }));

      // Determine experience level based on keywords
      const text = `${jobTitle || ''} ${jobDescription}`.toLowerCase();
      let experienceLevel: ExperienceLevel | undefined;
      if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
        experienceLevel = 'senior';
      } else if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) {
        experienceLevel = 'entry';
      } else if (text.includes('mid') || text.includes('intermediate')) {
        experienceLevel = 'mid';
      } else if (text.includes('executive') || text.includes('director') || text.includes('vp')) {
        experienceLevel = 'executive';
      } else if (text.includes('intern')) {
        experienceLevel = 'intern';
      }

      // Extract salary information using regex
      let salaryRange: { min?: number; max?: number } | undefined;
      const salaryPatterns = [
        /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
        /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*to\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
        /(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:k|thousand)/gi,
      ];

      for (const pattern of salaryPatterns) {
        const match = pattern.exec(jobDescription);
        if (match) {
          const min = parseInt(match[1].replace(/,/g, ''));
          const max = parseInt(match[2].replace(/,/g, ''));
          
          // If the pattern includes 'k' or 'thousand', multiply by 1000
          const multiplier = pattern.source.includes('k|thousand') ? 1000 : 1;
          
          salaryRange = {
            min: min * multiplier,
            max: max * multiplier,
          };
          break;
        }
      }

      // Create key terms from skill names
      const keyTerms = extractedSkills.map(skill => skill.name).slice(0, 20);

      return {
        extractedSkills,
        requiredSkills: extractedSkills
          .filter(skill => skill.confidence > 0.7)
          .slice(0, 15)
          .map(skill => ({
            name: skill.name,
            required: true,
            category: skill.category,
          })),
        preferredSkills: extractedSkills
          .filter(skill => skill.confidence <= 0.7 && skill.confidence > 0.5)
          .slice(0, 10)
          .map(skill => ({
            name: skill.name,
            required: false,
            category: skill.category,
          })),
        experienceLevel,
        salaryRange,
        keyTerms,
        confidence: Math.max(skillResult.confidence * 0.8, 0.5), // Slightly reduce confidence for fallback
        summary: `Enhanced fallback analysis extracted ${extractedSkills.length} skills from the job description.`,
      };
    } catch (error) {
      // If comprehensive extraction fails, use basic fallback
      return this.basicFallbackAnalysis(jobDescription, jobTitle);
    }
  }

  /**
   * Basic fallback analysis as last resort
   */
  private basicFallbackAnalysis(jobDescription: string, jobTitle?: string): JobAnalysisResult {
    const text = `${jobTitle || ''} ${jobDescription}`.toLowerCase();
    
    // Common technical skills to look for
    const technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust',
      'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
      'html', 'css', 'sass', 'scss', 'tailwind', 'bootstrap',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
      'rest', 'graphql', 'api', 'microservices', 'agile', 'scrum', 'devops', 'ci/cd'
    ];

    // Common soft skills
    const softSkills = [
      'communication', 'leadership', 'teamwork', 'problem solving', 'analytical',
      'creative', 'detail oriented', 'time management', 'project management'
    ];

    const extractedSkills: ExtractedSkill[] = [];
    const keyTerms: string[] = [];

    // Extract technical skills
    technicalSkills.forEach(skill => {
      if (text.includes(skill)) {
        extractedSkills.push({
          name: skill,
          confidence: 0.7,
          category: 'technical',
          synonyms: [],
        });
        keyTerms.push(skill);
      }
    });

    // Extract soft skills
    softSkills.forEach(skill => {
      if (text.includes(skill)) {
        extractedSkills.push({
          name: skill,
          confidence: 0.6,
          category: 'soft',
          synonyms: [],
        });
        keyTerms.push(skill);
      }
    });

    // Determine experience level based on keywords
    let experienceLevel: ExperienceLevel | undefined;
    if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      experienceLevel = 'senior';
    } else if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) {
      experienceLevel = 'entry';
    } else if (text.includes('mid') || text.includes('intermediate')) {
      experienceLevel = 'mid';
    } else if (text.includes('executive') || text.includes('director') || text.includes('vp')) {
      experienceLevel = 'executive';
    } else if (text.includes('intern')) {
      experienceLevel = 'intern';
    }

    return {
      extractedSkills,
      requiredSkills: extractedSkills.slice(0, 10).map(skill => ({
        name: skill.name,
        required: true,
        category: skill.category,
      })),
      preferredSkills: [],
      experienceLevel,
      salaryRange: undefined,
      keyTerms: keyTerms.slice(0, 15),
      confidence: extractedSkills.length > 0 ? 0.4 : 0.2,
      summary: `Basic fallback analysis extracted ${extractedSkills.length} skills from the job description.`,
    };
  }

  /**
   * Utility function to add delay for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch analyze multiple job postings for efficiency
   */
  async analyzeBatch(
    jobs: Array<{ id: string; description: string; title?: string }>,
    userId?: string
  ): Promise<Array<{ id: string; result: JobAnalysisResult; error?: string }>> {
    return withLogging('job-analysis.batch', async () => {
      const results = await Promise.allSettled(
        jobs.map(async (job) => {
          try {
            const result = await this.batchProcessor({
              id: job.id,
              description: job.description,
              title: job.title,
            });
            return { id: job.id, result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Batch job analysis failed', {
              operation: 'job-analysis.batch-item',
              metadata: { jobId: job.id },
            }, error as Error);
            
            // Return fallback result for failed items
            const fallbackResult = await this.fallbackAnalysis(job.description, job.title);
            return { id: job.id, result: fallbackResult, error: errorMessage };
          }
        })
      );

      return await Promise.all(results.map(async (result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const job = jobs[index];
          const fallbackResult = await this.fallbackAnalysis(job.description, job.title);
          return {
            id: job.id,
            result: fallbackResult,
            error: result.reason?.message || 'Batch processing failed',
          };
        }
      }));
    });
  }

  /**
   * Process a batch of job analyses
   */
  private async processBatchAnalysis(
    items: Array<{ id: string; description: string; title?: string }>
  ): Promise<JobAnalysisResult[]> {
    // For now, process items individually but with shared rate limiting
    // In a more advanced implementation, we could combine multiple job descriptions
    // into a single AI request for better efficiency
    
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          // Check cache first
          const contentHash = cacheUtils.generateContentHash(item.description + (item.title || ''));
          const cacheKey = cacheKeys.aiAnalysis(contentHash);
          
          const cachedResult = await cache.get<JobAnalysisResult>(cacheKey);
          if (cachedResult) {
            return cachedResult;
          }

          // Process with AI
          const prompt = this.buildAnalysisPrompt(item.description, item.title);
          const response = await this.circuitBreaker.execute(() => 
            this.callAIWithRetry(prompt)
          );
          const result = this.parseAIResponse(response);
          const finalResult = await this.validateAndEnhanceResult(result, item.description);
          
          // Cache the result
          await cache.set(cacheKey, finalResult, cacheTTL.long);
          
          return finalResult;
        } catch (error) {
          // Return fallback for failed items
          return await this.fallbackAnalysis(item.description, item.title);
        }
      })
    );

    return results;
  }

  /**
   * Analyze job posting with caching and optimization
   */
  async analyzeJobPostingOptimized(
    jobDescription: string,
    jobTitle?: string,
    userId?: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<JobAnalysisResult> {
    // For high priority requests, bypass batching
    if (priority === 'high') {
      return this.analyzeJobPosting(jobDescription, jobTitle, userId);
    }

    // For normal and low priority, use batch processing
    const result = await this.batchProcessor({
      id: `${Date.now()}-${Math.random()}`,
      description: jobDescription,
      title: jobTitle,
    });

    return result;
  }

  /**
   * Warm up cache with common job analysis patterns
   */
  async warmCache(commonJobDescriptions: string[]): Promise<void> {
    return withLogging('job-analysis.warm-cache', async () => {
      const warmupJobs = commonJobDescriptions.map((desc, index) => ({
        id: `warmup-${index}`,
        description: desc,
      }));

      await this.analyzeBatch(warmupJobs);
      
      logger.info('Job analysis cache warmed', {
        operation: 'job-analysis.warm-cache',
        metadata: { jobCount: warmupJobs.length },
      });
    });
  }

  /**
   * Get analysis statistics for monitoring
   */
  async getAnalysisStats(): Promise<{
    cacheHitRate: number;
    totalAnalyses: number;
    averageConfidence: number;
    circuitBreakerStatus: string;
  }> {
    // This would be implemented with proper metrics collection
    // For now, return mock data
    return {
      cacheHitRate: 0.75, // 75% cache hit rate
      totalAnalyses: 1000,
      averageConfidence: 0.82,
      circuitBreakerStatus: this.circuitBreaker.getState(),
    };
  }

  /**
   * Test the AI connection and return service status
   */
  async testConnection(): Promise<{ available: boolean; error?: string }> {
    if (!serverConfig.ai.openRouterApiKey) {
      return { available: false, error: 'API key not configured' };
    }

    return withLogging('job-analysis.test-connection', async () => {
      try {
        const testPrompt = 'Respond with just the word "test" in JSON format: {"response": "test"}';
        await this.callAIWithRetry(testPrompt);
        
        logger.info('AI service connection test successful', {
          operation: 'job-analysis.test-connection',
        });
        
        return { available: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        logger.error('AI service connection test failed', {
          operation: 'job-analysis.test-connection',
        }, error as Error);
        
        return { 
          available: false, 
          error: errorMessage
        };
      }
    });
  }
}

// Export a singleton instance
export const jobAnalysisService = new JobAnalysisService();