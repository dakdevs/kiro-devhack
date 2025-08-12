import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { SpeechRecognitionService, SpeechConfig, SpeechRecognitionResult, SpeechRecognitionError } from '../SpeechRecognitionService';

// Mock the Web Speech API
class MockSpeechRecognition implements Partial<SpeechRecognition> {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;

  onstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  // Helper methods for testing
  simulateStart() {
    if (this.onstart) {
      this.onstart.call(this as any, new Event('start'));
    }
  }

  simulateEnd() {
    if (this.onend) {
      this.onend.call(this as any, new Event('end'));
    }
  }

  simulateResult(transcript: string, isFinal: boolean, confidence = 0.9) {
    if (this.onresult) {
      const mockResult = {
        resultIndex: 0,
        results: [{
          0: { transcript, confidence },
          isFinal,
          length: 1,
          item: () => ({ transcript, confidence })
        }] as any
      } as SpeechRecognitionEvent;
      
      this.onresult.call(this as any, mockResult);
    }
  }

  simulateError(error: string, message = 'Test error') {
    if (this.onerror) {
      const errorEvent = {
        error,
        message
      } as SpeechRecognitionErrorEvent;
      
      this.onerror.call(this as any, errorEvent);
    }
  }

  simulateNoMatch() {
    if (this.onnomatch) {
      this.onnomatch.call(this as any, {} as SpeechRecognitionEvent);
    }
  }
}

