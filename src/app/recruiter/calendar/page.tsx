import { CalendarView } from './_modules/calendar-view';
import { CalendarIntegration } from './_modules/calendar-integration';

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
          Interview Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your interview schedule and sync with Google Calendar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CalendarView />
        </div>
        <div>
          <CalendarIntegration />
        </div>
      </div>
    </div>
  );
}