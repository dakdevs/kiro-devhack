import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '~/app/api/recruiter/profile/route';
import { db } from '~/db';
import { recruiterProfiles } from '~/db/schema';
import { eq } from 'drizzle-orm';

// Mock the auth module
vi.mock('~/lib/auth', () => ({
  auth: {
    api: vi.fn().mockReturnValue({
      getSession: vi.fn().mockResolvedValue({
        user: { id: 'test-user-id' }
      })
    })
  }
}));

// Mock the database
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock the schema
vi.mock('~/db/schema', () => ({
  recruiterProfiles: {
    userId: 'userId',
    id: 'id',
    organizationName: 'organizationName',
    recruitingFor: 'recruitingFor',
    contactEmail: 'contactEmail',
    phoneNumber: 'phoneNumber',
    timezone: 'timezone',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
}));

describe('Recruiter Profile API Integration Tests', () => {
  const mockRecruiterProfile = {
    id: 'test-profile-id',
    userId: 'test-user-id',
    organizationName: 'Test Company',
    recruitingFor: 'Software Engineers',
    contactEmail: 'recruiter@test.com',
    phoneNumber: '+1234567890',
    timezone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/recruiter/profile', () => {
    it('should return recruiter profile when profile exists', async () => {
      // Mock database response
      const mockDbResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };
      (db.select as any).mockReturnValue(mockDbResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRecruiterProfile);
    });

    it('should return 404 when profile does not exist', async () => {
      // Mock database response for no profile found
      const mockDbResponse = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      };
      (db.select as any).mockReturnValue(mockDbResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recruiter profile not found');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Mock auth to return no session
      const { auth } = await import('~/lib/auth');
      (auth.api as any).mockReturnValue({
        getSession: vi.fn().mockResolvedValue(null)
      });

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/recruiter/profile', () => {
    const validProfileData = {
      organizationName: 'Test Company',
      recruitingFor: 'Software Engineers',
      contactEmail: 'recruiter@test.com',
      phoneNumber: '+1234567890',
      timezone: 'America/New_York'
    };

    it('should create recruiter profile with valid data', async () => {
      // Mock database insert
      const mockDbResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockRecruiterProfile])
      };
      (db.insert as any).mockReturnValue(mockDbResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile', {
        method: 'POST',
        body: JSON.stringify(validProfileData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRecruiterProfile);
    });

    it('should return 400 with invalid data', async () => {
      const invalidData = {
        organizationName: '', // Empty required field
        recruitingFor: 'Software Engineers'
      };

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('should return 409 when profile already exists', async () => {
      // Mock database to throw unique constraint error
      const mockDbResponse = {
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('duplicate key value violates unique constraint'))
      };
      (db.insert as any).mockReturnValue(mockDbResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile', {
        method: 'POST',
        body: JSON.stringify(validProfileData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recruiter profile already exists');
    });
  });

  describe('PUT /api/recruiter/profile', () => {
    const updateData = {
      organizationName: 'Updated Company',
      contactEmail: 'updated@test.com'
    };

    it('should update recruiter profile with valid data', async () => {
      const updatedProfile = { ...mockRecruiterProfile, ...updateData };
      
      // Mock database update
      const mockDbResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedProfile])
      };
      (db.update as any).mockReturnValue(mockDbResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.organizationName).toBe(updateData.organizationName);
      expect(data.data.contactEmail).toBe(updateData.contactEmail);
    });

    it('should return 404 when profile does not exist', async () => {
      // Mock database update to return empty array
      const mockDbResponse = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([])
      };
      (db.update as any).mockReturnValue(mockDbResponse);

      const request = new NextRequest('http://localhost:3000/api/recruiter/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recruiter profile not found');
    });
  });
});