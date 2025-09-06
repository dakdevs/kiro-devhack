"use client"

import { useState } from 'react';
import { RecruiterBookingView } from '~/app/recruiter/calendar/_modules/recruiter-booking-view';
import { calIntegration } from '~/services/cal-integration';

export default function TestCalIntegrationPage() {
  const [testUsername, setTestUsername] = useState('');
  const [testEventSlug, setTestEventSlug] = useState('30min');
  const [calLink, setCalLink] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleUsernameChange = (username: string) => {
    setTestUsername(username);
    const valid = calIntegration.validateUsername(username);
    setIsValid(valid);
    
    if (valid && testEventSlug) {
      setCalLink(`${username}/${testEventSlug}`);
    } else {
      setCalLink('');
    }
  };

  const handleEventSlugChange = (slug: string) => {
    setTestEventSlug(slug);
    
    if (isValid && slug) {
      setCalLink(`${testUsername}/${slug}`);
    } else {
      setCalLink('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-black dark:text-white mb-2">
            Cal.com Integration Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the Cal.com integration with different usernames and event types
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Configuration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Cal.com Username
              </label>
              <input
                type="text"
                value={testUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g., john-doe"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
                  testUsername && !isValid
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 dark:border-gray-700 focus:border-apple-blue focus:ring-apple-blue/20'
                }`}
              />
              {testUsername && !isValid && (
                <p className="text-red-500 text-xs mt-1">
                  Username must be 3-39 characters, lowercase letters, numbers, and hyphens only
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Event Type Slug
              </label>
              <input
                type="text"
                value={testEventSlug}
                onChange={(e) => handleEventSlugChange(e.target.value)}
                placeholder="e.g., 30min, interview, consultation"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20"
              />
            </div>
          </div>

          {calLink && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Generated Cal Link:</strong> {calLink}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Full URL: https://cal.com/{calLink}
              </p>
            </div>
          )}
        </div>

        {/* Cal.com Embed Test */}
        {calLink && (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Cal.com Embed Preview
            </h2>
            
            <RecruiterBookingView 
              calLink={calLink}
              candidateName="Test Candidate"
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
            Testing Instructions
          </h3>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>1. Enter a valid Cal.com username (must be an existing Cal.com user)</li>
            <li>2. Enter an event type slug that exists for that user</li>
            <li>3. The Cal.com booking interface should load below</li>
            <li>4. Test the booking flow (you can cancel before confirming)</li>
            <li>5. Verify that the embed respects your theme preferences</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This is a test page. In production, the Cal.com usernames and event types 
              would be stored in your database and associated with your users.
            </p>
          </div>
        </div>

        {/* API Test Section */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
            API Integration Test
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Test the Cal.com API integration (requires valid API key in environment)
          </p>
          
          <div className="space-y-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/cal/event-types?username=test');
                  const data = await response.json();
                  console.log('Event types response:', data);
                  alert('Check console for API response');
                } catch (error) {
                  console.error('API test error:', error);
                  alert('API test failed - check console');
                }
              }}
              className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-150 mr-2"
            >
              Test Event Types API
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/cal/bookings');
                  const data = await response.json();
                  console.log('Bookings response:', data);
                  alert('Check console for API response');
                } catch (error) {
                  console.error('API test error:', error);
                  alert('API test failed - check console');
                }
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:bg-gray-200 hover:dark:bg-gray-700 transition-colors duration-150"
            >
              Test Bookings API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}