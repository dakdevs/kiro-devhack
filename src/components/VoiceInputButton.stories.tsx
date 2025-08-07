import React from 'react';
import VoiceInputButton, { VoiceInputState } from './VoiceInputButton';

// Demo component to showcase all states
const VoiceInputButtonDemo = () => {
  const states: { state: VoiceInputState; label: string; error?: string }[] = [
    { state: 'idle', label: 'Idle State' },
    { state: 'listening', label: 'Listening State' },
    { state: 'processing', label: 'Processing State' },
    { state: 'error', label: 'Error State', error: 'Microphone access denied' },
  ];

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
        Voice Input Button States
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {states.map(({ state, label, error }) => (
          <div key={state} className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {label}
            </h3>
            <div className="flex justify-center">
              <VoiceInputButton
                state={state}
                onClick={() => console.log(`Clicked ${state} button`)}
                error={error}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Disabled State
        </h2>
        <div className="flex justify-center">
          <VoiceInputButton
            state="idle"
            onClick={() => console.log('This should not fire')}
            disabled={true}
          />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Integration Example
        </h2>
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
            />
            <VoiceInputButton
              state="idle"
              onClick={() => console.log('Voice input clicked')}
            />
            <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInputButtonDemo;