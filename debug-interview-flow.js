// Debug script for interview scheduling flow
const { db } = require('./src/db');
const { recruiterProfiles, recruiterAvailability } = require('./src/db/schema');

async function debugInterviewFlow() {
  console.log('🔍 Debugging interview scheduling flow...\n');
  
  try {
    // Check if there are any recruiter profiles
    console.log('1. Checking recruiter profiles...');
    const recruiters = await db.select().from(recruiterProfiles).limit(5);
    console.log(`Found ${recruiters.length} recruiter profiles:`);
    recruiters.forEach(r => {
      console.log(`  - ID: ${r.id}, Name: ${r.organizationName}, Cal.com Connected: ${r.calComConnected}`);
    });
    
    if (recruiters.length === 0) {
      console.log('❌ No recruiter profiles found. You need to create some first.');
      return;
    }
    
    // Check recruiter availability
    console.log('\n2. Checking recruiter availability...');
    const availability = await db.select().from(recruiterAvailability).limit(5);
    console.log(`Found ${availability.length} availability records:`);
    availability.forEach(a => {
      console.log(`  - Recruiter: ${a.recruiterId}, Event Type: ${a.eventTypeName}, Duration: ${a.duration}min`);
    });
    
    // Test the API endpoints
    console.log('\n3. Testing API endpoints...');
    
    const testRecruiterId = recruiters[0]?.id;
    if (testRecruiterId) {
      console.log(`Testing with recruiter ID: ${testRecruiterId}`);
      
      // This would be done in a browser environment
      console.log('To test the APIs, visit:');
      console.log(`- /api/cal_com_api/recruiter-availability?recruiterId=${testRecruiterId}`);
      console.log(`- /api/cal_com_api/slots?eventTypeId=123&startTime=${new Date().toISOString()}&endTime=${new Date(Date.now() + 30*24*60*60*1000).toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Export for use in other scripts
module.exports = { debugInterviewFlow };

// Run if called directly
if (require.main === module) {
  debugInterviewFlow().then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
}