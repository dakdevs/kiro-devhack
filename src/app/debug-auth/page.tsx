"use client"

import { useState, useEffect } from 'react';
import { useCSRFToken } from '~/hooks/use-csrf-token';

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [profileStatus, setProfileStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const csrfToken = useCSRFToken();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check authentication by trying to access a protected endpoint
        const authResponse = await fetch('/api/recruiter/profile');
        const authData = await authResponse.json();
        
        setAuthStatus({
          status: authResponse.status,
          ok: authResponse.ok,
          data: authData
        });

        if (authResponse.status === 404) {
          setProfileStatus('Profile not found - needs to be created');
        } else if (authResponse.ok) {
          setProfileStatus('Profile exists');
        } else {
          setProfileStatus(`Error: ${authData.error}`);
        }
      } catch (error) {
        setAuthStatus({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-6">Loading auth status...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Authentication Debug</h1>
      
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium mb-2">CSRF Token</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono break-all">
            {csrfToken || 'Not available'}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Authentication Status</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Profile Status</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
            {profileStatus}
          </div>
        </div>

        <div className="pt-4">
          <h2 className="text-lg font-medium mb-2">Quick Actions</h2>
          <div className="flex gap-2">
            <a 
              href="/recruiter/profile" 
              className="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm hover:bg-blue-600"
            >
              Go to Profile
            </a>
            <a 
              href="/test-csrf" 
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
            >
              Test CSRF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}