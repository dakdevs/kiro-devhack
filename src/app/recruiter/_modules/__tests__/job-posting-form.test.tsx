import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobPostingForm } from '../job-posting-form';
import { CreateJobPostingRequest, CreateJobPostingResponse } from '~/types/interview-management';

// Mock data
const mockJobAnalysisResult = {
  summary: 'Senior software engineer position requiring JavaScript and React experience',
  requiredSkills: [
    { name: 'JavaScript', confidence: 0.95 },
    { name: 'React', confidence: 0.9 },
  ],
  preferredSkills: [
    { name: 'TypeScript', confidence: 0.8 },
    { name: 'Node.js', confidence: 0.85 },
  ],
  experienceLevel: 'senior',
  salaryRange: { min: 80000, max: 120000 },
  keyTerms: ['frontend', 'web development', 'agile'],
  confidence: 0.92,
};

const mockSuccessResponse: CreateJobPostingResponse = {
  success: true,
  data: {
    job: {
      id: 'job1',
      title: 'Senior Frontend Developer',
      description: 'We are looking for a senior frontend developer...',
      location: 'San Francisco, CA',
      remoteAllowed: true,
      employmentType: 'full-time',
      experienceLevel: 'senior',
      salaryMin: 80000,
      salaryMax: 120000,
      requiredSkills: ['JavaScript', 'React'],
      preferredSkills: ['TypeScript', 'Node.js'],
      status: 'active',
      recruiterId: 'recruiter1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    analysis: mockJobAnalysisResult,
  },
};

const renderJobPostingForm = (props = {}) => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    ...props,
  };
  return render(<JobPostingForm {...defaultProps} />);
};

