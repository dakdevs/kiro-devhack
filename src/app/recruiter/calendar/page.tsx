import { CalComConnection } from './_modules/cal-com-connection';

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Interview Scheduling
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your Cal.com account to enable interview scheduling with candidates
        </p>
      </div>

      <CalComConnection />

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          How Interview Scheduling Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">1</span>
            </div>
            <h3 className="font-medium text-black dark:text-white mb-2">Connect Cal.com</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your Cal.com account to sync your availability and event types
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">2</span>
            </div>
            <h3 className="font-medium text-black dark:text-white mb-2">Candidates Book</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Matched candidates can view your availability and book interview slots
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">3</span>
            </div>
            <h3 className="font-medium text-black dark:text-white mb-2">Auto Confirmation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Both parties receive calendar invitations and meeting details automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}