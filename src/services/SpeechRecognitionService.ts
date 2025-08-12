/**
 * SpeechRecognitionService - Manages Web Speech API lifecycle
 * Provides real-time speech-to-text transcription with proper cleanup
 */

import { getBrowserCompatibility, isVoiceInputSupported } from '../utils/browserCompatibility';

export interface SpeechConfig {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  maxAlternatives: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export interface SpeechRecognitionError {
  error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'language-not-supported' | 'bad-grammar';
  message: string;
  canRetry: boolean;
  userGuidance?: string;
}

type ResultCallback = (result: SpeechRecognitionResult) => void;
type ErrorCallback = (error: SpeechRecognitionError) => void;
type StateChangeCallback = (isListening: boolean) => void;

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private resultCallbacks: ResultCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private stateChangeCallbacks: StateChangeCallback[] = [];
  private retryCount = 0;
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(private config: SpeechConfig = {
    continuous: true,
    interimResults: true,
    language: 'en-US',
    maxAlternatives: 1
  }) {
    this.initializeRecognition();
  }

  /**
   * Initialize the SpeechRecognition instance with configuration
   */
  private initializeRecognition(): void {
    if (!this.isSupported()) {
      return;
    }

    // Use webkit prefix for Chrome/Edge compatibility
    const SpeechRecognitionConstructor = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionConstructor();

    // Configure recognition settings
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for speech recognition events
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.retryCount = 0; // Reset retry count on successful start
      this.notifyStateChange(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.notifyStateChange(false);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        const speechResult: SpeechRecognitionResult = {
          transcript,
          confidence,
          isFinal,
          timestamp: Date.now()
        };

        this.notifyResult(speechResult);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorInfo = this.getErrorInfo(event.error);
      const error: SpeechRecognitionError = {
        error: event.error as SpeechRecognitionError['error'],
        message: errorInfo.message,
        canRetry: errorInfo.canRetry,
        userGuidance: errorInfo.userGuidance
      };

      this.notifyError(error);

      // Auto-retry for certain recoverable errors
      if (errorInfo.canRetry && errorInfo.autoRetry && this.retryCount < this.maxRetries) {
        this.scheduleRetry();
      }
    };

    this.recognition.onnomatch = () => {
      const error: SpeechRecognitionError = {
        error: 'no-speech',
        message: 'No speech was detected. Please try speaking again.',
        canRetry: true,
        userGuidance: 'Speak clearly and ensure your microphone is working properly.'
      };

      this.notifyError(error);

      // Auto-retry for no-speech if we haven't exceeded retry limit
      if (this.retryCount < this.maxRetries) {
        this.scheduleRetry();
      }
    };
  }

  /**
   * Start speech recognition
   */
  public async start(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    if (this.isListening) {
      return;
    }

    // Clear any pending retry
    this.clearRetryTimeout();

    try {
      this.recognition.start();
    } catch (error: any) {
      let speechError: SpeechRecognitionError;
      
      if (error.name === 'InvalidStateError') {
        speechError = {
          error: 'aborted',
          message: 'Speech recognition is already running. Please wait and try again.',
          canRetry: true,
          userGuidance: 'Wait a moment before trying again.'
        };
      } else if (error.name === 'NotAllowedError') {
        speechError = {
          error: 'not-allowed',
          message: 'Microphone access denied. Please allow microphone access and try again.',
          canRetry: true,
          userGuidance: 'Click the microphone icon in your browser\'s address bar and allow access.'
        };
      } else {
        speechError = {
          error: 'aborted',
          message: 'Failed to start speech recognition',
          canRetry: true
        };
      }
      
      this.notifyError(speechError);
      throw error;
    }
  }

