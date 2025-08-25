import { serverConfig } from '~/config/server-config';
import { 
  JobAnalysisResult, 
  ExtractedSkill, 
  Skill, 
  ExperienceLevel, 
  SkillCategory 
} from '~/types/interview-management';

/**
 * Service for analyzing job postings using AI to extract skills, requirements, and other metadata
 */
export class JobAnalysisService {
  private readonly aiModel = 'moonshot-v1-8k';
  private readonly apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    if (!serverConfig.ai.openRouterApiKey) {
      console.warn('OpenRouter API key not configured. Job analysis will use fallback mode.');
    }
  }

  /**
   * Analyze a job posting to extract skills, requirements, and metadata
   */
  async analyzeJobPosting(jobDescription: string, jobTitle?: string): Promise<JobAnalysisResult> {
    if (!serverConfig.ai.openRouterApiKey) {
      console.warn('AI analysis unavailable, using fallback extraction');
      return this.fallbackAnalysis(jobDescription, jobTitle);
    }

    try {
      const prompt = this.buildAnalysisPrompt(jobDescription, jobTitle);
      const response = await this.callAIWithRetry(prompt);
      const result = this.parseAIResponse(response);
      
      // Validate and enhance the result
      return this.validateAndEnhanceResult(result, jobDescription);
    } catch (error) {
      console.error('AI job analysis failed:', error);
      return this.fallbackAnalysis(jobDescription, jobTitle);
    }
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
  private async callAIWithRetry(prompt: string, retryCount = 0): Promise<any> {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`AI API call failed (attempt ${retryCount + 1}/${this.maxRetries + 1}):`, error);
        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.callAIWithRetry(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Parse the AI response and extract structured data
   */
  private parseAIResponse(response: string): Partial<JobAnalysisResult> {
    try {
      // Clean the response - remove any markdown formatting or extra text
      const cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Response is not a valid object');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse AI analysis response');
    }
  }

  /**
   * Validate and enhance the AI analysis result
   */
  private validateAndEnhanceResult(
    aiResult: Partial<JobAnalysisResult>, 
    originalDescription: string
  ): JobAnalysisResult {
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
      const fallback = this.fallbackAnalysis(originalDescription);
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
      .slice(0, 50); // Limit to 50 skills
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
  private fallbackAnalysis(jobDescription: string, jobTitle?: string): JobAnalysisResult {
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

    return {
      extractedSkills,
      requiredSkills: extractedSkills.slice(0, 10).map(skill => ({
        name: skill.name,
        required: true,
        category: skill.category,
      })),
      preferredSkills: [],
      experienceLevel,
      salaryRange,
      keyTerms: keyTerms.slice(0, 15),
      confidence: extractedSkills.length > 0 ? 0.4 : 0.2,
      summary: `Fallback analysis extracted ${extractedSkills.length} skills from the job description.`,
    };
  }

  /**
   * Utility function to add delay for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test the AI connection and return service status
   */
  async testConnection(): Promise<{ available: boolean; error?: string }> {
    if (!serverConfig.ai.openRouterApiKey) {
      return { available: false, error: 'API key not configured' };
    }

    try {
      const testPrompt = 'Respond with just the word "test" in JSON format: {"response": "test"}';
      await this.callAIWithRetry(testPrompt);
      return { available: true };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export a singleton instance
export const jobAnalysisService = new JobAnalysisService();