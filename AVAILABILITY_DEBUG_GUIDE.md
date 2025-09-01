# Availability Calendar Debug Guide

## Issue Description
The "Add Availability" button doesn't save data to the database or update the UI when clicked.

## Debugging Steps

### 1. Test Pages Created
- `/debug-availability` - Comprehensive testing tool
- `/simple-availability-test` - Simple test for basic functionality
- `/api/test-db` - Database connection test

### 2. Common Issues to Check

#### Authentication Issues
- User not logged in
- Session expired
- Auth configuration problems

#### Database Issues
- Database not running
- Wrong connection string
- Table doesn't exist
- Migration not applied

#### API Issues
- Route not accessible
- Validation errors
- Server errors

#### Frontend Issues
- Form validation failing
- Network request not sent
- State not updating after success

### 3. Step-by-Step Debugging

#### Step 1: Check Authentication
1. Go to `/debug-availability`
2. Click "Test Auth"
3. Should return user session data

#### Step 2: Check Database
1. Click "Test Database"
2. Should show table exists and structure
3. If fails, check database connection

#### Step 3: Check API Endpoints
1. Click "Test GET" - should return existing availability
2. Click "Test POST" - should create new availability
3. Check browser dev tools Network tab for requests

#### Step 4: Check Form Submission
1. Go to main availability page
2. Open browser dev tools Console tab
3. Try to add availability
4. Check for JavaScript errors and network requests

### 4. Expected Behavior

#### Successful Flow:
1. User clicks "Add Availability"
2. Form modal opens
3. User fills in start/end time
4. User clicks "Add Availability" button
5. POST request sent to `/api/availability`
6. Server validates data and saves to database
7. Success response returned
8. Form closes and availability list refreshes

#### Common Failure Points:
- Form validation fails (check console for errors)
- Authentication fails (401 response)
- Database connection fails (500 response)
- Validation schema fails (400 response)

### 5. Quick Fixes

#### If Authentication Fails:
- Make sure user is logged in
- Check auth configuration in `.env.local`
- Restart the server

#### If Database Fails:
- Check if database container is running: `docker ps`
- Check connection string in `.env.local`
- Run migrations: `pnpm db:migrate`

#### If API Fails:
- Check server logs for errors
- Verify API route exists and is accessible
- Check request/response in browser dev tools

#### If Form Fails:
- Check browser console for JavaScript errors
- Verify form data format matches API expectations
- Check if form validation is passing

### 6. Logs to Check

#### Browser Console:
- JavaScript errors
- Network request details
- Form validation messages

#### Server Logs:
- API route execution
- Database queries
- Authentication checks
- Validation errors

### 7. Testing Commands

```bash
# Check database
docker ps | grep postgres

# Check server
ps aux | grep next

# Test database connection
pnpm db:studio

# Check migrations
ls -la drizzle/

# Run migrations
pnpm db:migrate
```

### 8. Manual Testing

1. Open browser dev tools (F12)
2. Go to Network tab
3. Navigate to availability page
4. Try to add availability
5. Check if POST request appears in Network tab
6. Check request payload and response
7. Look for any error messages in Console tab

### 9. Expected API Responses

#### Successful POST:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "startTime": "2024-...",
    "endTime": "2024-...",
    "timezone": "UTC",
    "status": "available",
    "isRecurring": false,
    "createdAt": "2024-...",
    "updatedAt": "2024-..."
  }
}
```

#### Authentication Error:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### Validation Error:
```json
{
  "success": false,
  "error": "Validation error",
  "message": "startTime: Start time must be in the future",
  "details": [...]
}
```

### 10. Next Steps

If all tests pass but the main form still doesn't work:
1. Check form component state management
2. Verify onSubmit callback is properly connected
3. Check if success handler is updating the UI
4. Look for any React state issues or re-rendering problems