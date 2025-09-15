// Test script for candidate matching endpoint
// Run with: node test-candidate-matching.js

const BASE_URL = 'http://localhost:3000';

async function testCandidateMatching(jobID, testName) {
  console.log(`\n🧪 ${testName}`);
  console.log('='.repeat(50));
  console.log(`Job ID: "${jobID}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/jobs/matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobID }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:');
      console.log(`   - Candidate ID: ${data.candidateID}`);
    } else {
      const errorData = await response.json();
      console.log(`❌ Error: ${errorData.error}`);
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Candidate Matching Tests');
  console.log('Make sure your Next.js server is running on localhost:3000\n');

  const tests = [
    {
      jobID: "fcbc550ec1c40e0932004aa054a4dc18",
      name: "Test 1: Valid job ID"
    },
    {
      jobID: "invalid-job-id",
      name: "Test 2: Invalid job ID (should fail)"
    },
    {
      jobID: "fcbc550ec1c40e0932004aa054a4dc18",
      name: "Test 3: Valid job ID (repeat test)"
    }
  ];

  for (const test of tests) {
    await testCandidateMatching(test.jobID, test.name);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ All tests completed!');
  console.log('Check your Next.js server console for candidate matching logs.');
}

// Run the tests
runTests().catch(console.error);
