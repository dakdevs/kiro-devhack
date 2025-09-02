import { serverConfig } from '~/config/server-config';
import { logger, withLogging } from '~/lib/logger';
import { withRetry } from '~/lib/error-handler';
import { cache, cacheKeys, cacheTTL } from '~/lib/cache';

export interface ExtractedSkill {
  name: string;
  confidence: number;
  category: 'technical' | 'soft' | 'domain' | 'language' | 'certification' | 'tool' | 'framework' | 'methodology';
  evidence: string;
  context?: string;
}

export interface SkillExtractionResult {
  skills: ExtractedSkill[];
  totalSkillsFound: number;
  confidence: number;
  processingMethod: 'ai' | 'hybrid' | 'fallback';
}

/**
 * Comprehensive skill extraction service that works across all job fields
 */
export class SkillExtractionService {
  private readonly aiModel = 'moonshot-v1-8k';
  private readonly apiUrl = 'https://api.moonshot.cn/v1/chat/completions';

  /**
   * Extract skills from text using AI-powered analysis with comprehensive fallback
   */
  async extractSkills(text: string, context?: 'job_posting' | 'interview' | 'resume'): Promise<SkillExtractionResult> {
    if (!text || text.trim().length === 0) {
      return {
        skills: [],
        totalSkillsFound: 0,
        confidence: 0,
        processingMethod: 'fallback'
      };
    }

    // Check cache first
    const cacheKey = cacheKeys.skillExtraction(text, context);
    const cachedResult = await cache.get<SkillExtractionResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    return withLogging('skill-extraction.extract', async () => {
      let result: SkillExtractionResult;

      // Try AI extraction first if available
      if (serverConfig.ai.openRouterApiKey) {
        try {
          result = await this.extractWithAI(text, context);
          result.processingMethod = 'ai';
        } catch (error) {
          logger.warn('AI skill extraction failed, using hybrid approach', {
            operation: 'skill-extraction.extract',
            metadata: { context, textLength: text.length }
          }, error as Error);
          
          result = await this.extractWithHybrid(text, context);
          result.processingMethod = 'hybrid';
        }
      } else {
        result = await this.extractWithHybrid(text, context);
        result.processingMethod = 'hybrid';
      }

      // Cache the result
      await cache.set(cacheKey, result, cacheTTL.medium);

      logger.info('Skill extraction completed', {
        operation: 'skill-extraction.extract',
        metadata: {
          skillsFound: result.totalSkillsFound,
          confidence: result.confidence,
          method: result.processingMethod,
          context
        }
      });

      return result;
    });
  }

  /**
   * AI-powered skill extraction
   */
  private async extractWithAI(text: string, context?: string): Promise<SkillExtractionResult> {
    const prompt = this.buildSkillExtractionPrompt(text, context);
    
    const response = await withRetry(
      async () => {
        const apiResponse = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serverConfig.ai.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.BETTER_AUTH_URL || 'http://localhost:3000',
            'X-Title': 'Interview Management System - Skill Extraction',
          },
          body: JSON.stringify({
            model: this.aiModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      },
      { maxAttempts: 2, delayMs: 1000 }
    );

    return this.parseAISkillResponse(response, text);
  }

  /**
   * Hybrid extraction combining pattern matching with comprehensive skill databases
   */
  private async extractWithHybrid(text: string, context?: string): Promise<SkillExtractionResult> {
    const normalizedText = text.toLowerCase();
    const skills: ExtractedSkill[] = [];
    
    // Extract using comprehensive skill patterns
    const patternSkills = this.extractWithPatterns(normalizedText);
    const contextualSkills = this.extractContextualSkills(normalizedText);
    const domainSkills = this.extractDomainSpecificSkills(normalizedText);
    
    // Combine and deduplicate
    const allSkills = [...patternSkills, ...contextualSkills, ...domainSkills];
    const uniqueSkills = this.deduplicateSkills(allSkills);
    
    // Sort by confidence and limit results
    const sortedSkills = uniqueSkills
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50); // Limit to top 50 skills

    return {
      skills: sortedSkills,
      totalSkillsFound: sortedSkills.length,
      confidence: sortedSkills.length > 0 ? 0.75 : 0.2,
      processingMethod: 'hybrid'
    };
  }

