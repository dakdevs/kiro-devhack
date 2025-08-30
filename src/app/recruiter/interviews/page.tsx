import { Suspense } from 'react';
import { InterviewManagementPage } from './_modules/interview-management-page';

export default function RecruiterInterviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Interview Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your scheduled interviews and candidate interactions
        </p>
      </div>
      
      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      }>
        <InterviewManagementPage />
      </Suspense>
    </div>
  );
}