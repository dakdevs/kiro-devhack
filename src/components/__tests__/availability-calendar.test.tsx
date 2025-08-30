import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityCalendar } from '../availability-calendar';
import { CandidateAvailability, TimeSlot } from '~/types/interview-management';

// Mock data
const mockAvailability: CandidateAvailability[] = [
  {
    id: '1',
    userId: 'user1',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    timezone: 'UTC',
    status: 'available',
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    startTime: new Date('2024-01-15T14:00:00Z'),
    endTime: new Date('2024-01-15T15:00:00Z'),
    timezone: 'UTC',
    status: 'booked',
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    startTime: new Date('2024-01-16T09:00:00Z'),
    endTime: new Date('2024-01-16T10:00:00Z'),
    timezone: 'UTC',
    status: 'unavailable',
    isRecurring: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const renderAvailabilityCalendar = (props = {}) => {
  const defaultProps = {
    availability: mockAvailability,
    selectedDate: new Date('2024-01-15'),
    timezone: 'UTC',
    readonly: false,
    ...props,
  };
  return render(<AvailabilityCalendar {...defaultProps} />);
};

describe('AvailabilityCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders calendar with correct month and year', () => {
      renderAvailabilityCalendar({ selectedDate: new Date('2024-01-15') });
      
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('renders day headers correctly', () => {
      renderAvailabilityCalendar();
      
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('renders navigation buttons', () => {
      renderAvailabilityCalendar();
      
      const prevButton = screen.getByLabelText('Previous month');
      const nextButton = screen.getByLabelText('Next month');
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('renders legend with status indicators', () => {
      renderAvailabilityCalendar();
      
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Booked')).toBeInTheDocument();
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    it('shows help text when not readonly', () => {
      renderAvailabilityCalendar({ readonly: false });
      
      expect(screen.getByText(/Click on a date to add availability/)).toBeInTheDocument();
    });

    it('hides help text when readonly', () => {
      renderAvailabilityCalendar({ readonly: true });
      
      expect(screen.queryByText(/Click on a date to add availability/)).not.toBeInTheDocument();
    });
  });

  describe('Availability Display', () => {
    it('displays availability slots on correct dates', () => {
      renderAvailabilityCalendar();
      
      // Check for availability slots (they should show time)
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    it('applies correct colors for different availability statuses', () => {
      renderAvailabilityCalendar();
      
      const availableSlot = screen.getByText('10:00 AM').closest('div');
      const bookedSlot = screen.getByText('2:00 PM').closest('div');
      const unavailableSlot = screen.getByText('9:00 AM').closest('div');
      
      expect(availableSlot).toHaveClass('bg-apple-green');
      expect(bookedSlot).toHaveClass('bg-apple-blue');
      expect(unavailableSlot).toHaveClass('bg-gray-400');
    });

    it('shows tooltips with full time range and status', () => {
      renderAvailabilityCalendar();
      
      const availableSlot = screen.getByText('10:00 AM').closest('div');
      expect(availableSlot).toHaveAttribute('title', '10:00 AM - 11:00 AM (available)');
    });
  });

  describe('Navigation', () => {
    it('navigates to previous month when previous button is clicked', () => {
      renderAvailabilityCalendar({ selectedDate: new Date('2024-02-15') });
      
      expect(screen.getByText('February 2024')).toBeInTheDocument();
      
      const prevButton = screen.getByLabelText('Previous month');
      fireEvent.click(prevButton);
      
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('navigates to next month when next button is clicked', () => {
      renderAvailabilityCalendar({ selectedDate: new Date('2024-01-15') });
      
      expect(screen.getByText('January 2024')).toBeInTheDocument();
      
      const nextButton = screen.getByLabelText('Next month');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('February 2024')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onSlotSelect when date is clicked in non-readonly mode', () => {
      const mockOnSlotSelect = vi.fn();
      renderAvailabilityCalendar({ 
        onSlotSelect: mockOnSlotSelect,
        readonly: false 
      });
      
      // Find a date cell and click it
      const dateCell = screen.getByText('20').closest('div');
      fireEvent.click(dateCell!);
      
      expect(mockOnSlotSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
          timezone: 'UTC'
        })
      );
    });

    it('does not call onSlotSelect when date is clicked in readonly mode', () => {
      const mockOnSlotSelect = vi.fn();
      renderAvailabilityCalendar({ 
        onSlotSelect: mockOnSlotSelect,
        readonly: true 
      });
      
      const dateCell = screen.getByText('20').closest('div');
      fireEvent.click(dateCell!);
      
      expect(mockOnSlotSelect).not.toHaveBeenCalled();
    });

    it('calls onSlotEdit when availability slot is clicked', () => {
      const mockOnSlotEdit = vi.fn();
      renderAvailabilityCalendar({ 
        onSlotEdit: mockOnSlotEdit,
        readonly: false 
      });
      
      const availabilitySlot = screen.getByText('10:00 AM');
      fireEvent.click(availabilitySlot);
      
      expect(mockOnSlotEdit).toHaveBeenCalledWith(mockAvailability[0]);
    });

    it('does not call onSlotEdit when slot is clicked in readonly mode', () => {
      const mockOnSlotEdit = vi.fn();
      renderAvailabilityCalendar({ 
        onSlotEdit: mockOnSlotEdit,
        readonly: true 
      });
      
      const availabilitySlot = screen.getByText('10:00 AM');
      fireEvent.click(availabilitySlot);
      
      expect(mockOnSlotEdit).not.toHaveBeenCalled();
    });

    it('prevents event bubbling when slot is clicked', () => {
      const mockOnSlotSelect = vi.fn();
      const mockOnSlotEdit = vi.fn();
      
      renderAvailabilityCalendar({ 
        onSlotSelect: mockOnSlotSelect,
        onSlotEdit: mockOnSlotEdit,
        readonly: false 
      });
      
      const availabilitySlot = screen.getByText('10:00 AM');
      fireEvent.click(availabilitySlot);
      
      // Should call onSlotEdit but not onSlotSelect (event should not bubble)
      expect(mockOnSlotEdit).toHaveBeenCalled();
      expect(mockOnSlotSelect).not.toHaveBeenCalled();
    });
  });

  describe('Date Highlighting', () => {
    it('highlights today\'s date', () => {
      const today = new Date();
      renderAvailabilityCalendar({ selectedDate: today });
      
      const todayElement = screen.getByText(today.getDate().toString());
      expect(todayElement).toHaveClass('text-apple-blue', 'font-semibold');
    });

    it('dims dates from other months', () => {
      renderAvailabilityCalendar({ selectedDate: new Date('2024-01-15') });
      
      // Find a date from previous/next month (usually at the edges)
      const calendarDays = screen.getAllByText(/^\d+$/);
      const firstDay = calendarDays[0];
      
      // If it's a small number and we're in January, it's likely from December
      if (parseInt(firstDay.textContent!) > 25) {
        expect(firstDay).toHaveClass('text-gray-400');
      }
    });
  });

  describe('Timezone Support', () => {
    it('formats times according to specified timezone', () => {
      renderAvailabilityCalendar({ timezone: 'America/New_York' });
      
      // The times should be formatted according to the timezone
      // This is a basic check - in a real app you'd want more specific timezone testing
      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation buttons', () => {
      renderAvailabilityCalendar();
      
      const prevButton = screen.getByLabelText('Previous month');
      const nextButton = screen.getByLabelText('Next month');
      
      expect(prevButton).toHaveAttribute('aria-label', 'Previous month');
      expect(nextButton).toHaveAttribute('aria-label', 'Next month');
    });

    it('provides meaningful titles for availability slots', () => {
      renderAvailabilityCalendar();
      
      const availableSlot = screen.getByText('10:00 AM').closest('div');
      expect(availableSlot).toHaveAttribute('title');
      expect(availableSlot!.getAttribute('title')).toContain('available');
    });

    it('supports keyboard navigation', () => {
      renderAvailabilityCalendar();
      
      const prevButton = screen.getByLabelText('Previous month');
      const nextButton = screen.getByLabelText('Next month');
      
      // Buttons should be focusable
      prevButton.focus();
      expect(prevButton).toHaveFocus();
      
      nextButton.focus();
      expect(nextButton).toHaveFocus();
    });
  });

  describe('Empty State', () => {
    it('renders calendar without availability slots', () => {
      renderAvailabilityCalendar({ availability: [] });
      
      expect(screen.getByText('January 2024')).toBeInTheDocument();
      expect(screen.queryByText('10:00 AM')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      const { container } = renderAvailabilityCalendar();
      
      const calendarGrid = container.querySelector('.grid-cols-7');
      expect(calendarGrid).toBeInTheDocument();
    });
  });
});