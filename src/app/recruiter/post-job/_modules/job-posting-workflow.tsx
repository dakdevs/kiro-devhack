"use client";

import { useState } from 'react';
import { SimpleJobPostingForm } from './simple-job-posting-form';
import { JobPostingSuccess } from './job-posting-success';
import { JobAnalysisResult } from '~/types/interview-management';

export type WorkflowStep = 'posting' | 'success';

export function JobPostingWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('posting');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [jobResult, setJobResult] = useState<{
    job: any;
    analysis: JobAnalysisResult;
  } | null>(null);

  const transitionToStep = (nextStep: WorkflowStep) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
    }, 300);
  };

  const handleJobPostingSuccess = (result: any) => {
    console.log('[JOB-POSTING-WORKFLOW] handleJobPostingSuccess called with:', result);
    console.log('[JOB-POSTING-WORKFLOW] result type:', typeof result);
    console.log('[JOB-POSTING-WORKFLOW] result keys:', result ? Object.keys(result) : 'null');
    
    // Handle API response structure - need to unwrap nested success/data objects
    let jobData;
    
    // Start with the result and keep unwrapping until we find the actual job data
    let current = result;
    while (current?.success && current?.data && !current.job) {
      console.log('[JOB-POSTING-WORKFLOW] Unwrapping layer, current keys:', Object.keys(current));
      current = current.data;
    }
    
    // Now current should be the actual job data with { job, analysis }
    if (current?.job) {
      console.log('[JOB-POSTING-WORKFLOW] Found job data:', current);
      jobData = current;
    } else if (current?.success && current?.data?.job) {
      // One more level of unwrapping if needed
      console.log('[JOB-POSTING-WORKFLOW] Found job data one level deeper');
      jobData = current.data;
    } else {
      console.error('[JOB-POSTING-WORKFLOW] ERROR: Could not find job data in response');
      console.error('[JOB-POSTING-WORKFLOW] Final current object:', current);
      console.error('[JOB-POSTING-WORKFLOW] Current keys:', current ? Object.keys(current) : 'null');
      return;
    }
    
    console.log('[JOB-POSTING-WORKFLOW] Final jobData:', jobData);
    console.log('[JOB-POSTING-WORKFLOW] jobData.job:', jobData?.job);
    console.log('[JOB-POSTING-WORKFLOW] jobData.analysis:', jobData?.analysis);
    
    // Validate the job data structure
    if (!jobData || typeof jobData !== 'object') {
      console.error('[JOB-POSTING-WORKFLOW] ERROR: Invalid job data structure');
      return;
    }
    
    if (!jobData.job) {
      console.error('[JOB-POSTING-WORKFLOW] ERROR: Missing job in job data');
      console.error('[JOB-POSTING-WORKFLOW] Available jobData keys:', Object.keys(jobData));
      return;
    }
    
    // Analysis can be null, that's okay - we handle it in the success component
    if (jobData.analysis === undefined) {
      console.warn('[JOB-POSTING-WORKFLOW] WARNING: Analysis is undefined, setting to null');
      jobData.analysis = null;
    }
    
    console.log('[JOB-POSTING-WORKFLOW] Setting job result and transitioning to success');
    setJobResult(jobData);
    transitionToStep('success');
  };

  const handleStartOver = () => {
    setJobResult(null);
    transitionToStep('posting');
  };

  // Test function to simulate successful job posting
  const handleTestSuccess = () => {
    const mockResult = {
      job: {
        id: 'test-job-id',
        title: 'Test Software Engineer',
        rawDescription: 'Test job description',
        recruiterId: 'test-recruiter-id',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        extractedSkills: [
          { name: 'JavaScript', category: 'technical', required: true },
          { name: 'React', category: 'technical', required: true }
        ],
        requiredSkills: [
          { name: 'JavaScript', category: 'technical', required: true },
          { name: 'React', category: 'technical', required: true }
        ],
        preferredSkills: [],
        experienceLevel: 'mid',
        salaryMin: 100000,
        salaryMax: 150000,
        location: 'San Francisco, CA',
        remoteAllowed: true,
        employmentType: 'full-time',
        aiConfidenceScore: 0.8
      },
      analysis: {
        extractedSkills: [
          { name: 'JavaScript', category: 'technical', required: true },
          { name: 'React', category: 'technical', required: true }
        ],
        requiredSkills: [
          { name: 'JavaScript', category: 'technical', required: true },
          { name: 'React', category: 'technical', required: true }
        ],
        preferredSkills: [],
        experienceLevel: 'mid',
        salaryRange: { min: 100000, max: 150000 },
        keyTerms: ['JavaScript', 'React', 'Software Engineer'],
        confidence: 0.8,
        summary: 'Software engineering position requiring JavaScript and React skills'
      }
    };
    
    console.log('[JOB-POSTING-WORKFLOW] Testing with mock data:', mockResult);
    handleJobPostingSuccess(mockResult);
  };

  const renderCurrentStep = () => {
    console.log('[JOB-POSTING-WORKFLOW] Rendering step:', currentStep);
    switch (currentStep) {
      case 'posting':
        console.log('[JOB-POSTING-WORKFLOW] Rendering SimpleJobPostingForm');
        return (
          <div>
            {/* Test button for debugging */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">Debug: Test success component with mock data</p>
              <button
                onClick={handleTestSuccess}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Test Success Component
              </button>
            </div>
            
            <SimpleJobPostingForm
              onSuccess={handleJobPostingSuccess}
            />
          </div>
        );
      case 'success':
        return (
          <JobPostingSuccess
            jobResult={jobResult!}
            onStartOver={handleStartOver}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Post New Job
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentStep === 'posting'
            ? 'Simply paste your job posting and let AI extract all the details automatically.'
            : 'Your job has been posted successfully!'
          }
        </p>
      </div>

      {/* Step Content */}
      <div className={`transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
        {renderCurrentStep()}
      </div>
    </div>
  );
}