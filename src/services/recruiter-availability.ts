import { eq, and } from 'drizzle-orm';
import { db } from '~/db';
import { recruiterProfiles, recruiterAvailability } from '~/db/schema';
import { calIntegration } from './cal-integration';
import { nanoid } from 'nanoid';

export interface RecruiterAvailabilitySync {
  recruiterId: string;
  calComUsername: string;
  eventTypes: Array<{
    id: string;
    name: string;
    duration: number;
    isActive: boolean;
    calComData: any;
  }>;
  syncedAt: Date;
}

class RecruiterAvailabilityService {
  /**
   * Connect a recruiter to Cal.com and sync their availability
   */
  async connectRecruiterToCal(
    recruiterId: string, 
    calComUsername: string
  ): Promise<{
    success: boolean;
    data?: RecruiterAvailabilitySync;
    error?: string;
  }> {
    try {
      console.log('[RECRUITER-AVAILABILITY] Connecting recruiter to Cal.com:', { recruiterId, calComUsername });

      // Validate Cal.com username
      if (!calIntegration.validateUsername(calComUsername)) {
        return {
          success: false,
          error: 'Invalid Cal.com username format',
        };
      }

      // Update recruiter profile with Cal.com info
      await db
        .update(recruiterProfiles)
        .set({
          calComUsername,
          calComConnected: true,
          updatedAt: new Date(),
        })
        .where(eq(recruiterProfiles.id, recruiterId));

      // Sync availability
      const syncResult = await this.syncRecruiterAvailability(recruiterId);
      
      if (!syncResult.success) {
        // Rollback the connection if sync fails
        await db
          .update(recruiterProfiles)
          .set({
            calComUsername: null,
            calComConnected: false,
            updatedAt: new Date(),
          })
          .where(eq(recruiterProfiles.id, recruiterId));

        return syncResult;
      }

      return syncResult;
    } catch (error) {
      console.error('[RECRUITER-AVAILABILITY] Error connecting to Cal.com:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Cal.com',
      };
    }
  }

  /**
   * Sync recruiter availability from Cal.com
   */
  async syncRecruiterAvailability(recruiterId: string): Promise<{
    success: boolean;
    data?: RecruiterAvailabilitySync;
    error?: string;
  }> {
    try {
      console.log('[RECRUITER-AVAILABILITY] Syncing availability for recruiter:', recruiterId);

      // Get recruiter profile
      const [recruiter] = await db
        .select()
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.id, recruiterId))
        .limit(1);

      if (!recruiter || !recruiter.calComUsername) {
        return {
          success: false,
          error: 'Recruiter not connected to Cal.com',
        };
      }

      // Fetch event types from Cal.com
      let eventTypes;
      try {
        eventTypes = await calIntegration.getEventTypes(recruiter.calComUsername);
      } catch (error) {
        console.error('[RECRUITER-AVAILABILITY] Cal.com API error:', error);
        return {
          success: false,
          error: 'Failed to fetch availability from Cal.com. Please check your Cal.com username and ensure you have event types set up.',
        };
      }

      console.log('[RECRUITER-AVAILABILITY] Fetched event types:', eventTypes.length);

      // Clear existing availability
      await db
        .delete(recruiterAvailability)
        .where(eq(recruiterAvailability.recruiterId, recruiterId));

