"use client";

import { useState } from 'react';

export default function DebugJobCreationPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG-JOB] ${message}`);
  };

  const testMinimalJobCreation = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('Starting minimal job creation test');
      
      // Step 1: Check if we have a CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1];
      
      if (!csrfToken) {
        addLog('ERROR: No CSRF token found in cookies');
        addLog('Available cookies: ' + document.cookie);
        return;
      }
      
      addLog('✓ CSRF token found: ' + csrfToken.substring(0, 8) + '...');
      
      // Step 2: Check auth status
      addLog('Checking authentication status...');
      const authResponse = await fetch('/api/recruiter/profile');
      addLog(`Auth check response: ${authResponse.status} ${authResponse.statusText}`);
      
      if (authResponse.status === 404) {
        addLog('ERROR: Recruiter profile not found - need to create profile first');
        return;
      }
      
      if (!authResponse.ok) {
        const authError = await authResponse.text();
        addLog('ERROR: Auth check failed: ' + authError);
        return;
      }
      
      const authData = await authResponse.json();
      addLog('✓ Authentication successful: ' + JSON.stringify(authData));
      
      // Step 3: Create minimal job posting
      addLog('Creating minimal job posting...');
      
      const minimalJobData = {
        title: 'Test Job - Debug',
        description: 'This is a minimal test job posting for debugging purposes. It contains basic information to test the job creation API endpoint. Requirements: Basic skills, experience with testing, problem-solving abilities.',
        remoteAllowed: false,
        employmentType: 'full-time'
      };
      
      addLog('Job data: ' + JSON.stringify(minimalJobData, null, 2));
      
      const jobResponse = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(minimalJobData),
      });
      
      addLog(`Job creation response: ${jobResponse.status} ${jobResponse.statusText}`);
      addLog('Response headers: ' + JSON.stringify(Object.fromEntries(jobResponse.headers.entries())));
      
      const responseText = await jobResponse.text();
      addLog('Response body: ' + responseText);
      
      if (!jobResponse.ok) {
        addLog('ERROR: Job creation failed');
        try {
          const errorData = JSON.parse(responseText);
          addLog('Parsed error: ' + JSON.stringify(errorData, null, 2));
        } catch (parseError) {
          addLog('Could not parse error response as JSON');
        }
        return;
      }
      
      const jobResult = JSON.parse(responseText);
      addLog('✓ Job creation successful!');
      addLog('Result: ' + JSON.stringify(jobResult, null, 2));
      
    } catch (error) {
      addLog('EXCEPTION: ' + (error instanceof Error ? error.message : String(error)));
      addLog('Stack trace: ' + (error instanceof Error ? error.stack : 'No stack'));
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Job Creation</h1>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={testMinimalJobCreation}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Minimal Job Creation'}
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click "Test Minimal Job Creation" to start.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}