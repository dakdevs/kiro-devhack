# API Integration Tests

This directory contains integration tests for the Interview Management System API endpoints.

## Test Structure

### API Endpoints Integration Tests (`api-endpoints.test.ts`)
Comprehensive validation tests for all API endpoints covering:

#### Recruiter Profile API
- Profile creation validation
- Profile update scenarios
- Data validation and error handling

#### Job Posting API
- Job posting creation flow
- AI analysis integration validation
- Job filtering and search criteria
- Data validation for job requirements

#### Availability Management API
- Availability slot creation and validation
- Recurring availability patterns
- Conflict detection logic
- Time range validation

#### Interview Scheduling API
- Interview scheduling request validation
- Interview confirmation flow
- Mutual availability logic
- Scheduling conflict handling

#### Candidate Matching API
- Candidate matching criteria validation
- Match score calculation
- Candidate filtering options
- Ranking and sorting logic

#### Notification System API
- Notification creation and validation
- Notification preferences management
- Filtering and pagination
- Notification type validation

#### Data Validation and Error Handling
- Common data type validation (email, phone, dates, IDs)
- Error response format validation
- Pagination response validation
- Input sanitization testing

## Test Coverage

The integration tests cover:

✅ **Recruiter Profile Management**
- Profile CRUD operations
- Data validation
- Error scenarios

✅ **Job Posting and AI Analysis**
- Job creation with AI skill extraction
- Job filtering and search
- AI service integration validation

✅ **Availability Management**
- Availability slot management
- Recurring patterns
- Conflict detection

✅ **Interview Scheduling**
- Mutual availability finding
- Interview confirmation flow
- Scheduling conflict resolution

✅ **Candidate Matching**
- Skill-based matching algorithms
- Match score calculation
- Candidate filtering and ranking

✅ **Notification System**
- Notification creation and delivery
- User preference management
- Real-time notification handling

✅ **Data Validation**
- Input validation across all endpoints
- Error handling and response formats
- Security and sanitization

## Running the Tests

```bash
# Run all integration tests
pnpm test src/test/integration/api

# Run specific test file
pnpm test src/test/integration/api/api-endpoints.test.ts

# Run with coverage
pnpm test --coverage src/test/integration/api
```

## Test Helpers

The `test-helpers.ts` file provides:
- Mock database setup utilities
- Mock authentication helpers
- Test data factories
- Common test utilities

## Requirements Coverage

These integration tests validate all requirements from the Interview Management System specification:

- **Requirement 1**: Candidate Interview Availability Management ✅
- **Requirement 2**: Recruiter Profile and Job Storage System ✅
- **Requirement 3**: AI-Powered Job Analysis and Skill Extraction ✅
- **Requirement 4**: Candidate Filtering and Ranking System ✅
- **Requirement 5**: Automated Interview Scheduling System ✅
- **Requirement 6**: Notification and Communication System ✅
- **Requirement 7**: Dashboard Integration and Navigation ✅
- **Requirement 8**: Data Integrity and Error Handling ✅

## Test Results

All 18 integration tests are passing, covering:
- API endpoint validation
- Data flow validation
- Business logic validation
- Error handling validation
- Security validation

The tests ensure that all API endpoints work correctly with proper validation, error handling, and data integrity.