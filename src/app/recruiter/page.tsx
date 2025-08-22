import Link from 'next/link';

export default function RecruiterDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Welcome to Recruiter Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your job postings, interviews, and candidate applications
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/recruiter/post"
          className="group bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-apple-blue/10 rounded-lg flex items-center justify-center group-hover:bg-apple-blue/20 transition-colors duration-200">
              <svg className="w-6 h-6 text-apple-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Post New Job
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a job listing and set availability
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/recruiter/calendar"
          className="group bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-apple-green/10 rounded-lg flex items-center justify-center group-hover:bg-apple-green/20 transition-colors duration-200">
              <svg className="w-6 h-6 text-apple-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Interview Calendar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage schedule and Google Calendar
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/recruiter/applications"
          className="group bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-apple-orange/10 rounded-lg flex items-center justify-center group-hover:bg-apple-orange/20 transition-colors duration-200">
              <svg className="w-6 h-6 text-apple-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Applications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review candidate applications
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          Recent Activity
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-apple-blue/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-apple-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">New application received</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Senior Software Engineer position</p>
              </div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-apple-green/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-apple-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">Interview scheduled</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">John Doe - Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">1 day ago</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-apple-orange/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-apple-orange" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">Job posting published</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Product Manager position is now live</p>
              </div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">3 days ago</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-semibold text-black dark:text-white">5</p>
            </div>
            <div className="w-10 h-10 bg-apple-blue/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-apple-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Applications</p>
              <p className="text-2xl font-semibold text-black dark:text-white">23</p>
            </div>
            <div className="w-10 h-10 bg-apple-green/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-apple-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Interviews</p>
              <p className="text-2xl font-semibold text-black dark:text-white">8</p>
            </div>
            <div className="w-10 h-10 bg-apple-orange/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-apple-orange" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hired</p>
              <p className="text-2xl font-semibold text-black dark:text-white">2</p>
            </div>
            <div className="w-10 h-10 bg-apple-purple/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-apple-purple" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}