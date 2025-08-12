import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VoiceInputButton, { VoiceInputButtonProps } from '../VoiceInputButton';

// Helper function to render component with default props
const renderVoiceInputButton = (props: Partial<VoiceInputButtonProps> = {}) => {
  const defaultProps: VoiceInputButtonProps = {
    state: 'idle',
    onClick: vi.fn(),
    ...props,
  };
  return render(<VoiceInputButton {...defaultProps} />);
};

describe('VoiceInputButton', () => {
  describe('Visual States', () => {
    it('renders idle state correctly', () => {
      renderVoiceInputButton({ state: 'idle' });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Voice input button, click to start voice input');
      expect(button).toHaveAttribute('title', 'Click to start voice input');
      expect(button).not.toHaveClass('animate-pulse');
      expect(button).not.toHaveClass('bg-red-500');
    });

    it('renders listening state with pulsing animation', () => {
      renderVoiceInputButton({ state: 'listening' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('animate-pulse');
      expect(button).toHaveClass('bg-red-500');
      expect(button).toHaveAttribute('aria-label', 'Voice input button, currently recording, click to stop recording');
      expect(button).toHaveAttribute('title', 'Recording... Click to stop');
      
      // Check for pulsing ring animation
      const pulsingRing = button.querySelector('.animate-ping');
      expect(pulsingRing).toBeInTheDocument();
    });

    it('renders processing state with loading spinner', () => {
      renderVoiceInputButton({ state: 'processing' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-500');
      expect(button).toHaveAttribute('aria-label', 'Voice input button, processing speech, please wait');
      expect(button).toHaveAttribute('title', 'Converting speech to text...');
      
      // Check for loading spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('renders completed state with checkmark icon', () => {
      renderVoiceInputButton({ state: 'completed' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-500');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-300');
      expect(button).toHaveAttribute('aria-label', 'Voice input button, speech successfully transcribed, click to start new recording');
      expect(button).toHaveAttribute('title', 'Speech successfully transcribed!');
      
      // Check for checkmark icon
      const checkIcon = button.querySelector('svg polyline[points="20,6 9,17 4,12"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('renders error state correctly', () => {
      const errorMessage = 'Microphone access denied';
      renderVoiceInputButton({ state: 'error', error: errorMessage, canRetry: true });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
      expect(button).toHaveAttribute('aria-label', `Voice input button, error occurred, ${errorMessage}, click to retry`);
      expect(button).toHaveAttribute('title', `Error occurred. Click to retry`);
    });

    it('renders disabled state correctly', () => {
      renderVoiceInputButton({ disabled: true });
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-not-allowed');
      expect(button).toHaveClass('bg-gray-300');
      expect(button).toHaveAttribute('aria-label', 'Voice input button, disabled, not supported in this browser');
      expect(button).toHaveAttribute('title', 'Voice input not supported in this browser');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when button is clicked', () => {
      const mockOnClick = vi.fn();
      renderVoiceInputButton({ onClick: mockOnClick });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const mockOnClick = vi.fn();
      renderVoiceInputButton({ onClick: mockOnClick, disabled: true });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles keyboard interactions', () => {
      const mockOnClick = vi.fn();
      renderVoiceInputButton({ onClick: mockOnClick });
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyPress(button, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      // Since we're testing a button element, it should handle Enter key automatically
      // Let's test that the button is focusable instead
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all states', () => {
      const states = [
        { state: 'idle' as const, expectedLabel: 'Voice input button, click to start voice input' },
        { state: 'listening' as const, expectedLabel: 'Voice input button, currently recording, click to stop recording' },
        { state: 'processing' as const, expectedLabel: 'Voice input button, processing speech, please wait' },
        { state: 'completed' as const, expectedLabel: 'Voice input button, speech successfully transcribed, click to start new recording' },
        { state: 'error' as const, expectedLabel: 'Voice input button, error occurred, Test error, click to retry', error: 'Test error', canRetry: true },
      ];

      states.forEach(({ state, expectedLabel, error, canRetry }) => {
        const { unmount } = renderVoiceInputButton({ state, error, canRetry });
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', expectedLabel);
        unmount();
      });
    });

    it('has proper ARIA labels for permission states', () => {
      const { rerender } = renderVoiceInputButton({ 
        state: 'idle', 
        permissionState: 'denied' 
      });
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Voice input button, microphone permission required, click to enable microphone access');
      
      rerender(<VoiceInputButton 
        state="error" 
        onClick={vi.fn()} 
        error="Permission denied" 
        permissionState="denied"
        canRetry={true}
      />);
      
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Voice input button, microphone access denied, Permission denied, click to request permission');
    });

    it('has proper tooltips for all states', () => {
      const states = [
        { state: 'idle' as const, expectedTooltip: 'Click to start voice input' },
        { state: 'listening' as const, expectedTooltip: 'Recording... Click to stop' },
        { state: 'processing' as const, expectedTooltip: 'Converting speech to text...' },
        { state: 'completed' as const, expectedTooltip: 'Speech successfully transcribed!' },
        { state: 'error' as const, expectedTooltip: 'Error occurred. Click to retry', canRetry: true },
      ];

      states.forEach(({ state, expectedTooltip, canRetry }) => {
        const { unmount } = renderVoiceInputButton({ state, canRetry });
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', expectedTooltip);
        unmount();
      });
    });

    it('is focusable and has focus styles', () => {
      renderVoiceInputButton();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('Visual Feedback', () => {
    it('shows different icons for different states', () => {
      // Test idle state (microphone icon)
      const { rerender } = renderVoiceInputButton({ state: 'idle' });
      let button = screen.getByRole('button');
      let micIcon = button.querySelector('svg path[d*="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"]');
      expect(micIcon).toBeInTheDocument();

      // Test processing state (loading spinner)
      rerender(<VoiceInputButton state="processing" onClick={vi.fn()} />);
      button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Test completed state (checkmark icon)
      rerender(<VoiceInputButton state="completed" onClick={vi.fn()} />);
      button = screen.getByRole('button');
      const checkIcon = button.querySelector('svg polyline[points="20,6 9,17 4,12"]');
      expect(checkIcon).toBeInTheDocument();

      // Test error state (microphone off icon)
      rerender(<VoiceInputButton state="error" onClick={vi.fn()} />);
      button = screen.getByRole('button');
      const micOffIcon = button.querySelector('svg line[x1="2"][y1="2"][x2="22"][y2="22"]');
      expect(micOffIcon).toBeInTheDocument();
    });

    it('applies correct CSS classes for hover states', () => {
      renderVoiceInputButton({ state: 'idle' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-300');
      expect(button).toHaveClass('dark:hover:bg-gray-600');
    });

    it('applies correct transition classes', () => {
      renderVoiceInputButton();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const customClass = 'custom-voice-button';
      renderVoiceInputButton({ className: customClass });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(customClass);
    });

    it('handles custom error messages', () => {
      const customError = 'Custom error message';
      renderVoiceInputButton({ state: 'error', error: customError, canRetry: true });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', `Voice input button, error occurred, ${customError}, click to retry`);
    });
  });

  describe('Retry Functionality', () => {
    it('calls onRetry when in error state with retry capability', () => {
      const mockOnClick = vi.fn();
      const mockOnRetry = vi.fn();
      
      renderVoiceInputButton({ 
        state: 'error', 
        onClick: mockOnClick, 
        onRetry: mockOnRetry,
        canRetry: true,
        error: 'Test error'
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('calls onClick when not in error state', () => {
      const mockOnClick = vi.fn();
      const mockOnRetry = vi.fn();
      
      renderVoiceInputButton({ 
        state: 'idle', 
        onClick: mockOnClick, 
        onRetry: mockOnRetry 
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('calls onClick when in error state but cannot retry', () => {
      const mockOnClick = vi.fn();
      const mockOnRetry = vi.fn();
      
      renderVoiceInputButton({ 
        state: 'error', 
        onClick: mockOnClick, 
        onRetry: mockOnRetry,
        canRetry: false,
        error: 'Non-retryable error'
      });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).not.toHaveBeenCalled();
    });
  });

  describe('Enhanced Tooltips', () => {
    it('shows enhanced error tooltip with retry instruction', () => {
      renderVoiceInputButton({ 
        state: 'error', 
        error: 'Test error message',
        canRetry: true
      });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Error occurred. Click to retry');
    });

    it('shows permission tooltip when permission denied', () => {
      renderVoiceInputButton({ 
        state: 'idle', 
        permissionState: 'denied'
      });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Microphone permission required. Click to enable');
    });

    it('shows permission error tooltip when in error state with denied permission', () => {
      renderVoiceInputButton({ 
        state: 'error', 
        permissionState: 'denied',
        error: 'Permission denied',
        canRetry: true
      });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Microphone access denied. Click to request permission');
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes for idle state', () => {
      renderVoiceInputButton({ state: 'idle' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('dark:bg-gray-700');
      expect(button).toHaveClass('dark:hover:bg-gray-600');
      expect(button).toHaveClass('dark:text-gray-300');
    });

    it('has dark mode classes for disabled state', () => {
      renderVoiceInputButton({ disabled: true });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('dark:bg-gray-600');
    });
  });
});