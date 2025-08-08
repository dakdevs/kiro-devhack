/**
 * Voice Debug Info Component
 * Shows browser compatibility and voice input status for debugging
 */

"use client";

import React, { useState, useEffect } from 'react';
import { getBrowserCompatibility, checkBrowserFeatures, isVoiceInputSupported } from '../utils/browserCompatibility';

const VoiceDebugInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setBrowserInfo(getBrowserCompatibility());
      setFeatures(checkBrowserFeatures());
    }
  }, []);

  if (!browserInfo || !features) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-blue-600 transition-colors"
      >
        🎤 Debug
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Voice Input Debug</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${isVoiceInputSupported() ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm font-medium">
                  Voice Input: {isVoiceInputSupported() ? 'Supported' : 'Not Supported'}
                </span>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Browser: {browserInfo.name} {browserInfo.version}</div>
                <div>Support Level: {browserInfo.supportLevel}</div>
                <div>Protocol: {window.location.protocol}</div>
                <div>Hostname: {window.location.hostname}</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Features:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Speech Recognition:</span>
                  <span className={features.speechRecognition ? 'text-green-600' : 'text-red-600'}>
                    {features.speechRecognition ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Media Devices:</span>
                  <span className={features.mediaDevices ? 'text-green-600' : 'text-red-600'}>
                    {features.mediaDevices ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Permissions API:</span>
                  <span className={features.permissions ? 'text-green-600' : 'text-red-600'}>
                    {features.permissions ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Secure Context:</span>
                  <span className={features.secureContext ? 'text-green-600' : 'text-red-600'}>
                    {features.secureContext ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
            
            {browserInfo.guidance && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Guidance:</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {browserInfo.guidance}
                </div>
              </div>
            )}
            
            {browserInfo.limitations && browserInfo.limitations.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Limitations:</div>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {browserInfo.limitations.map((limitation: string, index: number) => (
                    <li key={index}>• {limitation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceDebugInfo;