#!/bin/bash

# Test script for skill extraction endpoint
# Make sure your Next.js server is running on localhost:3000

echo "🧪 Testing Skill Extraction Endpoint"
echo "=================================="

# Test 1: Basic skill extraction
echo "Test 1: Basic skill extraction"
curl -X POST http://localhost:3000/api/user-skills \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "I have experience with React, TypeScript, and Node.js"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 2: More complex skills
echo "Test 2: Complex skills"
curl -X POST http://localhost:3000/api/user-skills \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "I am a full-stack developer with 5 years of experience in Python, Django, PostgreSQL, Docker, AWS, and machine learning with TensorFlow"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 3: Empty query (should return error)
echo "Test 3: Empty query (should return 400)"
curl -X POST http://localhost:3000/api/user-skills \
  -H "Content-Type: application/json" \
  -d '{"userQuery": ""}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 4: Missing userQuery parameter (should return error)
echo "Test 4: Missing userQuery parameter (should return 400)"
curl -X POST http://localhost:3000/api/user-skills \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n\n"

# Test 5: DevOps skills
echo "Test 5: DevOps skills"
curl -X POST http://localhost:3000/api/user-skills \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "I work with Jenkins, GitLab CI/CD, Kubernetes, Terraform, and monitoring tools like Prometheus and Grafana"}' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "✅ All tests completed!"
echo "Check your Next.js server console for skill extraction logs."