  /**
   * Stop speech recognition
   */
  public stop(): void {
    this.clearRetryTimeout();
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition immediately
   */
  public abort(): void {
    this.clearRetryTimeout();
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  /**
   * Check if speech recognition is supported
   */
  public isSupported(): boolean {
    return isVoiceInputSupported();
  }

  /**
   * Get detailed browser compatibility information
   */
  public getBrowserInfo() {
    return getBrowserCompatibility();
  }

  /**
   * Get current listening state
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Register callback for speech recognition results
   */
  public onResult(callback: ResultCallback): () => void {
    this.resultCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.resultCallbacks.indexOf(callback);
      if (index > -1) {
        this.resultCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for speech recognition errors
   */
  public onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register callback for state changes (listening/not listening)
   */
  public onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clean up resources and remove event listeners
   */
  public cleanup(): void {
    this.clearRetryTimeout();
    
    if (this.recognition) {
      this.stop();
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onnomatch = null;
      this.recognition = null;
    }

    // Clear all callbacks
    this.resultCallbacks = [];
    this.errorCallbacks = [];
    this.stateChangeCallbacks = [];
    this.retryCount = 0;
  }

  /**
   * Update configuration and reinitialize if needed
   */
  public updateConfig(newConfig: Partial<SpeechConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.recognition) {
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * Notify all result callbacks
   */
  private notifyResult(result: SpeechRecognitionResult): void {
    this.resultCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in speech recognition result callback:', error);
      }
    });
  }

  /**
   * Notify all error callbacks
   */
  private notifyError(error: SpeechRecognitionError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in speech recognition error callback:', callbackError);
      }
    });
  }

  /**
   * Notify all state change callbacks
   */
  private notifyStateChange(isListening: boolean): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(isListening);
      } catch (error) {
        console.error('Error in speech recognition state change callback:', error);
      }
    });
  }

  /**
   * Get comprehensive error information
   */
  private getErrorInfo(errorType: string): {
    message: string;
    canRetry: boolean;
    autoRetry: boolean;
    userGuidance?: string;
  } {
    switch (errorType) {
      case 'no-speech':
        return {
          message: 'No speech was detected. Please speak clearly and try again.',
          canRetry: true,
          autoRetry: true,
          userGuidance: 'Speak clearly into your microphone and ensure there is no background noise.'
        };
      case 'aborted':
        return {
          message: 'Speech recognition was stopped.',
          canRetry: true,
          autoRetry: false,
          userGuidance: 'You can start voice input again if needed.'
        };
      case 'audio-capture':
        return {
          message: 'Audio capture failed. Please check your microphone connection.',
          canRetry: true,
          autoRetry: false,
          userGuidance: 'Ensure your microphone is connected and working properly. Check your system audio settings.'
        };
      case 'network':
        return {
          message: 'Network error occurred. Please check your internet connection.',
          canRetry: true,
          autoRetry: true,
          userGuidance: 'Check your internet connection and try again.'
        };
      case 'not-allowed':
        return {
          message: 'Microphone access denied. Please allow microphone access and try again.',
          canRetry: true,
          autoRetry: false,
          userGuidance: 'Click the microphone icon in your browser\'s address bar and select "Allow" to enable voice input.'
        };
      case 'service-not-allowed':
        return {
          message: 'Speech recognition service is not allowed.',
          canRetry: true,
          autoRetry: false,
          userGuidance: 'Check your browser settings and ensure speech recognition is enabled.'
        };
      case 'language-not-supported':
        return {
          message: 'The selected language is not supported.',
          canRetry: false,
          autoRetry: false,
          userGuidance: 'Try using English or check if your browser supports the selected language.'
        };
      case 'bad-grammar':
        return {
          message: 'Speech recognition configuration error.',
          canRetry: true,
          autoRetry: false,
          userGuidance: 'This is a technical issue. Please try again or refresh the page.'
        };
      default:
        return {
          message: 'An unexpected error occurred during speech recognition.',
          canRetry: true,
          autoRetry: false,
          userGuidance: 'Please try again. If the problem persists, refresh the page.'
        };
    }
  }

  /**
   * Schedule a retry attempt
   */
  private scheduleRetry(): void {
    this.retryCount++;
    const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 5000); // Exponential backoff, max 5s
    
    this.retryTimeout = setTimeout(async () => {
      try {
        console.log(`Auto-retrying speech recognition (attempt ${this.retryCount}/${this.maxRetries})`);
        await this.start();
      } catch (error) {
        console.error('Auto-retry failed:', error);
      }
    }, retryDelay);
  }

  /**
   * Clear retry timeout
   */
  private clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Reset retry count (call when successfully starting)
   */
  public resetRetryCount(): void {
    this.retryCount = 0;
    this.clearRetryTimeout();
  }

  /**
   * Get current retry count
   */
  public getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Check if can retry
   */
  public canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }
}