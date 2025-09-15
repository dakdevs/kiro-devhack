#!/bin/bash

# Test script for candidate matching endpoint
# Make sure your Next.js server is running on localhost:3000

echo "🧪 Testing Candidate Matching Endpoint"
echo "====================================="

# Test 1: Basic candidate matching
echo "Test 1: Basic candidate matching"
curl -X POST http://localhost:3000/api/jobs/matching \
  -H "Content-Type: application/json" \
  -d '{"jobID": "fcbc550ec1c40e0932004aa054a4dc18"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 2: Invalid job ID (should return 404)
echo "Test 2: Invalid job ID (should return 404)"
curl -X POST http://localhost:3000/api/jobs/matching \
  -H "Content-Type: application/json" \
  -d '{"jobID": "invalid-job-id"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 3: Missing jobID parameter (should return 400)
echo "Test 3: Missing jobID parameter (should return 400)"
curl -X POST http://localhost:3000/api/jobs/matching \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 4: Valid job ID with different job
echo "Test 4: Valid job ID with different job"
curl -X POST http://localhost:3000/api/jobs/matching \
  -H "Content-Type: application/json" \
  -d '{"jobID": "fcbc550ec1c40e0932004aa054a4dc18"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "✅ All tests completed!"
echo "Check your Next.js server console for candidate matching logs."
