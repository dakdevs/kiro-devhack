import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SimpleChat from '../SimpleChat';

// Create mock functions that we can control
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
const mockResetTranscript = vi.fn();

// Mock the speech recognition hook with controllable state
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
  retryListening: vi.fn(),
  requestPermission: vi.fn(),
};

vi.mock('../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => mockSpeechState,
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('SimpleChat Voice Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      retryListening: vi.fn(),
      requestPermission: vi.fn(),
    };
  });

  it('should render voice input button when speech recognition is supported', () => {
    render(<SimpleChat />);
    
    // Check that the voice input button is present
    const voiceButton = screen.getByRole('button', { name: /voice input button/i });
    expect(voiceButton).toBeInTheDocument();
  });

  it('should render input field with proper layout for voice button', () => {
    render(<SimpleChat />);
    
    // Check that the input field exists
    const input = screen.getByPlaceholderText('Type a message to the AI...');
    expect(input).toBeInTheDocument();
    
    // Check that the voice button is present
    const voiceButton = screen.getByRole('button', { name: /voice input button/i });
    expect(voiceButton).toBeInTheDocument();
    
    // Check that the send button is present (it has type="submit" but no accessible name)
    const sendButton = screen.getByRole('button', { name: '' });
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveAttribute('type', 'submit');
  });

  it('should have proper responsive layout structure', () => {
    render(<SimpleChat />);
    
    // Check that the form element exists by finding it in the DOM
    const input = screen.getByPlaceholderText('Type a message to the AI...');
    const form = input.closest('form');
    expect(form).toBeInTheDocument();
    
    // The input should be in a relative container for positioning the voice button
    expect(input.parentElement?.parentElement).toHaveClass('relative');
  });

  it('should allow voice button interaction', () => {
    render(<SimpleChat />);
    
    const voiceButton = screen.getByRole('button', { name: /voice input button/i });
    
    // Should be clickable
    expect(voiceButton).not.toBeDisabled();
    
    // Should be able to click without errors
    fireEvent.click(voiceButton);
  });

  describe('Real-time Transcript Updates', () => {
    it('should display interim transcript with visual indication', async () => {
      // Set up interim transcript
      mockSpeechState.interimTranscript = 'hello world';
      mockSpeechState.isListening = true;
      
      render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      expect(input).toHaveValue('');
      
      // Check that interim transcript is displayed with visual indication
      await waitFor(() => {
        const interimText = screen.getByText('hello world');
        expect(interimText).toBeInTheDocument();
        expect(interimText).toHaveClass('text-gray-400', 'italic');
      });
    });

    it('should update input field with final transcript', async () => {
      // Set up final transcript
      mockSpeechState.transcript = 'hello world';
      
      const { rerender } = render(<SimpleChat />);
      
      // Trigger re-render to simulate transcript update
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });
    });

    it('should handle multiple final transcript updates', async () => {
      const { rerender } = render(<SimpleChat />);
      
      // First final transcript
      mockSpeechState.transcript = 'hello';
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      await waitFor(() => {
        expect(input).toHaveValue('hello');
      });
      
      // Reset transcript and add new one (simulating how the hook works)
      mockSpeechState.transcript = 'world';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });
    });

    it('should preserve user typed text when adding speech transcript', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // User types some text
      fireEvent.change(input, { target: { value: 'I typed this' } });
      expect(input).toHaveValue('I typed this');
      
      // Then speech transcript comes in
      mockSpeechState.transcript = 'and said this';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('I typed this and said this');
      });
    });

    it('should allow user to edit transcribed text', async () => {
      const { rerender } = render(<SimpleChat />);
      
      // Speech transcript comes in
      mockSpeechState.transcript = 'hello world';
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });
      
      // User edits the transcribed text
      fireEvent.change(input, { target: { value: 'hello beautiful world' } });
      expect(input).toHaveValue('hello beautiful world');
    });

    it('should reset speech transcript when starting new recording', async () => {
      const { rerender } = render(<SimpleChat />);
      
      // First transcript
      mockSpeechState.transcript = 'first message';
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      await waitFor(() => {
        expect(input).toHaveValue('first message');
      });
      
      // Start new recording (should reset speech transcript)
      fireEvent.click(voiceButton);
      
      // Clear previous transcript and add new one
      mockSpeechState.transcript = 'second message';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('second message');
      });
    });

    it('should clear all transcript state when message is sent', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'AI response' }),
      });
      
      const { rerender } = render(<SimpleChat />);
      
      // Add speech transcript
      mockSpeechState.transcript = 'test message';
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const form = input.closest('form')!;
      
      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });
      
      // Send the message
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should handle mixed typing and speech input correctly', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // User types first
      fireEvent.change(input, { target: { value: 'I typed' } });
      expect(input).toHaveValue('I typed');
      
      // Then speech comes in
      mockSpeechState.transcript = 'and spoke';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('I typed and spoke');
      });
      
      // User continues typing
      fireEvent.change(input, { target: { value: 'I typed and spoke more' } });
      expect(input).toHaveValue('I typed and spoke more');
    });

    it('should show interim transcript alongside existing text', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      
      // User has some text
      fireEvent.change(input, { target: { value: 'existing text' } });
      expect(input).toHaveValue('existing text');
      
      // Interim transcript appears
      mockSpeechState.interimTranscript = 'interim words';
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      // Check that interim text is displayed with proper spacing and styling
      await waitFor(() => {
        const interimElement = screen.getByText((content, element) => {
          return element?.textContent === ' interim words';
        });
        expect(interimElement).toBeInTheDocument();
        expect(interimElement).toHaveClass('text-gray-400', 'italic');
      });
    });
  });

  describe('Loading States and Processing Feedback', () => {
    it('should show processing state in voice button when processing speech', async () => {
      mockSpeechState.isProcessing = true;
      
      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-blue-500');
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, processing speech, please wait');
      expect(voiceButton).toHaveAttribute('title', 'Converting speech to text...');
      
      // Check for loading spinner
      const spinner = voiceButton.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show completed state in voice button after successful transcription', async () => {
      mockSpeechState.hasCompletedTranscription = true;
      
      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-green-500');
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, speech successfully transcribed, click to start new recording');
      expect(voiceButton).toHaveAttribute('title', 'Speech successfully transcribed!');
      
      // Check for checkmark icon
      const checkIcon = voiceButton.querySelector('svg polyline[points="20,6 9,17 4,12"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should show processing indicator in input field during processing', async () => {
      mockSpeechState.isProcessing = true;
      
      render(<SimpleChat />);
      
      // Check for processing indicator
      await waitFor(() => {
        const processingText = screen.getByText('Processing...');
        expect(processingText).toBeInTheDocument();
        expect(processingText).toHaveClass('text-xs');
        
        // Check for animated dots
        const dots = processingText.parentElement?.querySelectorAll('.animate-pulse');
        expect(dots).toHaveLength(3);
      });
    });

    it('should show completion confirmation in input field after transcription', async () => {
      mockSpeechState.hasCompletedTranscription = true;
      
      render(<SimpleChat />);
      
      // Check for completion confirmation
      await waitFor(() => {
        const confirmationText = screen.getByText('Transcribed!');
        expect(confirmationText).toBeInTheDocument();
        expect(confirmationText).toHaveClass('text-xs');
        expect(confirmationText.parentElement).toHaveClass('animate-fade-in');
        
        // Check for checkmark icon
        const checkIcon = confirmationText.parentElement?.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('should prioritize states correctly in voice button', async () => {
      const { rerender } = render(<SimpleChat />);
      
      // Error state should take priority
      mockSpeechState.error = 'Test error';
      mockSpeechState.hasCompletedTranscription = true;
      mockSpeechState.isProcessing = true;
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      let voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-red-500');
      
      // Completed state should take priority over processing and listening
      mockSpeechState.error = null;
      rerender(<SimpleChat />);
      
      voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-green-500');
      
      // Processing state should take priority over listening
      mockSpeechState.hasCompletedTranscription = false;
      rerender(<SimpleChat />);
      
      voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-blue-500');
      
      // Listening state when no higher priority states
      mockSpeechState.isProcessing = false;
      rerender(<SimpleChat />);
      
      voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-red-500', 'animate-pulse');
    });

    it('should not show processing indicators when not processing', async () => {
      mockSpeechState.isProcessing = false;
      mockSpeechState.hasCompletedTranscription = false;
      
      render(<SimpleChat />);
      
      // Should not show processing text
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      
      // Should not show completion text
      expect(screen.queryByText('Transcribed!')).not.toBeInTheDocument();
    });

    it('should show smooth transitions between states', async () => {
      const { rerender } = render(<SimpleChat />);
      
      // Start with listening
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      let voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-red-500', 'animate-pulse');
      
      // Move to processing
      mockSpeechState.isListening = false;
      mockSpeechState.isProcessing = true;
      rerender(<SimpleChat />);
      
      voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-blue-500');
      expect(voiceButton).not.toHaveClass('animate-pulse');
      
      // Move to completed
      mockSpeechState.isProcessing = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-green-500');
      expect(voiceButton).toHaveClass('transition-all', 'duration-300');
      
      // Back to idle
      mockSpeechState.hasCompletedTranscription = false;
      rerender(<SimpleChat />);
      
      voiceButton = screen.getByRole('button', { name: /voice input button/i });
      expect(voiceButton).toHaveClass('bg-gray-200');
    });

    it('should handle processing state during form submission', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'AI response' }),
      });
      
      const { rerender } = render(<SimpleChat />);
      
      // Set up processing state with transcript
      mockSpeechState.isProcessing = true;
      mockSpeechState.transcript = 'test message';
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const form = input.closest('form')!;
      
      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });
      
      // Voice button should be disabled during form submission
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Submit the form
      fireEvent.submit(form);
      
      // Voice button should be disabled during loading
      await waitFor(() => {
        expect(voiceButton).toBeDisabled();
      });
    });

    it('should clear processing states when message is sent', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'AI response' }),
      });
      
      const { rerender } = render(<SimpleChat />);
      
      // Set up completed state with transcript
      mockSpeechState.hasCompletedTranscription = true;
      mockSpeechState.transcript = 'test message';
      rerender(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const form = input.closest('form')!;
      
      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });
      
      // Should show completion confirmation
      expect(screen.getByText('Transcribed!')).toBeInTheDocument();
      
      // Send the message
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      
      // Processing states should be cleared (this would happen in the real hook)
      mockSpeechState.hasCompletedTranscription = false;
      mockSpeechState.transcript = '';
      rerender(<SimpleChat />);
      
      expect(screen.queryByText('Transcribed!')).not.toBeInTheDocument();
    });

    it('should show processing feedback with proper accessibility', async () => {
      mockSpeechState.isProcessing = true;
      
      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Check ARIA attributes for processing state
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, processing speech, please wait');
      expect(voiceButton).toHaveAttribute('title', 'Converting speech to text...');
      
      // Processing indicator should be properly positioned and styled
      await waitFor(() => {
        const processingText = screen.getByText('Processing...');
        expect(processingText.parentElement?.parentElement).toHaveClass('pointer-events-none');
        expect(processingText.parentElement?.parentElement).toHaveClass('absolute');
      });
    });

    it('should show completion feedback with proper accessibility', async () => {
      mockSpeechState.hasCompletedTranscription = true;
      
      render(<SimpleChat />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Check ARIA attributes for completed state
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, speech successfully transcribed, click to start new recording');
      expect(voiceButton).toHaveAttribute('title', 'Speech successfully transcribed!');
      
      // Completion indicator should be properly positioned and styled
      await waitFor(() => {
        const completionText = screen.getByText('Transcribed!');
        expect(completionText.parentElement?.parentElement).toHaveClass('pointer-events-none');
        expect(completionText.parentElement?.parentElement).toHaveClass('absolute');
        expect(completionText.parentElement).toHaveClass('animate-fade-in');
      });
    });
  });
});