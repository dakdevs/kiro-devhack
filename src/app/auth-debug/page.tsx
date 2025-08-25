import { AuthForm } from "~/app/_modules/auth-form"

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Auth Debug
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Testing Google OAuth integration
          </p>
        </div>
        
        <AuthForm redirectTo="/dashboard" />
        
        <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Auth URL:</strong> {process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'}</p>
            <p><strong>Expected Callback:</strong> {process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google</p>
          </div>
        </div>
      </div>
    </div>
  )
}