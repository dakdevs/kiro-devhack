# Cal.com and Job Import Integration Guide

This guide explains how the Cal.com API integration and job import functionality work in your recruiting platform.

## Overview

The integration provides two main features:
1. **Cal.com Integration**: Allows recruiters to connect their Cal.com accounts for automated interview scheduling
2. **Job Import**: Enables recruiters to import job postings from Greenhouse.io URLs

## Features

### For Recruiters

#### Cal.com Setup
1. **Connect Cal.com Account**: Recruiters can connect their Cal.com account using their API key
2. **Automatic Event Type Creation**: The system creates a "45-Minute Candidate Interview" event type
3. **Interview Management**: View and manage all scheduled interviews in one place

#### Job Import
1. **Import from Greenhouse**: Paste a Greenhouse.io job URL to automatically extract job details
2. **Skill Extraction**: AI-powered extraction of required and preferred skills
3. **Auto-populate Forms**: Imported data automatically fills the job posting form

### For Candidates

#### Interview Scheduling
1. **Self-Service Scheduling**: Candidates can schedule interviews directly without recruiter involvement
2. **Real-time Availability**: See recruiter's real-time availability from Cal.com
3. **Automatic Confirmations**: Both parties receive confirmation emails
4. **Calendar Integration**: Easy calendar integration for both parties

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# Cal.com Integration
CAL_API_KEY=your_cal_com_api_key_here
```

### 2. Database Migration

Run the database migration to add the new fields:

```bash
pnpm db:migrate
```

### 3. Cal.com API Key Setup

1. Go to your Cal.com dashboard
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Copy the generated key and add it to your environment variables

## Usage Guide

### For Recruiters

#### Setting up Cal.com Integration

1. Go to your **Recruiter Profile** page
2. Scroll down to the **Cal.com Setup** section
3. Enter your Cal.com API key
4. Click **Connect Cal.com Account**
5. Once connected, click **Setup Interview Event Type**

#### Importing Jobs from Greenhouse

1. Go to **Post Job** page
2. Click **Import from URL** button
3. Paste a Greenhouse.io job posting URL
4. Review the extracted information
5. Click **Use This Job** to populate the form
6. Make any necessary edits and submit

#### Managing Interviews

1. Go to your **Recruiter Dashboard**
2. View the **Interview Management** panel
3. Filter interviews by:
   - Upcoming
   - Today
   - Completed
   - All
4. Click on interviews to view details or join meetings

### For Candidates

#### Scheduling an Interview

1. Navigate to `/schedule-interview/[jobId]` (this link should be provided by the recruiter)
2. Fill in your name and email
3. Select an available date
4. Choose from available time slots
5. Click **Schedule Interview**
6. You'll be redirected to a confirmation page

## API Endpoints

### Cal.com Integration

- `POST /api/cal_com_api/connect` - Connect Cal.com account
- `POST /api/cal_com_api/setup` - Setup interview event type
- `GET /api/cal_com_api/slots` - Get available time slots
- `POST /api/cal_com_api/book` - Book an interview

### Job Import

- `GET /api/convert_from_json` - Convert Greenhouse URL to job data

### Interview Management

- `GET /api/recruiter/interviews` - Get recruiter's interviews
- `GET /api/interviews/[id]` - Get specific interview details

## Database Schema Changes

### Recruiter Profiles Table

New fields added:
- `cal_com_connected` - Boolean indicating if Cal.com is connected
- `cal_com_api_key` - Encrypted API key (in production)
- `cal_com_username` - Cal.com username
- `cal_com_user_id` - Cal.com user ID
- `cal_com_schedule_id` - Default schedule ID
- `cal_com_event_type_id` - Interview event type ID

### Interview Sessions Scheduled Table

New fields added:
- `cal_com_booking_id` - Cal.com booking ID
- `cal_com_event_type_id` - Event type used
- `candidate_name` - Candidate's name
- `candidate_email` - Candidate's email
- `cal_com_data` - Full Cal.com booking response (JSON)

## Security Considerations

### Production Deployment

1. **Encrypt API Keys**: In production, encrypt Cal.com API keys before storing
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Input Validation**: Validate all user inputs, especially URLs
4. **Access Control**: Ensure proper access control for interview data

### Recommended Security Measures

```typescript
// Example: Encrypt API keys before storing
import crypto from 'crypto';

const encryptApiKey = (apiKey: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
```

## Troubleshooting

### Common Issues

1. **Cal.com Connection Failed**
   - Verify API key is correct
   - Check if Cal.com account has proper permissions
   - Ensure API key hasn't expired

2. **Job Import Not Working**
   - Verify the URL is a valid Greenhouse.io job posting
   - Check if the job posting is publicly accessible
   - Ensure the URL format is correct

3. **Interview Scheduling Issues**
   - Verify recruiter has connected Cal.com
   - Check if event type was created successfully
   - Ensure recruiter has availability set in Cal.com

### Debug Endpoints

Use these endpoints for debugging:

```bash
# Test Cal.com connection
curl -X POST /api/cal_com_api/connect \
  -H "Content-Type: application/json" \
  -d '{"calComApiKey": "your_api_key"}'

# Test job import
curl "/api/convert_from_json?url=https://boards.greenhouse.io/company/jobs/123456"
```

## Future Enhancements

### Planned Features

1. **Multiple Calendar Providers**: Support for Google Calendar, Outlook
2. **Advanced Scheduling**: Recurring interviews, panel interviews
3. **Interview Templates**: Customizable interview types and durations
4. **Analytics**: Interview scheduling analytics and insights
5. **Automated Reminders**: Email and SMS reminders for interviews

### Integration Opportunities

1. **Video Conferencing**: Direct integration with Zoom, Teams, Meet
2. **ATS Integration**: Connect with other Applicant Tracking Systems
3. **Background Checks**: Automated background check initiation
4. **Assessment Tools**: Integration with coding assessment platforms

## Support

For technical support or questions about the integration:

1. Check the troubleshooting section above
2. Review the API documentation
3. Contact the development team
4. Submit issues through the project repository

## Contributing

To contribute to the integration:

1. Follow the existing code patterns
2. Add appropriate tests for new features
3. Update documentation for any changes
4. Ensure security best practices are followed