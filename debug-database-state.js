#!/usr/bin/env node

/**
 * Debug script to check the actual database state
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
  console.log('🔍 Checking Real Users in Database...');
  console.log('=' .repeat(50));
  
  const result = await makeRequest('/api/debug/check-real-users');
  
  if (!result.success) {
    console.log('❌ Failed to check real users:', result.error);
    return;
  }
  
  const { summary, users, usersWithSkills, topSkills, sampleUserSkills } = result.data;
  
  console.log('📊 Database Summary:');
  console.log(`   • Total Users: ${summary.totalUsers}`);
  console.log(`   • Users with Skills: ${summary.usersWithSkills}`);
  console.log(`   • Total User Skills: ${summary.totalUserSkills}`);
  console.log(`   • Unique Skills: ${summary.uniqueSkills}`);
  
  console.log('\\n👥 All Users:');
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
  });
  
  console.log('\\n🎯 Users with Skills:');
  usersWithSkills.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    console.log(`      Skills: ${user.skills.map(s => `${s.name} (${s.proficiencyScore}%)`).join(', ')}`);
  });
  
  console.log('\\n📋 Sample User-Skill Records:');
  sampleUserSkills.forEach((record, index) => {
    console.log(`   ${index + 1}. User: ${record.userName} | Skill: ${record.skillName} | Proficiency: ${record.proficiencyScore}%`);
  });
}

async function checkJobs() {
  console.log('\\n📝 Checking Jobs in Database...');
  console.log('=' .repeat(50));
  
  const result = await makeRequest('/api/debug/jobs');
  
  if (!result.success) {
    console.log('❌ Failed to check jobs:', result.error);
    return;
  }
  
  const { summary, jobs } = result.data;
  
  console.log('📊 Jobs Summary:');
  console.log(`   • Total Jobs: ${summary.totalJobs}`);
  console.log(`   • Active Jobs: ${summary.activeJobs}`);
  
  console.log('\\n📋 All Jobs:');
  jobs.forEach((job, index) => {
    console.log(`   ${index + 1}. ${job.title} (${job.status}) - ID: ${job.id}`);
    console.log(`      Recruiter: ${job.recruiterId}`);
    console.log(`      Required Skills: ${job.requiredSkills?.length || 0}`);
    console.log(`      Preferred Skills: ${job.preferredSkills?.length || 0}`);
  });
}

async function testCandidateMatching() {
  console.log('\\n🎯 Testing Candidate Matching...');
  console.log('=' .repeat(50));
  
  // Get first job
  const jobsResult = await makeRequest('/api/debug/jobs');
  if (!jobsResult.success || !jobsResult.data.jobs.length) {
    console.log('⚠️  No jobs found for testing');
    return;
  }
  
  const firstJob = jobsResult.data.jobs[0];
  console.log(`Testing with job: \"${firstJob.title}\" (ID: ${firstJob.id})`);
  
  const result = await makeRequest(`/api/debug/candidate-matching?jobId=${firstJob.id}&limit=10`);
  
  if (!result.success) {
    console.log('❌ Candidate matching failed:', result.data?.error || result.error);
    return;
  }
  
  const { job, candidates, summary } = result.data.data;
  
  console.log('📊 Matching Results:');
  console.log(`   • Total Candidates: ${summary.totalCandidates}`);
  console.log(`   • Matched Candidates: ${summary.matchedCandidates}`);
  console.log(`   • Average Match Score: ${summary.averageMatchScore}%`);
  
  console.log('\\n🏆 Candidates Found:');
  candidates.forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.candidate.name} (${candidate.match.score}% match)`);
    console.log(`      Email: ${candidate.candidate.email}`);
    console.log(`      Skills: ${candidate.candidate.skills.map(s => s.name).join(', ')}`);
    console.log(`      Matching Skills: ${candidate.match.matchingSkills.map(s => s.name).join(', ')}`);
  });
}

async function runDebug() {
  console.log('🚀 Database State Debug');
  console.log('=' .repeat(60));
  
  await checkRealUsers();
  await checkJobs();
  await testCandidateMatching();
  
  console.log('\\n✅ Debug complete!');
}

runDebug().catch(console.error);