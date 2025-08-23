"use client";

import Link from 'next/link';
import { JobData, AvailabilitySlot } from './job-posting-workflow';

interface CompletionStepProps {
  jobData: JobData;
  availability: AvailabilitySlot[];
  onBack: () => void;
}

export function CompletionStep({ jobData, availability, onBack }: CompletionStepProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-apple-blue to-apple-purple rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-semibold text-black dark:text-white mb-4">
          Currently in Development
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          We're working hard to bring you the complete job posting experience. This feature will be available soon!
        </p>

        <div className="bg-gradient-to-r from-apple-blue/10 to-apple-purple/10 border border-apple-blue/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            What's Coming Next
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-apple-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-apple-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-black dark:text-white">AI-Powered Matching</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Intelligent candidate matching based on your job requirements</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-apple-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-apple-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-black dark:text-white">Automated Scheduling</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Seamless interview scheduling with calendar integration</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-apple-orange/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-apple-orange" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-black dark:text-white">Real-time Analytics</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track application metrics and candidate engagement</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-apple-purple/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-apple-purple" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-black dark:text-white">Multi-platform Publishing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distribute your job posting across multiple job boards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview of collected data */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4 text-center">
            Your Job Posting Preview
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-black dark:text-white">{jobData.jobTitle || 'Job Title'}</h4>
              {jobData.primaryTech.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {jobData.primaryTech.map((tech, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-apple-blue/10 text-apple-blue rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {jobData.jobDescription && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {jobData.jobDescription}
                </p>
              </div>
            )}
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Availability</h5>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {availability.filter(slot => slot.enabled).length} days selected
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Availability
          </button>
          
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0"
          >
            Return to Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}