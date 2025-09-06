#!/usr/bin/env tsx

/**
 * Comprehensive Cal.com API Testing Script
 * 
 * This script systematically tests all Cal.com API endpoints to identify issues.
 * It uses the CAL_COM_API_KEY from your .env.local file.
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  statusCode?: number;
  data?: any;
  error?: string;
  responseTime: number;
}

class CalComAPITester {
  private apiKey: string;
  private baseUrl = 'https://api.cal.com/v1';
  private results: TestResult[] = [];

  constructor() {
    this.apiKey = process.env.CAL_API_KEY || process.env.CAL_COM_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('❌ CAL_API_KEY not found in .env.local');
      console.log('Please add CAL_API_KEY=your_api_key to your .env.local file');
      process.exit(1);
    }
    
    console.log('🔑 Using Cal.com API Key:', this.apiKey.substring(0, 8) + '...');
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}?apiKey=${this.apiKey}`;
    
    try {
      console.log(`\n🧪 Testing ${method} ${endpoint}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Success (${response.status}) - ${responseTime}ms`);
        return {
          endpoint,
          method,
          status: 'success',
          statusCode: response.status,
          data,
          responseTime,
        };
      } else {
        console.log(`❌ Failed (${response.status}) - ${responseTime}ms`);
        console.log(`   Error: ${data.message || JSON.stringify(data)}`);
        return {
          endpoint,
          method,
          status: 'error',
          statusCode: response.status,
          error: data.message || JSON.stringify(data),
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`💥 Network Error - ${responseTime}ms`);
      console.log(`   Error: ${errorMessage}`);
      
      return {
        endpoint,
        method,
        status: 'error',
        error: errorMessage,
        responseTime,
      };
    }
  }

  async testUserEndpoints() {
    console.log('\n📋 Testing User Endpoints');
    console.log('=' .repeat(50));
    
    // Test user info
    const userResult = await this.makeRequest('/me');
    this.results.push(userResult);
    
    return userResult.data?.user;
  }

  async testEventTypeEndpoints() {
    console.log('\n📅 Testing Event Type Endpoints');
    console.log('=' .repeat(50));
    
    // Test event types
    const eventTypesResult = await this.makeRequest('/event-types');
    this.results.push(eventTypesResult);
    
    return eventTypesResult.data?.event_types || [];
  }

  async testScheduleEndpoints() {
    console.log('\n⏰ Testing Schedule Endpoints');
    console.log('=' .repeat(50));
    
    // Test schedules
    const schedulesResult = await this.makeRequest('/schedules');
    this.results.push(schedulesResult);
    
    return schedulesResult.data?.schedules || [];
  }

  async testAvailabilityEndpoints(userId?: number) {
    console.log('\n📊 Testing Availability Endpoints');
    console.log('=' .repeat(50));
    
    // Test availability
    const availabilityResult = await this.makeRequest('/availability');
    this.results.push(availabilityResult);
    
    // If we have a user ID, test user-specific availability
    if (userId) {
      const userAvailabilityResult = await this.makeRequest(`/availability?userId=${userId}`);
      this.results.push(userAvailabilityResult);
    }
    
    return availabilityResult.data;
  }

  async testBookingEndpoints() {
    console.log('\n📝 Testing Booking Endpoints');
    console.log('=' .repeat(50));
    
    // Test bookings
    const bookingsResult = await this.makeRequest('/bookings');
    this.results.push(bookingsResult);
    
    return bookingsResult.data?.bookings || [];
  }

  async testTeamEndpoints() {
    console.log('\n👥 Testing Team Endpoints');
    console.log('=' .repeat(50));
    
    // Test teams
    const teamsResult = await this.makeRequest('/teams');
    this.results.push(teamsResult);
    
    return teamsResult.data?.teams || [];
  }

  async testWebhookEndpoints() {
    console.log('\n🔗 Testing Webhook Endpoints');
    console.log('=' .repeat(50));
    
    // Test webhooks
    const webhooksResult = await this.makeRequest('/webhooks');
    this.results.push(webhooksResult);
    
    return webhooksResult.data?.webhooks || [];
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Cal.com API Tests');
    console.log('=' .repeat(60));
    
    try {
      // Test user endpoints first to get user info
      const user = await this.testUserEndpoints();
      
      // Test all other endpoints
      const [eventTypes, schedules, bookings, teams, webhooks] = await Promise.all([
        this.testEventTypeEndpoints(),
        this.testScheduleEndpoints(),
        this.testBookingEndpoints(),
        this.testTeamEndpoints(),
        this.testWebhookEndpoints(),
      ]);
      
      // Test availability with user ID if available
      await this.testAvailabilityEndpoints(user?.id);
      
      // Generate summary report
      this.generateReport();
      
      return {
        user,
        eventTypes,
        schedules,
        bookings,
        teams,
        webhooks,
        results: this.results,
      };
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(60));
    
    const successful = this.results.filter(r => r.status === 'success');
    const failed = this.results.filter(r => r.status === 'error');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Endpoints:');
      failed.forEach(result => {
        console.log(`   ${result.method} ${result.endpoint}: ${result.error}`);
      });
    }
    
    console.log('\n⚡ Performance Summary:');
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    
    const slowest = this.results.reduce((prev, current) => 
      prev.responseTime > current.responseTime ? prev : current
    );
    console.log(`   Slowest Endpoint: ${slowest.method} ${slowest.endpoint} (${slowest.responseTime}ms)`);
  }

  async testSpecificEndpoint(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    console.log(`\n🎯 Testing Specific Endpoint: ${method} ${endpoint}`);
    const result = await this.makeRequest(endpoint, method, body);
    console.log('\nResult:', JSON.stringify(result, null, 2));
    return result;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const tester = new CalComAPITester();
  
  if (args.length === 0) {
    // Run all tests
    await tester.runAllTests();
  } else if (args[0] === 'endpoint') {
    // Test specific endpoint
    const endpoint = args[1];
    const method = (args[2] as any) || 'GET';
    
    if (!endpoint) {
      console.error('Usage: npm run test:cal-api endpoint <endpoint> [method]');
      console.error('Example: npm run test:cal-api endpoint /me GET');
      process.exit(1);
    }
    
    await tester.testSpecificEndpoint(endpoint, method);
  } else {
    console.error('Usage:');
    console.error('  npm run test:cal-api                    # Run all tests');
    console.error('  npm run test:cal-api endpoint <path>    # Test specific endpoint');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { CalComAPITester };