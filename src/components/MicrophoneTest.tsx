/**
 * Microphone Test Component
 * Simple test to check microphone access and speech recognition
 */

"use client";

import React, { useState } from 'react';

const MicrophoneTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testMicrophoneAccess = async () => {
    setIsLoading(true);
    addResult('🎤 Testing microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addResult('✅ Microphone access granted');
      
      // Test audio levels
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let hasAudio = false;
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average > 10) {
          hasAudio = true;
          addResult(`🔊 Audio detected (level: ${average.toFixed(1)})`);
        }
      };
      
      // Check for audio for 3 seconds
      const interval = setInterval(checkAudio, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        if (!hasAudio) {
          addResult('⚠️ No audio detected - speak into your microphone');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        addResult('🛑 Microphone test completed');
      }, 3000);
      
    } catch (error: any) {
      addResult(`❌ Microphone access failed: ${error.name} - ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpeechRecognition = async () => {
    setIsLoading(true);
    addResult('🗣️ Testing speech recognition...');

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        addResult('❌ Speech recognition not supported in this browser');
        setIsLoading(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        addResult('✅ Speech recognition started - say something!');
      };

      recognition.onresult = (event: any) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;
        
        addResult(`🎯 ${isFinal ? 'Final' : 'Interim'}: "${transcript}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
      };

      recognition.onerror = (event: any) => {
        addResult(`❌ Speech recognition error: ${event.error}`);
        setIsLoading(false);
      };

      recognition.onend = () => {
        addResult('🛑 Speech recognition ended');
        setIsLoading(false);
      };

      recognition.start();

      // Auto-stop after 10 seconds
      setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {
          // Already stopped
        }
      }, 10000);

    } catch (error: any) {
      addResult(`❌ Speech recognition test failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const testBrowserInfo = () => {
    addResult('🌐 Browser Information:');
    addResult(`  User Agent: ${navigator.userAgent.substring(0, 100)}...`);
    addResult(`  Protocol: ${window.location.protocol}`);
    addResult(`  Hostname: ${window.location.hostname}`);
    addResult(`  Secure Context: ${window.isSecureContext}`);
    addResult(`  Speech Recognition: ${!!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)}`);
    addResult(`  Media Devices: ${!!navigator.mediaDevices}`);
    addResult(`  Permissions API: ${!!navigator.permissions}`);
    
    // Check if Brave
    const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave;
    addResult(`  Brave Browser: ${!!isBrave}`);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-28 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-purple-600 transition-colors"
        >
          🔬 Mic Test
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-28 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-96 max-h-80 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Microphone Test</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={testBrowserInfo}
              className="w-full bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              📋 Browser Info
            </button>
            
            <button
              onClick={testMicrophoneAccess}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {isLoading ? '🔄 Testing...' : '🎤 Test Microphone'}
            </button>
            
            <button
              onClick={testSpeechRecognition}
              disabled={isLoading}
              className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-600 disabled:bg-green-300 transition-colors"
            >
              {isLoading ? '🔄 Testing...' : '🗣️ Test Speech Recognition'}
            </button>
            
            <button
              onClick={clearResults}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
            >
              🗑️ Clear Results
            </button>
          </div>
          
          {testResults.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Test Results:</div>
              <div className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="mb-1 font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicrophoneTest;