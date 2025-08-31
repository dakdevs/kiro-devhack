import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilitySlotForm } from '../availability-slot-form';
import { CandidateAvailability, CreateAvailabilityRequest } from '~/types/interview-management';

// Mock data
const mockAvailability: CandidateAvailability = {
  id: '1',
  userId: 'user1',
  startTime: new Date('2024-01-15T10:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  timezone: 'UTC',
  status: 'available',
  isRecurring: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRecurringAvailability: CandidateAvailability = {
  ...mockAvailability,
  id: '2',
  isRecurring: true,
  recurrencePattern: {
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    maxOccurrences: 10,
  },
};

const renderAvailabilitySlotForm = (props = {}) => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    ...props,
  };
  return render(<AvailabilitySlotForm {...defaultProps} />);
};

describe('AvailabilitySlotForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form with correct title for new availability', () => {
      renderAvailabilitySlotForm();
      
      expect(screen.getByText('Add Availability')).toBeInTheDocument();
      expect(screen.getByText('Set your available times for interviews')).toBeInTheDocument();
    });

    it('renders form with correct title for editing availability', () => {
      renderAvailabilitySlotForm({ availability: mockAvailability });
      
      expect(screen.getByText('Edit Availability')).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      renderAvailabilitySlotForm();
      
      expect(screen.getByLabelText(/Start Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Timezone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Make this recurring/)).toBeInTheDocument();
    });

    it('renders status field when editing existing availability', () => {
      renderAvailabilitySlotForm({ availability: mockAvailability });
      
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    });

    it('does not render status field when creating new availability', () => {
      renderAvailabilitySlotForm();
      
      expect(screen.queryByLabelText(/Status/)).not.toBeInTheDocument();
    });
  });

  describe('Form Initialization', () => {
    it('initializes with default values for new availability', () => {
      renderAvailabilitySlotForm({ initialDate: new Date('2024-01-15T00:00:00Z') });
      
      const startTimeInput = screen.getByLabelText(/Start Time/) as HTMLInputElement;
      const endTimeInput = screen.getByLabelText(/End Time/) as HTMLInputElement;
      
      expect(startTimeInput.value).toContain('2024-01-15T09:00');
      expect(endTimeInput.value).toContain('2024-01-15T10:00');
    });

    it('initializes with existing availability data when editing', () => {
      renderAvailabilitySlotForm({ availability: mockAvailability });
      
      const startTimeInput = screen.getByLabelText(/Start Time/) as HTMLInputElement;
      const endTimeInput = screen.getByLabelText(/End Time/) as HTMLInputElement;
      const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
      
      expect(startTimeInput.value).toContain('2024-01-15T10:00');
      expect(endTimeInput.value).toContain('2024-01-15T11:00');
      expect(statusSelect.value).toBe('available');
    });

    it('initializes recurring options when editing recurring availability', () => {
      renderAvailabilitySlotForm({ availability: mockRecurringAvailability });
      
      const recurringCheckbox = screen.getByLabelText(/Make this recurring/) as HTMLInputElement;
      expect(recurringCheckbox.checked).toBe(true);
      
      // Check that recurring options are visible
      expect(screen.getByLabelText(/Repeat/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Every/)).toBeInTheDocument();
      expect(screen.getByText('Days of the week')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when start time is missing', async () => {
      const mockOnSubmit = vi.fn();
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Start time is required')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when end time is missing', async () => {
      const mockOnSubmit = vi.fn();
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      const startTimeInput = screen.getByLabelText(/Start Time/);
      fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('End time is required')).toBeInTheDocument();
      });
    });

    it('shows error when end time is before start time', async () => {
      const mockOnSubmit = vi.fn();
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      const startTimeInput = screen.getByLabelText(/Start Time/);
      const endTimeInput = screen.getByLabelText(/End Time/);
      
      fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '2024-01-15T09:00' } });
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
      });
    });

    it('shows error when start time is in the past for new availability', async () => {
      const mockOnSubmit = vi.fn();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      const startTimeInput = screen.getByLabelText(/Start Time/);
      const endTimeInput = screen.getByLabelText(/End Time/);
      
      fireEvent.change(startTimeInput, { target: { value: pastDate.toISOString().slice(0, 16) } });
      fireEvent.change(endTimeInput, { target: { value: new Date().toISOString().slice(0, 16) } });
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Start time must be in the future')).toBeInTheDocument();
      });
    });

    it('validates recurring options when recurring is enabled', async () => {
      const mockOnSubmit = vi.fn();
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      // Fill required fields
      const startTimeInput = screen.getByLabelText(/Start Time/);
      const endTimeInput = screen.getByLabelText(/End Time/);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureEndDate = new Date(futureDate);
      futureEndDate.setHours(futureEndDate.getHours() + 1);
      
      fireEvent.change(startTimeInput, { target: { value: futureDate.toISOString().slice(0, 16) } });
      fireEvent.change(endTimeInput, { target: { value: futureEndDate.toISOString().slice(0, 16) } });
      
      // Enable recurring
      const recurringCheckbox = screen.getByLabelText(/Make this recurring/);
      fireEvent.click(recurringCheckbox);
      
      // Submit without selecting days of week
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Select at least one day of the week')).toBeInTheDocument();
      });
    });
  });

  describe('Recurring Options', () => {
    it('shows recurring options when checkbox is checked', () => {
      renderAvailabilitySlotForm();
      
      const recurringCheckbox = screen.getByLabelText(/Make this recurring/);
      fireEvent.click(recurringCheckbox);
      
      expect(screen.getByLabelText(/Repeat/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Every/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Max Occurrences/)).toBeInTheDocument();
    });

    it('hides recurring options when checkbox is unchecked', () => {
      renderAvailabilitySlotForm();
      
      expect(screen.queryByLabelText(/Repeat/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Every/)).not.toBeInTheDocument();
    });

    it('shows days of week selection for weekly recurrence', () => {
      renderAvailabilitySlotForm();
      
      const recurringCheckbox = screen.getByLabelText(/Make this recurring/);
      fireEvent.click(recurringCheckbox);
      
      const recurrenceTypeSelect = screen.getByLabelText(/Repeat/);
      fireEvent.change(recurrenceTypeSelect, { target: { value: 'weekly' } });
      
      expect(screen.getByText('Days of the week')).toBeInTheDocument();
      expect(screen.getByLabelText(/Sun/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mon/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tue/)).toBeInTheDocument();
    });

    it('allows selecting multiple days of the week', () => {
      renderAvailabilitySlotForm();
      
      const recurringCheckbox = screen.getByLabelText(/Make this recurring/);
      fireEvent.click(recurringCheckbox);
      
      const mondayCheckbox = screen.getByLabelText(/Mon/) as HTMLInputElement;
      const wednesdayCheckbox = screen.getByLabelText(/Wed/) as HTMLInputElement;
      
      fireEvent.click(mondayCheckbox);
      fireEvent.click(wednesdayCheckbox);
      
      expect(mondayCheckbox.checked).toBe(true);
      expect(wednesdayCheckbox.checked).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('submits form with correct data for new availability', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      const startTimeInput = screen.getByLabelText(/Start Time/);
      const endTimeInput = screen.getByLabelText(/End Time/);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(10, 0, 0, 0);
      const futureEndDate = new Date(futureDate);
      futureEndDate.setHours(11, 0, 0, 0);
      
      fireEvent.change(startTimeInput, { target: { value: futureDate.toISOString().slice(0, 16) } });
      fireEvent.change(endTimeInput, { target: { value: futureEndDate.toISOString().slice(0, 16) } });
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            startTime: futureDate.toISOString().slice(0, 16),
            endTime: futureEndDate.toISOString().slice(0, 16),
            timezone: expect.any(String),
            isRecurring: false,
          })
        );
      });
    });

    it('submits form with recurring data when recurring is enabled', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      // Fill required fields
      const startTimeInput = screen.getByLabelText(/Start Time/);
      const endTimeInput = screen.getByLabelText(/End Time/);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(10, 0, 0, 0);
      const futureEndDate = new Date(futureDate);
      futureEndDate.setHours(11, 0, 0, 0);
      
      fireEvent.change(startTimeInput, { target: { value: futureDate.toISOString().slice(0, 16) } });
      fireEvent.change(endTimeInput, { target: { value: futureEndDate.toISOString().slice(0, 16) } });
      
      // Enable recurring
      const recurringCheckbox = screen.getByLabelText(/Make this recurring/);
      fireEvent.click(recurringCheckbox);
      
      // Select Monday
      const mondayCheckbox = screen.getByLabelText(/Mon/);
      fireEvent.click(mondayCheckbox);
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            isRecurring: true,
            recurrencePattern: expect.objectContaining({
              type: 'weekly',
              interval: 1,
              daysOfWeek: [1], // Monday
            }),
          })
        );
      });
    });

    it('includes status when editing existing availability', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      renderAvailabilitySlotForm({ 
        availability: mockAvailability,
        onSubmit: mockOnSubmit 
      });
      
      const statusSelect = screen.getByLabelText(/Status/);
      fireEvent.change(statusSelect, { target: { value: 'unavailable' } });
      
      const submitButton = screen.getByText(/Update.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'unavailable',
          })
        );
      });
    });
  });

  describe('Loading State', () => {
    it('disables form fields when loading', () => {
      renderAvailabilitySlotForm({ isLoading: true });
      
      const startTimeInput = screen.getByLabelText(/Start Time/) as HTMLInputElement;
      const endTimeInput = screen.getByLabelText(/End Time/) as HTMLInputElement;
      const submitButton = screen.getByText(/Add.*Availability/) as HTMLButtonElement;
      
      expect(startTimeInput.disabled).toBe(true);
      expect(endTimeInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });

    it('shows loading text on submit button when loading', () => {
      renderAvailabilitySlotForm({ isLoading: true });
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const mockOnCancel = vi.fn();
      renderAvailabilitySlotForm({ onCancel: mockOnCancel });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('disables cancel button when loading', () => {
      renderAvailabilitySlotForm({ isLoading: true });
      
      const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
      expect(cancelButton.disabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('clears errors when user starts typing', async () => {
      const mockOnSubmit = vi.fn();
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      // Trigger validation error
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Start time is required')).toBeInTheDocument();
      });
      
      // Start typing in start time field
      const startTimeInput = screen.getByLabelText(/Start Time/);
      fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
      
      // Error should be cleared
      expect(screen.queryByText('Start time is required')).not.toBeInTheDocument();
    });
  });

  describe('Timezone Support', () => {
    it('includes timezone options', () => {
      renderAvailabilitySlotForm();
      
      const timezoneSelect = screen.getByLabelText(/Timezone/);
      expect(timezoneSelect).toBeInTheDocument();
      
      // Check for some common timezone options
      expect(screen.getByText('UTC')).toBeInTheDocument();
      expect(screen.getByText('Eastern Time')).toBeInTheDocument();
      expect(screen.getByText('Pacific Time')).toBeInTheDocument();
    });

    it('uses system timezone as default', () => {
      renderAvailabilitySlotForm();
      
      const timezoneSelect = screen.getByLabelText(/Timezone/) as HTMLSelectElement;
      // Should have a default value (system timezone)
      expect(timezoneSelect.value).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      renderAvailabilitySlotForm();
      
      expect(screen.getByLabelText(/Start Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Timezone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Make this recurring/)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      const mockOnSubmit = vi.fn();
      renderAvailabilitySlotForm({ onSubmit: mockOnSubmit });
      
      const submitButton = screen.getByText(/Add.*Availability/);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Start time is required');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', () => {
      renderAvailabilitySlotForm();
      
      const startTimeInput = screen.getByLabelText(/Start Time/);
      const endTimeInput = screen.getByLabelText(/End Time/);
      const submitButton = screen.getByText(/Add.*Availability/);
      
      // All interactive elements should be focusable
      startTimeInput.focus();
      expect(startTimeInput).toHaveFocus();
      
      endTimeInput.focus();
      expect(endTimeInput).toHaveFocus();
      
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });
});