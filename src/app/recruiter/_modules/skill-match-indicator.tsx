"use client"

import { Skill } from '~/types/interview-management';

interface SkillMatchIndicatorProps {
  skill: Skill;
  candidateSkill?: Skill;
  showProficiency?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SkillMatchIndicator({ 
  skill, 
  candidateSkill, 
  showProficiency = true,
  size = 'md'
}: SkillMatchIndicatorProps) {
  const proficiencyScore = candidateSkill?.proficiencyScore || 0;
  const isRequired = skill.required;
  
  // Get proficiency color based on score
  const getProficiencyColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get skill badge styling based on match and requirement
  const getSkillBadgeStyle = () => {
    const baseStyle = "inline-flex items-center gap-1 rounded-md font-medium transition-colors";
    
    const sizeStyles = {
      sm: "px-2 py-1 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base"
    };

    if (candidateSkill) {
      // Candidate has this skill
      if (isRequired) {
        return `${baseStyle} ${sizeStyles[size]} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800`;
      } else {
        return `${baseStyle} ${sizeStyles[size]} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800`;
      }
    } else {
      // Candidate doesn't have this skill
      if (isRequired) {
        return `${baseStyle} ${sizeStyles[size]} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800`;
      } else {
        return `${baseStyle} ${sizeStyles[size]} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-700`;
      }
    }
  };

  // Get icon based on match status
  const getMatchIcon = () => {
    if (candidateSkill) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (isRequired) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="relative group">
      <span className={getSkillBadgeStyle()}>
        {getMatchIcon()}
        <span>{skill.name}</span>
        
        {/* Required indicator */}
        {isRequired && (
          <span className="text-xs opacity-75">*</span>
        )}
        
        {/* Proficiency indicator */}
        {showProficiency && candidateSkill && proficiencyScore > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                className={`h-full rounded-full ${getProficiencyColor(proficiencyScore)}`}
                style={{ width: `${proficiencyScore}%` }}
              />
            </div>
            <span className="text-xs opacity-75">{proficiencyScore}%</span>
          </div>
        )}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="space-y-1">
          <div className="font-medium">{skill.name}</div>
          {isRequired && (
            <div className="text-red-300 dark:text-red-600">Required skill</div>
          )}
          {candidateSkill ? (
            <div className="space-y-1">
              <div className="text-green-300 dark:text-green-600">✓ Candidate has this skill</div>
              {proficiencyScore > 0 && (
                <div>Proficiency: {proficiencyScore}%</div>
              )}
            </div>
          ) : (
            <div className="text-red-300 dark:text-red-600">✗ Skill gap</div>
          )}
          {skill.category && (
            <div className="text-gray-300 dark:text-gray-600 capitalize">
              {skill.category} skill
            </div>
          )}
        </div>
        
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-white"></div>
      </div>
    </div>
  );
}