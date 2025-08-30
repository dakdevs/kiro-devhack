import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobAnalysisService } from '~/services/job-analysis';

// Mock the AI service
vi.mock('~/services/job-analysis', () => ({
  jobAnalysisService: {
    analyzeJobPosting: vi.fn(),
  },
}));

describe('Job Posting AI Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze a job posting and extract skills', async () => {
    const mockJobDescription = `
      Senior Software Engineer - Full Stack
      
      We're looking for a Senior Software Engineer to join our growing team at TechCorp. 
      You'll be working on our core platform using React, Node.js, and PostgreSQL.
      
      Requirements:
      - 5+ years of experience in software development
      - Strong proficiency in JavaScript/TypeScript
      - Experience with React and Node.js
      - Knowledge of SQL databases (PostgreSQL preferred)
      - Experience with AWS or similar cloud platforms
      
      Salary: $120,000 - $160,000
      Location: San Francisco, CA (Remote OK)
    `;

    const mockAnalysisResult = {
      extractedSkills: [
        { name: 'JavaScript', confidence: 0.9, category: 'technical' as const, synonyms: [] },
        { name: 'TypeScript', confidence: 0.9, category: 'technical' as const, synonyms: [] },
        { name: 'React', confidence: 0.95, category: 'technical' as const, synonyms: [] },
        { name: 'Node.js', confidence: 0.95, category: 'technical' as const, synonyms: [] },
        { name: 'PostgreSQL', confidence: 0.9, category: 'technical' as const, synonyms: [] },
        { name: 'AWS', confidence: 0.8, category: 'technical' as const, synonyms: [] },
      ],
      requiredSkills: [
        { name: 'JavaScript', required: true, category: 'technical' as const },
        { name: 'TypeScript', required: true, category: 'technical' as const },
        { name: 'React', required: true, category: 'technical' as const },
        { name: 'Node.js', required: true, category: 'technical' as const },
      ],
      preferredSkills: [
        { name: 'PostgreSQL', required: false, category: 'technical' as const },
        { name: 'AWS', required: false, category: 'technical' as const },
      ],
      experienceLevel: 'senior' as const,
      salaryRange: {
        min: 120000,
        max: 160000,
      },
      keyTerms: ['Senior', 'Full Stack', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
      confidence: 0.85,
      summary: 'Senior full-stack position requiring JavaScript/TypeScript, React, and Node.js experience.',
    };

    vi.mocked(jobAnalysisService.analyzeJobPosting).mockResolvedValue(mockAnalysisResult);

    const result = await jobAnalysisService.analyzeJobPosting(mockJobDescription, 'Senior Software Engineer');

    expect(jobAnalysisService.analyzeJobPosting).toHaveBeenCalledWith(
      mockJobDescription,
      'Senior Software Engineer'
    );
    expect(result).toEqual(mockAnalysisResult);
    expect(result.extractedSkills).toHaveLength(6);
    expect(result.requiredSkills).toHaveLength(4);
    expect(result.preferredSkills).toHaveLength(2);
    expect(result.experienceLevel).toBe('senior');
    expect(result.salaryRange?.min).toBe(120000);
    expect(result.salaryRange?.max).toBe(160000);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle fallback analysis when AI fails', async () => {
    const mockJobDescription = `
      Software Engineer position requiring JavaScript and React experience.
      Must have 3+ years experience. Salary range: $80,000 - $100,000.
    `;

    const mockFallbackResult = {
      extractedSkills: [
        { name: 'javascript', confidence: 0.7, category: 'technical' as const, synonyms: [] },
        { name: 'react', confidence: 0.7, category: 'technical' as const, synonyms: [] },
      ],
      requiredSkills: [
        { name: 'javascript', required: true, category: 'technical' as const },
        { name: 'react', required: true, category: 'technical' as const },
      ],
      preferredSkills: [],
      experienceLevel: undefined,
      salaryRange: {
        min: 80000,
        max: 100000,
      },
      keyTerms: ['javascript', 'react'],
      confidence: 0.4,
      summary: 'Fallback analysis extracted 2 skills from the job description.',
    };

    vi.mocked(jobAnalysisService.analyzeJobPosting).mockResolvedValue(mockFallbackResult);

    const result = await jobAnalysisService.analyzeJobPosting(mockJobDescription);

    expect(result).toEqual(mockFallbackResult);
    expect(result.extractedSkills).toHaveLength(2);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should validate minimum job description length', async () => {
    const shortDescription = 'Short job description';

    vi.mocked(jobAnalysisService.analyzeJobPosting).mockRejectedValue(
      new Error('Job description must be at least 50 characters long')
    );

    await expect(
      jobAnalysisService.analyzeJobPosting(shortDescription)
    ).rejects.toThrow('Job description must be at least 50 characters long');
  });
});