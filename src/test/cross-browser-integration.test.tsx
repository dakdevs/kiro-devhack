/**
 * Cross-Browser and Mobile Integration Tests
 * Tests voice input functionality across different browser environments
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SimpleChat from '../components/SimpleChat';

// Mock the speech recognition hook
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
const mockResetTranscript = vi.fn();
const mockRetryListening = vi.fn();
const mockRequestPermission = vi.fn();

let mockSpeechState = {
  isListening: false,
  transcript: '',
  interimTranscript: '',
  error: null,
  isSupported: true,
  canRetry: false,
  permissionState: 'unknown' as const,
  isProcessing: false,
  hasCompletedTranscription: false,
  startListening: mockStartListening,
  stopListening: mockStopListening,
  resetTranscript: mockResetTranscript,
  retryListening: mockRetryListening,
  requestPermission: mockRequestPermission,
};

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => mockSpeechState,
}));

// Mock browser compatibility - will be overridden per test
let mockBrowserInfo = {
  name: 'Chrome',
  version: '120',
  isSupported: true,
  supportLevel: 'full' as const,
  limitations: [],
  guidance: '',
  recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
};

vi.mock('../utils/browserCompatibility', () => ({
  getBrowserCompatibility: () => mockBrowserInfo,
  logCompatibilityInfo: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// Browser environment simulation helpers
const simulateBrowser = (browserName: string, version: string, userAgent: string, features: {
  speechRecognition?: boolean;
  webkitSpeechRecognition?: boolean;
  mediaDevices?: boolean;
  secureContext?: boolean;
} = {}) => {
  // Mock user agent
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  });

  // Mock APIs based on browser
  if (features.speechRecognition !== undefined) {
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      configurable: true,
      value: features.speechRecognition ? vi.fn() : undefined,
    });
  }

  if (features.webkitSpeechRecognition !== undefined) {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      writable: true,
      configurable: true,
      value: features.webkitSpeechRecognition ? vi.fn() : undefined,
    });
  }

  if (features.mediaDevices !== undefined) {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: features.mediaDevices ? { getUserMedia: vi.fn() } : undefined,
    });
  }

  if (features.secureContext !== undefined) {
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      configurable: true,
      value: features.secureContext,
    });
  }

  // Update mock browser info
  mockBrowserInfo = {
    name: browserName,
    version,
    isSupported: features.speechRecognition || features.webkitSpeechRecognition || false,
    supportLevel: (features.speechRecognition || features.webkitSpeechRecognition) ? 'full' : 'none',
    limitations: [],
    guidance: '',
    recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
  };
};

describe('Cross-Browser Integration Tests', () => {
  let originalUserAgent: string;
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Store original values
    originalUserAgent = navigator.userAgent;
    originalWindow = {
      SpeechRecognition: window.SpeechRecognition,
      webkitSpeechRecognition: (window as any).webkitSpeechRecognition,
      isSecureContext: window.isSecureContext,
    };
    originalNavigator = {
      mediaDevices: navigator.mediaDevices,
    };

    // Reset mock state
    mockSpeechState = {
      isListening: false,
      transcript: '',
      interimTranscript: '',
      error: null,
      isSupported: true,
      canRetry: false,
      permissionState: 'unknown' as const,
      isProcessing: false,
      hasCompletedTranscription: false,
      startListening: mockStartListening,
      stopListening: mockStopListening,
      resetTranscript: mockResetTranscript,
      retryListening: mockRetryListening,
      requestPermission: mockRequestPermission,
    };

    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'AI response' }),
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: originalUserAgent,
    });
    
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      configurable: true,
      value: originalWindow.SpeechRecognition,
    });
    
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      writable: true,
      configurable: true,
      value: originalWindow.webkitSpeechRecognition,
    });
    
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      configurable: true,
      value: originalWindow.isSecureContext,
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: originalNavigator.mediaDevices,
    });
  });

  describe('Chrome Browser Support', () => {
    beforeEach(() => {
      simulateBrowser(
        'Chrome',
        '120',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        {
          webkitSpeechRecognition: true,
          mediaDevices: true,
          secureContext: true,
        }
      );
    });

    it('should provide full voice input functionality in Chrome', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // Voice button should be enabled
      expect(voiceButton).not.toBeDisabled();
      
      // Should be able to start recording
      fireEvent.click(voiceButton);
      expect(mockStartListening).toHaveBeenCalled();
      
      // Simulate successful transcription
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      mockSpeechState.transcript = 'test message';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });
      
      // Should show success state
      expect(voiceButton).toHaveClass('bg-green-500');
    });

    it('should handle Chrome-specific speech recognition events', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Start recording
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      // Simulate interim results (Chrome feature)
      mockSpeechState.interimTranscript = 'hello';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(screen.getByText('hello')).toBeInTheDocument();
      });
      
      // Update interim results
      mockSpeechState.interimTranscript = 'hello world';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(screen.getByText('hello world')).toBeInTheDocument();
      });
      
      // Final result
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'hello world';
      mockSpeechState.isListening = false;
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });
    });
  });

  describe('Edge Browser Support', () => {
    beforeEach(() => {
      simulateBrowser(
        'Edge',
        '120',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        {
          webkitSpeechRecognition: true,
          mediaDevices: true,
          secureContext: true,
        }
      );
    });

    it('should provide full voice input functionality in Edge', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // Voice button should be enabled
      expect(voiceButton).not.toBeDisabled();
      
      // Should work similarly to Chrome
      fireEvent.click(voiceButton);
      expect(mockStartListening).toHaveBeenCalled();
      
      mockSpeechState.transcript = 'edge test';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('edge test');
      });
    });
  });

  describe('Safari Browser Support', () => {
    beforeEach(() => {
      simulateBrowser(
        'Safari',
        '17',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        {
          speechRecognition: true, // Safari uses standard API
          mediaDevices: true,
          secureContext: true,
        }
      );
    });

    it('should provide voice input functionality in Safari', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // Voice button should be enabled
      expect(voiceButton).not.toBeDisabled();
      
      // Should work with standard SpeechRecognition API
      fireEvent.click(voiceButton);
      expect(mockStartListening).toHaveBeenCalled();
      
      mockSpeechState.transcript = 'safari test';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('safari test');
      });
    });

    it('should handle Safari-specific limitations gracefully', async () => {
      // Simulate Safari with limited support
      mockBrowserInfo = {
        ...mockBrowserInfo,
        supportLevel: 'partial',
        limitations: ['Limited continuous recognition', 'Requires user interaction'],
        guidance: 'Safari desktop has limited speech recognition support. For best experience, use Safari on iOS or switch to Chrome/Edge.',
      };

      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Should still be functional but with limitations
      expect(voiceButton).not.toBeDisabled();
      
      // Should show appropriate tooltip/guidance
      expect(voiceButton).toHaveAttribute('title', expect.stringContaining('Click to start'));
    });
  });

  describe('Firefox Browser Support', () => {
    beforeEach(() => {
      simulateBrowser(
        'Firefox',
        '120',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        {
          speechRecognition: false,
          webkitSpeechRecognition: false,
          mediaDevices: true,
          secureContext: true,
        }
      );
      
      mockSpeechState.isSupported = false;
      mockBrowserInfo = {
        name: 'Firefox',
        version: '120',
        isSupported: false,
        supportLevel: 'none',
        limitations: ['No Web Speech API support'],
        guidance: 'Voice input is not supported in Firefox. Please use Chrome, Edge, or Safari for voice input functionality.',
        recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
      };
    });

    it('should gracefully degrade in Firefox', () => {
      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Voice button should be disabled
      expect(voiceButton).toBeDisabled();
      
      // Should show appropriate tooltip
      expect(voiceButton).toHaveAttribute('title', expect.stringContaining('not supported'));
    });

    it('should still allow typing in Firefox', async () => {
      render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const form = input.closest('form')!;
      
      // Typing should work normally
      fireEvent.change(input, { target: { value: 'typed message' } });
      expect(input).toHaveValue('typed message');
      
      // Should be able to send message
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          body: expect.stringContaining('typed message'),
        }));
      });
    });
  });

  describe('Mobile Browser Support', () => {
    describe('Chrome Mobile', () => {
      beforeEach(() => {
        simulateBrowser(
          'Chrome',
          '120',
          'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          {
            webkitSpeechRecognition: true,
            mediaDevices: true,
            secureContext: true,
          }
        );
      });

      it('should provide full functionality on Chrome Mobile', async () => {
        const { rerender } = render(<SimpleChat />);
        
        const voiceButton = screen.getByRole('button', { name: /voice input button/i });
        const input = screen.getByPlaceholderText('Type a message to the AI...');
        
        // Should work on mobile
        expect(voiceButton).not.toBeDisabled();
        
        fireEvent.click(voiceButton);
        expect(mockStartListening).toHaveBeenCalled();
        
        mockSpeechState.transcript = 'mobile test';
        mockSpeechState.hasCompletedTranscription = true;
        rerender(<SimpleChat />);
        
        await waitFor(() => {
          expect(input).toHaveValue('mobile test');
        });
      });

      it('should handle mobile-specific touch interactions', () => {
        render(<SimpleChat />);
        
        const voiceButton = screen.getByRole('button', { name: /voice input button/i });
        
        // Should handle touch events
        fireEvent.touchStart(voiceButton);
        fireEvent.touchEnd(voiceButton);
        fireEvent.click(voiceButton);
        
        expect(mockStartListening).toHaveBeenCalled();
      });
    });

    describe('Safari Mobile (iOS)', () => {
      beforeEach(() => {
        simulateBrowser(
          'Safari',
          '17',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          {
            speechRecognition: true,
            mediaDevices: true,
            secureContext: true,
          }
        );
      });

      it('should provide full functionality on Safari iOS', async () => {
        const { rerender } = render(<SimpleChat />);
        
        const voiceButton = screen.getByRole('button', { name: /voice input button/i });
        const input = screen.getByPlaceholderText('Type a message to the AI...');
        
        // Should work on iOS Safari
        expect(voiceButton).not.toBeDisabled();
        
        fireEvent.click(voiceButton);
        expect(mockStartListening).toHaveBeenCalled();
        
        mockSpeechState.transcript = 'iOS test';
        mockSpeechState.hasCompletedTranscription = true;
        rerender(<SimpleChat />);
        
        await waitFor(() => {
          expect(input).toHaveValue('iOS test');
        });
      });

      it('should handle iOS-specific behavior', async () => {
        const { rerender } = render(<SimpleChat />);
        
        const voiceButton = screen.getByRole('button', { name: /voice input button/i });
        
        // iOS may require user interaction for each recording session
        fireEvent.click(voiceButton);
        mockSpeechState.isListening = true;
        rerender(<SimpleChat />);
        
        // Stop recording
        fireEvent.click(voiceButton);
        mockSpeechState.isListening = false;
        mockSpeechState.hasCompletedTranscription = true;
        rerender(<SimpleChat />);
        
        // Should be able to start new session
        mockSpeechState.hasCompletedTranscription = false;
        fireEvent.click(voiceButton);
        expect(mockStartListening).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Insecure Context Handling', () => {
    beforeEach(() => {
      // Mock insecure context (HTTP)
      const originalLocation = global.location;
      delete (global as any).location;
      global.location = {
        protocol: 'http:',
        hostname: 'example.com'
      } as any;

      simulateBrowser(
        'Chrome',
        '120',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        {
          webkitSpeechRecognition: true,
          mediaDevices: true,
          secureContext: false,
        }
      );

      mockSpeechState.isSupported = false;
      mockBrowserInfo = {
        name: 'Chrome',
        version: '120',
        isSupported: false,
        supportLevel: 'none',
        limitations: ['Requires HTTPS'],
        guidance: 'Voice input requires a secure context (HTTPS). Please access this site over HTTPS to use voice input.',
        recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
      };
    });

    it('should disable voice input in insecure context', () => {
      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Should be disabled
      expect(voiceButton).toBeDisabled();
      
      // Should show appropriate guidance (browser not supported message)
      expect(voiceButton).toHaveAttribute('title', expect.stringContaining('not supported'));
    });

    it('should still allow typing in insecure context', async () => {
      render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const form = input.closest('form')!;
      
      // Typing should work
      fireEvent.change(input, { target: { value: 'typed in insecure context' } });
      expect(input).toHaveValue('typed in insecure context');
      
      // Should be able to send
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Design Testing', () => {
    it('should maintain proper layout on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });

      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // Elements should be present and properly positioned
      expect(voiceButton).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      
      // Voice button should have appropriate mobile styling
      expect(voiceButton).toHaveClass('!p-2');
    });

    it('should maintain proper layout on large screens', () => {
      // Mock large screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // Elements should be present
      expect(voiceButton).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('should handle rapid state changes without performance issues', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const startTime = performance.now();
      
      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        mockSpeechState.isListening = i % 2 === 0;
        mockSpeechState.interimTranscript = i % 2 === 0 ? `interim ${i}` : '';
        mockSpeechState.transcript = i % 2 === 1 ? `final ${i}` : '';
        rerender(<SimpleChat />);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle long transcripts without performance degradation', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const longTranscript = 'word '.repeat(1000); // 1000 words
      
      const startTime = performance.now();
      
      mockSpeechState.transcript = longTranscript;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      await waitFor(() => {
        expect(input).toHaveValue(longTranscript);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle long text efficiently
      expect(duration).toBeLessThan(50);
    });
  });
});