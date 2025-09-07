"use client"

import { useState } from 'react';
import { Button } from '~/components/ui/button';

interface JobImportData {
  title: string;
  company: string;
  location: string;
  description: string;
  rawDescription: string;
  url: string;
}

interface JobImportFormProps {
  onJobImported?: (jobData: JobImportData) => void;
  onCancel?: () => void;
}

export function JobImportForm({ onJobImported, onCancel }: JobImportFormProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedJob, setImportedJob] = useState<JobImportData | null>(null);

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a job posting URL');
      return;
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('greenhouse.io')) {
        setError('Currently only Greenhouse.io job postings are supported');
        return;
      }
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setImportedJob(null);

    try {
      const response = await fetch(`/api/convert_from_json?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.text && !data.structured) {
        throw new Error('No job description found');
      }

      let jobData: JobImportData;

      // Use structured data if available, otherwise parse text
      if (data.structured && data.structured.title) {
        jobData = {
          title: data.structured.title || 'Untitled Position',
          company: data.structured.company || 'Unknown Company',
          location: data.structured.location || 'Location not specified',
          description: stripHtmlTags(data.structured.content) || data.text,
          rawDescription: data.structured.content || data.text,
          url,
        };
      } else {
        // Fallback to text parsing
        const lines = data.text.split('\n').filter(line => line.trim());
        
        let title = '';
        let company = '';
        let location = '';
        let description = '';
        
        // Extract title (first line)
        if (lines.length > 0) {
          title = lines[0].trim();
        }

        // Extract company and location from header lines
        for (let i = 1; i < Math.min(lines.length, 5); i++) {
          const line = lines[i].trim();
          if (line.startsWith('Company:')) {
            company = line.replace('Company:', '').trim();
          } else if (line.startsWith('Location:')) {
            location = line.replace('Location:', '').trim();
          }
        }

        // The rest is the job description
        const descriptionStartIndex = lines.findIndex((line, index) => 
          index > 0 && 
          !line.startsWith('Company:') && 
          !line.startsWith('Location:') &&
          line.length > 10
        );

        if (descriptionStartIndex > -1) {
          description = lines.slice(descriptionStartIndex).join('\n').trim();
        }

        jobData = {
          title: title || 'Untitled Position',
          company: company || 'Unknown Company',
          location: location || 'Location not specified',
          description: description || data.text,
          rawDescription: data.text,
          url,
        };
      }

      setImportedJob(jobData);

    } catch (err) {
      console.error('Job import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import job posting');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleUseJob = () => {
    if (importedJob && onJobImported) {
      onJobImported(importedJob);
    }
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
        Import Job Posting
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Import job details from a Greenhouse.io job posting URL to automatically populate the job form.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="job-url" className="block text-sm font-medium text-black dark:text-white mb-2">
            Job Posting URL
          </label>
          <input
            id="job-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://boards.greenhouse.io/company/jobs/123456"
            className="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
            className="bg-apple-blue text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : 'Import Job'}
          </Button>
          
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-apple-red/10 border border-apple-red/20 rounded-lg">
          <p className="text-apple-red text-sm">{error}</p>
        </div>
      )}

      {importedJob && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-black dark:text-white mb-3">
            Imported Job Details:
          </h4>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Title:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{importedJob.title}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Company:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{importedJob.company}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{importedJob.location}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
              <div className="mt-1 p-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto text-xs">
                {importedJob.description.substring(0, 300)}
                {importedJob.description.length > 300 && '...'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleUseJob}
              className="bg-apple-green text-white hover:bg-green-600"
            >
              Use This Job
            </Button>
            <Button
              onClick={() => setImportedJob(null)}
              variant="secondary"
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Supported Platforms:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Greenhouse.io job postings</li>
          <li>• More platforms coming soon...</li>
        </ul>
      </div>
    </div>
  );
}