"use client"

import { useState } from 'react';

export default function SimpleAvailabilityTestPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSimpleAvailability = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      // Create a simple availability slot for tomorrow 10-11 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);
      
      const data = {
        startTime: tomorrow.toISOString(),
        endTime: endTime.toISOString(),
        timezone: 'UTC',
        isRecurring: false
      };
      
      console.log('Sending data:', data);
      
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      setResult(`
Status: ${response.status}
Response: ${JSON.stringify(responseData, null, 2)}
      `);
      
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
          Simple Availability Test
        </h1>
        
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This will test creating a simple availability slot for tomorrow 10-11 AM UTC.
          </p>
          
          <button
            onClick={testSimpleAvailability}
            disabled={isLoading}
            className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Add Availability'}
          </button>
        </div>
        
        {result && (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Result
            </h2>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}