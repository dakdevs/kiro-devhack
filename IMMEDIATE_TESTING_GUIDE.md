# Immediate Testing Guide 🧪

## 🚀 **Start Here - Quick Test**

### 1. Health Check (30 seconds)
```bash
# Option A: Browser
http://localhost:3001/api/health-check

# Option B: Terminal
curl http://localhost:3001/api/health-check
```

**Expected Result**: JSON response with `"status": "healthy"`

### 2. Test Suite Dashboard (2 minutes)
```bash
# Visit the main test dashboard
http://localhost:3001/test-suite
```

**What you'll see**: 
- Links to all test pages
- API endpoint documentation
- System status overview
- Quick action buttons

### 3. Complete Workflow Test (5 minutes)
```bash
# Run comprehensive API tests
http://localhost:3001/test-complete-workflow
```

**What it tests**:
- Database connectivity
- Authentication system
- Job matching API
- Recruiter availability API
- Cal.com integration
- Error handling

## 📋 **Test Scenarios by User Type**

### 👤 **Candidate Testing**

#### Job Matching Workflow
1. **Visit**: `http://localhost:3001/dashboard`
2. **Expected**: Job matches page loads
3. **Test**: Click "Refresh Matches" button
4. **Verify**: API call succeeds (check browser network tab)

#### Interview Scheduling
1. **Visit**: `http://localhost:3001/schedule-interview/test-job-id`
2. **Expected**: Interview scheduling page loads
3. **Test**: Page fetches recruiter availability
4. **Verify**: No client-side errors in console

### 👔 **Recruiter Testing**

#### Cal.com Setup
1. **Visit**: `http://localhost:3001/dashboard/availability`
2. **Expected**: Availability management page loads
3. **Test**: Try connecting Cal.com (will show API key form)
4. **Verify**: Form submission works (even without real API key)

#### Job Posting
1. **Visit**: `http://localhost:3001/recruiter/post-job`
2. **Expected**: Job posting form loads
3. **Test**: Fill out and submit form
4. **Verify**: Form validation and submission work

## 🔧 **API Endpoint Testing**

### Direct API Tests
```bash
# Test job matches
curl "http://localhost:3001/api/job-matches?candidateId=test-candidate"

# Test recruiter availability
curl "http://localhost:3001/api/recruiter-availability?recruiterId=test-recruiter"

# Test database
curl "http://localhost:3001/api/test-db"

# Test health
curl "http://localhost:3001/api/health-check"
```

### Expected Responses
- **200 OK**: Successful API calls
- **JSON format**: All responses in JSON
- **No 500 errors**: No server crashes
- **Proper error messages**: Clear error responses for invalid requests

## 🐛 **What to Look For**

### ✅ **Success Indicators**
- Pages load without errors
- API calls return 200 status codes
- No "Module not found: Can't resolve 'dns'" errors
- Database connections work
- Forms submit successfully
- Navigation works between pages

### ❌ **Red Flags**
- 500 Internal Server Error responses
- Client-side console errors
- "Cannot resolve module" errors
- Database connection failures
- Blank pages or infinite loading

## 🔍 **Debugging Tools**

### Browser Developer Tools
1. **Console Tab**: Check for JavaScript errors
2. **Network Tab**: Monitor API calls and responses
3. **Application Tab**: Check localStorage/sessionStorage

### Server Logs
```bash
# Watch server logs while testing
pnpm dev:app
# Look for error messages in terminal output
```

### Database Verification
```bash
# Check database is running
pnpm dev:db

# Run database studio
pnpm db:studio
```

## 📊 **Test Results Tracking**

### Create a Test Log
```markdown
## Test Session: [Date/Time]

### Health Check
- [ ] API responds with 200 OK
- [ ] Database connection successful
- [ ] All required tables exist

### Job Matching
- [ ] Dashboard loads without errors
- [ ] Refresh matches works
- [ ] API calls succeed

### Cal.com Integration
- [ ] Availability page loads
- [ ] Connect form appears
- [ ] API endpoints respond

### Authentication
- [ ] Auth pages load
- [ ] Session management works
- [ ] Login/logout functional

### Issues Found
- Issue 1: [Description]
- Issue 2: [Description]

### Overall Status
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Major issues found
```

## 🎯 **Priority Testing Order**

### Phase 1: Core Infrastructure (15 minutes)
1. Health check API
2. Database connectivity
3. Basic page loading
4. API endpoint responses

### Phase 2: User Workflows (30 minutes)
1. Job matching for candidates
2. Cal.com setup for recruiters
3. Interview scheduling flow
4. Authentication system

### Phase 3: Edge Cases (15 minutes)
1. Error handling
2. Invalid API requests
3. Missing data scenarios
4. Network failure simulation

## 🚨 **Emergency Fixes**

### If Tests Fail

#### Database Issues
```bash
# Restart database
pnpm dev:db

# Check environment variables
cat .env.local | grep DATABASE_URL
```

#### API Issues
```bash
# Check server is running
pnpm dev:app

# Verify API routes exist
ls src/app/api/
```

#### Client Issues
```bash
# Clear browser cache
# Check browser console for errors
# Verify no direct service imports in client components
```

## 🎉 **Success Criteria**

### Minimum Viable Test
- ✅ Health check returns healthy status
- ✅ Dashboard loads without errors
- ✅ At least one API endpoint works
- ✅ No DNS module errors

### Full Success
- ✅ All API endpoints functional
- ✅ Complete user workflows work
- ✅ Error handling graceful
- ✅ Performance acceptable
- ✅ Ready for user testing

---

**🚀 The application is ready for testing! Start with the health check and work through the scenarios above.**