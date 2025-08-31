#!/usr/bin/env node

/**
 * Test script to verify dashboard update after job posting
 */

const BASE_URL = 'http://localhost:3000';

async function testDashboardUpdate() {
  console.log('🧪 Testing Dashboard Update Flow...\n');

  try {
    // Step 1: Get initial dashboard state
    console.log('1️⃣ Fetching initial dashboard state...');
    const initialResponse = await fetch(`${BASE_URL}/api/recruiter/jobs?limit=5`);
    const initialData = await initialResponse.json();
    
    console.log('Initial response status:', initialResponse.status);
    console.log('Initial jobs count:', initialData.data?.data?.length || 0);
    console.log('Initial response structure:', {
      success: initialData.success,
      hasData: !!initialData.data,
      dataSuccess: initialData.data?.success,
      dataIsArray: Array.isArray(initialData.data?.data),
      jobsCount: initialData.data?.data?.length || 0
    });

    // Step 2: Create a test job
    console.log('\n2️⃣ Creating test job...');
    const jobData = {
      title: 'Dashboard Update Test Job',
      description: 'This is a test job to verify dashboard updates work correctly.',
      location: 'Remote',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      requiredSkills: ['JavaScript', 'React'],
      preferredSkills: ['Node.js'],
      salaryMin: 80000,
      salaryMax: 120000,
      remoteAllowed: true
    };

    const createResponse = await fetch(`${BASE_URL}/api/recruiter/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    });

    const createResult = await createResponse.json();
    console.log('Job creation status:', createResponse.status);
    console.log('Job creation success:', createResult.success);
    
    if (!createResult.success) {
      console.error('❌ Job creation failed:', createResult.error);
      return;
    }

    const jobId = createResult.data?.job?.id;
    console.log('Created job ID:', jobId);

    // Step 3: Wait a moment for cache invalidation
    console.log('\n3️⃣ Waiting for cache invalidation...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Fetch dashboard with force refresh
    console.log('\n4️⃣ Fetching dashboard with force refresh...');
    const refreshResponse = await fetch(`${BASE_URL}/api/recruiter/jobs?limit=5&refresh=true&t=${Date.now()}`);
    const refreshData = await refreshResponse.json();
    
    console.log('Refresh response status:', refreshResponse.status);
    console.log('Refresh jobs count:', refreshData.data?.data?.length || 0);
    console.log('Refresh response structure:', {
      success: refreshData.success,
      hasData: !!refreshData.data,
      dataSuccess: refreshData.data?.success,
      dataIsArray: Array.isArray(refreshData.data?.data),
      jobsCount: refreshData.data?.data?.length || 0
    });

    // Step 5: Verify the new job appears
    console.log('\n5️⃣ Verifying job appears in dashboard...');
    const jobs = refreshData.data?.data || [];
    const newJob = jobs.find(job => job.id === jobId);
    
    if (newJob) {
      console.log('✅ SUCCESS: New job found in dashboard!');
      console.log('Job details:', {
        id: newJob.id,
        title: newJob.title,
        status: newJob.status,
        createdAt: newJob.createdAt
      });
    } else {
      console.log('❌ FAILURE: New job not found in dashboard');
      console.log('Available jobs:', jobs.map(j => ({ id: j.id, title: j.title })));
    }

    // Step 6: Test the parsing logic
    console.log('\n6️⃣ Testing dashboard parsing logic...');
    let jobsArray = [];
    const jobsData = refreshData;

    if (jobsData.success && jobsData.data) {
      if (jobsData.data.success && Array.isArray(jobsData.data.data)) {
        jobsArray = jobsData.data.data;
        console.log('✅ Parsing: Jobs data from API response, length:', jobsArray.length);
      } else if (Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
        console.log('⚠️ Fallback: Jobs data is direct array, length:', jobsArray.length);
      } else {
        console.log('❌ Parsing failed: Unexpected structure');
      }
    }

    console.log('\n📊 Summary:');
    console.log(`- Initial jobs: ${initialData.data?.data?.length || 0}`);
    console.log(`- After creation: ${refreshData.data?.data?.length || 0}`);
    console.log(`- Job found in dashboard: ${newJob ? '✅' : '❌'}`);
    console.log(`- Parsing works: ${jobsArray.length > 0 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDashboardUpdate();