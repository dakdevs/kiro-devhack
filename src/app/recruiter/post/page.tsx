import { JobPostingForm } from './_modules/job-posting-form';

export default function PostJobPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Post a New Job
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create a job posting and set your availability for interviews
        </p>
      </div>
      
      <JobPostingForm />
    </div>
  );
}