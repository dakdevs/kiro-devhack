import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CandidateList } from '../candidate-list';
import { CandidateWithMatch, CandidateFilters } from '~/types/interview-management';

// Mock child components
vi.mock('../candidate-card', () => ({
  CandidateCard: ({ candidateMatch, onScheduleInterview }: any) => (
    <div data-testid="candidate-card">
      <span>{candidateMatch.candidate.name}</span>
      <button onClick={() => onScheduleInterview(candidateMatch.candidate.id)}>
        Schedule Interview
      </button>
    </div>
  ),
}));

vi.mock('../candidate-filters-panel', () => ({
  CandidateFiltersPanel: ({ filters, onFiltersChange, onClose }: any) => (
    <div data-testid="filters-panel">
      <button onClick={() => onFiltersChange({ skills: ['React'] })}>Apply Filters</button>
      <button onClick={onClose}>Close Filters</button>
    </div>
  ),
}));

vi.mock('~/components/interview-scheduling-modal', () => ({
  InterviewSchedulingModal: ({ isOpen, onClose, candidate, onSchedule }: any) => (
    isOpen ? (
      <div data-testid="scheduling-modal">
        <span>Scheduling for {candidate.candidate.name}</span>
        <button onClick={() => onSchedule({ candidateId: candidate.candidate.id })}>
          Schedule
        </button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockCandidates: CandidateWithMatch[] = [
  {
    candidate: {
      id: 'candidate1',
      name: 'John Doe',
      email: 'john@example.com',
      skills: [{ id: '1', name: 'JavaScript', proficiencyScore: 85 }],
    },
    match: {
      score: 85,
      matchingSkills: [{ name: 'JavaScript', required: true, confidence: 0.9 }],
      skillGaps: [],
      overallFit: 'excellent',
    },
  },
  {
    candidate: {
      id: 'candidate2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      skills: [{ id: '2', name: 'React', proficiencyScore: 90 }],
    },
    match: {
      score: 75,
      matchingSkills: [{ name: 'React', required: true, confidence: 0.95 }],
      skillGaps: [],
      overallFit: 'good',
    },
  },
];

const renderCandidateList = (props = {}) => {
  const defaultProps = {
    jobId: 'job1',
    initialCandidates: [],
    initialFilters: {},
    ...props,
  };
  return render(<CandidateList {...defaultProps} />);
};

describe('CandidateList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses by default
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/recruiter/jobs/job1/candidates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockCandidates,
            pagination: {
              total: 2,
              hasNext: false,
            },
          }),
        });
      }
      
      if (url.includes('/api/interviews/schedule')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Rendering', () => {
    it('renders header with candidate count', async () => {
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Candidates')).toBeInTheDocument();
        expect(screen.getByText('2 candidates found')).toBeInTheDocument();
      });
    });

    it('renders control buttons', () => {
      renderCandidateList();
      
      expect(screen.getByText('Filters +')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('renders sort controls', () => {
      renderCandidateList();
      
      expect(screen.getByDisplayValue('Match Score')).toBeInTheDocument();
      expect(screen.getByText('↓')).toBeInTheDocument(); // Descending sort
    });

    it('displays initial candidates when provided', () => {
      renderCandidateList({ initialCandidates: mockCandidates });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Filters', () => {
    it('shows filters panel when filters button is clicked', () => {
      renderCandidateList();
      
      const filtersButton = screen.getByText('Filters +');
      fireEvent.click(filtersButton);
      
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
    });

    it('hides filters panel when close is clicked', () => {
      renderCandidateList();
      
      const filtersButton = screen.getByText('Filters +');
      fireEvent.click(filtersButton);
      
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close Filters');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument();
    });

    it('updates filters button text when filters are shown', () => {
      renderCandidateList();
      
      const filtersButton = screen.getByText('Filters +');
      fireEvent.click(filtersButton);
      
      expect(screen.getByText('Filters −')).toBeInTheDocument();
    });

    it('applies filters and refetches candidates', async () => {
      renderCandidateList();
      
      const filtersButton = screen.getByText('Filters +');
      fireEvent.click(filtersButton);
      
      const applyFiltersButton = screen.getByText('Apply Filters');
      fireEvent.click(applyFiltersButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('skills=React'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Sorting', () => {
    it('changes sort field when dropdown is changed', async () => {
      renderCandidateList();
      
      const sortSelect = screen.getByDisplayValue('Match Score');
      fireEvent.change(sortSelect, { target: { value: 'name' } });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sortBy=name'),
          expect.any(Object)
        );
      });
    });

    it('toggles sort order when order button is clicked', async () => {
      renderCandidateList();
      
      const sortOrderButton = screen.getByText('↓');
      fireEvent.click(sortOrderButton);
      
      expect(screen.getByText('↑')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sortOrder=asc'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches candidates on initial load when no initial candidates provided', async () => {
      renderCandidateList();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/recruiter/jobs/job1/candidates'),
          expect.any(Object)
        );
      });
    });

    it('does not fetch on initial load when initial candidates are provided', () => {
      renderCandidateList({ initialCandidates: mockCandidates });
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('refreshes candidates when refresh button is clicked', async () => {
      renderCandidateList();
      
      // Clear initial fetch
      mockFetch.mockClear();
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/recruiter/jobs/job1/candidates/refresh'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch candidates')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                data: mockCandidates,
                pagination: { total: 2, hasNext: false },
              }),
            });
          }, 100);
        })
      );
      
      renderCandidateList();
      
      expect(screen.getByText('Loading candidates...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('shows load more button when there are more candidates', async () => {
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockCandidates,
            pagination: {
              total: 10,
              hasNext: true,
            },
          }),
        })
      );
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });
    });

    it('hides load more button when no more candidates', async () => {
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
      });
    });

    it('loads more candidates when load more is clicked', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('page=1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: mockCandidates,
              pagination: { total: 4, hasNext: true },
            }),
          });
        }
        if (url.includes('page=2')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [mockCandidates[0]], // Additional candidate
              pagination: { total: 4, hasNext: false },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });
      
      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Interview Scheduling', () => {
    it('opens scheduling modal when schedule interview is clicked', async () => {
      renderCandidateList({ initialCandidates: mockCandidates });
      
      const scheduleButtons = screen.getAllByText('Schedule Interview');
      fireEvent.click(scheduleButtons[0]);
      
      expect(screen.getByTestId('scheduling-modal')).toBeInTheDocument();
      expect(screen.getByText('Scheduling for John Doe')).toBeInTheDocument();
    });

    it('closes scheduling modal when close is clicked', async () => {
      renderCandidateList({ initialCandidates: mockCandidates });
      
      const scheduleButtons = screen.getAllByText('Schedule Interview');
      fireEvent.click(scheduleButtons[0]);
      
      expect(screen.getByTestId('scheduling-modal')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('scheduling-modal')).not.toBeInTheDocument();
    });

    it('handles successful interview scheduling', async () => {
      renderCandidateList({ initialCandidates: mockCandidates });
      
      const scheduleButtons = screen.getAllByText('Schedule Interview');
      fireEvent.click(scheduleButtons[0]);
      
      const scheduleButton = screen.getByText('Schedule');
      fireEvent.click(scheduleButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/interviews/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: 'candidate1' }),
        });
      });
    });

    it('handles scheduling errors', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/interviews/schedule')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Scheduling failed' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockCandidates,
            pagination: { total: 2, hasNext: false },
          }),
        });
      });
      
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderCandidateList({ initialCandidates: mockCandidates });
      
      const scheduleButtons = screen.getAllByText('Schedule Interview');
      fireEvent.click(scheduleButtons[0]);
      
      const scheduleButton = screen.getByText('Schedule');
      fireEvent.click(scheduleButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Scheduling failed');
      });
      
      alertSpy.mockRestore();
    });

    it('handles scheduling conflicts with suggested times', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/interviews/schedule')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: false,
              data: { suggestedTimes: [{ start: new Date(), end: new Date() }] },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockCandidates,
            pagination: { total: 2, hasNext: false },
          }),
        });
      });
      
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderCandidateList({ initialCandidates: mockCandidates });
      
      const scheduleButtons = screen.getAllByText('Schedule Interview');
      fireEvent.click(scheduleButtons[0]);
      
      const scheduleButton = screen.getByText('Schedule');
      fireEvent.click(scheduleButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('No mutual availability found')
        );
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no candidates found', async () => {
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [],
            pagination: { total: 0, hasNext: false },
          }),
        })
      );
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('No candidates found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or refresh the candidate list.')).toBeInTheDocument();
      });
    });

    it('shows refresh button in empty state', async () => {
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [],
            pagination: { total: 0, hasNext: false },
          }),
        })
      );
      
      renderCandidateList();
      
      await waitFor(() => {
        const refreshButtons = screen.getAllByText('Refresh Candidates');
        expect(refreshButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('disables refresh button while loading', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                data: mockCandidates,
                pagination: { total: 2, hasNext: false },
              }),
            });
          }, 100);
        })
      );
      
      renderCandidateList();
      
      const refreshButton = screen.getByText('Refreshing...');
      expect(refreshButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).not.toBeDisabled();
      });
    });

    it('disables load more button while loading more', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('page=1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: mockCandidates,
              pagination: { total: 4, hasNext: true },
            }),
          });
        }
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                data: [mockCandidates[0]],
                pagination: { total: 4, hasNext: false },
              }),
            });
          }, 100);
        });
      });
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });
      
      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper headings', async () => {
      renderCandidateList();
      
      await waitFor(() => {
        const heading = screen.getByText('Candidates');
        expect(heading.tagName).toBe('H2');
      });
    });

    it('has proper button labels', () => {
      renderCandidateList();
      
      expect(screen.getByText('Filters +')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderCandidateList();
      
      const filtersButton = screen.getByText('Filters +');
      const refreshButton = screen.getByText('Refresh');
      
      filtersButton.focus();
      expect(filtersButton).toHaveFocus();
      
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes to controls', () => {
      renderCandidateList();
      
      const controlsContainer = screen.getByText('Candidates').parentElement;
      expect(controlsContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('clears error when retrying', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: mockCandidates,
            pagination: { total: 2, hasNext: false },
          }),
        });
      
      renderCandidateList();
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});