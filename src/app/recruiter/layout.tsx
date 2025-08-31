import { redirect } from 'next/navigation';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { NotificationBell } from '~/components/notification-bell';
import { ErrorBoundary } from '~/components/error-boundary';

export default async function RecruiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        redirect('/auth/signin');
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl font-semibold text-black dark:text-white">
                                Recruiter Dashboard
                            </h1>
                            <nav className="flex gap-6">
                                <Link
                                    href="/recruiter/profile"
                                    className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                                >
                                    Profile
                                </Link>
                                <Link
                                    href="/recruiter/jobs"
                                    className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                                >
                                    Jobs
                                </Link>
                                <Link
                                    href="/recruiter/post-job"
                                    className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                                >
                                    Post Job
                                </Link>
                                <Link
                                    href="/recruiter/calendar"
                                    className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                                >
                                    Calendar
                                </Link>
                                <Link
                                    href="/recruiter/interviews"
                                    className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                                >
                                    Interviews
                                </Link>
                                <Link
                                    href="/recruiter/applications"
                                    className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
                                >
                                    Applications
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {session.user.name}
                            </span>
                            <Link
                                href="/dashboard"
                                className="text-sm text-apple-blue hover:text-blue-600 transition-colors duration-150"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>
        </div>
    );
}