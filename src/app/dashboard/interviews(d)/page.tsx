import { InterviewsList } from './_modules/interviews-list';

export default function InterviewsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Interviews
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your scheduled interviews and view upcoming sessions
        </p>
      </div>
      
      <InterviewsList />
    </div>
  );
}