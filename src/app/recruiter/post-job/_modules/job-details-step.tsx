"use client";

import { useState } from 'react';
import { JobData } from './job-posting-workflow';

interface JobDetailsStepProps {
  jobData: JobData;
  onUpdate: (data: Partial<JobData>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function JobDetailsStep({ jobData, onUpdate, onContinue, onBack }: JobDetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof JobData, value: string | string[]) => {
    onUpdate({ [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillsChange = (field: 'primaryTech' | 'secondaryTech', value: string) => {
    const skills = value.split(',').map(skill => skill.trim()).filter(Boolean);
    handleInputChange(field, skills);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!jobData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    if (!jobData.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    }
    if (jobData.primaryTech.length === 0) {
      newErrors.primaryTech = 'At least one primary technology/skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onContinue();
    }
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Job Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fill in the details for your job posting. Required fields are marked with an asterisk (*).
        </p>
      </div>

      <div className="space-y-6">
        {/* Job Title */}
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-black dark:text-white mb-2">
            Job Title *
          </label>
          <input
            type="text"
            id="jobTitle"
            value={jobData.jobTitle}
            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            className={`w-full min-h-[44px] px-4 py-3 border rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.jobTitle 
                ? 'border-apple-red focus:border-apple-red' 
                : 'border-gray-200 dark:border-gray-700 focus:border-apple-blue'
            }`}
            placeholder="e.g. Senior Software Engineer"
          />
          {errors.jobTitle && (
            <p className="mt-1 text-sm text-apple-red" role="alert">
              {errors.jobTitle}
            </p>
          )}
        </div>

        {/* Primary Technologies */}
        <div>
          <label htmlFor="primaryTech" className="block text-sm font-medium text-black dark:text-white mb-2">
            Important Technologies/Skills *
          </label>
          <input
            type="text"
            id="primaryTech"
            value={jobData.primaryTech.join(', ')}
            onChange={(e) => handleSkillsChange('primaryTech', e.target.value)}
            className={`w-full min-h-[44px] px-4 py-3 border rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
              errors.primaryTech 
                ? 'border-apple-red focus:border-apple-red' 
                : 'border-gray-200 dark:border-gray-700 focus:border-apple-blue'
            }`}
            placeholder="e.g. React, TypeScript, Node.js (comma separated)"
          />
          {errors.primaryTech && (
            <p className="mt-1 text-sm text-apple-red" role="alert">
              {errors.primaryTech}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Core technologies and skills that are essential for this role
          </p>
        </div>

        {/* Secondary Technologies */}
        <div>
          <label htmlFor="secondaryTech" className="block text-sm font-medium text-black dark:text-white mb-2">
            Secondary Technologies/Skills
          </label>
          <input
            type="text"
            id="secondaryTech"
            value={jobData.secondaryTech.join(', ')}
            onChange={(e) => handleSkillsChange('secondaryTech', e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="e.g. Docker, AWS, GraphQL (comma separated)"
          />
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Nice-to-have technologies and skills
          </p>
        </div>

        {/* Job Description */}
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-black dark:text-white mb-2">
            Job Description *
          </label>
          <textarea
            id="jobDescription"
            rows={6}
            value={jobData.jobDescription}
            onChange={(e) => handleInputChange('jobDescription', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical ${
              errors.jobDescription 
                ? 'border-apple-red focus:border-apple-red' 
                : 'border-gray-200 dark:border-gray-700 focus:border-apple-blue'
            }`}
            placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
          />
          {errors.jobDescription && (
            <p className="mt-1 text-sm text-apple-red" role="alert">
              {errors.jobDescription}
            </p>
          )}
        </div>

        {/* Team/Project Description */}
        <div>
          <label htmlFor="teamDescription" className="block text-sm font-medium text-black dark:text-white mb-2">
            Team or Project Description
          </label>
          <textarea
            id="teamDescription"
            rows={4}
            value={jobData.teamDescription}
            onChange={(e) => handleInputChange('teamDescription', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
            placeholder="Describe the team structure, project goals, and working environment..."
          />
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-black dark:text-white mb-2">
            Salary Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                value={jobData.salaryMin}
                onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Minimum (e.g. $80,000)"
              />
            </div>
            <div>
              <input
                type="text"
                value={jobData.salaryMax}
                onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Maximum (e.g. $120,000)"
              />
            </div>
          </div>
        </div>

        {/* Company Description */}
        <div>
          <label htmlFor="companyDescription" className="block text-sm font-medium text-black dark:text-white mb-2">
            Company Description
          </label>
          <textarea
            id="companyDescription"
            rows={4}
            value={jobData.companyDescription}
            onChange={(e) => handleInputChange('companyDescription', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
            placeholder="Tell candidates about your company, culture, and mission..."
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <button
          onClick={handleContinue}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0"
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}