import { DashboardSidebar } from '../dashboard/_modules/dashboard-sidebar';

export default function TestSidebarPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Sidebar Test</h1>
        <p>This page tests if the sidebar renders without errors.</p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-800">✅ Success!</h2>
          <p className="text-green-700">If you can see this page, the sidebar is working correctly.</p>
        </div>
      </main>
    </div>
  );
}