import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardHeader } from './_modules/dashboard-header'
import { DashboardSidebar } from './_modules/dashboard-sidebar'
import { ErrorBoundary } from '~/components/error-boundary'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ErrorBoundary>
        <DashboardHeader user={session.user} />
      </ErrorBoundary>
      <div className="flex">
        <ErrorBoundary>
          <DashboardSidebar />
        </ErrorBoundary>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}