export default function ApplicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Job Applications
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage candidate applications
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex flex-wrap gap-4">
          <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white">
            <option>All Jobs</option>
            <option>Senior Software Engineer</option>
            <option>Product Manager</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white">
            <option>All Status</option>
            <option>Pending</option>
            <option>Reviewing</option>
            <option>Interview Scheduled</option>
            <option>Rejected</option>
            <option>Hired</option>
          </select>
          <input
            type="text"
            placeholder="Search candidates..."
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Recent Applications
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Sample Application */}
          <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-apple-purple rounded-full flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    John Doe
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Applied for Senior Software Engineer
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Applied 2 days ago</span>
                    <span>•</span>
                    <span>5 years experience</span>
                    <span>•</span>
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 text-xs bg-apple-blue/10 text-apple-blue rounded">
                      React
                    </span>
                    <span className="px-2 py-1 text-xs bg-apple-blue/10 text-apple-blue rounded">
                      TypeScript
                    </span>
                    <span className="px-2 py-1 text-xs bg-apple-blue/10 text-apple-blue rounded">
                      Node.js
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm bg-apple-orange/10 text-apple-orange rounded-full">
                  Pending Review
                </span>
                <button className="px-4 py-2 text-sm bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150">
                  Review
                </button>
              </div>
            </div>
          </div>

          {/* Another Sample Application */}
          <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-apple-green to-apple-teal rounded-full flex items-center justify-center text-white font-semibold">
                  JS
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    Jane Smith
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Applied for Product Manager
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Applied 1 week ago</span>
                    <span>•</span>
                    <span>8 years experience</span>
                    <span>•</span>
                    <span>Remote</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 text-xs bg-apple-green/10 text-apple-green rounded">
                      Product Strategy
                    </span>
                    <span className="px-2 py-1 text-xs bg-apple-green/10 text-apple-green rounded">
                      Analytics
                    </span>
                    <span className="px-2 py-1 text-xs bg-apple-green/10 text-apple-green rounded">
                      Leadership
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm bg-apple-green/10 text-apple-green rounded-full">
                  Interview Scheduled
                </span>
                <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150">
                  View Details
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No more applications
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You've reviewed all current applications. New applications will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}