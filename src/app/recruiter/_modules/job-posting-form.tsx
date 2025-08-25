"use client"

import { useState } from 'react';
import { 
  CreateJobPostingRequest, 
  CreateJobPostingResponse,
  JobAnalysisResult,
  EmploymentType,
  ExperienceLevel
} from '~/types/interview-management';

interface JobPostingFormProps {
  onSubmit: (data: CreateJobPostingRequest) => Promise<CreateJobPostingResponse>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function JobPostingForm({ onSubmit, onCancel, isLoading = false }: JobPostingFormProps) {
  const [formData, setFormData] = useState<CreateJobPostingRequest>({
    title: '',
    description: '',
    location: '',
    remoteAllowed: false,
    employmentType: 'full-time',
    experienceLevel: undefined,
    salaryMin: undefined,
    salaryMax: undefined,
    requiredSkills: [],
    preferredSkills: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleInputChange = (field: keyof CreateJobPostingRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillsChange = (field: 'requiredSkills' | 'preferredSkills', value: string) => {
    const skills = value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    handleInputChange(field, skills);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Job description must be at least 10 characters';
    }

    if (formData.salaryMin && formData.salaryMax && formData.salaryMin > formData.salaryMax) {
      newErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await onSubmit(formData);
      
      if (result.success && result.data) {
        setAnalysisResult(result.data.analysis);
        setShowAnalysis(true);
      } else {
        setErrors({ submit: result.error || 'Failed to create job posting' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    }
  };

  if (showAnalysis && analysisResult) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
            Job Posted Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your job posting has been created and analyzed by AI. Here's what we extracted:
          </p>
        </div>

        <AIExtractionResults analysis={analysisResult} />

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowAnalysis(false);
              setAnalysisResult(null);
              setFormData({
                title: '',
                description: '',
                location: '',
                remoteAllowed: false,
                employmentType: 'full-time',
                experienceLevel: undefined,
                salaryMin: undefined,
                salaryMax: undefined,
                requiredSkills: [],
                preferredSkills: [],
              });
            }}
            className="px-4 py-2 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0"
          >
            Post Another Job
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Post a New Job
        </h2>
      </div>

      {/* Job Title */}
      <div>
        <label htmlFor="title" className="block text-[15px] font-medium text-black dark:text-white mb-2">
          Job Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          placeholder="e.g. Senior Software Engineer"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="mt-1 text-[13px] text-apple-red">{errors.title}</p>
        )}
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="description" className="block text-[15px] font-medium text-black dark:text-white mb-2">
          Job Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
          placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity exciting..."
          disabled={isLoading}
        />
        {errors.description && (
          <p className="mt-1 text-[13px] text-apple-red">{errors.description}</p>
        )}
        <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-400">
          Our AI will analyze this description to extract skills, requirements, and other details automatically.
        </p>
      </div>

      {/* Location and Remote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g. San Francisco, CA"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.remoteAllowed}
              onChange={(e) => handleInputChange('remoteAllowed', e.target.checked)}
              className="w-5 h-5 text-apple-blue bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded focus:ring-apple-blue focus:ring-2"
              disabled={isLoading}
            />
            <span className="text-[15px] text-black dark:text-white">
              Remote work allowed
            </span>
          </label>
        </div>
      </div>

      {/* Employment Type and Experience Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="employmentType" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Employment Type
          </label>
          <select
            id="employmentType"
            value={formData.employmentType}
            onChange={(e) => handleInputChange('employmentType', e.target.value as EmploymentType)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
            disabled={isLoading}
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div>
          <label htmlFor="experienceLevel" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Experience Level
          </label>
          <select
            id="experienceLevel"
            value={formData.experienceLevel || ''}
            onChange={(e) => handleInputChange('experienceLevel', e.target.value as ExperienceLevel || undefined)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
            disabled={isLoading}
          >
            <option value="">Let AI determine</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="executive">Executive</option>
            <option value="intern">Intern</option>
          </select>
        </div>
      </div>

      {/* Salary Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="salaryMin" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Minimum Salary (USD)
          </label>
          <input
            type="number"
            id="salaryMin"
            value={formData.salaryMin || ''}
            onChange={(e) => handleInputChange('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g. 80000"
            min="0"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="salaryMax" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Maximum Salary (USD)
          </label>
          <input
            type="number"
            id="salaryMax"
            value={formData.salaryMax || ''}
            onChange={(e) => handleInputChange('salaryMax', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g. 120000"
            min="0"
            disabled={isLoading}
          />
          {errors.salaryMax && (
            <p className="mt-1 text-[13px] text-apple-red">{errors.salaryMax}</p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="requiredSkills" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Required Skills
          </label>
          <input
            type="text"
            id="requiredSkills"
            value={formData.requiredSkills?.join(', ') || ''}
            onChange={(e) => handleSkillsChange('requiredSkills', e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g. JavaScript, React, Node.js"
            disabled={isLoading}
          />
          <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-400">
            Separate skills with commas. Leave blank to let AI extract from description.
          </p>
        </div>

        <div>
          <label htmlFor="preferredSkills" className="block text-[15px] font-medium text-black dark:text-white mb-2">
            Preferred Skills
          </label>
          <input
            type="text"
            id="preferredSkills"
            value={formData.preferredSkills?.join(', ') || ''}
            onChange={(e) => handleSkillsChange('preferredSkills', e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g. TypeScript, GraphQL, AWS"
            disabled={isLoading}
          />
          <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-400">
            Nice-to-have skills that would be a bonus.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="px-4 py-3 rounded-lg border border-apple-red bg-apple-red/10 text-apple-red">
          <p className="text-[15px]">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
        >
          {isLoading ? 'Creating Job...' : 'Create Job Posting'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// AI Extraction Results Component
interface AIExtractionResultsProps {
  analysis: JobAnalysisResult;
}

function AIExtractionResults({ analysis }: AIExtractionResultsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-apple-green rounded-full"></div>
        <span className="text-[15px] text-gray-600 dark:text-gray-400">
          AI Analysis Confidence: {Math.round(analysis.confidence * 100)}%
        </span>
      </div>

      {analysis.summary && (
        <div>
          <h3 className="text-[15px] font-medium text-black dark:text-white mb-2">Summary</h3>
          <p className="text-[15px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
            {analysis.summary}
          </p>
        </div>
      )}

      {analysis.requiredSkills.length > 0 && (
        <div>
          <h3 className="text-[15px] font-medium text-black dark:text-white mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-apple-blue/10 text-apple-blue rounded-full text-[13px] font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.preferredSkills.length > 0 && (
        <div>
          <h3 className="text-[15px] font-medium text-black dark:text-white mb-2">Preferred Skills</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.preferredSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-[13px] font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.experienceLevel && (
        <div>
          <h3 className="text-[15px] font-medium text-black dark:text-white mb-2">Experience Level</h3>
          <span className="px-3 py-1 bg-apple-green/10 text-apple-green rounded-full text-[13px] font-medium capitalize">
            {analysis.experienceLevel}
          </span>
        </div>
      )}

      {analysis.salaryRange && (analysis.salaryRange.min || analysis.salaryRange.max) && (
        <div>
          <h3 className="text-[15px] font-medium text-black dark:text-white mb-2">Salary Range</h3>
          <p className="text-[15px] text-gray-600 dark:text-gray-400">
            {analysis.salaryRange.min && analysis.salaryRange.max
              ? `$${analysis.salaryRange.min.toLocaleString()} - $${analysis.salaryRange.max.toLocaleString()}`
              : analysis.salaryRange.min
              ? `From $${analysis.salaryRange.min.toLocaleString()}`
              : `Up to $${analysis.salaryRange.max?.toLocaleString()}`
            }
          </p>
        </div>
      )}

      {analysis.keyTerms.length > 0 && (
        <div>
          <h3 className="text-[15px] font-medium text-black dark:text-white mb-2">Key Terms</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keyTerms.slice(0, 10).map((term, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[12px]"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}