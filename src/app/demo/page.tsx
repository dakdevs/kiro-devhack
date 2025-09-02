import Link from 'next/link';
import { UserProfileDemo } from '~/components/user-profile-demo';

export default function DemoPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            AI Interview Management System Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive demonstration of AI-powered job posting, skill extraction, and candidate matching
          </p>
        </header>

        {/* Demo Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/demo/jobs"
            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-apple-blue/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-white group-hover:text-apple-blue transition-colors">
                Job Postings Demo
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              View 25 diverse job postings with AI-powered skill extraction across 5 industries
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span>• 25 job postings</span>
              <span>• AI skill extraction</span>
              <span>• 5 industries</span>
            </div>
          </Link>

          <Link
            href="/demo/matching"
            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-apple-green/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-apple-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-white group-hover:text-apple-green transition-colors">
                Candidate Matching Demo
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              See AI-powered candidate matching with skill overlap analysis and fit scores
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span>• Smart matching</span>
              <span>• Skill analysis</span>
              <span>• Fit scoring</span>
            </div>
          </Link>

          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-apple-purple/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-apple-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                User Skills Demo
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Interactive user skills and interview sessions demonstration
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span>• User profiles</span>
              <span>• Skill tracking</span>
              <span>• Sessions</span>
            </div>
          </div>
        </div>
        
        <UserProfileDemo />
        
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              Complete AI-powered interview management system with job posting, skill extraction, and candidate matching
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <span>• 25 diverse job postings across 5 industries</span>
              <span>• 24 candidates with 233 total skills</span>
              <span>• AI skill extraction with 70-90% confidence</span>
              <span>• Smart candidate matching algorithm</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}