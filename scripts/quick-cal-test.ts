#!/usr/bin/env tsx

/**
 * Quick Cal.com API Test
 * 
 * This script quickly tests if your Cal.com API key works
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

async function quickTest() {
  const apiKey = process.env.CAL_API_KEY || process.env.CAL_COM_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CAL_API_KEY not found in .env.local');
    console.log('Please add CAL_API_KEY=your_api_key to your .env.local file');
    process.exit(1);
  }
  
  console.log('🔑 Testing Cal.com API Key:', apiKey.substring(0, 8) + '...');
  
  try {
    const response = await fetch(`https://api.cal.com/v1/me?apiKey=${apiKey}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cal.com API Key is valid!');
      console.log('👤 User:', data.user.name, `(${data.user.email})`);
      console.log('🌍 Timezone:', data.user.timeZone);
      console.log('👤 Username:', data.user.username);
      
      // Test event types
      console.log('\n📅 Testing Event Types...');
      const eventTypesResponse = await fetch(`https://api.cal.com/v1/event-types?apiKey=${apiKey}`);
      const eventTypesData = await eventTypesResponse.json();
      
      if (eventTypesResponse.ok) {
        console.log(`✅ Found ${eventTypesData.event_types.length} event types`);
        eventTypesData.event_types.slice(0, 3).forEach((et: any) => {
          console.log(`   📝 ${et.title} (${et.length}min) - ${et.hidden ? 'Hidden' : 'Visible'}`);
        });
      } else {
        console.log('❌ Failed to fetch event types:', eventTypesData.message);
      }
      
      // Test schedules
      console.log('\n⏰ Testing Schedules...');
      const schedulesResponse = await fetch(`https://api.cal.com/v1/schedules?apiKey=${apiKey}`);
      const schedulesData = await schedulesResponse.json();
      
      if (schedulesResponse.ok) {
        console.log(`✅ Found ${schedulesData.schedules.length} schedules`);
        schedulesData.schedules.slice(0, 2).forEach((schedule: any) => {
          console.log(`   📋 ${schedule.name} (${schedule.timeZone})`);
        });
      } else {
        console.log('❌ Failed to fetch schedules:', schedulesData.message);
      }
      
    } else {
      console.log('❌ Cal.com API Key is invalid!');
      console.log('Error:', data.message || JSON.stringify(data));
      console.log('\n💡 Make sure you:');
      console.log('   1. Have a valid Cal.com account');
      console.log('   2. Generated an API key in Cal.com settings');
      console.log('   3. Added the correct API key to .env.local');
    }
    
  } catch (error) {
    console.error('💥 Network error:', error);
  }
}

quickTest();