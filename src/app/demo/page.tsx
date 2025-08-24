import { UserProfileDemo } from '~/components/user-profile-demo';

export default function DemoPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            User Skills & Sessions Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstrating user-attached skills and interview sessions stored in separate tables
          </p>
        </header>
        
        <UserProfileDemo />
        
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              Skills and sessions are stored in separate tables and linked to users
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <span>• user_skills table for aggregated skill data</span>
              <span>• interview_sessions table for session data</span>
              <span>• skill_mentions table for detailed audit trail</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}