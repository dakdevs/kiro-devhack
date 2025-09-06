import { JobMatchesList } from './_modules/job-matches-list';

export default function JobMatchesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Job Matches
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover job opportunities that match your skills and experience
        </p>
      </div>
      
      <JobMatchesList />
    </div>
  );
}