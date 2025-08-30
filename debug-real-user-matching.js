#!/usr/bin/env node

/**
 * Debug script to test why real users aren't showing up in candidate matching
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

async function checkRealUsers() {
  console.log('🔍 Step 1: Checking Real Users in Database...');
  console.log('=' .repeat(60));
  
  const result = await makeRequest('/api/debug/check-real-users');
  
  if (!result.success) {
    console.log('❌ Failed to check real users:', result.error);
    return null;
  }
  
  const { summary, users, usersWithSkills, topSkills, sampleUserSkills } = result.data;
  
  console.log('📊 Database Summary:');
  console.log(`   • Total Users: ${summary.totalUsers}`);
  console.log(`   • Users with Skills: ${summary.usersWithSkills}`);
  console.log(`   • Total User Skills: ${summary.totalUserSkills}`);
  console.log(`   • Unique Skills: ${summary.uniqueSkills}`);
  
  if (summary.usersWithSkills === 0) {
    console.log('\\n❌ No users with skills found!');
    console.log('   This explains why no candidates are showing up.');
    return null;
  }
  
  console.log('\\n👥 Users with Skills:');
  usersWithSkills.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    console.log(`      Skills: ${user.skills.map(s => `${s.name} (${s.proficiencyScore}%)`).join(', ')}`);
  });
  
  console.log('\\n🎯 Top Skills in Database:');
  topSkills.slice(0, 10).forEach((skill, index) => {
    console.log(`   ${index + 1}. ${skill.skillName}: ${skill.userCount} users (avg: ${skill.avgProficiency}%)`);
  });
  
  return { users: usersWithSkills, skills: topSkills };
}

async function checkJobs() {
  console.log('\\n📝 Step 2: Checking Available Jobs...');
  console.log('=' .repeat(60));
  
  const result = await makeRequest('/api/debug/jobs');
  
  if (!result.success) {
    console.log('❌ Failed to check jobs:', result.error);
    return null;
  }
  
  const { summary, jobs } = result.data;
  
  console.log('📊 Jobs Summary:');
  console.log(`   • Total Jobs: ${summary.totalJobs}`);
  console.log(`   • Active Jobs: ${summary.activeJobs}`);
  
  if (jobs.length === 0) {
    console.log('\\n❌ No jobs found!');
    console.log('   Need jobs to test candidate matching.');
    return null;
  }
  
  console.log('\\n📋 Available Jobs:');
  jobs.forEach((job, index) => {
    console.log(`   ${index + 1}. ${job.title} (${job.status})`);
    console.log(`      Required Skills: ${job.requiredSkills?.map(s => s.name || s).join(', ') || 'None'}`);
    console.log(`      Preferred Skills: ${job.preferredSkills?.map(s => s.name || s).join(', ') || 'None'}`);
  });
  
  return jobs;
}

async function testCandidateMatchingWithJob(job) {
  console.log(`\\n🎯 Step 3: Testing Candidate Matching for "${job.title}"...`);
  console.log('=' .repeat(60));
  
  // Test with very low minimum match score to catch all candidates
  const result = await makeRequest(`/api/debug/candidate-matching?jobId=${job.id}&limit=20`);
  
  if (!result.success) {
    console.log('❌ Candidate matching failed:', result.data?.error || result.error);
    return false;
  }
  
  const { candidates, summary } = result.data.data;
  
  console.log('📊 Matching Results:');
  console.log(`   • Total Candidates in DB: ${summary.totalCandidates}`);
  console.log(`   • Matched Candidates: ${summary.matchedCandidates}`);
  console.log(`   • Average Match Score: ${summary.averageMatchScore}%`);
  console.log(`   • Top Match Score: ${summary.topMatchScore}%`);
  
  if (candidates.length === 0) {
    console.log('\\n❌ No candidates matched!');
    console.log('   This is the problem - real users should appear here.');
    return false;
  }
  
  console.log('\\n🏆 Matched Candidates:');
  candidates.forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.candidate.name} (${candidate.match.score}% match)`);
    console.log(`      Email: ${candidate.candidate.email}`);
    console.log(`      Skills: ${candidate.candidate.skills.map(s => s.name).join(', ')}`);
    console.log(`      Matching Skills: ${candidate.match.matchingSkills.map(s => s.name).join(', ')}`);
    console.log(`      Skill Gaps: ${candidate.match.skillGaps.map(s => s.name).join(', ')}`);
    console.log(`      Overall Fit: ${candidate.match.overallFit}`);
    console.log('');
  });
  
  return true;
}

async function testDirectMatchAPI() {
  console.log('\\n🔧 Step 4: Testing Direct Match API...');
  console.log('=' .repeat(60));
  
  // Test with skills that should match the real user
  const testJobDescription = `
    We are looking for a developer with experience in:
    - TypeScript development
    - React framework
    - Modern web development
    - Team collaboration
  `;
  
  const result = await makeRequest('/api/match', {
    method: 'POST',
    body: JSON.stringify({
      jobDescription: testJobDescription,
      limit: 10,
      minMatchScore: 1 // Very low threshold to catch all candidates
    })
  });
  
  if (!result.success) {
    console.log('❌ Direct match API failed:', result.data?.error || result.error);
    return false;
  }
  
  const { candidates, summary } = result.data.data;
  
  console.log('📊 Direct Match Results:');
  console.log(`   • Total Candidates: ${summary.totalCandidates}`);
  console.log(`   • Matched Candidates: ${summary.matchedCandidates}`);
  console.log(`   • Average Match Score: ${summary.averageMatchScore}%`);
  
  if (candidates.length === 0) {
    console.log('\\n❌ No candidates found via direct match API!');
    return false;
  }
  
  console.log('\\n🏆 Direct Match Candidates:');
  candidates.forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.candidate.name} (${candidate.match.score}% match)`);
    console.log(`      Skills: ${candidate.candidate.skills.map(s => s.name).join(', ')}`);
  });
  
  return true;
}

async function testCandidateService() {
  console.log('\\n⚙️  Step 5: Testing Candidate Service Directly...');
  console.log('=' .repeat(60));
  
  // Test the candidate service with a simple query
  const result = await makeRequest('/api/recruiter/jobs');
  
  if (!result.success) {
    console.log('❌ Failed to get jobs for service test:', result.error);
    return false;
  }
  
  if (!result.data.data || result.data.data.length === 0) {
    console.log('❌ No jobs available for service test');
    return false;
  }
  
  const firstJob = result.data.data[0];
  console.log(`Testing with job: "${firstJob.title}"`);
  
  // Test the candidates endpoint for this job
  const candidatesResult = await makeRequest(`/api/recruiter/jobs/${firstJob.id}/candidates?limit=20&minMatchScore=1`);
  
  if (!candidatesResult.success) {
    console.log('❌ Candidates endpoint failed:', candidatesResult.data?.error || candidatesResult.error);
    return false;
  }
  
  const candidatesData = candidatesResult.data;
  
  console.log('📊 Candidates Endpoint Results:');
  console.log(`   • Success: ${candidatesData.success}`);
  console.log(`   • Candidates Found: ${candidatesData.data?.length || 0}`);
  console.log(`   • Total Candidates: ${candidatesData.summary?.totalCandidates || 0}`);
  
  if (candidatesData.data && candidatesData.data.length > 0) {
    console.log('\\n🏆 Found Candidates:');
    candidatesData.data.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ${candidate.candidate.name} (${candidate.match.score}% match)`);
    });
    return true;
  } else {
    console.log('\\n❌ No candidates found via service endpoint');
    return false;
  }
}

async function runDebug() {
  console.log('🚀 Debugging Real User Matching Issue');
  console.log('=' .repeat(70));
  console.log('Expected: User with skills (Gemini team, TypeScript, React) should appear');
  console.log('=' .repeat(70));
  
  // Step 1: Check if real users exist
  const userData = await checkRealUsers();
  if (!userData) {
    console.log('\\n🔴 ISSUE FOUND: No users with skills in database');
    console.log('   • Check if user skills were properly stored during AI interview');
    console.log('   • Verify user_skills table has data');
    return;
  }
  
  // Step 2: Check if jobs exist
  const jobs = await checkJobs();
  if (!jobs) {
    console.log('\\n🔴 ISSUE FOUND: No jobs available for matching');
    console.log('   • Create a job posting first');
    return;
  }
  
  // Step 3: Test candidate matching with first job
  const matchingWorked = await testCandidateMatchingWithJob(jobs[0]);
  
  // Step 4: Test direct match API
  const directMatchWorked = await testDirectMatchAPI();
  
  // Step 5: Test candidate service endpoint
  const serviceWorked = await testCandidateService();
  
  console.log('\\n📋 Debug Summary');
  console.log('=' .repeat(70));
  console.log(`✅ Users with skills found: ${userData ? 'YES' : 'NO'}`);
  console.log(`✅ Jobs available: ${jobs ? 'YES' : 'NO'}`);
  console.log(`✅ Candidate matching works: ${matchingWorked ? 'YES' : 'NO'}`);
  console.log(`✅ Direct match API works: ${directMatchWorked ? 'YES' : 'NO'}`);
  console.log(`✅ Service endpoint works: ${serviceWorked ? 'YES' : 'NO'}`);
  
  if (userData && jobs && !matchingWorked) {
    console.log('\\n🔴 ISSUE IDENTIFIED:');
    console.log('   • Users and jobs exist, but matching is not working');
    console.log('   • Possible causes:');
    console.log('     - Minimum match score too high');
    console.log('     - Skill name matching issues');
    console.log('     - Database query problems');
    console.log('     - Caching issues');
  }
  
  if (userData && jobs && matchingWorked) {
    console.log('\\n✅ SYSTEM WORKING:');
    console.log('   • Real users should be appearing in recruiter interface');
    console.log('   • Check recruiter dashboard and job candidate pages');
  }
}

runDebug().catch(console.error);