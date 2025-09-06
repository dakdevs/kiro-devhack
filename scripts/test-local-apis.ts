#!/usr/bin/env tsx

/**
 * Local API Endpoint Tester
 * 
 * Tests your local API endpoints to identify issues
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

class LocalAPITester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(port = 3000) {
    this.baseUrl = `http://localhost:${port}`;
    console.log('🌐 Testing local APIs at:', this.baseUrl);
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      console.log(`\n🧪 Testing ${method} ${endpoint}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      let data;
      
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

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
        console.log(`   Error: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        return {
          endpoint,
          method,
          status: 'error',
          statusCode: response.status,
          error: typeof data === 'string' ? data : JSON.stringify(data),
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

  async testHealthEndpoints() {
    console.log('\n🏥 Testing Health Endpoints');
    console.log('=' .repeat(50));
    
    // Test basic health
    const healthResult = await this.makeRequest('/api/health');
    this.results.push(healthResult);
    
    return healthResult;
  }

  async testAuthEndpoints() {
    console.log('\n🔐 Testing Auth Endpoints');
    console.log('=' .repeat(50));
    
    // Test auth endpoints (these should return 401 without session)
    const endpoints = [
      '/api/cal_com_api/connect',
      '/api/cal_com_api/sync-event-types',
    ];
    
    for (const endpoint of endpoints) {
      const result = await this.makeRequest(endpoint, 'POST');
      this.results.push(result);
    }
  }

  async testCalComEndpoints() {
    console.log('\n📅 Testing Cal.com Integration Endpoints');
    console.log('=' .repeat(50));
    
    const calComApiKey = process.env.CAL_API_KEY || process.env.CAL_COM_API_KEY;
    
    if (!calComApiKey) {
      console.log('⚠️  CAL_API_KEY not found, skipping Cal.com tests');
      return;
    }
    
    // Test Cal.com connect endpoint (should fail without auth)
    const connectResult = await this.makeRequest('/api/cal_com_api/connect', 'POST', {
      calComApiKey
    });
    this.results.push(connectResult);
    
    // Test sync event types (should fail without auth)
    const syncResult = await this.makeRequest('/api/cal_com_api/sync-event-types', 'POST');
    this.results.push(syncResult);
  }

  async testAvailabilityEndpoints() {
    console.log('\n⏰ Testing Availability Endpoints');
    console.log('=' .repeat(50));
    
    // Test availability endpoints (should fail without auth)
    const availabilityResult = await this.makeRequest('/api/availability/test-id');
    this.results.push(availabilityResult);
  }

  async testChatEndpoint() {
    console.log('\n💬 Testing Chat Endpoint');
    console.log('=' .repeat(50));
    
    // Test chat endpoint
    const chatResult = await this.makeRequest('/api/chat', 'POST', {
      messages: [{ role: 'user', content: 'Hello' }]
    });
    this.results.push(chatResult);
  }

  async runAllTests() {
    console.log('🚀 Starting Local API Tests');
    console.log('=' .repeat(60));
    
    try {
      await this.testHealthEndpoints();
      await this.testAuthEndpoints();
      await this.testCalComEndpoints();
      await this.testAvailabilityEndpoints();
      await this.testChatEndpoint();
      
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 Local API Test Results');
    console.log('=' .repeat(60));
    
    const successful = this.results.filter(r => r.status === 'success');
    const failed = this.results.filter(r => r.status === 'error');
    const unauthorized = this.results.filter(r => r.statusCode === 401);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`🔒 Unauthorized (expected): ${unauthorized.length}`);
    console.log(`📈 Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Endpoints:');
      failed.forEach(result => {
        if (result.statusCode !== 401) { // Don't show expected auth failures
          console.log(`   ${result.method} ${result.endpoint}: ${result.error}`);
        }
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
}

async function main() {
  const args = process.argv.slice(2);
  const port = args[0] ? parseInt(args[0]) : 3000;
  
  const tester = new LocalAPITester(port);
  
  console.log('💡 Make sure your Next.js app is running on port', port);
  console.log('   Run: pnpm dev');
  console.log('');
  
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { LocalAPITester };