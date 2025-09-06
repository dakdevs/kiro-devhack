import { EventTypesManager } from './_modules/event-types-manager';

export default function EventTypesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Event Types
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your interview event types and availability settings
        </p>
      </div>
      
      <EventTypesManager />
    </div>
  );
}