describe('JobPostingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form with correct title', () => {
      renderJobPostingForm();
      
      expect(screen.getByText('Post a New Job')).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      renderJobPostingForm();
      
      expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Job Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remote work allowed/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Employment Type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Experience Level/)).toBeInTheDocument();
    });

    it('renders salary fields', () => {
      renderJobPostingForm();
      
      expect(screen.getByLabelText(/Minimum Salary/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Maximum Salary/)).toBeInTheDocument();
    });

    it('renders skills fields', () => {
      renderJobPostingForm();
      
      expect(screen.getByLabelText(/Required Skills/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preferred Skills/)).toBeInTheDocument();
    });

    it('renders form action buttons', () => {
      renderJobPostingForm();
      
      expect(screen.getByText('Create Job Posting')).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      const mockOnCancel = vi.fn();
      renderJobPostingForm({ onCancel: mockOnCancel });
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      renderJobPostingForm({ onCancel: undefined });
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when job title is missing', async () => {
      const mockOnSubmit = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Job title is required')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when job description is missing', async () => {
      const mockOnSubmit = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Job description is required')).toBeInTheDocument();
      });
    });

    it('shows error when job description is too short', async () => {
      const mockOnSubmit = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'Short' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Job description must be at least 10 characters')).toBeInTheDocument();
      });
    });

    it('shows error when maximum salary is less than minimum salary', async () => {
      const mockOnSubmit = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      const minSalaryInput = screen.getByLabelText(/Minimum Salary/);
      const maxSalaryInput = screen.getByLabelText(/Maximum Salary/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      fireEvent.change(minSalaryInput, { target: { value: '100000' } });
      fireEvent.change(maxSalaryInput, { target: { value: '80000' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Maximum salary must be greater than minimum salary')).toBeInTheDocument();
      });
    });

    it('clears errors when user starts typing', async () => {
      const mockOnSubmit = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Job title is required')).toBeInTheDocument();
      });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      
      expect(screen.queryByText('Job title is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates form fields when user types', () => {
      renderJobPostingForm();
      
      const titleInput = screen.getByLabelText(/Job Title/) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Job Description/) as HTMLTextAreaElement;
      const locationInput = screen.getByLabelText(/Location/) as HTMLInputElement;
      
      fireEvent.change(titleInput, { target: { value: 'Senior Developer' } });
      fireEvent.change(descriptionInput, { target: { value: 'Great opportunity' } });
      fireEvent.change(locationInput, { target: { value: 'New York' } });
      
      expect(titleInput.value).toBe('Senior Developer');
      expect(descriptionInput.value).toBe('Great opportunity');
      expect(locationInput.value).toBe('New York');
    });

    it('toggles remote work checkbox', () => {
      renderJobPostingForm();
      
      const remoteCheckbox = screen.getByLabelText(/Remote work allowed/) as HTMLInputElement;
      
      expect(remoteCheckbox.checked).toBe(false);
      
      fireEvent.click(remoteCheckbox);
      expect(remoteCheckbox.checked).toBe(true);
      
      fireEvent.click(remoteCheckbox);
      expect(remoteCheckbox.checked).toBe(false);
    });

    it('updates employment type dropdown', () => {
      renderJobPostingForm();
      
      const employmentTypeSelect = screen.getByLabelText(/Employment Type/) as HTMLSelectElement;
      
      fireEvent.change(employmentTypeSelect, { target: { value: 'contract' } });
      expect(employmentTypeSelect.value).toBe('contract');
    });

    it('updates experience level dropdown', () => {
      renderJobPostingForm();
      
      const experienceLevelSelect = screen.getByLabelText(/Experience Level/) as HTMLSelectElement;
      
      fireEvent.change(experienceLevelSelect, { target: { value: 'senior' } });
      expect(experienceLevelSelect.value).toBe('senior');
    });

    it('handles salary inputs', () => {
      renderJobPostingForm();
      
      const minSalaryInput = screen.getByLabelText(/Minimum Salary/) as HTMLInputElement;
      const maxSalaryInput = screen.getByLabelText(/Maximum Salary/) as HTMLInputElement;
      
      fireEvent.change(minSalaryInput, { target: { value: '80000' } });
      fireEvent.change(maxSalaryInput, { target: { value: '120000' } });
      
      expect(minSalaryInput.value).toBe('80000');
      expect(maxSalaryInput.value).toBe('120000');
    });

    it('handles skills input with comma separation', () => {
      renderJobPostingForm();
      
      const requiredSkillsInput = screen.getByLabelText(/Required Skills/) as HTMLInputElement;
      const preferredSkillsInput = screen.getByLabelText(/Preferred Skills/) as HTMLInputElement;
      
      fireEvent.change(requiredSkillsInput, { target: { value: 'JavaScript, React, Node.js' } });
      fireEvent.change(preferredSkillsInput, { target: { value: 'TypeScript, GraphQL' } });
      
      expect(requiredSkillsInput.value).toBe('JavaScript, React, Node.js');
      expect(preferredSkillsInput.value).toBe('TypeScript, GraphQL');
    });
  });

  describe('Form Submission', () => {
    it('submits form with correct data', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      // Fill out form
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      const locationInput = screen.getByLabelText(/Location/);
      const remoteCheckbox = screen.getByLabelText(/Remote work allowed/);
      const employmentTypeSelect = screen.getByLabelText(/Employment Type/);
      const minSalaryInput = screen.getByLabelText(/Minimum Salary/);
      const maxSalaryInput = screen.getByLabelText(/Maximum Salary/);
      const requiredSkillsInput = screen.getByLabelText(/Required Skills/);
      
      fireEvent.change(titleInput, { target: { value: 'Senior Frontend Developer' } });
      fireEvent.change(descriptionInput, { target: { value: 'We are looking for a senior frontend developer with React experience' } });
      fireEvent.change(locationInput, { target: { value: 'San Francisco, CA' } });
      fireEvent.click(remoteCheckbox);
      fireEvent.change(employmentTypeSelect, { target: { value: 'full-time' } });
      fireEvent.change(minSalaryInput, { target: { value: '80000' } });
      fireEvent.change(maxSalaryInput, { target: { value: '120000' } });
      fireEvent.change(requiredSkillsInput, { target: { value: 'JavaScript, React' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Senior Frontend Developer',
          description: 'We are looking for a senior frontend developer with React experience',
          location: 'San Francisco, CA',
          remoteAllowed: true,
          employmentType: 'full-time',
          experienceLevel: undefined, // Let AI determine
          salaryMin: 80000,
          salaryMax: 120000,
          requiredSkills: ['JavaScript', 'React'],
          preferredSkills: [],
        });
      });
    });

    it('handles empty skills gracefully', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            requiredSkills: [],
            preferredSkills: [],
          })
        );
      });
    });

    it('handles submission errors', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to create job posting',
      });
      
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create job posting')).toBeInTheDocument();
      });
    });

    it('handles unexpected errors', async () => {
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('AI Analysis Results', () => {
    it('shows analysis results after successful submission', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      // Submit form
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Job Posted Successfully!')).toBeInTheDocument();
        expect(screen.getByText('AI Analysis Confidence: 92%')).toBeInTheDocument();
      });
    });

    it('displays extracted skills in analysis results', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      // Submit form
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Required Skills')).toBeInTheDocument();
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
        
        expect(screen.getByText('Preferred Skills')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
      });
    });

    it('displays extracted experience level and salary', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      // Submit form
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Experience Level')).toBeInTheDocument();
        expect(screen.getByText('senior')).toBeInTheDocument();
        
        expect(screen.getByText('Salary Range')).toBeInTheDocument();
        expect(screen.getByText('80,000 - 120,000')).toBeInTheDocument();
      });
    });

    it('allows posting another job from results view', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      // Submit form
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Post Another Job')).toBeInTheDocument();
      });
      
      const postAnotherButton = screen.getByText('Post Another Job');
      fireEvent.click(postAnotherButton);
      
      // Should return to form view
      expect(screen.getByText('Post a New Job')).toBeInTheDocument();
      expect(screen.getByLabelText(/Job Title/)).toHaveValue('');
    });

    it('calls onCancel from results view', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);
      const mockOnCancel = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit, onCancel: mockOnCancel });
      
      // Submit form
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      
      fireEvent.change(titleInput, { target: { value: 'Test Job' } });
      fireEvent.change(descriptionInput, { target: { value: 'This is a test job description' } });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
      
      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables form fields when loading', () => {
      renderJobPostingForm({ isLoading: true });
      
      const titleInput = screen.getByLabelText(/Job Title/) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Job Description/) as HTMLTextAreaElement;
      const submitButton = screen.getByText('Creating Job...') as HTMLButtonElement;
      
      expect(titleInput.disabled).toBe(true);
      expect(descriptionInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });

    it('shows loading text on submit button', () => {
      renderJobPostingForm({ isLoading: true });
      
      expect(screen.getByText('Creating Job...')).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const mockOnCancel = vi.fn();
      renderJobPostingForm({ onCancel: mockOnCancel });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('disables cancel button when loading', () => {
      const mockOnCancel = vi.fn();
      renderJobPostingForm({ onCancel: mockOnCancel, isLoading: true });
      
      const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
      expect(cancelButton.disabled).toBe(true);
    });
  });

  describe('Help Text and Placeholders', () => {
    it('shows helpful placeholder text', () => {
      renderJobPostingForm();
      
      expect(screen.getByPlaceholderText('e.g. Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe the role, responsibilities/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. San Francisco, CA')).toBeInTheDocument();
    });

    it('shows AI analysis help text', () => {
      renderJobPostingForm();
      
      expect(screen.getByText(/Our AI will analyze this description/)).toBeInTheDocument();
      expect(screen.getByText(/Separate skills with commas/)).toBeInTheDocument();
      expect(screen.getByText(/Nice-to-have skills/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      renderJobPostingForm();
      
      expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Job Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remote work allowed/)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      const mockOnSubmit = vi.fn();
      renderJobPostingForm({ onSubmit: mockOnSubmit });
      
      const submitButton = screen.getByText('Create Job Posting');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Job title is required');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', () => {
      renderJobPostingForm();
      
      const titleInput = screen.getByLabelText(/Job Title/);
      const descriptionInput = screen.getByLabelText(/Job Description/);
      const submitButton = screen.getByText('Create Job Posting');
      
      titleInput.focus();
      expect(titleInput).toHaveFocus();
      
      descriptionInput.focus();
      expect(descriptionInput).toHaveFocus();
      
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      renderJobPostingForm();
      
      const salaryContainer = screen.getByLabelText(/Minimum Salary/).closest('.grid');
      expect(salaryContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });
  });
});