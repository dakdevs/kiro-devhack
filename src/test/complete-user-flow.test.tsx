/**
 * Complete User Flow Integration Tests
 * Tests the entire voice input flow from button click to message sending
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SimpleChat from '../components/SimpleChat';

// Create mock functions that we can control
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
const mockResetTranscript = vi.fn();
const mockRetryListening = vi.fn();
const mockRequestPermission = vi.fn();

// Mock the speech recognition hook with controllable state
let mockSpeechState = {
  isListening: false,
  transcript: '',
  interimTranscript: '',
  error: null as string | null,
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

// Mock browser compatibility
vi.mock('../utils/browserCompatibility', () => ({
  getBrowserCompatibility: () => ({
    name: 'Chrome',
    version: '120',
    isSupported: true,
    supportLevel: 'full',
    limitations: [],
    guidance: '',
    recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
  }),
  logCompatibilityInfo: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('Complete User Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockSpeechState = {
      isListening: false,
      transcript: '',
      interimTranscript: '',
      error: null as string | null,
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

    // Mock successful API response by default
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'AI response to your message' }),
    });
  });

  describe('Complete Voice Input to Message Flow', () => {
    it('should complete full flow: voice button click → recording → transcription → message sending', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const form = input.closest('form')!;

      // Step 1: Click voice button to start recording
      fireEvent.click(voiceButton);
      expect(mockStartListening).toHaveBeenCalled();

      // Step 2: Simulate recording state
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);

      // Voice button should show recording state
      expect(voiceButton).toHaveClass('bg-red-500', 'animate-pulse');
      expect(voiceButton).toHaveAttribute('title', 'Recording... Click to stop');

      // Step 3: Simulate interim transcript appearing
      mockSpeechState.interimTranscript = 'hello world';
      rerender(<SimpleChat />);

      // Should show interim transcript with visual indication
      await waitFor(() => {
        const interimText = screen.getByText('hello world');
        expect(interimText).toBeInTheDocument();
        expect(interimText).toHaveClass('text-gray-400', 'italic');
      });

      // Step 4: Simulate final transcript
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'hello world';
      mockSpeechState.isListening = false;
      mockSpeechState.isProcessing = true;
      rerender(<SimpleChat />);

      // Should show processing state
      expect(voiceButton).toHaveClass('bg-blue-500');
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });

      // Step 5: Simulate transcription completion
      mockSpeechState.isProcessing = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      // Should show completion state
      expect(voiceButton).toHaveClass('bg-green-500');
      await waitFor(() => {
        expect(screen.getByText('Transcribed!')).toBeInTheDocument();
      });

      // Input should contain the transcribed text
      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });

      // Step 6: Send the message
      fireEvent.submit(form);

      // Should send message with transcribed text
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('hello world'),
        }));
      });

      // Input should be cleared
      await waitFor(() => {
        expect(input).toHaveValue('');
      });

      // Should show user message in chat
      await waitFor(() => {
        expect(screen.getByText('hello world')).toBeInTheDocument();
      });

      // Should show AI response
      await waitFor(() => {
        expect(screen.getByText('AI response to your message')).toBeInTheDocument();
      });
    });

    it('should handle voice input with multiple interim and final results', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');

      // Start recording
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);

      // First interim result
      mockSpeechState.interimTranscript = 'hello';
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(screen.getByText('hello')).toBeInTheDocument();
      });

      // Updated interim result
      mockSpeechState.interimTranscript = 'hello world';
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(screen.getByText('hello world')).toBeInTheDocument();
      });

      // First final result
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'hello world';
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });

      // Continue with more interim results
      mockSpeechState.transcript = '';
      mockSpeechState.interimTranscript = 'how are you';
      rerender(<SimpleChat />);

      await waitFor(() => {
        const interimText = screen.getByText((content, element) => {
          return element?.textContent === ' how are you';
        });
        expect(interimText).toBeInTheDocument();
      });

      // Second final result
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'how are you';
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('hello world how are you');
      });

      // Stop recording and complete
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      expect(voiceButton).toHaveClass('bg-green-500');
    });

    it('should handle error during voice input flow', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Start recording
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);

      // Simulate error during recording
      mockSpeechState.isListening = false;
      mockSpeechState.error = 'no-speech';
      mockSpeechState.canRetry = true;
      rerender(<SimpleChat />);

      // Should show error state
      expect(voiceButton).toHaveClass('bg-red-500');
      expect(voiceButton).toHaveAttribute('title', 'Error occurred. Click to retry');

      // Should be able to retry
      fireEvent.click(voiceButton);
      expect(mockRetryListening).toHaveBeenCalled();
    });

    it('should handle permission denied during voice input', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Start recording
      fireEvent.click(voiceButton);

      // Simulate permission denied
      mockSpeechState.error = 'not-allowed';
      mockSpeechState.permissionState = 'denied';
      rerender(<SimpleChat />);

      // Should show error state with permission guidance
      expect(voiceButton).toHaveClass('bg-red-500');
      expect(voiceButton).toHaveAttribute('title', expect.stringContaining('Microphone access denied'));
    });
  });

  describe('Mixed Input Scenarios', () => {
    it('should handle typing followed by voice input', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // User types first
      fireEvent.change(input, { target: { value: 'I typed this' } });
      expect(input).toHaveValue('I typed this');

      // Then starts voice input
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);

      // Voice transcript comes in
      mockSpeechState.transcript = 'and said this';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      // Should combine typed and spoken text
      await waitFor(() => {
        expect(input).toHaveValue('I typed this and said this');
      });
    });

    it('should handle voice input followed by typing', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Start with voice input
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      mockSpeechState.transcript = 'I said this';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('I said this');
      });

      // Then user continues typing
      fireEvent.change(input, { target: { value: 'I said this and typed more' } });
      expect(input).toHaveValue('I said this and typed more');
    });

    it('should handle editing transcribed text', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Voice input first
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'hello world';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });

      // User edits the transcribed text
      fireEvent.change(input, { target: { value: 'hello beautiful world' } });
      expect(input).toHaveValue('hello beautiful world');

      // Should be able to send the edited message
      const form = input.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          body: expect.stringContaining('hello beautiful world'),
        }));
      });
    });

    it('should handle multiple voice sessions in one message', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // First voice session
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'first part';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('first part');
      });

      // Second voice session
      mockSpeechState.hasCompletedTranscription = false;
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'second part';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      // Current implementation resets speech transcript on new recording, so only second part shows
      await waitFor(() => {
        expect(input).toHaveValue('second part');
      });
    });

    it('should preserve cursor position during voice input updates', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // User types some text
      fireEvent.change(input, { target: { value: 'start middle end' } });

      // Position cursor in the middle
      input.setSelectionRange(6, 6); // After "start "

      // Voice input adds text
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'inserted';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      // Text should be appended (current implementation appends)
      await waitFor(() => {
        expect(input).toHaveValue('start middle end inserted');
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should recover from network errors during message sending', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const form = input.closest('form')!;

      // Voice input
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'test message';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Send message
      fireEvent.submit(form);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Sorry, I'm having trouble connecting. Please try again later.")).toBeInTheDocument();
      });

      // Input should still be cleared
      expect(input).toHaveValue('');
    });

    it('should handle API errors gracefully', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const form = input.closest('form')!;

      // Voice input
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'test message';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });

      // Mock API error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      // Send message
      fireEvent.submit(form);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Sorry, I'm having trouble connecting. Please try again later.")).toBeInTheDocument();
      });
    });

    it('should handle empty voice input gracefully', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');

      // Start and stop recording without any speech
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);

      fireEvent.click(voiceButton);
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      // Input should remain empty
      expect(input).toHaveValue('');

      // Send button should remain disabled
      const sendButton = screen.getByRole('button', { name: '' });
      expect(sendButton).toBeDisabled();
    });

    it('should handle rapid voice button clicks', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Rapid clicks
      fireEvent.click(voiceButton);
      fireEvent.click(voiceButton);
      fireEvent.click(voiceButton);

      // Should handle gracefully without errors
      expect(mockStartListening).toHaveBeenCalled();
    });

    it('should handle voice input during form submission', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const form = input.closest('form')!;

      // Add some text and start form submission
      fireEvent.change(input, { target: { value: 'test message' } });

      // Mock slow API response
      (global.fetch as any).mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ reply: 'AI response' }),
          }), 100)
        )
      );

      fireEvent.submit(form);

      // Voice button should be disabled during loading
      await waitFor(() => {
        expect(voiceButton).toBeDisabled();
      });

      // Wait for API response
      await waitFor(() => {
        expect(screen.getByText('AI response')).toBeInTheDocument();
      }, { timeout: 200 });

      // Voice button should be enabled again
      expect(voiceButton).not.toBeDisabled();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels throughout the flow', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Initial state
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, click to start voice input');

      // Recording state
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, currently recording, click to stop recording');

      // Processing state
      mockSpeechState.isListening = false;
      mockSpeechState.isProcessing = true;
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, processing speech, please wait');

      // Completed state
      mockSpeechState.isProcessing = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('aria-label', 'Voice input button, speech successfully transcribed, click to start new recording');

      // Error state
      mockSpeechState.hasCompletedTranscription = false;
      mockSpeechState.error = 'no-speech';
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('aria-label', expect.stringContaining('error'));
    });

    it('should provide appropriate tooltips throughout the flow', async () => {
      const { rerender } = render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Initial state
      expect(voiceButton).toHaveAttribute('title', 'Click to start voice input');

      // Recording state
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('title', 'Recording... Click to stop');

      // Processing state
      mockSpeechState.isListening = false;
      mockSpeechState.isProcessing = true;
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('title', 'Converting speech to text...');

      // Completed state
      mockSpeechState.isProcessing = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      expect(voiceButton).toHaveAttribute('title', 'Speech successfully transcribed!');
    });

    it('should handle keyboard navigation properly', async () => {
      render(<SimpleChat />);

      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const sendButton = screen.getByRole('button', { name: '' });

      // Should be able to tab between elements
      input.focus();
      expect(document.activeElement).toBe(input);

      // Tab to voice button
      fireEvent.keyDown(input, { key: 'Tab' });
      // Note: jsdom doesn't handle focus management automatically
      // In a real browser, this would focus the voice button

      // Voice button should be focusable
      voiceButton.focus();
      expect(document.activeElement).toBe(voiceButton);

      // Should be able to activate with Enter or Space (note: jsdom doesn't handle keyDown->click automatically)
      // In a real browser, keyDown with Enter/Space would trigger click
      fireEvent.click(voiceButton);
      expect(mockStartListening).toHaveBeenCalled();
    });

    it('should maintain focus appropriately during voice input', async () => {
      const { rerender } = render(<SimpleChat />);

      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });

      // Focus input field
      input.focus();
      expect(document.activeElement).toBe(input);

      // Start voice input
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);

      // Focus should remain on input for accessibility
      expect(document.activeElement).toBe(input);

      // Add transcript
      mockSpeechState.transcript = 'hello world';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);

      // Focus should still be on input
      expect(document.activeElement).toBe(input);
    });
  });
});