import { serverConfig } from '~/config/server-config';

export interface JobImportData {
  title: string;
  company: string;
  location: string;
  description: string;
  rawDescription: string;
  url: string;
}

export interface GreenhouseJobData {
  id: number;
  title: string;
  content: string;
  location: {
    name: string;
  };
  departments: Array<{
    name: string;
  }>;
  offices: Array<{
    name: string;
  }>;
  metadata: Array<{
    name: string;
    value: string;
  }>;
}

export class JobImportService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  /**
   * Convert a Greenhouse job URL to the API JSON URL
   */
  private turnUrlToJsonUrl(url: string): string {
    if (!url.includes('greenhouse.io')) {
      throw new Error('Only Greenhouse.io URLs are supported');
    }

    const regex = /greenhouse\.io\/([^/]+)\/jobs\/(\d+)|greenhouse\.io\/jobs\/(\d+)/;
    const match = url.match(regex);

    if (!match) {
      throw new Error('Could not parse the company name or job ID from the Greenhouse URL');
    }

    const companyName = match[1] || 'greenhouse';
    const jobId = match[2] || match[3];

    return `https://boards-api.greenhouse.io/v1/boards/${companyName}/jobs/${jobId}?questions=true&pay_transparency=true`;
  }

  /**
   * Import job data from a Greenhouse URL
   */
  async importFromGreenhouseUrl(url: string): Promise<JobImportData> {
    try {
      // Use our convert_from_json API endpoint
      const response = await fetch(`${this.baseUrl}/api/convert_from_json?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error('No job description text found');
      }

      // Parse the structured text to extract job information
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

      return {
        title: title || 'Untitled Position',
        company: company || 'Unknown Company',
        location: location || 'Location not specified',
        description: description || data.text,
        rawDescription: data.text,
        url,
      };

    } catch (error) {
      console.error('Job import error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to import job from URL'
      );
    }
  }

  /**
   * Import job data directly from Greenhouse API
   */
  async importFromGreenhouseApi(url: string): Promise<JobImportData> {
    try {
      const apiUrl = this.turnUrlToJsonUrl(url);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch job data: ${response.statusText}`);
      }

      const jobData: GreenhouseJobData = await response.json();

      // Extract company name from departments or offices
      const company = jobData.departments?.[0]?.name || 
                    jobData.offices?.[0]?.name || 
                    'Unknown Company';

      // Clean HTML from description
      const description = this.stripHtmlTags(jobData.content || '');

      return {
        title: jobData.title || 'Untitled Position',
        company,
        location: jobData.location?.name || 'Location not specified',
        description,
        rawDescription: jobData.content || '',
        url,
      };

    } catch (error) {
      console.error('Direct API import error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to import job from Greenhouse API'
      );
    }
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtmlTags(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Basic HTML tag removal
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
  }

  /**
   * Validate if a URL is a supported job posting URL
   */
  isValidJobUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('greenhouse.io');
    } catch {
      return false;
    }
  }

  /**
   * Extract skills from job description using simple keyword matching
   * This is a basic implementation - you might want to use AI for better extraction
   */
  extractSkills(description: string): string[] {
    const commonSkills = [
      // Programming languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'SQL',
      
      // Frameworks and libraries
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'Next.js', 'Nuxt.js', 'Svelte', 'jQuery',
      
      // Databases
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle',
      
      // Cloud and DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions',
      'Terraform', 'Ansible',
      
      // Other technical skills
      'Git', 'Linux', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
      'Machine Learning', 'AI', 'Data Science', 'Analytics',
    ];

    const foundSkills: string[] = [];
    const lowerDescription = description.toLowerCase();

    commonSkills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      if (lowerDescription.includes(lowerSkill)) {
        foundSkills.push(skill);
      }
    });

    return [...new Set(foundSkills)]; // Remove duplicates
  }
}

export const jobImportService = new JobImportService();