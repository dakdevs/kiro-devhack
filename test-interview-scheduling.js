// Test script to verify interview scheduling functionality
const testInterviewScheduling = async () => {
  console.log('Testing interview scheduling flow...');
  
  try {
    // Test 1: Check if recruiter availability API works
    console.log('\n1. Testing recruiter availability API...');
    const availabilityResponse = await fetch('/api/cal_com_api/recruiter-availability?recruiterId=test-recruiter-id');
    console.log('Availability response status:', availabilityResponse.status);
    
    if (availabilityResponse.ok) {
      const availabilityData = await availabilityResponse.json();
      console.log('Availability data:', availabilityData);
    } else {
      console.log('Availability error:', await availabilityResponse.text());
    }
    
    // Test 2: Check if slots API works
    console.log('\n2. Testing slots API...');
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);
    
    const slotsResponse = await fetch(`/api/cal_com_api/slots?eventTypeId=123&startTime=${now.toISOString()}&endTime=${future.toISOString()}`);
    console.log('Slots response status:', slotsResponse.status);
    
    if (slotsResponse.ok) {
      const slotsData = await slotsResponse.json();
      console.log('Slots data:', slotsData);
      console.log('Is slots data an array?', Array.isArray(slotsData));
    } else {
      console.log('Slots error:', await slotsResponse.text());
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run the test if in browser environment
if (typeof window !== 'undefined') {
  testInterviewScheduling();
}

module.exports = { testInterviewScheduling };