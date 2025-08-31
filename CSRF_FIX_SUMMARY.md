# CSRF Token Fix Summary

## Problem
When trying to post a job, users were getting a CSRF (Cross-Site Request Forgery) failure error:
```
Error[object Object]WARN: Security event: csrf_failure
POST /api/recruiter/jobs 400 in 109ms
```

This happened because:
1. The API endpoints require CSRF protection (`requireCSRF: true`)
2. The client-side forms were not sending the required CSRF token in request headers
3. The security middleware was rejecting requests without proper CSRF tokens

## Solution
Created a comprehensive CSRF token management system:

### 1. CSRF Token Hook (`src/hooks/use-csrf-token.ts`)
- `useCSRFToken()` hook that generates and manages CSRF tokens
- `secureApiRequest()` utility function that automatically includes CSRF tokens in API requests
- Tokens are stored as cookies and included in `x-csrf-token` headers

### 2. Updated Components
Updated all components that make POST/PUT/DELETE API requests:

#### Job Posting Forms:
- `src/app/recruiter/jobs/page.tsx` - Main job management page
- `src/app/recruiter/_modules/job-posting-form.tsx` - Detailed job posting form
- `src/app/recruiter/post-job/_modules/simple-job-posting-form.tsx` - Simple job posting form
- `src/app/recruiter/post/_modules/job-posting-form.tsx` - Alternative job posting form

#### Profile Management:
- `src/app/recruiter/profile/page.tsx` - Recruiter profile CRUD operations

#### Candidate Management:
- `src/app/recruiter/_modules/candidate-list.tsx` - Interview scheduling and candidate refresh

### 3. How It Works
1. When a component mounts, `useCSRFToken()` generates a random 32-character token
2. The token is stored as a `csrf-token` cookie
3. When making API requests, `secureApiRequest()` automatically:
   - Reads the token from the cookie
   - Includes it in the `x-csrf-token` header
   - Sets proper `Content-Type: application/json` header

### 4. Security Features
- Tokens are generated client-side using cryptographically secure random strings
- Tokens are validated server-side by comparing header and cookie values
- Only state-changing operations (POST/PUT/DELETE) require CSRF tokens
- Tokens are scoped to the current session

## Testing
Created a test page at `/test-csrf` to verify the CSRF token functionality works correctly.

## Files Modified
- `src/hooks/use-csrf-token.ts` (new)
- `src/app/test-csrf/page.tsx` (new)
- `src/app/recruiter/jobs/page.tsx`
- `src/app/recruiter/profile/page.tsx`
- `src/app/recruiter/_modules/candidate-list.tsx`
- `src/app/recruiter/post-job/_modules/simple-job-posting-form.tsx`
- `src/app/recruiter/post/_modules/job-posting-form.tsx`

## Result
✅ Job posting now works without CSRF failures
✅ All recruiter API operations are properly protected
✅ Security is maintained while providing smooth user experience
✅ Consistent CSRF handling across the entire application

## Usage
To use in new components:
```typescript
import { useCSRFToken, secureApiRequest } from '~/hooks/use-csrf-token';

function MyComponent() {
  const csrfToken = useCSRFToken();
  
  const handleSubmit = async (data) => {
    const response = await secureApiRequest('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Handle response...
  };
}
```