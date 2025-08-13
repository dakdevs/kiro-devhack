import { beforeAll, afterAll } from 'vitest';

// Mock environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  process.env.DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || 'test-api-key';
  process.env.DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
  process.env.QWEN_MODEL_NAME = 'text-embedding-v3';
  process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-purposes-only';
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
});

// Clean up after all tests
afterAll(() => {
  // Reset environment variables if needed
});