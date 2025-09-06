import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterviewScheduler } from '~/app/schedule-interview/[jobId]/_modules/interview-scheduler';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  useParams: () => ({ jobId: 'test-job-id' }),
  useSearchParams: () => ({
    get: (key: string) => key === 'recruiter' ? 'test-recruiter-id' : null,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('InterviewScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    // Mock successful recruiter availability response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        connected: true,
        recruiter: {
          id: 'test-recruiter',
          name: 'Test Recruiter',
          calComUsername: 'test-recruiter',
          timezone: 'UTC',
        },
        eventTypes: [
          {
            id: 1,
            name: 'Interview',
            slug: 'interview',
            duration: 30,
            isActive: true,
          },
        ],
      }),
    });

    render(<InterviewScheduler />);
    
    expect(screen.getByText('Available Time Slots')).toBeInTheDocument();
  });

  it('should handle empty slots array without error', async () => {
    // Mock recruiter availability
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          connected: true,
          recruiter: {
            id: 'test-recruiter',
            name: 'Test Recruiter',
            calComUsername: 'test-recruiter',
            timezone: 'UTC',
          },
          eventTypes: [
            {
              id: 1,
              name: 'Interview',
              slug: 'interview',
              duration: 30,
              isActive: true,
            },
          ],
        }),
      })
      // Mock empty slots response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<InterviewScheduler />);

    await waitFor(() => {
      expect(screen.getByText('No available slots found for the next 30 days')).toBeInTheDocument();
    });
  });

  it('should handle non-array slots response without error', async () => {
    // Mock recruiter availability
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          connected: true,
          recruiter: {
            id: 'test-recruiter',
            name: 'Test Recruiter',
            calComUsername: 'test-recruiter',
            timezone: 'UTC',
          },
          eventTypes: [
            {
              id: 1,
              name: 'Interview',
              slug: 'interview',
              duration: 30,
              isActive: true,
            },
          ],
        }),
      })
      // Mock invalid slots response (not an array)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'No slots available' }),
      });

    render(<InterviewScheduler />);

    await waitFor(() => {
      expect(screen.getByText('No available slots found for the next 30 days')).toBeInTheDocument();
    });
  });

  it('should handle valid slots array', async () => {
    const mockSlots = [
      { time: '2024-12-15T10:00:00Z', attendees: 0 },
      { time: '2024-12-15T11:00:00Z', attendees: 0 },
    ];

    // Mock recruiter availability
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          connected: true,
          recruiter: {
            id: 'test-recruiter',
            name: 'Test Recruiter',
            calComUsername: 'test-recruiter',
            timezone: 'UTC',
          },
          eventTypes: [
            {
              id: 1,
              name: 'Interview',
              slug: 'interview',
              duration: 30,
              isActive: true,
            },
          ],
        }),
      })
      // Mock valid slots response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSlots,
      });

    render(<InterviewScheduler />);

    await waitFor(() => {
      expect(screen.getByText('12/15/2024')).toBeInTheDocument();
    });
  });
});