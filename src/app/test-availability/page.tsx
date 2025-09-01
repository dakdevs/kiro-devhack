"use client"

import { useState, useEffect } from 'react';
import { AvailabilitySlotForm } from '~/components/availability-slot-form';
import { CreateAvailabilityRequest } from '~/types/interview-management';

export default function TestAvailabilityPage() {
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<string>('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check authentication on load
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        console.log('Session data:', data);
        setSession(data);
      })
      .catch(err => {
        console.error('Session check failed:', err);
      });
  }, []);

  const handleFormSubmit = async (data: CreateAvailabilityRequest) => {
    try {
      console.log('Form submitted with data:', data);
      setResult('Submitting...');
      
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      console.log('API response:', responseData);
      
      setResult(`
Status: ${response.status}
Success: ${responseData.success}
Response: ${JSON.stringify(responseData, null, 2)}
      `);
      
      if (responseData.success) {
        setShowForm(false);
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      setResult(`Error: ${error}`);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setResult('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
          Test Availability Form
        </h1>
        
        {/* Session Info */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Authentication Status
          </h2>
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
            {session ? JSON.stringify(session, null, 2) : 'Loading...'}
          </pre>
        </div>
        
        {/* Controls */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-blue-600"
          >
            Open Availability Form
          </button>
        </div>
        
        {/* Result */}
        {result && (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Result
            </h2>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
              {result}
            </pre>
          </div>
        )}
        
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <AvailabilitySlotForm
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isLoading={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}