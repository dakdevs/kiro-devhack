/**
 * Mixed Input Scenarios and Editing Capabilities Tests
 * Tests complex interactions between typing and voice input
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock fetch
global.fetch = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

describe('Mixed Input Scenarios and Editing Tests', () => {
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
      retryListening: mockRetryListening,
      requestPermission: mockRequestPermission,
    };

    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'AI response' }),
    });
  });

  describe('Complex Mixed Input Patterns', () => {
    it('should handle type → voice → type → voice pattern', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Step 1: Type initial text
      fireEvent.change(input, { target: { value: 'I typed' } });
      expect(input).toHaveValue('I typed');
      
      // Step 2: Add voice input
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'and spoke';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('I typed and spoke');
      });
      
      // Step 3: Continue typing
      fireEvent.change(input, { target: { value: 'I typed and spoke then typed more' } });
      expect(input).toHaveValue('I typed and spoke then typed more');
      
      // Step 4: Add more voice input
      mockSpeechState.hasCompletedTranscription = false;
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'and spoke again';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('I typed and spoke then typed more and spoke again');
      });
    });

    it('should handle voice → edit → voice → edit pattern', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Step 1: Voice input
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'hello world';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('hello world');
      });
      
      // Step 2: Edit the transcribed text
      fireEvent.change(input, { target: { value: 'hello beautiful world' } });
      expect(input).toHaveValue('hello beautiful world');
      
      // Step 3: Add more voice input
      mockSpeechState.hasCompletedTranscription = false;
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'how are you';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('hello beautiful world how are you');
      });
      
      // Step 4: Edit again
      fireEvent.change(input, { target: { value: 'hello beautiful world how are you today' } });
      expect(input).toHaveValue('hello beautiful world how are you today');
    });

    it('should handle multiple voice sessions with interim results', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // First voice session with interim results
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      // Interim results
      mockSpeechState.interimTranscript = 'first';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(screen.getByText('first')).toBeInTheDocument();
      });
      
      mockSpeechState.interimTranscript = 'first part';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(screen.getByText('first part')).toBeInTheDocument();
      });
      
      // Final result
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'first part';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('first part');
      });
      
      // Second voice session
      mockSpeechState.hasCompletedTranscription = false;
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      // More interim results
      mockSpeechState.interimTranscript = 'second';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        const interimText = screen.getByText('second');
        expect(interimText).toBeInTheDocument();
        expect(interimText).toHaveClass('text-gray-400', 'italic');
      });
      
      // Final result for second session
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'second part';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      // Current implementation resets speech transcript on new recording, so only second part shows
      await waitFor(() => {
        expect(input).toHaveValue('second part');
      });
    });

    it('should handle typing during voice recording', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Start typing
      fireEvent.change(input, { target: { value: 'I am typing' } });
      expect(input).toHaveValue('I am typing');
      
      // Start voice recording while typing
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      // Continue typing while recording
      fireEvent.change(input, { target: { value: 'I am typing more' } });
      expect(input).toHaveValue('I am typing more');
      
      // Interim voice results appear
      mockSpeechState.interimTranscript = 'and speaking';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        const interimText = screen.getByText((content, element) => {
          return element?.textContent === ' and speaking';
        });
        expect(interimText).toBeInTheDocument();
      });
      
      // Final voice result
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'and speaking';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('I am typing more and speaking');
      });
    });
  });

  describe('Advanced Editing Scenarios', () => {
    it('should handle text selection and replacement with voice', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Initial text
      fireEvent.change(input, { target: { value: 'The quick brown fox jumps' } });
      expect(input).toHaveValue('The quick brown fox jumps');
      
      // Simulate text selection (select "brown fox")
      input.setSelectionRange(10, 19);
      
      // Replace selected text with typing
      fireEvent.change(input, { target: { value: 'The quick red cat jumps' } });
      expect(input).toHaveValue('The quick red cat jumps');
      
      // Add voice input at the end
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'over the fence';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('The quick red cat jumps over the fence');
      });
    });

    it('should handle cursor positioning during voice input', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Type initial text
      fireEvent.change(input, { target: { value: 'Hello world' } });
      expect(input).toHaveValue('Hello world');
      
      // Position cursor in middle (after "Hello ")
      input.setSelectionRange(6, 6);
      
      // Add voice input (current implementation appends to end)
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'beautiful';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('Hello world beautiful');
      });
    });

    it('should handle backspace and delete operations with voice content', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Add voice content
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'hello world test';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('hello world test');
      });
      
      // Simulate backspace operations
      fireEvent.change(input, { target: { value: 'hello world' } });
      expect(input).toHaveValue('hello world');
      
      // Add more voice content
      mockSpeechState.hasCompletedTranscription = false;
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'again';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('hello world again');
      });
    });

    it('should handle undo/redo-like operations', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Initial state
      fireEvent.change(input, { target: { value: 'original text' } });
      expect(input).toHaveValue('original text');
      
      // Add voice content
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'added by voice';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('original text added by voice');
      });
      
      // "Undo" by manually reverting
      fireEvent.change(input, { target: { value: 'original text' } });
      expect(input).toHaveValue('original text');
      
      // "Redo" by adding different content
      fireEvent.change(input, { target: { value: 'original text modified' } });
      expect(input).toHaveValue('original text modified');
    });
  });

  describe('Error Handling in Mixed Scenarios', () => {
    it('should handle voice error while user is typing', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // User starts typing
      fireEvent.change(input, { target: { value: 'I am typing' } });
      expect(input).toHaveValue('I am typing');
      
      // Start voice recording
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      // Voice error occurs
      mockSpeechState.isListening = false;
      mockSpeechState.error = 'no-speech';
      mockSpeechState.canRetry = true;
      rerender(<SimpleChat />);
      
      // User should still be able to continue typing
      fireEvent.change(input, { target: { value: 'I am typing despite error' } });
      expect(input).toHaveValue('I am typing despite error');
      
      // Voice button should show error state
      expect(voiceButton).toHaveClass('bg-red-500');
      
      // Should be able to retry voice
      fireEvent.click(voiceButton);
      expect(mockRetryListening).toHaveBeenCalled();
    });

    it('should handle network error during mixed input message sending', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const form = input.closest('form')!;
      
      // Mixed input
      fireEvent.change(input, { target: { value: 'typed part' } });
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'spoken part';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('typed part spoken part');
      });
      
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      // Send message
      fireEvent.submit(form);
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText("Sorry, I'm having trouble connecting. Please try again later.")).toBeInTheDocument();
      });
      
      // Input should be cleared despite error
      expect(input).toHaveValue('');
    });

    it('should handle permission denied during mixed input', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // User starts typing
      fireEvent.change(input, { target: { value: 'typed content' } });
      expect(input).toHaveValue('typed content');
      
      // Try to start voice recording
      fireEvent.click(voiceButton);
      
      // Permission denied
      mockSpeechState.error = 'not-allowed';
      mockSpeechState.permissionState = 'denied';
      rerender(<SimpleChat />);
      
      // Typed content should remain
      expect(input).toHaveValue('typed content');
      
      // Voice button should show error state
      expect(voiceButton).toHaveClass('bg-red-500');
      expect(voiceButton).toHaveAttribute('title', expect.stringContaining('denied'));
      
      // User should still be able to continue typing
      fireEvent.change(input, { target: { value: 'typed content continues' } });
      expect(input).toHaveValue('typed content continues');
    });
  });

  describe('Performance with Mixed Input', () => {
    it('should handle rapid mixed input changes efficiently', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      const startTime = performance.now();
      
      // Rapid alternating input
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          // Typing
          fireEvent.change(input, { target: { value: `typed ${i}` } });
        } else {
          // Voice input
          mockSpeechState.transcript = `spoken ${i}`;
          mockSpeechState.hasCompletedTranscription = true;
          rerender(<SimpleChat />);
          mockSpeechState.hasCompletedTranscription = false;
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjusted for test environment)
      expect(duration).toBeLessThan(200);
    });

    it('should handle long mixed content efficiently', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Long typed content
      const longTypedText = 'typed '.repeat(500);
      fireEvent.change(input, { target: { value: longTypedText } });
      
      const startTime = performance.now();
      
      // Add long voice content
      const longVoiceText = 'spoken '.repeat(500);
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = longVoiceText;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      // Current implementation shows the combined text (typed + voice)
      await waitFor(() => {
        // The implementation actually combines the texts
        const actualValue = input.value;
        expect(actualValue).toContain('typed');
        expect(actualValue).toContain('spoken');
        expect(actualValue.length).toBeGreaterThan(longTypedText.length);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle long content efficiently
      expect(duration).toBeLessThan(50);
    });
  });

  describe('State Management in Mixed Scenarios', () => {
    it('should maintain correct state when switching between input modes', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Start with typing
      fireEvent.change(input, { target: { value: 'typed' } });
      expect(input).toHaveValue('typed');
      
      // Switch to voice (listening state)
      fireEvent.click(voiceButton);
      mockSpeechState.isListening = true;
      rerender(<SimpleChat />);
      
      expect(voiceButton).toHaveClass('bg-red-500', 'animate-pulse');
      
      // Interim voice results
      mockSpeechState.interimTranscript = 'speaking';
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent === ' speaking';
        })).toBeInTheDocument();
      });
      
      // Switch back to typing while voice is active
      fireEvent.change(input, { target: { value: 'typed more' } });
      expect(input).toHaveValue('typed more');
      
      // Complete voice input
      mockSpeechState.interimTranscript = '';
      mockSpeechState.transcript = 'spoken';
      mockSpeechState.isListening = false;
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('typed more spoken');
      });
      
      expect(voiceButton).toHaveClass('bg-green-500');
    });

    it('should clear all states when message is sent', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      const form = input.closest('form')!;
      
      // Mixed input with various states
      fireEvent.change(input, { target: { value: 'typed' } });
      fireEvent.click(voiceButton);
      mockSpeechState.transcript = 'spoken';
      mockSpeechState.hasCompletedTranscription = true;
      rerender(<SimpleChat />);
      
      await waitFor(() => {
        expect(input).toHaveValue('typed spoken');
      });
      
      // Send message
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      
      // All voice states should be cleared
      mockSpeechState.transcript = '';
      mockSpeechState.hasCompletedTranscription = false;
      rerender(<SimpleChat />);
      
      expect(voiceButton).toHaveClass('bg-gray-200');
      expect(screen.queryByText('Transcribed!')).not.toBeInTheDocument();
    });

    it('should handle state conflicts gracefully', async () => {
      const { rerender } = render(<SimpleChat />);
      
      const input = screen.getByPlaceholderText('Type a message to the AI...');
      const voiceButton = screen.getByRole('button', { name: /voice input button/i });
      
      // Create conflicting states
      mockSpeechState.isListening = true;
      mockSpeechState.isProcessing = true;
      mockSpeechState.hasCompletedTranscription = true;
      mockSpeechState.error = 'no-speech';
      rerender(<SimpleChat />);
      
      // Should prioritize error state
      expect(voiceButton).toHaveClass('bg-red-500');
      
      // Clear error, should show completed state
      mockSpeechState.error = null;
      rerender(<SimpleChat />);
      
      expect(voiceButton).toHaveClass('bg-green-500');
      
      // Clear completed, should show processing state
      mockSpeechState.hasCompletedTranscription = false;
      rerender(<SimpleChat />);
      
      expect(voiceButton).toHaveClass('bg-blue-500');
      
      // Clear processing, should show listening state
      mockSpeechState.isProcessing = false;
      rerender(<SimpleChat />);
      
      expect(voiceButton).toHaveClass('bg-red-500', 'animate-pulse');
    });
  });
});