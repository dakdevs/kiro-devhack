import { Suspense } from 'react';
import { MonitoringDashboard } from './_modules/monitoring-dashboard';
import { LoadingFallback } from '~/components/loading-fallback';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor the health and performance of the interview management system
          </p>
        </div>

        <Suspense fallback={<LoadingFallback message="Loading monitoring data..." />}>
          <MonitoringDashboard />
        </Suspense>
      </div>
    </div>
  );
}