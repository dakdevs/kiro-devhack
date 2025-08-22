"use client";

import { useState } from 'react';
import { AvailabilitySelector } from './availability-selector';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salaryMin: string;
  salaryMax: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
  benefits: string;
  applicationDeadline: string;
}

interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export function JobPostingForm() {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salaryMin: '',
    salaryMax: '',
    location: '',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: [],
    benefits: '',
    applicationDeadline: '',
  });

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof JobFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (skillsText: string) => {
    const skills = skillsText.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobData: formData,
          availability,
        }),
      });

      if (response.ok) {
        // Reset form or redirect
        alert('Job posted successfully!');
        setFormData({
          title: '',
          description: '',
          requirements: '',
          responsibilities: '',
          salaryMin: '',
          salaryMax: '',
          location: '',
          jobType: 'full-time',
          experienceLevel: 'mid',
          skills: [],
          benefits: '',
          applicationDeadline: '',
        });
        setAvailability([]);
      } else {
        throw new Error('Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Job Details Section */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          Job Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-black dark:text-white mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="e.g. Senior Software Engineer"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-black dark:text-white mb-2">
              Location *
            </label>
            <input
              type="text"
              id="location"
              required
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="e.g. San Francisco, CA or Remote"
            />
          </div>

          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-black dark:text-white mb-2">
              Job Type *
            </label>
            <select
              id="jobType"
              required
              value={formData.jobType}
              onChange={(e) => handleInputChange('jobType', e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div>
            <label htmlFor="experienceLevel" className="block text-sm font-medium text-black dark:text-white mb-2">
              Experience Level
            </label>
            <select
              id="experienceLevel"
              value={formData.experienceLevel}
              onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <div>
            <label htmlFor="salaryMin" className="block text-sm font-medium text-black dark:text-white mb-2">
              Salary Range
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="salaryMin"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                className="flex-1 min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Min"
              />
              <span className="flex items-center text-gray-400">-</span>
              <input
                type="text"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                className="flex-1 min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Max"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-black dark:text-white mb-2">
              Job Description *
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
              placeholder="Describe the role, company culture, and what makes this opportunity unique..."
            />
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-black dark:text-white mb-2">
              Requirements
            </label>
            <textarea
              id="requirements"
              rows={4}
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
              placeholder="List the required qualifications, experience, and skills..."
            />
          </div>

          <div>
            <label htmlFor="responsibilities" className="block text-sm font-medium text-black dark:text-white mb-2">
              Responsibilities
            </label>
            <textarea
              id="responsibilities"
              rows={4}
              value={formData.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
              placeholder="Outline the key responsibilities and day-to-day tasks..."
            />
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-black dark:text-white mb-2">
              Required Skills
            </label>
            <input
              type="text"
              id="skills"
              value={formData.skills.join(', ')}
              onChange={(e) => handleSkillsChange(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="e.g. React, TypeScript, Node.js (comma separated)"
            />
          </div>

          <div>
            <label htmlFor="applicationDeadline" className="block text-sm font-medium text-black dark:text-white mb-2">
              Application Deadline
            </label>
            <input
              type="date"
              id="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="benefits" className="block text-sm font-medium text-black dark:text-white mb-2">
              Benefits & Perks
            </label>
            <textarea
              id="benefits"
              rows={3}
              value={formData.benefits}
              onChange={(e) => handleInputChange('benefits', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-vertical"
              placeholder="Health insurance, 401k, flexible hours, remote work options..."
            />
          </div>
        </div>
      </div>

      {/* Availability Section */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
          Interview Availability
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Set your available days and times for conducting interviews for this position.
        </p>
        
        <AvailabilitySelector 
          availability={availability}
          onChange={setAvailability}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Posting Job...
            </>
          ) : (
            'Post Job'
          )}
        </button>
      </div>
    </form>
  );
}