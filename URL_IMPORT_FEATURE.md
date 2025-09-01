# URL Import Feature for Job Posting

## Overview
The job posting form now includes a "Import from URL" feature that allows recruiters to import job posting data from a JSON URL. This feature automatically extracts job details and populates the job posting form.

## How It Works

### 1. URL Input
- Located at the top of the job posting form
- Accepts any URL that returns JSON data
- Includes test buttons for quick testing with sample data

### 2. JSON Structure Support
The system supports multiple JSON structures:

#### Nested Job Object
```json
{
  "job": {
    "title": "Senior Frontend Developer",
    "company": "TechStart Inc.",
    "location": "San Francisco, CA",
    "type": "Full-time",
    "salary": "$130,000 - $170,000",
    "description": "Job description here...",
    "requirements": ["Requirement 1", "Requirement 2"],
    "benefits": ["Benefit 1", "Benefit 2"]
  }
}
```

#### Flat Structure
```json
{
  "title": "Product Manager",
  "company": "InnovateCorp",
  "location": "New York, NY",
  "employment_type": "Full-time",
  "salary_range": "$140,000 - $180,000",
  "job_description": "Job description here...",
  "requirements": "• Requirement 1\n• Requirement 2",
  "benefits": "• Benefit 1\n• Benefit 2"
}
```

### 3. Field Mapping
The system automatically maps common field names:
- **Title**: `title`, `job.title`
- **Company**: `company`, `job.company`
- **Location**: `location`, `job.location`
- **Type**: `type`, `employment_type`, `job.type`
- **Salary**: `salary`, `salary_range`, `job.salary`
- **Description**: `description`, `job_description`, `job.description`
- **Requirements**: `requirements`, `qualifications`, `job.requirements`
- **Benefits**: `benefits`, `job.benefits`

## Test URLs
Two test JSON files are included:

1. **Frontend Developer**: `/test-job-data.json`
   - Structured with nested job object
   - Array-based requirements and benefits

2. **Product Manager**: `/test-job-data-alt.json`
   - Flat structure
   - String-based requirements and benefits

## Usage Instructions

1. **Navigate** to the job posting form (`/recruiter/post-job`)
2. **Enter URL** in the "Import from URL" field
3. **Click Import** button or use test buttons for quick testing
4. **Review** the imported content in the job posting textarea
5. **Edit** as needed and submit the job posting

## Error Handling
- Invalid URLs show appropriate error messages
- Network errors are caught and displayed
- JSON parsing errors are handled gracefully
- Empty or invalid JSON structures show helpful messages

## Features
- **Real-time import** with loading indicators
- **Automatic field extraction** from various JSON structures
- **Success feedback** showing import status
- **Test data** for easy demonstration
- **Error recovery** with clear error messages
- **Form integration** - imported data populates the existing form

## Technical Implementation
- Uses dedicated API route `/api/convert_from_json` for secure processing
- Server-side fetching avoids CORS issues
- HTML-to-text conversion for clean output
- Handles various JSON structures automatically
- Integrates seamlessly with existing form validation
- Maintains all existing form functionality

## Future Enhancements
- Support for XML and other data formats
- Integration with popular job board APIs
- Bulk import from multiple URLs
- Custom field mapping configuration
- Import history and favorites