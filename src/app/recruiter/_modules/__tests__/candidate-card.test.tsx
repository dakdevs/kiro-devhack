import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CandidateCard } from '../candidate-card';
import { CandidateWithMatch } from '~/types/interview-management';

// Mock the SkillMatchIndicator component
vi.mock('../skill-match-indicator', () => ({
  SkillMatchIndicator: ({ skill }: { skill: any }) => (
    <div data-testid="skill-match-indicator">{skill.name}</div>
  ),
}));

// Mock data
const mockCandidateMatch: CandidateWithMatch = {
  candidate: {
    id: 'candidate1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    experienceLevel: 'senior',
    location: 'San Francisco, CA',
    skills: [
      { id: '1', name: 'JavaScript', proficiencyScore: 85 },
      { id: '2', name: 'React', proficiencyScore: 90 },
      { id: '3', name: 'Node.js', proficiencyScore: 80 },
      { id: '4', name: 'TypeScript', proficiencyScore: 75 },
      { id: '5', name: 'GraphQL', proficiencyScore: 70 },
    ],
  },
  match: {
    score: 85,
    matchingSkills: [
      { name: 'JavaScript', required: true, confidence: 0.9 },
      { name: 'React', required: true, confidence: 0.95 },
      { name: 'Node.js', required: false, confidence: 0.8 },
      { name: 'TypeScript', required: false, confidence: 0.85 },
    ],
    skillGaps: [
      { name: 'Python', required: false, confidence: 0.8 },
      { name: 'Docker', required: true, confidence: 0.9 },
    ],
    overallFit: 'excellent',
    availability: [
      {
        id: '1',
        userId: 'candidate1',
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
        userId: 'candidate1',
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T15:00:00Z'),
        timezone: 'UTC',
        status: 'available',
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
};

const renderCandidateCard = (props = {}) => {
  const defaultProps = {
    candidateMatch: mockCandidateMatch,
    jobId: 'job1',
    onScheduleInterview: vi.fn(),
    ...props,
  };
  return render(<CandidateCard {...defaultProps} />);
};

describe('CandidateCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders candidate basic information', () => {
      renderCandidateCard();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('senior')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });

    it('renders candidate avatar with first letter', () => {
      renderCandidateCard();
      
      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
      expect(avatar.closest('div')).toHaveClass('bg-gradient-to-br', 'from-apple-blue', 'to-apple-purple');
    });

    it('displays match score with correct styling', () => {
      renderCandidateCard();
      
      const matchScore = screen.getByText('85% match');
      expect(matchScore).toBeInTheDocument();
      expect(matchScore).toHaveClass('text-green-600', 'bg-green-50');
    });

    it('displays overall fit badge', () => {
      renderCandidateCard();
      
      const fitBadge = screen.getByText('excellent fit');
      expect(fitBadge).toBeInTheDocument();
      expect(fitBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('shows matching skills count', () => {
      renderCandidateCard();
      
      expect(screen.getByText('Matching Skills (4)')).toBeInTheDocument();
    });

    it('renders skill match indicators', () => {
      renderCandidateCard();
      
      const skillIndicators = screen.getAllByTestId('skill-match-indicator');
      expect(skillIndicators).toHaveLength(4); // First 4 skills when not expanded
    });
  });

  describe('Match Score Colors', () => {
    it('shows green for high match scores (80+)', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, score: 85 }
        }
      });
      
      const matchScore = screen.getByText('85% match');
      expect(matchScore).toHaveClass('text-green-600', 'bg-green-50');
    });

    it('shows blue for good match scores (60-79)', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, score: 65 }
        }
      });
      
      const matchScore = screen.getByText('65% match');
      expect(matchScore).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    it('shows yellow for fair match scores (40-59)', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, score: 45 }
        }
      });
      
      const matchScore = screen.getByText('45% match');
      expect(matchScore).toHaveClass('text-yellow-600', 'bg-yellow-50');
    });

    it('shows red for poor match scores (<40)', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, score: 25 }
        }
      });
      
      const matchScore = screen.getByText('25% match');
      expect(matchScore).toHaveClass('text-red-600', 'bg-red-50');
    });
  });

  describe('Overall Fit Badge Colors', () => {
    it('shows green for excellent fit', () => {
      renderCandidateCard();
      
      const fitBadge = screen.getByText('excellent fit');
      expect(fitBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('shows blue for good fit', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, overallFit: 'good' }
        }
      });
      
      const fitBadge = screen.getByText('good fit');
      expect(fitBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('shows yellow for fair fit', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, overallFit: 'fair' }
        }
      });
      
      const fitBadge = screen.getByText('fair fit');
      expect(fitBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('shows red for poor fit', () => {
      renderCandidateCard({
        candidateMatch: {
          ...mockCandidateMatch,
          match: { ...mockCandidateMatch.match, overallFit: 'poor' }
        }
      });
      
      const fitBadge = screen.getByText('poor fit');
      expect(fitBadge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Expansion Functionality', () => {
    it('shows limited skills initially', () => {
      renderCandidateCard();
      
      const skillIndicators = screen.getAllByTestId('skill-match-indicator');
      expect(skillIndicators).toHaveLength(4); // Limited to first 4
      
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('shows all skills when expanded', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      const skillIndicators = screen.getAllByTestId('skill-match-indicator');
      expect(skillIndicators).toHaveLength(4); // All matching skills
      
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('shows expanded details when expanded', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('All Skills (5)')).toBeInTheDocument();
      expect(screen.getByText('Missing Skills (2)')).toBeInTheDocument();
      expect(screen.getByText('Availability (2 slots)')).toBeInTheDocument();
    });

    it('displays all candidate skills in expanded view', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('GraphQL')).toBeInTheDocument();
    });

    it('displays skill gaps in expanded view', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
    });

    it('displays availability information in expanded view', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      // Should show availability dates
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/1\/16\/2024/)).toBeInTheDocument();
    });

    it('shows +N more indicator when skills are truncated', () => {
      const candidateWithManySkills = {
        ...mockCandidateMatch,
        match: {
          ...mockCandidateMatch.match,
          matchingSkills: [
            ...mockCandidateMatch.match.matchingSkills,
            { name: 'Python', required: false, confidence: 0.7 },
            { name: 'Docker', required: false, confidence: 0.8 },
            { name: 'AWS', required: false, confidence: 0.75 },
          ],
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithManySkills });
      
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onScheduleInterview when schedule button is clicked', () => {
      const mockOnScheduleInterview = vi.fn();
      renderCandidateCard({ onScheduleInterview: mockOnScheduleInterview });
      
      const scheduleButton = screen.getByText('Schedule Interview');
      fireEvent.click(scheduleButton);
      
      expect(mockOnScheduleInterview).toHaveBeenCalledWith('candidate1');
    });

    it('toggles expansion when view details button is clicked', () => {
      renderCandidateCard();
      
      const viewDetailsButton = screen.getByText('View details');
      fireEvent.click(viewDetailsButton);
      
      expect(screen.getByText('Less details')).toBeInTheDocument();
      expect(screen.getByText('All Skills (5)')).toBeInTheDocument();
    });

    it('shows correct action button text based on expansion state', () => {
      renderCandidateCard();
      
      expect(screen.getByText('View details')).toBeInTheDocument();
      
      const viewDetailsButton = screen.getByText('View details');
      fireEvent.click(viewDetailsButton);
      
      expect(screen.getByText('Less details')).toBeInTheDocument();
    });
  });

  describe('Skills Display', () => {
    it('shows proficiency scores for candidate skills', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('(85%)')).toBeInTheDocument(); // JavaScript proficiency
      expect(screen.getByText('(90%)')).toBeInTheDocument(); // React proficiency
    });

    it('handles skills without proficiency scores', () => {
      const candidateWithoutScores = {
        ...mockCandidateMatch,
        candidate: {
          ...mockCandidateMatch.candidate,
          skills: [
            { id: '1', name: 'JavaScript' }, // No proficiencyScore
          ],
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithoutScores });
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  describe('Location and Experience Display', () => {
    it('shows location with icon', () => {
      renderCandidateCard();
      
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      
      // Check for location icon (SVG)
      const locationIcon = screen.getByText('San Francisco, CA').previousElementSibling;
      expect(locationIcon).toBeInTheDocument();
    });

    it('shows experience level badge', () => {
      renderCandidateCard();
      
      const experienceBadge = screen.getByText('senior');
      expect(experienceBadge).toBeInTheDocument();
      expect(experienceBadge).toHaveClass('px-2', 'py-1', 'bg-gray-100');
    });

    it('handles missing location gracefully', () => {
      const candidateWithoutLocation = {
        ...mockCandidateMatch,
        candidate: {
          ...mockCandidateMatch.candidate,
          location: undefined,
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithoutLocation });
      
      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument();
    });

    it('handles missing experience level gracefully', () => {
      const candidateWithoutExperience = {
        ...mockCandidateMatch,
        candidate: {
          ...mockCandidateMatch.candidate,
          experienceLevel: undefined,
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithoutExperience });
      
      expect(screen.queryByText('senior')).not.toBeInTheDocument();
    });
  });

  describe('Availability Display', () => {
    it('shows availability count in expanded view', () => {
      renderCandidateCard();
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('Availability (2 slots)')).toBeInTheDocument();
    });

    it('shows limited availability slots with more indicator', () => {
      const candidateWithManySlots = {
        ...mockCandidateMatch,
        match: {
          ...mockCandidateMatch.match,
          availability: [
            ...mockCandidateMatch.match.availability!,
            {
              id: '3',
              userId: 'candidate1',
              startTime: new Date('2024-01-17T09:00:00Z'),
              endTime: new Date('2024-01-17T10:00:00Z'),
              timezone: 'UTC',
              status: 'available' as const,
              isRecurring: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: '4',
              userId: 'candidate1',
              startTime: new Date('2024-01-18T11:00:00Z'),
              endTime: new Date('2024-01-18T12:00:00Z'),
              timezone: 'UTC',
              status: 'available' as const,
              isRecurring: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithManySlots });
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('+1 more slots')).toBeInTheDocument();
    });

    it('handles candidate without availability', () => {
      const candidateWithoutAvailability = {
        ...mockCandidateMatch,
        match: {
          ...mockCandidateMatch.match,
          availability: [],
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithoutAvailability });
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.queryByText(/Availability/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels', () => {
      renderCandidateCard();
      
      const scheduleButton = screen.getByText('Schedule Interview');
      const viewDetailsButton = screen.getByText('View details');
      
      expect(scheduleButton).toBeInTheDocument();
      expect(viewDetailsButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderCandidateCard();
      
      const scheduleButton = screen.getByText('Schedule Interview');
      const viewDetailsButton = screen.getByText('View details');
      
      scheduleButton.focus();
      expect(scheduleButton).toHaveFocus();
      
      viewDetailsButton.focus();
      expect(viewDetailsButton).toHaveFocus();
    });

    it('has proper semantic structure', () => {
      renderCandidateCard();
      
      const candidateName = screen.getByText('John Doe');
      expect(candidateName.tagName).toBe('H3');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      const { container } = renderCandidateCard();
      
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'border', 'rounded-xl', 'p-6');
    });

    it('has hover effects', () => {
      const { container } = renderCandidateCard();
      
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md', 'transition-all');
    });
  });

  describe('Edge Cases', () => {
    it('handles candidate with no skills', () => {
      const candidateWithNoSkills = {
        ...mockCandidateMatch,
        candidate: {
          ...mockCandidateMatch.candidate,
          skills: [],
        },
        match: {
          ...mockCandidateMatch.match,
          matchingSkills: [],
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithNoSkills });
      
      expect(screen.getByText('Matching Skills (0)')).toBeInTheDocument();
    });

    it('handles candidate with no skill gaps', () => {
      const candidateWithNoGaps = {
        ...mockCandidateMatch,
        match: {
          ...mockCandidateMatch.match,
          skillGaps: [],
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithNoGaps });
      
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);
      
      expect(screen.queryByText('Missing Skills')).not.toBeInTheDocument();
    });

    it('handles very long names gracefully', () => {
      const candidateWithLongName = {
        ...mockCandidateMatch,
        candidate: {
          ...mockCandidateMatch.candidate,
          name: 'John Very Long Name That Should Be Truncated Properly',
        },
      };
      
      renderCandidateCard({ candidateMatch: candidateWithLongName });
      
      const nameElement = screen.getByText('John Very Long Name That Should Be Truncated Properly');
      expect(nameElement).toHaveClass('truncate');
    });
  });
});