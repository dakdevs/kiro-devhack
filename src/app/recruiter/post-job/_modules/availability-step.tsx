"use client";

import { AvailabilitySlot } from './job-posting-workflow';

interface AvailabilityStepProps {
  availability: AvailabilitySlot[];
  onUpdate: (availability: AvailabilitySlot[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function AvailabilityStep({ availability, onUpdate, onContinue, onBack }: AvailabilityStepProps) {
  const updateAvailability = (index: number, updates: Partial<AvailabilitySlot>) => {
    const newAvailability = [...availability];
    newAvailability[index] = { ...newAvailability[index], ...updates };
    onUpdate(newAvailability);
  };

  const toggleDay = (index: number) => {
    updateAvailability(index, { enabled: !availability[index].enabled });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        options.push({ value: time, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const hasAvailability = availability.some(slot => slot.enabled);

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Interview Availability
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select the days and times when you're available to conduct interviews for this position.
        </p>
      </div>

      <div className="space-y-4">
        {availability.map((slot, index) => (
          <div
            key={slot.day}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              slot.enabled
                ? 'border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={() => toggleDay(index)}
                    className="w-4 h-4 text-apple-blue bg-white border-gray-300 rounded focus:ring-apple-blue focus:ring-2"
                  />
                  <span className={`text-lg font-medium ${
                    slot.enabled ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {slot.day}
                  </span>
                </label>
              </div>

              {slot.enabled && (
                <div className="flex items-center gap-2">
                  <select
                    value={slot.startTime}
                    onChange={(e) => updateAvailability(index, { startTime: e.target.value })}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white text-sm focus:border-apple-blue focus:outline-none"
                  >
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  <span className="text-gray-400 dark:text-gray-500">to</span>
                  
                  <select
                    value={slot.endTime}
                    onChange={(e) => updateAvailability(index, { endTime: e.target.value })}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white text-sm focus:border-apple-blue focus:outline-none"
                  >
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="text-sm font-medium text-black dark:text-white mb-3">
          Quick Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const weekdayAvailability = availability.map((slot, index) => ({
                ...slot,
                enabled: index >= 1 && index <= 5, // Monday to Friday
                startTime: '09:00',
                endTime: '17:00'
              }));
              onUpdate(weekdayAvailability);
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            Weekdays 9-5
          </button>
          <button
            onClick={() => {
              const allDayAvailability = availability.map(slot => ({
                ...slot,
                enabled: true,
                startTime: '09:00',
                endTime: '17:00'
              }));
              onUpdate(allDayAvailability);
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            All Days 9-5
          </button>
          <button
            onClick={() => {
              const clearAvailability = availability.map(slot => ({
                ...slot,
                enabled: false
              }));
              onUpdate(clearAvailability);
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Summary */}
      {hasAvailability && (
        <div className="mt-6 p-4 bg-apple-blue/10 border border-apple-blue/20 rounded-lg">
          <h4 className="text-sm font-medium text-apple-blue mb-2">
            Availability Summary
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {availability
              .filter(slot => slot.enabled)
              .map(slot => (
                <div key={slot.day} className="flex justify-between">
                  <span>{slot.day}:</span>
                  <span>
                    {new Date(`2000-01-01T${slot.startTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(`2000-01-01T${slot.endTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!hasAvailability && (
        <div className="mt-6 p-4 bg-apple-orange/10 border border-apple-orange/20 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-apple-orange" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-apple-orange font-medium">
              Please select at least one day for interview availability
            </span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <button
          onClick={onContinue}
          disabled={!hasAvailability}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-apple-blue disabled:hover:translate-y-0"
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}