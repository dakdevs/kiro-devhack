import { useState, useEffect, useRef, useCallback } from 'react';
import { getBrowserCompatibility, getUnsupportedBrowserMessage } from '../utils/browserCompatibility';

// TypeScript interfaces for speech recognition
interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  canRetry: boolean;
  permissionState: 'unknown' | 'granted' | 'denied' | 'prompt';
  isProcessing: boolean;
  hasCompletedTranscription: boolean;
}

interface SpeechRecognitionActions {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  retryListening: () => void;
  requestPermission: () => Promise<boolean>;
}

// Extended SpeechRecognition interface to handle browser compatibility
interface ExtendedSpeechRecognition extends SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
}

// Browser compatibility detection
const getSpeechRecognition = (): typeof SpeechRecognition | null => {
  if (typeof window === 'undefined') return null;
  
  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
};

// Check if speech recognition is supported
const isSpeechRecognitionSupported = (): boolean => {
  return getSpeechRecognition() !== null;
};

export const useSpeechRecognition = (): SpeechRecognitionState & SpeechRecognitionActions => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(isSpeechRecognitionSupported());
  const [canRetry, setCanRetry] = useState(false);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCompletedTranscription, setHasCompletedTranscription] = useState(false);
  
  const recognitionRef = useRef<ExtendedSpeechRecognition | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor permission changes
  useEffect(() => {
    if (!navigator.permissions) return;

    let permissionStatus: PermissionStatus | null = null;

    const setupPermissionMonitoring = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        // Set initial permission state
        setPermissionState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        
        // Listen for permission changes
        const handlePermissionChange = () => {
          const newState = permissionStatus!.state as 'granted' | 'denied' | 'prompt';
          setPermissionState(newState);
          
          // Clear errors when permission is granted
          if (newState === 'granted' && error?.includes('denied')) {
            setError(null);
            setCanRetry(false);
          }
          
          // Show error when permission is denied
          if (newState === 'denied' && isListening) {
            setError('Microphone access was revoked. Voice input has been stopped.');
            setCanRetry(true);
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }
        };
        
        permissionStatus.addEventListener('change', handlePermissionChange);
        
        return () => {
          if (permissionStatus) {
            permissionStatus.removeEventListener('change', handlePermissionChange);
          }
        };
      } catch (error) {
        console.warn('Could not set up permission monitoring:', error);
      }
    };

    const cleanup = setupPermissionMonitoring();
    
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [error, isListening]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor() as ExtendedSpeechRecognition;
    
    // Configure recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Handle speech recognition results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (finalTranscript) {
        // Show processing state briefly when final results come in
        setIsProcessing(true);
        
        // Clear any existing processing timeout
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        
        // Process the final transcript
        setTranscript(prev => prev + finalTranscript);
        setInterimTranscript('');
        
        // Show processing for a brief moment, then show confirmation
        processingTimeoutRef.current = setTimeout(() => {
          setIsProcessing(false);
          setHasCompletedTranscription(true);
          
          // Clear confirmation after a short delay
          if (confirmationTimeoutRef.current) {
            clearTimeout(confirmationTimeoutRef.current);
          }
          confirmationTimeoutRef.current = setTimeout(() => {
            setHasCompletedTranscription(false);
          }, 1500); // Show confirmation for 1.5 seconds
        }, 300); // Show processing for 300ms
      } else {
        setInterimTranscript(interimTranscript);
        
        // If we have interim results, we're actively processing speech
        if (interimTranscript.trim()) {
          setIsProcessing(false); // Not processing final results yet
        }
      }
    };

    // Handle speech recognition errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event);
      
      // Log additional debugging info for network errors
      if (event.error === 'network') {
        console.log('Network error details:', {
          userAgent: navigator.userAgent,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          isSecureContext: window.isSecureContext,
          permissionState: permissionState
        });
      }
      
      let errorMessage = '';
      let canRetryError = false;
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly and try again.';
          canRetryError = true;
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check your microphone connection and settings.';
          canRetryError = true;
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please click the microphone icon in your browser\'s address bar and allow access, then try again.';
          setPermissionState('denied');
          canRetryError = true;
          break;
        case 'network':
          // Check if this is Brave browser
          const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave;
          if (isBrave) {
            errorMessage = 'Brave browser is blocking speech recognition. Click the Brave Shields icon (🦁) in your address bar and set "Block fingerprinting" to "Allow all fingerprinting", then refresh the page.';
          } else {
            errorMessage = 'Network error occurred. This might be due to browser security settings or internet connectivity. Please check your connection and try again.';
          }
          canRetryError = true;
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is not allowed. Please check your browser settings and try again.';
          canRetryError = true;
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was stopped. You can start again if needed.';
          canRetryError = true;
          break;
        case 'language-not-supported':
          errorMessage = 'The selected language is not supported. Please try with English.';
          canRetryError = false;
          break;
        case 'bad-grammar':
          errorMessage = 'Speech recognition configuration error. Please try again.';
          canRetryError = true;
          break;
        default:
          errorMessage = 'An unexpected error occurred during speech recognition. Please try again.';
          canRetryError = true;
      }
      
      setError(errorMessage);
      setCanRetry(canRetryError);
      setIsListening(false);
      setIsProcessing(false);
      setHasCompletedTranscription(false);
      
      // Don't auto-retry network errors as they often indicate permission or configuration issues
      // Only auto-retry no-speech errors, and only once
      if (canRetryError && event.error === 'no-speech') {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (!isListening && canRetryError) {
            console.log('Auto-retrying speech recognition for no-speech...');
            startListening();
          }
        }, 1500);
      }
    };

    // Handle speech recognition end
    recognition.onend = () => {
      setIsListening(false);
      
      // If we were processing when recognition ended, show brief processing state
      if (isProcessing) {
        setTimeout(() => {
          setIsProcessing(false);
        }, 200);
      }
    };

    // Handle speech recognition start
    recognition.onstart = () => {
      setError(null);
      setCanRetry(false);
      setIsListening(true);
      setIsProcessing(false);
      setHasCompletedTranscription(false);
      setPermissionState('granted');
      
      // Clear any pending timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, [isSupported]);

  // Check current permission state without requesting
  const checkPermissionState = useCallback(async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (!navigator.permissions || !navigator.mediaDevices) {
      return 'prompt'; // Fallback for browsers without permissions API
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'prompt';
    }
  }, []);

  // Request microphone permission with comprehensive error handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissionState('prompt');
      setError(null);
      
      // First check if we already have permission
      const currentState = await checkPermissionState();
      if (currentState === 'granted') {
        setPermissionState('granted');
        return true;
      }
      
      if (currentState === 'denied') {
        setPermissionState('denied');
        setError('Microphone access was previously denied. Please click the microphone icon in your browser\'s address bar and select "Allow", then try again.');
        setCanRetry(true);
        return false;
      }
      
      // Request microphone access to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop()); // Clean up the stream immediately
      setPermissionState('granted');
      setError(null);
      setCanRetry(false);
      return true;
    } catch (err: unknown) {
      console.error('Permission request failed:', err);
      
      const error = err as Error & { name: string };
      let errorMessage = '';
      let userGuidance = '';
      
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          setPermissionState('denied');
          errorMessage = 'Microphone access denied. Voice input requires microphone permission to work.';
          userGuidance = 'To enable voice input:\n1. Click the microphone icon in your browser\'s address bar\n2. Select "Allow" for microphone access\n3. Try voice input again';
          break;
        case 'NotFoundError':
          setPermissionState('denied');
          errorMessage = 'No microphone found. Please connect a microphone to use voice input.';
          userGuidance = 'Make sure your microphone is connected and recognized by your system.';
          break;
        case 'NotReadableError':
          setPermissionState('denied');
          errorMessage = 'Microphone is already in use by another application.';
          userGuidance = 'Close other applications that might be using your microphone and try again.';
          break;
        case 'OverconstrainedError':
          setPermissionState('denied');
          errorMessage = 'Microphone does not meet the required constraints.';
          userGuidance = 'Your microphone may not support the required audio features. Try with a different microphone.';
          break;
        case 'SecurityError':
          setPermissionState('denied');
          errorMessage = 'Microphone access blocked due to security restrictions.';
          userGuidance = 'This page must be served over HTTPS to access the microphone. Please use a secure connection.';
          break;
        case 'AbortError':
          setPermissionState('unknown');
          errorMessage = 'Permission request was cancelled.';
          userGuidance = 'You can try requesting microphone access again.';
          break;
        default:
          setPermissionState('denied');
          errorMessage = 'Unable to access microphone. Please check your browser and system settings.';
          userGuidance = 'Ensure your browser supports microphone access and your system audio is working properly.';
      }
      
      setError(`${errorMessage}\n\n${userGuidance}`);
      setCanRetry(true);
      return false;
    }
  }, [checkPermissionState]);

  // Start listening function with comprehensive permission handling
  const startListening = useCallback(async () => {
    if (!isSupported) {
      const browserInfo = getBrowserCompatibility();
      const errorMessage = getUnsupportedBrowserMessage(browserInfo);
      setError(errorMessage);
      setCanRetry(false);
      return;
    }

    if (!recognitionRef.current) {
      setError('Speech recognition is not initialized. Please refresh the page and try again.');
      setCanRetry(true);
      return;
    }

    if (isListening) return;

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      setError(null);
      setCanRetry(false);
      
      // Always check and request permission before starting
      const currentPermissionState = await checkPermissionState();
      
      if (currentPermissionState === 'denied' || permissionState === 'denied') {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          return;
        }
      } else if (currentPermissionState === 'prompt' || permissionState === 'unknown') {
        // Request permission proactively for better UX
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          return;
        }
      }
      
      // Double-check that we have permission before starting recognition
      if (permissionState !== 'granted') {
        setError('Microphone permission is required for voice input. Please allow access and try again.');
        setCanRetry(true);
        return;
      }
      
      recognitionRef.current.start();
    } catch (err: unknown) {
      console.error('Error starting speech recognition:', err);
      
      const error = err as Error & { name: string };
      let errorMessage = 'Failed to start speech recognition.';
      const canRetryError = true;
      let userGuidance = '';
      
      switch (error.name) {
        case 'InvalidStateError':
          errorMessage = 'Speech recognition is already running. Please wait a moment and try again.';
          userGuidance = 'Wait for the current session to end before starting a new one.';
          break;
        case 'NotAllowedError':
          errorMessage = 'Microphone access denied. Voice input requires microphone permission.';
          userGuidance = 'Click the microphone icon in your browser\'s address bar and select "Allow".';
          setPermissionState('denied');
          break;
        case 'ServiceNotAvailableError':
          errorMessage = 'Speech recognition service is not available.';
          userGuidance = 'Check your internet connection and try again. Some browsers require an internet connection for speech recognition.';
          break;
        case 'NetworkError':
          errorMessage = 'Network error occurred while starting speech recognition.';
          userGuidance = 'Check your internet connection and try again.';
          break;
        default:
          errorMessage = 'An unexpected error occurred while starting speech recognition.';
          userGuidance = 'Try refreshing the page or check your browser settings.';
      }
      
      setError(`${errorMessage}\n\n${userGuidance}`);
      setCanRetry(canRetryError);
    }
  }, [isSupported, isListening, permissionState, requestPermission, checkPermissionState]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    // Clear any pending timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, [isListening]);

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setCanRetry(false);
    setIsProcessing(false);
    setHasCompletedTranscription(false);
    
    // Clear any pending timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
  }, []);

  // Retry listening function
  const retryListening = useCallback(() => {
    if (!canRetry) return;
    
    resetTranscript();
    startListening();
  }, [canRetry, resetTranscript, startListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    canRetry,
    permissionState,
    isProcessing,
    hasCompletedTranscription,
    startListening,
    stopListening,
    resetTranscript,
    retryListening,
    requestPermission,
  };
};