describe('SpeechRecognitionService', () => {
  let mockRecognition: MockSpeechRecognition;
  let service: SpeechRecognitionService;
  let originalSpeechRecognition: any;
  let originalWebkitSpeechRecognition: any;

  beforeEach(() => {
    // Store original values
    originalSpeechRecognition = (global as any).SpeechRecognition;
    originalWebkitSpeechRecognition = (global as any).webkitSpeechRecognition;

    // Create mock and set up global
    mockRecognition = new MockSpeechRecognition();
    (global as any).SpeechRecognition = vi.fn(() => mockRecognition);
    (global as any).webkitSpeechRecognition = vi.fn(() => mockRecognition);
    
    // Mock window object
    Object.defineProperty(global, 'window', {
      value: {
        SpeechRecognition: (global as any).SpeechRecognition,
        webkitSpeechRecognition: (global as any).webkitSpeechRecognition
      },
      writable: true
    });
  });

  afterEach(() => {
    // Restore original values
    (global as any).SpeechRecognition = originalSpeechRecognition;
    (global as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
    
    if (service) {
      service.cleanup();
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      service = new SpeechRecognitionService();
      
      expect(mockRecognition.continuous).toBe(true);
      expect(mockRecognition.interimResults).toBe(true);
      expect(mockRecognition.lang).toBe('en-US');
      expect(mockRecognition.maxAlternatives).toBe(1);
    });

    it('should initialize with custom configuration', () => {
      const config: SpeechConfig = {
        continuous: false,
        interimResults: false,
        language: 'es-ES',
        maxAlternatives: 3
      };

      service = new SpeechRecognitionService(config);
      
      expect(mockRecognition.continuous).toBe(false);
      expect(mockRecognition.interimResults).toBe(false);
      expect(mockRecognition.lang).toBe('es-ES');
      expect(mockRecognition.maxAlternatives).toBe(3);
    });

    it('should handle unsupported browsers gracefully', () => {
      // Remove speech recognition support
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      service = new SpeechRecognitionService();
      
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('Speech Recognition Control', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should start speech recognition', async () => {
      await service.start();
      
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should not start if already listening', async () => {
      // First start
      await service.start();
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
      
      // Simulate the recognition starting
      mockRecognition.simulateStart();
      
      // Try to start again while listening
      await service.start();
      
      // Should still only be called once
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
    });

    it('should stop speech recognition', () => {
      // Start first
      mockRecognition.simulateStart();
      
      service.stop();
      
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should abort speech recognition', () => {
      mockRecognition.simulateStart();
      
      service.abort();
      
      expect(mockRecognition.abort).toHaveBeenCalled();
    });

    it('should throw error when starting unsupported recognition', async () => {
      service.cleanup();
      
      // Remove support
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });
      
      service = new SpeechRecognitionService();
      
      await expect(service.start()).rejects.toThrow('Speech recognition is not supported in this browser');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should handle speech recognition results', () => {
      const resultCallback = vi.fn();
      service.onResult(resultCallback);
      
      mockRecognition.simulateResult('hello world', true, 0.95);
      
      expect(resultCallback).toHaveBeenCalledWith({
        transcript: 'hello world',
        confidence: 0.95,
        isFinal: true,
        timestamp: expect.any(Number)
      });
    });

    it('should handle interim results', () => {
      const resultCallback = vi.fn();
      service.onResult(resultCallback);
      
      mockRecognition.simulateResult('hello', false, 0.8);
      
      expect(resultCallback).toHaveBeenCalledWith({
        transcript: 'hello',
        confidence: 0.8,
        isFinal: false,
        timestamp: expect.any(Number)
      });
    });

    it('should handle speech recognition errors', () => {
      const errorCallback = vi.fn();
      service.onError(errorCallback);
      
      mockRecognition.simulateError('not-allowed');
      
      expect(errorCallback).toHaveBeenCalledWith({
        error: 'not-allowed',
        message: 'Microphone access denied. Please allow microphone access and try again.',
        canRetry: true,
        userGuidance: 'Click the microphone icon in your browser\'s address bar and select "Allow" to enable voice input.'
      });
    });

    it('should handle no match events', () => {
      const errorCallback = vi.fn();
      service.onError(errorCallback);
      
      mockRecognition.simulateNoMatch();
      
      expect(errorCallback).toHaveBeenCalledWith({
        error: 'no-speech',
        message: 'No speech was detected. Please try speaking again.',
        canRetry: true,
        userGuidance: 'Speak clearly and ensure your microphone is working properly.'
      });
    });

    it('should handle state changes', () => {
      const stateCallback = vi.fn();
      service.onStateChange(stateCallback);
      
      mockRecognition.simulateStart();
      expect(stateCallback).toHaveBeenCalledWith(true);
      
      mockRecognition.simulateEnd();
      expect(stateCallback).toHaveBeenCalledWith(false);
    });

    it('should handle multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      service.onResult(callback1);
      service.onResult(callback2);
      
      mockRecognition.simulateResult('test', true);
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      service.onResult(errorCallback);
      
      mockRecognition.simulateResult('test', true);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in speech recognition result callback:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Callback Management', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should unsubscribe result callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = service.onResult(callback);
      
      unsubscribe();
      mockRecognition.simulateResult('test', true);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe error callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = service.onError(callback);
      
      unsubscribe();
      mockRecognition.simulateError('network');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe state change callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = service.onStateChange(callback);
      
      unsubscribe();
      mockRecognition.simulateStart();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should update configuration', () => {
      service.updateConfig({
        language: 'fr-FR',
        continuous: false
      });
      
      expect(mockRecognition.lang).toBe('fr-FR');
      expect(mockRecognition.continuous).toBe(false);
    });

    it('should preserve existing configuration when updating', () => {
      service.updateConfig({
        language: 'de-DE'
      });
      
      expect(mockRecognition.lang).toBe('de-DE');
      expect(mockRecognition.continuous).toBe(true); // Should remain true
      expect(mockRecognition.interimResults).toBe(true); // Should remain true
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should track listening state', () => {
      expect(service.getIsListening()).toBe(false);
      
      mockRecognition.simulateStart();
      expect(service.getIsListening()).toBe(true);
      
      mockRecognition.simulateEnd();
      expect(service.getIsListening()).toBe(false);
    });

    it('should report browser support correctly', () => {
      expect(service.isSupported()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should clean up resources', () => {
      const callback = vi.fn();
      service.onResult(callback);
      
      service.cleanup();
      
      // Should not receive callbacks after cleanup
      mockRecognition.simulateResult('test', true);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should stop recognition during cleanup', () => {
      mockRecognition.simulateStart();
      
      service.cleanup();
      
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should clear all event handlers', () => {
      service.cleanup();
      
      expect(mockRecognition.onstart).toBeNull();
      expect(mockRecognition.onend).toBeNull();
      expect(mockRecognition.onresult).toBeNull();
      expect(mockRecognition.onerror).toBeNull();
      expect(mockRecognition.onnomatch).toBeNull();
    });
  });

  describe('Enhanced Error Handling', () => {
    beforeEach(() => {
      service = new SpeechRecognitionService();
    });

    it('should provide comprehensive error information', () => {
      const errorCallback = vi.fn();
      service.onError(errorCallback);
      
      const testCases = [
        { 
          error: 'no-speech', 
          expectedMessage: 'No speech was detected. Please speak clearly and try again.',
          expectedCanRetry: true,
          expectedGuidance: 'Speak clearly into your microphone and ensure there is no background noise.'
        },
        { 
          error: 'aborted', 
          expectedMessage: 'Speech recognition was stopped.',
          expectedCanRetry: true,
          expectedGuidance: 'You can start voice input again if needed.'
        },
        { 
          error: 'audio-capture', 
          expectedMessage: 'Audio capture failed. Please check your microphone connection.',
          expectedCanRetry: true,
          expectedGuidance: 'Ensure your microphone is connected and working properly. Check your system audio settings.'
        },
        { 
          error: 'network', 
          expectedMessage: 'Network error occurred. Please check your internet connection.',
          expectedCanRetry: true,
          expectedGuidance: 'Check your internet connection and try again.'
        },
        { 
          error: 'not-allowed', 
          expectedMessage: 'Microphone access denied. Please allow microphone access and try again.',
          expectedCanRetry: true,
          expectedGuidance: 'Click the microphone icon in your browser\'s address bar and select "Allow" to enable voice input.'
        },
        { 
          error: 'service-not-allowed', 
          expectedMessage: 'Speech recognition service is not allowed.',
          expectedCanRetry: true,
          expectedGuidance: 'Check your browser settings and ensure speech recognition is enabled.'
        }
      ];

      testCases.forEach(({ error, expectedMessage, expectedCanRetry, expectedGuidance }) => {
        errorCallback.mockClear();
        mockRecognition.simulateError(error);
        
        expect(errorCallback).toHaveBeenCalledWith({
          error,
          message: expectedMessage,
          canRetry: expectedCanRetry,
          userGuidance: expectedGuidance
        });
      });
    });

    it('should handle auto-retry for recoverable errors', async () => {
      vi.useFakeTimers();
      const errorCallback = vi.fn();
      service.onError(errorCallback);
      
      // Start the service first
      await service.start();
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
      
      // Simulate no-speech error (should auto-retry)
      mockRecognition.simulateError('no-speech');
      
      expect(errorCallback).toHaveBeenCalledWith(expect.objectContaining({
        error: 'no-speech',
        canRetry: true
      }));
      
      // Fast-forward time to trigger auto-retry
      vi.advanceTimersByTime(1000);
      
      // Should attempt to start again
      expect(mockRecognition.start).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('should respect retry limits', async () => {
      vi.useFakeTimers();
      const errorCallback = vi.fn();
      service.onError(errorCallback);
      
      // Start the service first
      await service.start();
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
      
      // Simulate multiple no-speech errors
      for (let i = 0; i < 5; i++) {
        mockRecognition.simulateError('no-speech');
        vi.advanceTimersByTime(Math.pow(2, i) * 1000); // Account for exponential backoff
      }
      
      // Should only retry up to maxRetries (3 times)
      expect(mockRecognition.start).toHaveBeenCalledTimes(4); // Initial + 3 retries
      
      vi.useRealTimers();
    });

    it('should reset retry count on successful start', () => {
      // Simulate error to increment retry count
      mockRecognition.simulateError('no-speech');
      expect(service.getRetryCount()).toBe(1);
      
      // Simulate successful start
      mockRecognition.simulateStart();
      expect(service.getRetryCount()).toBe(0);
    });

    it('should provide retry count and capability info', () => {
      expect(service.getRetryCount()).toBe(0);
      expect(service.canRetry()).toBe(true);
      
      // Simulate multiple errors
      mockRecognition.simulateError('no-speech');
      mockRecognition.simulateError('no-speech');
      mockRecognition.simulateError('no-speech');
      
      expect(service.getRetryCount()).toBe(3);
      expect(service.canRetry()).toBe(false);
    });
  });
});