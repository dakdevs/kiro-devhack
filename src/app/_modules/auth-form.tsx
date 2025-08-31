"use client"

import { authClient } from "~/lib/auth-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AuthFormProps {
  redirectTo?: string
}

export function AuthForm({ redirectTo }: AuthFormProps) {
  const [session, setSession] = useState<any>(null)
  const [isPending, setIsPending] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      try {
        const sessionData = await authClient.getSession()
        setSession(sessionData)
        
        // Redirect to dashboard if user is authenticated
        if (sessionData?.data?.user) {
          router.push(redirectTo || '/dashboard')
        }
      } catch (error) {
        console.error("Session error:", error)
      } finally {
        setIsPending(false)
      }
    }
    
    getSession()
  }, [router])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      setSession(null)
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      console.log("Initiating Google sign in...")
      
      const result = await authClient.signIn.social({ 
        provider: "google",
        callbackURL: redirectTo || "/dashboard"
      })
      
      console.log("Google sign in result:", result)
    } catch (error) {
      console.error("Google sign in error:", error)
      setIsSigningIn(false)
    }
  }

  if (isPending) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"></div>
          </div>
        </div>
      </div>
    )
  }

  if (session?.data?.user) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
          {/* Profile Section */}
          <div className="mb-8 text-center">
            <div className="relative mb-4 inline-block">
              {session.data.user?.image ? (
                <img
                  src={session.data.user.image}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-4 border-white shadow-lg dark:border-slate-700"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg dark:border-slate-700">
                  <span className="text-2xl font-bold text-white">
                    {session.data.user?.name?.charAt(0) || session.data.user?.email?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-green-500 dark:border-slate-800"></div>
            </div>
            <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back!
            </h2>
            <p className="mb-1 text-lg font-medium text-slate-700 dark:text-slate-200">
              {session.data.user?.name || "User"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {session.data.user?.email || "No email"}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
              <div className="relative flex items-center justify-center gap-2">
                {isSigningOut ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80">
        {/* Sign In Section */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            Sign In
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="group relative w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 shadow-lg transition-all duration-200 hover:border-slate-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20"></div>
          <div className="relative flex items-center justify-center gap-3">
            {isSigningIn ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-blue-600"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </div>
        </button>

        {/* Security Notice */}
        <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Secure Authentication
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your data is protected with industry-standard security measures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}