      // Insert new availability
      const availabilityData = eventTypes.map(eventType => ({
        id: nanoid(),
        recruiterId,
        calComEventTypeId: eventType.id.toString(),
        eventTypeName: eventType.title || eventType.slug,
        duration: eventType.length || 30,
        isActive: !eventType.hidden && eventType.schedulingType !== 'COLLECTIVE', // Only individual bookings
        calComData: eventType,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (availabilityData.length > 0) {
        await db.insert(recruiterAvailability).values(availabilityData);
      }

      const syncData: RecruiterAvailabilitySync = {
        recruiterId,
        calComUsername: recruiter.calComUsername,
        eventTypes: availabilityData.map(item => ({
          id: item.calComEventTypeId,
          name: item.eventTypeName,
          duration: item.duration,
          isActive: item.isActive,
          calComData: item.calComData,
        })),
        syncedAt: new Date(),
      };

      console.log('[RECRUITER-AVAILABILITY] Sync completed:', syncData.eventTypes.length, 'event types');

      return {
        success: true,
        data: syncData,
      };
    } catch (error) {
      console.error('[RECRUITER-AVAILABILITY] Error syncing availability:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync availability',
      };
    }
  }

  /**
   * Get recruiter's current availability
   */
  async getRecruiterAvailability(recruiterId: string): Promise<{
    success: boolean;
    data?: {
      isConnected: boolean;
      calComUsername?: string;
      eventTypes: Array<{
        id: string;
        name: string;
        duration: number;
        isActive: boolean;
        calComLink?: string;
      }>;
      lastSyncedAt?: Date;
    };
    error?: string;
  }> {
    try {
      // Get recruiter profile
      const [recruiter] = await db
        .select()
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.id, recruiterId))
        .limit(1);

      if (!recruiter) {
        return {
          success: false,
          error: 'Recruiter not found',
        };
      }

      if (!recruiter.calComConnected || !recruiter.calComUsername) {
        return {
          success: true,
          data: {
            isConnected: false,
            eventTypes: [],
          },
        };
      }

      // Get availability data
      const availability = await db
        .select()
        .from(recruiterAvailability)
        .where(eq(recruiterAvailability.recruiterId, recruiterId));

      const eventTypes = availability.map(item => ({
        id: item.calComEventTypeId,
        name: item.eventTypeName,
        duration: item.duration,
        isActive: item.isActive,
        calComLink: calIntegration.generateBookingLink(
          recruiter.calComUsername!,
          (item.calComData as any)?.slug || item.eventTypeName.toLowerCase().replace(/\s+/g, '-')
        ),
      }));

      const lastSyncedAt = availability.length > 0 
        ? availability.reduce((latest, item) => 
            item.lastSyncedAt > latest ? item.lastSyncedAt : latest, 
            availability[0].lastSyncedAt
          )
        : undefined;

      return {
        success: true,
        data: {
          isConnected: true,
          calComUsername: recruiter.calComUsername,
          eventTypes,
          lastSyncedAt,
        },
      };
    } catch (error) {
      console.error('[RECRUITER-AVAILABILITY] Error getting availability:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get availability',
      };
    }
  }

  /**
   * Disconnect recruiter from Cal.com
   */
  async disconnectRecruiterFromCal(recruiterId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Clear availability data
      await db
        .delete(recruiterAvailability)
        .where(eq(recruiterAvailability.recruiterId, recruiterId));

      // Update recruiter profile
      await db
        .update(recruiterProfiles)
        .set({
          calComUsername: null,
          calComConnected: false,
          updatedAt: new Date(),
        })
        .where(eq(recruiterProfiles.id, recruiterId));

      return {
        success: true,
      };
    } catch (error) {
      console.error('[RECRUITER-AVAILABILITY] Error disconnecting from Cal.com:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect from Cal.com',
      };
    }
  }

  /**
   * Get booking link for a specific recruiter event type
   */
  getBookingLink(calComUsername: string, eventTypeSlug: string): string {
    return calIntegration.generateBookingLink(calComUsername, eventTypeSlug);
  }

  /**
   * Bulk sync all connected recruiters (for scheduled jobs)
   */
  async syncAllRecruiters(): Promise<{
    success: boolean;
    data?: {
      totalProcessed: number;
      successful: number;
      failed: number;
      errors: string[];
    };
    error?: string;
  }> {
    try {
      console.log('[RECRUITER-AVAILABILITY] Starting bulk sync of all recruiters');

      const connectedRecruiters = await db
        .select({ id: recruiterProfiles.id })
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.calComConnected, true));

      console.log('[RECRUITER-AVAILABILITY] Found connected recruiters:', connectedRecruiters.length);

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const recruiter of connectedRecruiters) {
        try {
          const result = await this.syncRecruiterAvailability(recruiter.id);
          if (result.success) {
            successful++;
          } else {
            failed++;
            errors.push(`Recruiter ${recruiter.id}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Recruiter ${recruiter.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log('[RECRUITER-AVAILABILITY] Bulk sync completed:', { successful, failed });

      return {
        success: true,
        data: {
          totalProcessed: connectedRecruiters.length,
          successful,
          failed,
          errors,
        },
      };
    } catch (error) {
      console.error('[RECRUITER-AVAILABILITY] Error in bulk sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync recruiters',
      };
    }
  }
}

export const recruiterAvailabilityService = new RecruiterAvailabilityService();