  /**
   * Extract skills using comprehensive pattern matching
   */
  private extractWithPatterns(text: string): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];

    // Technical skills patterns
    const technicalPatterns = [
      // Programming languages
      /\b(javascript|typescript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab|perl|shell|bash|powershell)\b/g,
      // Web technologies
      /\b(html|css|sass|scss|less|react|vue|angular|svelte|jquery|bootstrap|tailwind|material-ui|chakra)\b/g,
      // Backend frameworks
      /\b(node\.?js|express|django|flask|spring|laravel|rails|asp\.net|fastapi|nestjs|koa)\b/g,
      // Databases
      /\b(mysql|postgresql|mongodb|redis|elasticsearch|cassandra|dynamodb|sqlite|oracle|sql\s+server)\b/g,
      // Cloud platforms
      /\b(aws|azure|gcp|google\s+cloud|heroku|vercel|netlify|digitalocean|linode)\b/g,
      // DevOps tools
      /\b(docker|kubernetes|jenkins|gitlab\s+ci|github\s+actions|terraform|ansible|chef|puppet)\b/g,
      // Data science
      /\b(pandas|numpy|scikit-learn|tensorflow|pytorch|keras|jupyter|tableau|power\s+bi|spark)\b/g,
      // Mobile development
      /\b(react\s+native|flutter|xamarin|ionic|cordova|android\s+studio|xcode)\b/g,
    ];

    technicalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skillName = this.normalizeSkillName(match[1]);
        skills.push({
          name: skillName,
          confidence: 0.85,
          category: 'technical',
          evidence: match[0],
          context: this.extractContext(text, match.index, match[0].length)
        });
      }
    });

    // Soft skills patterns
    const softSkillPatterns = [
      /\b(leadership|communication|teamwork|problem[\s-]solving|analytical|creative|detail[\s-]oriented|time\s+management|project\s+management|critical\s+thinking|adaptability|collaboration|mentoring|coaching)\b/g,
    ];

    softSkillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skillName = this.normalizeSkillName(match[1]);
        skills.push({
          name: skillName,
          confidence: 0.75,
          category: 'soft',
          evidence: match[0],
          context: this.extractContext(text, match.index, match[0].length)
        });
      }
    });

    // Methodology patterns
    const methodologyPatterns = [
      /\b(agile|scrum|kanban|waterfall|lean|six\s+sigma|devops|ci\/cd|tdd|bdd|pair\s+programming)\b/g,
    ];

    methodologyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skillName = this.normalizeSkillName(match[1]);
        skills.push({
          name: skillName,
          confidence: 0.8,
          category: 'methodology',
          evidence: match[0],
          context: this.extractContext(text, match.index, match[0].length)
        });
      }
    });

    return skills;
  }

  /**
   * Extract skills based on contextual phrases
   */
  private extractContextualSkills(text: string): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    
    const contextPatterns = [
      /(?:experience\s+(?:with|in|using)|skilled\s+(?:in|with)|proficient\s+(?:in|with)|expert\s+(?:in|with)|familiar\s+with|knowledge\s+of|worked\s+with|used)\s+([^,.!?;]+)/g,
      /(?:built|developed|created|implemented|designed|architected|maintained|optimized)\s+(?:using|with|in)\s+([^,.!?;]+)/g,
      /(?:responsible\s+for|involved\s+in|focused\s+on|specialized\s+in)\s+([^,.!?;]+)/g,
    ];

    contextPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skillText = match[1].trim();
        const extractedSkills = this.parseSkillPhrase(skillText);
        
        extractedSkills.forEach(skill => {
          skills.push({
            name: skill,
            confidence: 0.7,
            category: this.categorizeSkill(skill),
            evidence: match[0],
            context: this.extractContext(text, match.index, match[0].length)
          });
        });
      }
    });

    return skills;
  }

  /**
   * Extract domain-specific skills based on industry keywords
   */
  private extractDomainSpecificSkills(text: string): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];

    // Healthcare/Medical
    if (this.containsDomainKeywords(text, ['medical', 'healthcare', 'clinical', 'patient', 'diagnosis', 'treatment'])) {
      const medicalSkills = this.extractMedicalSkills(text);
      skills.push(...medicalSkills);
    }

    // Finance/Banking
    if (this.containsDomainKeywords(text, ['finance', 'banking', 'investment', 'trading', 'risk', 'compliance'])) {
      const financeSkills = this.extractFinanceSkills(text);
      skills.push(...financeSkills);
    }

    // Marketing/Sales
    if (this.containsDomainKeywords(text, ['marketing', 'sales', 'campaign', 'brand', 'customer', 'lead'])) {
      const marketingSkills = this.extractMarketingSkills(text);
      skills.push(...marketingSkills);
    }

    // Education
    if (this.containsDomainKeywords(text, ['education', 'teaching', 'curriculum', 'student', 'learning', 'training'])) {
      const educationSkills = this.extractEducationSkills(text);
      skills.push(...educationSkills);
    }

    // Manufacturing/Engineering
    if (this.containsDomainKeywords(text, ['manufacturing', 'engineering', 'production', 'quality', 'process', 'design'])) {
      const engineeringSkills = this.extractEngineeringSkills(text);
      skills.push(...engineeringSkills);
    }

    return skills;
  }

  /**
   * Build AI prompt for skill extraction
   */
  private buildSkillExtractionPrompt(text: string, context?: string): string {
    const contextDescription = context === 'job_posting' 
      ? 'This is a job posting description.'
      : context === 'interview'
      ? 'This is from an interview conversation.'
      : context === 'resume'
      ? 'This is from a resume or CV.'
      : 'This is professional text.';

    return `
You are an expert skill extraction system. ${contextDescription} Extract ALL skills, technologies, tools, methodologies, and competencies mentioned in the following text.

Text to analyze:
${text}

Extract skills in the following JSON format:

{
  "skills": [
    {
      "name": "skill name (normalized)",
      "confidence": 0.0-1.0,
      "category": "technical|soft|domain|language|certification|tool|framework|methodology",
      "evidence": "exact text where skill was found",
      "context": "surrounding context (optional)"
    }
  ],
  "totalSkillsFound": number,
  "confidence": 0.0-1.0
}

Guidelines:
1. Extract ALL skills mentioned, not just a few
2. Include technical skills (programming languages, frameworks, tools, platforms)
3. Include soft skills (communication, leadership, problem-solving)
4. Include domain-specific skills (industry knowledge, methodologies)
5. Include certifications and qualifications
6. Normalize skill names (e.g., "React.js" → "React", "JavaScript" → "JavaScript")
7. Provide confidence based on how explicitly the skill is mentioned
8. Use evidence to show exactly where the skill was found
9. Be comprehensive - extract 20-50+ skills if they exist in the text
10. Don't limit yourself to common skills - extract domain-specific and niche skills too

Return ONLY the JSON object, no additional text.
    `.trim();
  }

  /**
   * Parse AI response for skill extraction
   */
  private parseAISkillResponse(response: string, originalText: string): SkillExtractionResult {
    try {
      const cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);
      
      if (!parsed.skills || !Array.isArray(parsed.skills)) {
        throw new Error('Invalid AI response structure');
      }

      const skills: ExtractedSkill[] = parsed.skills
        .filter((skill: any) => skill && skill.name && typeof skill.name === 'string')
        .map((skill: any) => ({
          name: this.normalizeSkillName(skill.name),
          confidence: Math.min(Math.max(skill.confidence || 0.5, 0), 1),
          category: this.validateCategory(skill.category),
          evidence: skill.evidence || skill.name,
          context: skill.context
        }))
        .slice(0, 100); // Limit to 100 skills max

      return {
        skills,
        totalSkillsFound: skills.length,
        confidence: Math.min(Math.max(parsed.confidence || 0.8, 0), 1),
        processingMethod: 'ai'
      };
    } catch (error) {
      logger.error('Failed to parse AI skill extraction response', {
        operation: 'skill-extraction.parse-ai',
        metadata: { responseLength: response.length }
      }, error as Error);
      
      // Fallback to hybrid extraction
      return this.extractWithHybrid(originalText);
    }
  }

  /**
   * Helper methods for domain-specific skill extraction
   */
  private extractMedicalSkills(text: string): ExtractedSkill[] {
    const medicalSkills = [
      'patient care', 'clinical assessment', 'medical diagnosis', 'treatment planning',
      'emr', 'epic', 'cerner', 'medical coding', 'icd-10', 'hipaa', 'clinical research',
      'pharmacology', 'anatomy', 'physiology', 'medical terminology'
    ];
    
    return this.matchSkillsInText(text, medicalSkills, 'domain');
  }

  private extractFinanceSkills(text: string): ExtractedSkill[] {
    const financeSkills = [
      'financial analysis', 'risk management', 'portfolio management', 'trading',
      'bloomberg', 'excel', 'financial modeling', 'valuation', 'derivatives',
      'compliance', 'audit', 'accounting', 'gaap', 'ifrs', 'sox', 'aml'
    ];
    
    return this.matchSkillsInText(text, financeSkills, 'domain');
  }

  private extractMarketingSkills(text: string): ExtractedSkill[] {
    const marketingSkills = [
      'digital marketing', 'seo', 'sem', 'social media marketing', 'content marketing',
      'email marketing', 'google analytics', 'facebook ads', 'google ads', 'hubspot',
      'salesforce', 'crm', 'lead generation', 'brand management', 'market research'
    ];
    
    return this.matchSkillsInText(text, marketingSkills, 'domain');
  }

  private extractEducationSkills(text: string): ExtractedSkill[] {
    const educationSkills = [
      'curriculum development', 'lesson planning', 'classroom management', 'assessment',
      'educational technology', 'learning management systems', 'blackboard', 'canvas',
      'moodle', 'instructional design', 'student engagement', 'differentiated instruction'
    ];
    
    return this.matchSkillsInText(text, educationSkills, 'domain');
  }

  private extractEngineeringSkills(text: string): ExtractedSkill[] {
    const engineeringSkills = [
      'cad', 'autocad', 'solidworks', 'matlab', 'simulink', 'finite element analysis',
      'project management', 'quality control', 'lean manufacturing', 'six sigma',
      'process improvement', 'technical documentation', 'design review'
    ];
    
    return this.matchSkillsInText(text, engineeringSkills, 'domain');
  }

  /**
   * Utility methods
   */
  private containsDomainKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private matchSkillsInText(text: string, skills: string[], category: ExtractedSkill['category']): ExtractedSkill[] {
    const found: ExtractedSkill[] = [];
    
    skills.forEach(skill => {
      if (text.includes(skill)) {
        found.push({
          name: skill,
          confidence: 0.8,
          category,
          evidence: skill
        });
      }
    });
    
    return found;
  }

  private parseSkillPhrase(phrase: string): string[] {
    // Split on common delimiters and clean up
    return phrase
      .split(/[,;/&+]|\sand\s|\sor\s/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 50)
      .map(s => this.normalizeSkillName(s));
  }

  private normalizeSkillName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\.(js|ts|py)$/i, '')
      .replace(/\s+(programming|language|framework|library|tool)$/i, '');
  }

  private categorizeSkill(skill: string): ExtractedSkill['category'] {
    const technical = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker'];
    const soft = ['communication', 'leadership', 'teamwork', 'problem solving'];
    const methodology = ['agile', 'scrum', 'devops', 'ci/cd'];
    
    const normalized = skill.toLowerCase();
    
    if (technical.some(t => normalized.includes(t))) return 'technical';
    if (soft.some(s => normalized.includes(s))) return 'soft';
    if (methodology.some(m => normalized.includes(m))) return 'methodology';
    
    return 'technical'; // Default
  }

  private validateCategory(category: any): ExtractedSkill['category'] {
    const validCategories: ExtractedSkill['category'][] = [
      'technical', 'soft', 'domain', 'language', 'certification', 'tool', 'framework', 'methodology'
    ];
    return validCategories.includes(category) ? category : 'technical';
  }

  private extractContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + length + 50);
    return text.substring(start, end).trim();
  }

  private deduplicateSkills(skills: ExtractedSkill[]): ExtractedSkill[] {
    const seen = new Map<string, ExtractedSkill>();
    
    skills.forEach(skill => {
      const key = skill.name.toLowerCase();
      const existing = seen.get(key);
      
      if (!existing || skill.confidence > existing.confidence) {
        seen.set(key, skill);
      }
    });
    
    return Array.from(seen.values());
  }
}

// Export singleton instance
export const skillExtractionService = new SkillExtractionService();