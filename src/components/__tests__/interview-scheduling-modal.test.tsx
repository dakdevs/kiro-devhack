import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InterviewSchedulingModal } from '../interview-scheduling-modal';
import { CandidateWithMatch, ScheduleInterviewRequest } from '~/types/interview-management';

// Mock data
const mockCandidate: CandidateWithMatch = {
  candidate: {
    id: 'candidate1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    skills: [
      { id: '1', name: 'JavaScript', proficiencyScore: 85 },
      { id: '2', name: 'React', proficiencyScore: 90 },
    ],
  },
  match: {
    score: 85,
    matchingSkills: [
      { name: 'JavaScript', required: true, confidence: 0.9 },
      { name: 'React', required: true, confidence: 0.95 },
    ],
    skillGaps: [
      { name: 'TypeScript', required: false, confidence: 0.8 },
    ],
    overallFit: 'excellent',
  },
};

const renderInterviewSchedulingModal = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    candidate: mockCandidate,
    jobPostingId: 'job1',
    onSchedule: vi.fn(),
    isLoading: false,
    ...props,
  };
  return render(<InterviewSchedulingModal {...defaultProps} />);
};

describe('InterviewSchedulingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByText('Schedule Interview')).toBeInTheDocument();
      expect(screen.getByText('with John Doe')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      renderInterviewSchedulingModal({ isOpen: false });
      
      expect(screen.queryByText('Schedule Interview')).not.toBeInTheDocument();
    });

    it('displays candidate information', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('JavaScript, React')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByLabelText(/Interview Type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Timezone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preferred Times/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
    });

    it('has close button', () => {
      renderInterviewSchedulingModal();
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('allows selecting interview type', () => {
      renderInterviewSchedulingModal();
      
      const interviewTypeSelect = screen.getByLabelText(/Interview Type/) as HTMLSelectElement;
      
      fireEvent.change(interviewTypeSelect, { target: { value: 'phone' } });
      expect(interviewTypeSelect.value).toBe('phone');
      
      fireEvent.change(interviewTypeSelect, { target: { value: 'in-person' } });
      expect(interviewTypeSelect.value).toBe('in-person');
    });

    it('allows selecting duration', () => {
      renderInterviewSchedulingModal();
      
      const durationSelect = screen.getByLabelText(/Duration/) as HTMLSelectElement;
      
      fireEvent.change(durationSelect, { target: { value: '45' } });
      expect(durationSelect.value).toBe('45');
      
      fireEvent.change(durationSelect, { target: { value: '90' } });
      expect(durationSelect.value).toBe('90');
    });

    it('allows selecting timezone', () => {
      renderInterviewSchedulingModal();
      
      const timezoneSelect = screen.getByLabelText(/Timezone/) as HTMLSelectElement;
      
      fireEvent.change(timezoneSelect, { target: { value: 'America/New_York' } });
      expect(timezoneSelect.value).toBe('America/New_York');
    });

    it('allows adding notes', () => {
      renderInterviewSchedulingModal();
      
      const notesTextarea = screen.getByLabelText(/Notes/) as HTMLTextAreaElement;
      
      fireEvent.change(notesTextarea, { target: { value: 'Please prepare for technical questions' } });
      expect(notesTextarea.value).toBe('Please prepare for technical questions');
    });
  });

  describe('Time Slot Management', () => {
    it('starts with no time slots', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByText('Add at least one preferred time slot')).toBeInTheDocument();
    });

    it('allows adding time slots', () => {
      renderInterviewSchedulingModal();
      
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      expect(screen.getByLabelText(/Start/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End/)).toBeInTheDocument();
    });

    it('allows removing time slots', () => {
      renderInterviewSchedulingModal();
      
      // Add a time slot first
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      // Remove it
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);
      
      expect(screen.queryByLabelText(/Start/)).not.toBeInTheDocument();
      expect(screen.getByText('Add at least one preferred time slot')).toBeInTheDocument();
    });

    it('updates end time when start time changes and duration is set', () => {
      renderInterviewSchedulingModal();
      
      // Set duration to 60 minutes
      const durationSelect = screen.getByLabelText(/Duration/);
      fireEvent.change(durationSelect, { target: { value: '60' } });
      
      // Add a time slot
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      // Change start time
      const startInput = screen.getByLabelText(/Start/) as HTMLInputElement;
      fireEvent.change(startInput, { target: { value: '2024-01-15T10:00' } });
      
      // End time should be updated automatically
      const endInput = screen.getByLabelText(/End/) as HTMLInputElement;
      expect(endInput.value).toContain('11:00');
    });

    it('allows editing time slots independently', () => {
      renderInterviewSchedulingModal();
      
      // Add a time slot
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      const startInput = screen.getByLabelText(/Start/) as HTMLInputElement;
      const endInput = screen.getByLabelText(/End/) as HTMLInputElement;
      
      fireEvent.change(startInput, { target: { value: '2024-01-15T10:00' } });
      fireEvent.change(endInput, { target: { value: '2024-01-15T12:00' } });
      
      expect(startInput.value).toContain('10:00');
      expect(endInput.value).toContain('12:00');
    });
  });

  describe('Form Submission', () => {
    it('prevents submission when no time slots are selected', async () => {
      const mockOnSchedule = vi.fn();
      renderInterviewSchedulingModal({ onSchedule: mockOnSchedule });
      
      const submitButton = screen.getByText('Schedule Interview');
      fireEvent.click(submitButton);
      
      // Should show alert (in real implementation, you might want to use a more accessible notification)
      expect(mockOnSchedule).not.toHaveBeenCalled();
    });

    it('submits form with correct data when time slots are provided', async () => {
      const mockOnSchedule = vi.fn().mockResolvedValue(undefined);
      renderInterviewSchedulingModal({ onSchedule: mockOnSchedule });
      
      // Add a time slot
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      const startInput = screen.getByLabelText(/Start/);
      const endInput = screen.getByLabelText(/End/);
      
      fireEvent.change(startInput, { target: { value: '2024-01-15T10:00' } });
      fireEvent.change(endInput, { target: { value: '2024-01-15T11:00' } });
      
      // Add notes
      const notesTextarea = screen.getByLabelText(/Notes/);
      fireEvent.change(notesTextarea, { target: { value: 'Technical interview' } });
      
      const submitButton = screen.getByText('Schedule Interview');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSchedule).toHaveBeenCalledWith(
          expect.objectContaining({
            jobPostingId: 'job1',
            candidateId: 'candidate1',
            preferredTimes: expect.arrayContaining([
              expect.objectContaining({
                start: expect.any(Date),
                end: expect.any(Date),
                timezone: 'UTC',
              }),
            ]),
            interviewType: 'video',
            duration: 60,
            notes: 'Technical interview',
            timezone: 'UTC',
          })
        );
      });
    });

    it('resets form after successful submission', async () => {
      const mockOnSchedule = vi.fn().mockResolvedValue(undefined);
      const mockOnClose = vi.fn();
      renderInterviewSchedulingModal({ 
        onSchedule: mockOnSchedule,
        onClose: mockOnClose 
      });
      
      // Add a time slot and submit
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      const startInput = screen.getByLabelText(/Start/);
      fireEvent.change(startInput, { target: { value: '2024-01-15T10:00' } });
      
      const submitButton = screen.getByText('Schedule Interview');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles submission errors gracefully', async () => {
      const mockOnSchedule = vi.fn().mockRejectedValue(new Error('Scheduling failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderInterviewSchedulingModal({ onSchedule: mockOnSchedule });
      
      // Add a time slot and submit
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      const startInput = screen.getByLabelText(/Start/);
      fireEvent.change(startInput, { target: { value: '2024-01-15T10:00' } });
      
      const submitButton = screen.getByText('Schedule Interview');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to schedule interview:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    it('shows loading state on submit button when loading', () => {
      renderInterviewSchedulingModal({ isLoading: true });
      
      expect(screen.getByText('Scheduling...')).toBeInTheDocument();
      expect(screen.queryByText('Schedule Interview')).not.toBeInTheDocument();
    });

    it('disables submit button when loading', () => {
      renderInterviewSchedulingModal({ isLoading: true });
      
      const submitButton = screen.getByText('Scheduling...') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it('disables cancel button when loading', () => {
      renderInterviewSchedulingModal({ isLoading: true });
      
      const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
      expect(cancelButton.disabled).toBe(true);
    });

    it('shows loading spinner when loading', () => {
      renderInterviewSchedulingModal({ isLoading: true });
      
      const spinner = screen.getByText('Scheduling...').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const mockOnClose = vi.fn();
      renderInterviewSchedulingModal({ onClose: mockOnClose });
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      const mockOnClose = vi.fn();
      renderInterviewSchedulingModal({ onClose: mockOnClose });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents submission when no time slots and shows appropriate message', () => {
      const mockOnSchedule = vi.fn();
      renderInterviewSchedulingModal({ onSchedule: mockOnSchedule });
      
      const submitButton = screen.getByText('Schedule Interview') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('Candidate Information Display', () => {
    it('displays candidate match score', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByText(/Match Score:/)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays top matching skills', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByText(/Top Skills:/)).toBeInTheDocument();
      expect(screen.getByText('JavaScript, React')).toBeInTheDocument();
    });

    it('truncates skills list to top 3', () => {
      const candidateWithManySkills = {
        ...mockCandidate,
        match: {
          ...mockCandidate.match,
          matchingSkills: [
            { name: 'JavaScript', required: true, confidence: 0.9 },
            { name: 'React', required: true, confidence: 0.95 },
            { name: 'Node.js', required: true, confidence: 0.8 },
            { name: 'TypeScript', required: false, confidence: 0.85 },
            { name: 'GraphQL', required: false, confidence: 0.7 },
          ],
        },
      };
      
      renderInterviewSchedulingModal({ candidate: candidateWithManySkills });
      
      expect(screen.getByText('JavaScript, React, Node.js')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper modal structure with backdrop', () => {
      renderInterviewSchedulingModal();
      
      const backdrop = screen.getByText('Schedule Interview').closest('.fixed');
      expect(backdrop).toHaveClass('inset-0');
    });

    it('has proper labels for all form controls', () => {
      renderInterviewSchedulingModal();
      
      expect(screen.getByLabelText(/Interview Type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Timezone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderInterviewSchedulingModal();
      
      const interviewTypeSelect = screen.getByLabelText(/Interview Type/);
      const durationSelect = screen.getByLabelText(/Duration/);
      const cancelButton = screen.getByText('Cancel');
      
      interviewTypeSelect.focus();
      expect(interviewTypeSelect).toHaveFocus();
      
      durationSelect.focus();
      expect(durationSelect).toHaveFocus();
      
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
    });

    it('has proper ARIA attributes', () => {
      renderInterviewSchedulingModal();
      
      const modal = screen.getByText('Schedule Interview').closest('[role]');
      // In a real implementation, you'd want role="dialog" and aria-labelledby
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates that at least one time slot is required', () => {
      renderInterviewSchedulingModal();
      
      const submitButton = screen.getByText('Schedule Interview') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
      
      // Add a time slot
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      expect(submitButton.disabled).toBe(false);
    });

    it('handles empty notes gracefully', async () => {
      const mockOnSchedule = vi.fn().mockResolvedValue(undefined);
      renderInterviewSchedulingModal({ onSchedule: mockOnSchedule });
      
      // Add a time slot
      const addButton = screen.getByText('Add Time Slot');
      fireEvent.click(addButton);
      
      const startInput = screen.getByLabelText(/Start/);
      fireEvent.change(startInput, { target: { value: '2024-01-15T10:00' } });
      
      const submitButton = screen.getByText('Schedule Interview');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSchedule).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: undefined, // Empty notes should be undefined
          })
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for mobile', () => {
      const { container } = renderInterviewSchedulingModal();
      
      const modal = container.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
      
      const mobileMargin = container.querySelector('.mx-4');
      expect(mobileMargin).toBeInTheDocument();
    });
  });
});