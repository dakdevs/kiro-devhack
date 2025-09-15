// Test script for skill extraction endpoint
// Run with: node test-skill-extraction.js

const BASE_URL = 'http://localhost:3000';

async function testSkillExtraction(userQuery, testName) {
  console.log(`\n🧪 ${testName}`);
  console.log('='.repeat(50));
  console.log(`Query: "${userQuery}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/user-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userQuery }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 204) {
      console.log('✅ Success: Skills extracted (check server console for details)');
    } else {
      const errorData = await response.json();
      console.log(`❌ Error: ${errorData.error}`);
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Skill Extraction Tests');
  console.log('Make sure your Next.js server is running on localhost:3000\n');

  const tests = [
    {
      query: "I have experience with React, TypeScript, and Node.js",
      name: "Test 1: Basic Frontend Skills"
    },
    {
      query: "I am a full-stack developer with 5 years of experience in Python, Django, PostgreSQL, Docker, AWS, and machine learning with TensorFlow",
      name: "Test 2: Complex Full-Stack Skills"
    },
    {
      query: "I work with Jenkins, GitLab CI/CD, Kubernetes, Terraform, and monitoring tools like Prometheus and Grafana",
      name: "Test 3: DevOps Skills"
    },
    {
      query: "I'm skilled in Java, Spring Boot, microservices, and have experience with REST APIs and GraphQL",
      name: "Test 4: Backend Skills"
    },
    {
      query: "",
      name: "Test 5: Empty Query (should fail)"
    },
    {
      query: "I have soft skills like communication, leadership, problem-solving, and teamwork",
      name: "Test 6: Soft Skills"
    }
  ];

  for (const test of tests) {
    await testSkillExtraction(test.query, test.name);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ All tests completed!');
  console.log('Check your Next.js server console for skill extraction logs.');
}

// Run the tests
runTests().catch(console.error);
