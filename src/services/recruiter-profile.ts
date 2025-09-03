import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { recruiterProfiles, user } from '~/db/schema';
import { 
  RecruiterProfile, 
  CreateRecruiterProfileRequest, 
  UpdateRecruiterProfileRequest,
  createRecruiterProfileSchema,
  updateRecruiterProfileSchema
} from '~/types/interview-management';
import { nanoid } from 'nanoid';

/**
 * Service class for managing recruiter profiles
 * Handles CRUD operations, validation, and business logic
 */
export class RecruiterProfileService {
  /**
   * Create a new recruiter profile
   */
  async createProfile(
    userId: string, 
    data: CreateRecruiterProfileRequest
  ): Promise<RecruiterProfile> {
    console.log('[RECRUITER-PROFILE-SERVICE] Creating profile for user:', userId, 'with data:', { organizationName: data.organizationName, recruitingFor: data.recruitingFor });
    
    // Validate input data
    console.log('[RECRUITER-PROFILE-SERVICE] Validating input data');
    const validatedData = createRecruiterProfileSchema.parse(data);
    
    // Note: We trust that Better Auth has already validated the user exists
    // since they have a valid session. The foreign key constraint on recruiterProfiles
    // will catch any issues if the user doesn't exist.
    console.log('[RECRUITER-PROFILE-SERVICE] Proceeding with profile creation for user:', userId);
    
    // Check if recruiter profile already exists for this user
    console.log('[RECRUITER-PROFILE-SERVICE] Checking for existing profile');
    const existingProfile = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, userId))
      .limit(1);
    
    if (existingProfile.length > 0) {
      console.log('[RECRUITER-PROFILE-SERVICE] ERROR: Profile already exists for user:', userId);
      throw new Error('Recruiter profile already exists for this user');
    }
    console.log('[RECRUITER-PROFILE-SERVICE] No existing profile found, proceeding with creation');
    
    // Create new profile
    const profileId = nanoid();
    const now = new Date();
    
    const newProfile = {
      id: profileId,
      userId,
      organizationName: validatedData.organizationName,
      recruitingFor: validatedData.recruitingFor,
      contactEmail: validatedData.contactEmail || null,
      phoneNumber: validatedData.phoneNumber || null,
      timezone: validatedData.timezone || 'UTC',
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('[RECRUITER-PROFILE-SERVICE] Inserting new profile with ID:', profileId);
    try {
      await db.insert(recruiterProfiles).values(newProfile);
      console.log('[RECRUITER-PROFILE-SERVICE] Profile created successfully');
    } catch (dbError) {
      console.error('[RECRUITER-PROFILE-SERVICE] Database insert failed:', dbError);
      
      // Check if it's a foreign key constraint error (user doesn't exist)
      if (dbError instanceof Error && dbError.message.includes('foreign key')) {
        console.log('[RECRUITER-PROFILE-SERVICE] Foreign key constraint failed - user does not exist');
        throw new Error('User not found in database. Please ensure you are properly authenticated.');
      }
      
      // Re-throw other database errors
      throw dbError;
    }
    
    return {
      ...newProfile,
      contactEmail: newProfile.contactEmail || undefined,
      phoneNumber: newProfile.phoneNumber || undefined,
    };
  }
  
  /**
   * Get recruiter profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<RecruiterProfile | null> {
    console.log('[RECRUITER-PROFILE-SERVICE] Getting profile for user:', userId);
    const profiles = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, userId))
      .limit(1);
    
    if (profiles.length === 0) {
      console.log('[RECRUITER-PROFILE-SERVICE] No profile found for user:', userId);
      return null;
    }
    console.log('[RECRUITER-PROFILE-SERVICE] Profile found:', profiles[0].id);
    
    const profile = profiles[0];
    return {
      ...profile,
      contactEmail: profile.contactEmail || undefined,
      phoneNumber: profile.phoneNumber || undefined,
    };
  }
  
  /**
   * Get recruiter profile by profile ID
   */
  async getProfileById(profileId: string): Promise<RecruiterProfile | null> {
    const profiles = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.id, profileId))
      .limit(1);
    
    if (profiles.length === 0) {
      return null;
    }
    
    const profile = profiles[0];
    return {
      ...profile,
      contactEmail: profile.contactEmail || undefined,
      phoneNumber: profile.phoneNumber || undefined,
    };
  }
  
  /**
   * Update recruiter profile
   */
  async updateProfile(
    userId: string, 
    data: UpdateRecruiterProfileRequest
  ): Promise<RecruiterProfile> {
    // Validate input data
    const validatedData = updateRecruiterProfileSchema.parse(data);
    
    // Check if profile exists
    const existingProfile = await this.getProfileByUserId(userId);
    if (!existingProfile) {
      throw new Error('Recruiter profile not found');
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (validatedData.organizationName !== undefined) {
      updateData.organizationName = validatedData.organizationName;
    }
    if (validatedData.recruitingFor !== undefined) {
      updateData.recruitingFor = validatedData.recruitingFor;
    }
    if (validatedData.contactEmail !== undefined) {
      updateData.contactEmail = validatedData.contactEmail || null;
    }
    if (validatedData.phoneNumber !== undefined) {
      updateData.phoneNumber = validatedData.phoneNumber || null;
    }
    if (validatedData.timezone !== undefined) {
      updateData.timezone = validatedData.timezone;
    }
    
    // Update profile
    await db
      .update(recruiterProfiles)
      .set(updateData)
      .where(eq(recruiterProfiles.userId, userId));
    
    // Return updated profile
    const updatedProfile = await this.getProfileByUserId(userId);
    if (!updatedProfile) {
      throw new Error('Failed to retrieve updated profile');
    }
    
    return updatedProfile;
  }
  
  /**
   * Delete recruiter profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    const existingProfile = await this.getProfileByUserId(userId);
    if (!existingProfile) {
      return false;
    }
    
    await db
      .delete(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, userId));
    
    return true;
  }
  
  /**
   * Check if user has a recruiter profile
   */
  async hasProfile(userId: string): Promise<boolean> {
    const profile = await this.getProfileByUserId(userId);
    return profile !== null;
  }
  
  /**
   * Validate profile data for business rules
   */
  private validateBusinessRules(data: CreateRecruiterProfileRequest | UpdateRecruiterProfileRequest): void {
    // Organization name should not be empty or just whitespace
    if (data.organizationName && data.organizationName.trim().length === 0) {
      throw new Error('Organization name cannot be empty');
    }
    
    // Recruiting for should not be empty or just whitespace
    if (data.recruitingFor && data.recruitingFor.trim().length === 0) {
      throw new Error('Recruiting for field cannot be empty');
    }
    
    // Phone number basic validation (if provided)
    if (data.phoneNumber) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Invalid phone number format');
      }
    }
    
    // Timezone validation (basic check)
    if (data.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
      } catch (error) {
        throw new Error('Invalid timezone');
      }
    }
  }
  
  /**
   * Get profile with user information
   */
  async getProfileWithUser(userId: string): Promise<(RecruiterProfile & { user: { name: string; email: string } }) | null> {
    const result = await db
      .select({
        profile: recruiterProfiles,
        user: {
          name: user.name,
          email: user.email,
        },
      })
      .from(recruiterProfiles)
      .innerJoin(user, eq(recruiterProfiles.userId, user.id))
      .where(eq(recruiterProfiles.userId, userId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const { profile, user: userInfo } = result[0];
    
    return {
      ...profile,
      contactEmail: profile.contactEmail || undefined,
      phoneNumber: profile.phoneNumber || undefined,
      user: userInfo,
    };
  }
  
  /**
   * Search recruiter profiles by organization
   */
  async searchByOrganization(organizationName: string): Promise<RecruiterProfile[]> {
    const profiles = await db
      .select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.organizationName, organizationName));
    
    return profiles.map(profile => ({
      ...profile,
      contactEmail: profile.contactEmail || undefined,
      phoneNumber: profile.phoneNumber || undefined,
    }));
  }
}

// Export singleton instance
export const recruiterProfileService = new RecruiterProfileService();