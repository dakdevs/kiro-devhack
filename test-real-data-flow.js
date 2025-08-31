#!/usr/bin/env node

/**
 * Test script to verify the real data flow in the candidate matching system
 * This script tests:
 * 1. Check real users and skills in database
 * 2. Test candidate matching with real data
 * 3. Verify the match API endpoint
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testRealUsersCheck() {
  console.log('\\n🔍 Testing Real Users Check...');
  console.log('=' .repeat(50));
  
  const result = await makeRequest('/api/debug/check-real-users');
  
  if (!result.success) {
    console.log('❌ Failed to check real users:', result.error);
    return false;
  }
  
  const { summary, users, usersWithSkills, topSkills } = result.data;
  
  console.log('📊 Database Summary:');
  console.log(`   • Total Users: ${summary.totalUsers}`);
  console.log(`   • Users with Skills: ${summary.usersWithSkills}`);
  console.log(`   • Total User Skills: ${summary.totalUserSkills}`);
  console.log(`   • Unique Skills: ${summary.uniqueSkills}`);
  
  if (summary.totalUsers === 0) {
    console.log('⚠️  No users found in database');
    return false;
  }
  
  if (summary.usersWithSkills === 0) {
    console.log('⚠️  No users with skills found');
    console.log('💡 Users need to take AI interviews to generate skill data');
    return false;
  }
  
  console.log('\\n👥 Sample Users:');
  users.slice(0, 3).forEach(user => {
    console.log(`   • ${user.name} (${user.email}) - Created: ${new Date(user.createdAt).toLocaleDateString()}`);
  });
  
  console.log('\\n🎯 Top Skills:');
  topSkills.slice(0, 5).forEach(skill => {
    console.log(`   • ${skill.skillName}: ${skill.userCount} users (avg proficiency: ${skill.avgProficiency}%)`);
  });
  
  console.log('\\n✅ Real users check completed successfully');
  return true;
}

async function testCandidateMatching() {
  console.log('\\n🎯 Testing Candidate Matching...');
  console.log('=' .repeat(50));
  
  // Test with a sample job description
  const jobDescription = `
    We are looking for a Senior Software Engineer with experience in:
    - JavaScript and TypeScript
    - React and Node.js
    - Database design and SQL
    - API development and integration
    - Agile development methodologies
  `;
  
  const result = await makeRequest('/api/match', {
    method: 'POST',
    body: JSON.stringify({
      jobDescription,
      limit: 10,
      minMatchScore: 20
    })
  });
  
  if (!result.success) {
    console.log('❌ Candidate matching failed:', result.data?.error || result.error);
    return false;
  }
  
  const { job, candidates, summary } = result.data.data;
  
  console.log('📋 Job Analysis:');
  console.log(`   • Title: ${job.title}`);
  console.log(`   • Required Skills: ${job.requiredSkills?.length || 0}`);
  console.log(`   • Preferred Skills: ${job.preferredSkills?.length || 0}`);
  
  console.log('\\n📊 Matching Results:');
  console.log(`   • Total Candidates in DB: ${summary.totalCandidates}`);
  console.log(`   • Matched Candidates: ${summary.matchedCandidates}`);
  console.log(`   • Average Match Score: ${summary.averageMatchScore}%`);
  console.log(`   • Top Match Score: ${summary.topMatchScore}%`);
  
  if (candidates.length === 0) {
    console.log('⚠️  No matching candidates found');
    console.log('💡 This could mean:');
    console.log('   - No users have skills matching the job requirements');
    console.log('   - Users need to take AI interviews to build skill profiles');
    console.log('   - Match score threshold is too high');
    return false;
  }
  
  console.log('\\n🏆 Top Matching Candidates:');
  candidates.slice(0, 3).forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.candidate.name} (${candidate.match.score}% match)`);
    console.log(`      • Email: ${candidate.candidate.email}`);
    console.log(`      • Skills: ${candidate.candidate.skills.length}`);
    console.log(`      • Matching Skills: ${candidate.match.matchingSkills.length}`);
    console.log(`      • Skill Gaps: ${candidate.match.skillGaps.length}`);
    console.log(`      • Overall Fit: ${candidate.match.overallFit}`);
    console.log('');
  });
  
  console.log('✅ Candidate matching completed successfully');
  return true;
}

async function testJobBasedMatching() {
  console.log('\\n📝 Testing Job-Based Matching...');
  console.log('=' .repeat(50));
  
  // First, get available jobs
  const jobsResult = await makeRequest('/api/debug/jobs');
  
  if (!jobsResult.success || !jobsResult.data.data.jobs.length) {
    console.log('⚠️  No jobs found for testing job-based matching');
    return false;
  }
  
  const firstJob = jobsResult.data.data.jobs[0];
  console.log(`🎯 Testing with job: \"${firstJob.title}\"`);
  
  const result = await makeRequest('/api/match', {
    method: 'POST',
    body: JSON.stringify({
      jobId: firstJob.id,
      limit: 5,
      minMatchScore: 10
    })
  });
  
  if (!result.success) {
    console.log('❌ Job-based matching failed:', result.data?.error || result.error);
    return false;
  }
  
  const { candidates, summary } = result.data.data;
  
  console.log('📊 Job-Based Matching Results:');
  console.log(`   • Matched Candidates: ${summary.matchedCandidates}`);
  console.log(`   • Average Match Score: ${summary.averageMatchScore}%`);
  
  if (candidates.length > 0) {
    console.log('\\n🏆 Top Candidate:');
    const top = candidates[0];
    console.log(`   • ${top.candidate.name} (${top.match.score}% match)`);
    console.log(`   • Skills: ${top.candidate.skills.map(s => s.name).join(', ')}`);
  }
  
  console.log('✅ Job-based matching completed successfully');
  return true;
}

async function runAllTests() {
  console.log('🚀 Starting Real Data Flow Tests');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Real Users Check', fn: testRealUsersCheck },
    { name: 'Candidate Matching', fn: testCandidateMatching },
    { name: 'Job-Based Matching', fn: testJobBasedMatching },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  console.log('\\n📋 Test Results Summary');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The system is using real data correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
  }
  
  console.log('\\n💡 Next Steps:');
  console.log('   1. Ensure users take AI interviews to generate skill data');
  console.log('   2. Create job postings with skill requirements');
  console.log('   3. Test the recruiter dashboard matching functionality');
  console.log('   4. Verify that new interview data updates candidate profiles');
}

// Run the tests
runAllTests().catch(console.error);