"use client";

import React, { FC } from 'react';

// --- TYPES & INTERFACES ---
export type VoiceInputState = 'idle' | 'listening' | 'processing' | 'error' | 'completed';

export interface VoiceInputButtonProps {
  state: VoiceInputState;
  onClick: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  className?: string;
  error?: string;
  canRetry?: boolean;
  permissionState?: 'unknown' | 'granted' | 'denied' | 'prompt';
  isSupported?: boolean;
  browserInfo?: {
    name: string;
    isSupported: boolean;
    recommendedBrowsers: string[];
  };
}

// --- SVG ICONS ---
const MicrophoneIcon: FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const MicrophoneOffIcon: FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="2" y1="2" x2="22" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const LoadingSpinner: FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={`animate-spin ${className}`} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const CheckIcon: FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

// --- MAIN COMPONENT ---
const VoiceInputButton: FC<VoiceInputButtonProps> = ({
  state,
  onClick,
  onRetry,
  disabled = false,
  className = '',
  error,
  canRetry = false,
  permissionState = 'unknown',
  isSupported = true,
  browserInfo
}) => {
  // Determine button styling based on state
  const getButtonClasses = () => {
    const baseClasses = 'relative rounded-full p-3 flex-shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (disabled) {
      return `${baseClasses} bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500`;
    }

    switch (state) {
      case 'listening':
        return `${baseClasses} bg-red-500 hover:bg-red-600 text-white animate-pulse focus:ring-red-500`;
      case 'processing':
        return `${baseClasses} bg-blue-500 text-white focus:ring-blue-500`;
      case 'completed':
        return `${baseClasses} bg-green-500 text-white focus:ring-green-500 transition-all duration-300`;
      case 'error':
        return `${baseClasses} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`;
      case 'idle':
      default:
        return `${baseClasses} bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 focus:ring-gray-500`;
    }
  };

  // Determine tooltip text based on state
  const getTooltipText = () => {
    if (!isSupported || disabled) {
      if (browserInfo && !browserInfo.isSupported) {
        return `Voice input not supported in ${browserInfo.name}. Try ${browserInfo.recommendedBrowsers.join(', ')}`;
      }
      return 'Voice input not supported in this browser';
    }
    
    switch (state) {
      case 'listening':
        return 'Recording... Click to stop';
      case 'processing':
        return 'Converting speech to text...';
      case 'completed':
        return 'Speech successfully transcribed!';
      case 'error':
        if (permissionState === 'denied') {
          return 'Microphone access denied. Click to request permission';
        }
        return canRetry ? 'Error occurred. Click to retry' : 'Error occurred';
      case 'idle':
      default:
        if (permissionState === 'denied') {
          return 'Microphone permission required. Click to enable';
        } else if (permissionState === 'prompt') {
          return 'Click to start voice input (permission will be requested)';
        } else if (permissionState === 'granted') {
          return 'Click to start voice input';
        }
        return 'Click to start voice input';
    }
  };

  // Determine ARIA label based on state
  const getAriaLabel = () => {
    if (!isSupported || disabled) {
      if (browserInfo && !browserInfo.isSupported) {
        return `Voice input button, disabled, not supported in ${browserInfo.name}, try ${browserInfo.recommendedBrowsers.join(', ')}`;
      }
      return 'Voice input button, disabled, not supported in this browser';
    }
    
    switch (state) {
      case 'listening':
        return 'Voice input button, currently recording, click to stop recording';
      case 'processing':
        return 'Voice input button, processing speech, please wait';
      case 'completed':
        return 'Voice input button, speech successfully transcribed, click to start new recording';
      case 'error':
        const errorText = error || 'unknown error';
        if (permissionState === 'denied') {
          return `Voice input button, microphone access denied, ${errorText}, click to request permission`;
        }
        return canRetry 
          ? `Voice input button, error occurred, ${errorText}, click to retry`
          : `Voice input button, error occurred, ${errorText}`;
      case 'idle':
      default:
        if (permissionState === 'denied') {
          return 'Voice input button, microphone permission required, click to enable microphone access';
        } else if (permissionState === 'prompt') {
          return 'Voice input button, click to start voice input, microphone permission will be requested';
        } else if (permissionState === 'granted') {
          return 'Voice input button, microphone access granted, click to start recording';
        }
        return 'Voice input button, click to start voice input';
    }
  };

  // Render appropriate icon based on state
  const renderIcon = () => {
    const iconClasses = 'h-6 w-6';
    
    switch (state) {
      case 'processing':
        return <LoadingSpinner className={iconClasses} />;
      case 'completed':
        return <CheckIcon className={iconClasses} />;
      case 'error':
        return <MicrophoneOffIcon className={iconClasses} />;
      case 'listening':
      case 'idle':
      default:
        return <MicrophoneIcon className={iconClasses} />;
    }
  };

  // Handle button click - use retry function if available and in error state
  const handleClick = () => {
    if (state === 'error' && canRetry && onRetry) {
      onRetry();
    } else {
      onClick();
    }
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`${getButtonClasses()} ${className}`}
        aria-label={getAriaLabel()}
        title={getTooltipText()}
      >
        {renderIcon()}
        
        {/* Pulsing ring animation for listening state */}
        {state === 'listening' && (
          <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </button>
      
      {/* Error tooltip with enhanced messaging */}
      {state === 'error' && error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg max-w-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="font-medium mb-1">Error</div>
          <div className="text-xs">{error}</div>
          {canRetry && (
            <div className="text-xs mt-1 opacity-75">Click to retry</div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-red-600" />
        </div>
      )}
      
      {/* Permission guidance tooltip */}
      {permissionState === 'denied' && state !== 'error' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg max-w-sm text-left opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="font-medium mb-1">🎤 Microphone Permission Required</div>
          <div className="text-xs mb-2">Voice input needs microphone access to work</div>
          <div className="text-xs space-y-1">
            <div>To enable:</div>
            <div>1. Click this button</div>
            <div>2. Allow microphone access when prompted</div>
            <div>3. Start speaking!</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-yellow-600" />
        </div>
      )}
      
      {/* Permission prompt guidance tooltip */}
      {permissionState === 'prompt' && state === 'idle' && isSupported && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg max-w-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="font-medium mb-1">🎤 Ready for Voice Input</div>
          <div className="text-xs">Click to start and allow microphone access when prompted</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600" />
        </div>
      )}
      
      {/* Browser compatibility tooltip for unsupported browsers */}
      {(!isSupported || disabled) && browserInfo && !browserInfo.isSupported && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg max-w-sm text-left opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="font-medium mb-2">🚫 Voice Input Not Supported</div>
          <div className="text-xs mb-2">
            Voice input is not available in {browserInfo.name}.
          </div>
          <div className="text-xs mb-2">
            <div className="font-medium mb-1">Supported browsers:</div>
            <div className="space-y-1">
              {browserInfo.recommendedBrowsers.map((browser, index) => (
                <div key={index}>• {browser}</div>
              ))}
            </div>
          </div>
          {browserInfo.limitations && browserInfo.limitations.length > 0 && (
            <div className="text-xs opacity-75">
              <div className="font-medium mb-1">Limitations:</div>
              {browserInfo.limitations.map((limitation, index) => (
                <div key={index}>• {limitation}</div>
              ))}
            </div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;