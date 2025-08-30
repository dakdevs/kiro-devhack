"use client"

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-apple-red/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold transition-all duration-150 ease-out hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Specific error fallbacks for different components
export function InterviewErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-apple-red/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-black dark:text-white mb-2">
          Interview system error
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unable to load interview information. Please refresh the page or try again later.
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center justify-center px-3 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function JobPostingErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-apple-red/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-black dark:text-white mb-2">
          Job posting error
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unable to load job posting information. Please check your connection and try again.
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center justify-center px-3 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function AvailabilityErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-apple-red/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-apple-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-black dark:text-white mb-2">
          Availability system error
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unable to load availability information. Your schedule data is safe.
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center justify-center px-3 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
}