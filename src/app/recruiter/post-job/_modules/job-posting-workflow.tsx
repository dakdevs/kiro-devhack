"use client";

import { useState } from 'react';
import { URLImportStep } from './url-import-step';
import { JobDetailsStep } from './job-details-step';
import { AvailabilityStep } from './availability-step';
import { CompletionStep } from './completion-step';

export type WorkflowStep = 'url-import' | 'job-details' | 'availability' | 'completion';

export interface JobData {
  jobTitle: string;
  primaryTech: string[];
  secondaryTech: string[];
  jobDescription: string;
  teamDescription: string;
  salaryMin: string;
  salaryMax: string;
  companyDescription: string;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export function JobPostingWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('url-import');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [jobData, setJobData] = useState<JobData>({
    jobTitle: '',
    primaryTech: [],
    secondaryTech: [],
    jobDescription: '',
    teamDescription: '',
    salaryMin: '',
    salaryMax: '',
    companyDescription: '',
  });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { day: 'Sunday', startTime: '09:00', endTime: '17:00', enabled: false },
    { day: 'Monday', startTime: '09:00', endTime: '17:00', enabled: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '17:00', enabled: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '17:00', enabled: true },
    { day: 'Thursday', startTime: '09:00', endTime: '17:00', enabled: true },
    { day: 'Friday', startTime: '09:00', endTime: '17:00', enabled: true },
    { day: 'Saturday', startTime: '09:00', endTime: '17:00', enabled: false },
  ]);

  const transitionToStep = (nextStep: WorkflowStep) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
    }, 300);
  };

  const handleJobDataUpdate = (data: Partial<JobData>) => {
    setJobData(prev => ({ ...prev, ...data }));
  };

  const handleAvailabilityUpdate = (newAvailability: AvailabilitySlot[]) => {
    setAvailability(newAvailability);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'url-import':
        return (
          <URLImportStep
            onContinue={(importedData) => {
              if (importedData) {
                handleJobDataUpdate(importedData);
              }
              transitionToStep('job-details');
            }}
          />
        );
      case 'job-details':
        return (
          <JobDetailsStep
            jobData={jobData}
            onUpdate={handleJobDataUpdate}
            onContinue={() => transitionToStep('availability')}
            onBack={() => transitionToStep('url-import')}
          />
        );
      case 'availability':
        return (
          <AvailabilityStep
            availability={availability}
            onUpdate={handleAvailabilityUpdate}
            onContinue={() => transitionToStep('completion')}
            onBack={() => transitionToStep('job-details')}
          />
        );
      case 'completion':
        return (
          <CompletionStep
            jobData={jobData}
            availability={availability}
            onBack={() => transitionToStep('availability')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold text-black dark:text-white">
            Post New Job
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep === 'url-import' ? 1 : currentStep === 'job-details' ? 2 : currentStep === 'availability' ? 3 : 4} of 4
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {['url-import', 'job-details', 'availability', 'completion'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                currentStep === step
                  ? 'bg-apple-blue text-white'
                  : index < ['url-import', 'job-details', 'availability', 'completion'].indexOf(currentStep)
                  ? 'bg-apple-green text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {index < ['url-import', 'job-details', 'availability', 'completion'].indexOf(currentStep) ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 mx-2 transition-colors duration-200 ${
                  index < ['url-import', 'job-details', 'availability', 'completion'].indexOf(currentStep)
                    ? 'bg-apple-green'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className={`transition-all duration-300 ease-out ${
        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
        {renderCurrentStep()}
      </div>
    </div>
  );
}