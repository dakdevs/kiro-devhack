"use client"

import { useState, useEffect } from 'react';
import { CandidateFilters, ExperienceLevel } from '~/types/interview-management';

interface CandidateFiltersPanelProps {
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
  onClose: () => void;
}

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
  { value: 'intern', label: 'Intern' },
];

export function CandidateFiltersPanel({ 
  filters, 
  onFiltersChange, 
  onClose 
}: CandidateFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<CandidateFilters>(filters);
  const [skillsInput, setSkillsInput] = useState('');

  // Initialize skills input from filters
  useEffect(() => {
    if (filters.skills) {
      setSkillsInput(filters.skills.join(', '));
    }
  }, [filters.skills]);

  // Handle skills input change
  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skills = value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    setLocalFilters(prev => ({
      ...prev,
      skills: skills.length > 0 ? skills : undefined,
    }));
  };

  // Handle experience level toggle
  const handleExperienceLevelToggle = (level: ExperienceLevel) => {
    setLocalFilters(prev => {
      const currentLevels = prev.experienceLevel || [];
      const isSelected = currentLevels.includes(level);
      
      let newLevels: ExperienceLevel[];
      if (isSelected) {
        newLevels = currentLevels.filter(l => l !== level);
      } else {
        newLevels = [...currentLevels, level];
      }
      
      return {
        ...prev,
        experienceLevel: newLevels.length > 0 ? newLevels : undefined,
      };
    });
  };

  // Handle location change
  const handleLocationChange = (value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      location: value.trim() || undefined,
    }));
  };

  // Handle remote only toggle
  const handleRemoteOnlyToggle = () => {
    setLocalFilters(prev => ({
      ...prev,
      remoteOnly: prev.remoteOnly ? undefined : true,
    }));
  };

  // Handle minimum match score change
  const handleMinMatchScoreChange = (value: string) => {
    const score = parseInt(value);
    setLocalFilters(prev => ({
      ...prev,
      minMatchScore: isNaN(score) ? undefined : score,
    }));
  };

  // Handle availability date changes
  const handleAvailabilityChange = (field: 'startDate' | 'endDate' | 'timezone', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [field]: value.trim() || undefined,
      },
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: CandidateFilters = {};
    setLocalFilters(clearedFilters);
    setSkillsInput('');
    onFiltersChange(clearedFilters);
  };

  // Count active filters
  const activeFiltersCount = Object.keys(localFilters).filter(key => {
    const value = localFilters[key as keyof CandidateFilters];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '');
    }
    return value !== undefined && value !== '';
  }).length;

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Filter Candidates
          </h3>
          {activeFiltersCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Skills filter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Required Skills
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => handleSkillsChange(e.target.value)}
            placeholder="e.g. JavaScript, React, Node.js"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-apple-blue focus:outline-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separate multiple skills with commas
          </p>
        </div>

        {/* Experience level filter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Experience Level
          </label>
          <div className="space-y-2">
            {experienceLevels.map(level => (
              <label key={level.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.experienceLevel?.includes(level.value) || false}
                  onChange={() => handleExperienceLevelToggle(level.value)}
                  className="w-4 h-4 text-apple-blue border-gray-300 dark:border-gray-600 rounded focus:ring-apple-blue"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {level.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Location filter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Location
          </label>
          <input
            type="text"
            value={localFilters.location || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="e.g. San Francisco, CA"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-apple-blue focus:outline-none"
          />
          
          {/* Remote only toggle */}
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={localFilters.remoteOnly || false}
              onChange={handleRemoteOnlyToggle}
              className="w-4 h-4 text-apple-blue border-gray-300 dark:border-gray-600 rounded focus:ring-apple-blue"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Remote candidates only
            </span>
          </label>
        </div>

        {/* Minimum match score */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Minimum Match Score
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localFilters.minMatchScore || 30}
              onChange={(e) => handleMinMatchScoreChange(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
              {localFilters.minMatchScore || 30}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Only show candidates with at least this match score
          </p>
        </div>

        {/* Availability filter */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Availability Window
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="date"
              value={localFilters.availability?.startDate || ''}
              onChange={(e) => handleAvailabilityChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
              placeholder="Start date"
            />
            <input
              type="date"
              value={localFilters.availability?.endDate || ''}
              onChange={(e) => handleAvailabilityChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
              placeholder="End date"
            />
            <select
              value={localFilters.availability?.timezone || ''}
              onChange={(e) => handleAvailabilityChange('timezone', e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-apple-blue focus:outline-none"
            >
              <option value="">Any timezone</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Show candidates available during this time period
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Clear All Filters
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}