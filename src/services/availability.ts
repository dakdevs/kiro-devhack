import { db } from '~/db';
import { candidateAvailability, interviewSessionsScheduled } from '~/db/schema';
import { eq, and, gte, lte, or, desc, asc } from 'drizzle-orm';
import { 
  CandidateAvailability, 
  CreateAvailabilityRequest, 
  UpdateAvailabilityRequest,
  RecurrencePattern,
  TimeSlot,
  ConflictInfo,
  InterviewSession,
  AvailabilityStatus
} from '~/types/interview-management';
import { nanoid } from 'nanoid';

export class AvailabilityService {
  /**
   * Create a new availability slot for a candidate
   */
  async createAvailability(
    userId: string, 
    request: CreateAvailabilityRequest
  ): Promise<CandidateAvailability> {
    const startTime = new Date(request.startTime);
    const endTime = new Date(request.endTime);
    
    // Validate time slot
    this.validateTimeSlot(startTime, endTime, request.timezone);
    
    // Check for conflicts with existing availability
    const conflicts = await this.checkAvailabilityConflicts(userId, startTime, endTime);
    if (conflicts.length > 0) {
      throw new Error(`Availability conflicts with existing slots: ${conflicts.map(c => c.description).join(', ')}`);
    }
    
    const availabilityId = nanoid();
    
    const [newAvailability] = await db.insert(candidateAvailability).values({
      id: availabilityId,
      userId,
      startTime,
      endTime,
      timezone: request.timezone,
      isRecurring: request.isRecurring || false,
      recurrencePattern: request.recurrencePattern || null,
      status: 'available',
    }).returning();
    
    // If recurring, generate additional slots
    if (request.isRecurring && request.recurrencePattern) {
      await this.generateRecurringSlots(userId, newAvailability, request.recurrencePattern);
    }
    
    return this.mapDbToAvailability(newAvailability);
  }
  
  /**
   * Get all availability slots for a candidate
   */
  async getCandidateAvailability(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: AvailabilityStatus;
      includeRecurring?: boolean;
    }
  ): Promise<CandidateAvailability[]> {
    let query = db.select().from(candidateAvailability).where(eq(candidateAvailability.userId, userId));
    
    const conditions = [eq(candidateAvailability.userId, userId)];
    
    if (options?.startDate) {
      conditions.push(gte(candidateAvailability.startTime, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(candidateAvailability.endTime, options.endDate));
    }
    
    if (options?.status) {
      conditions.push(eq(candidateAvailability.status, options.status));
    }
    
    if (options?.includeRecurring === false) {
      conditions.push(eq(candidateAvailability.isRecurring, false));
    }
    
    const results = await db.select()
      .from(candidateAvailability)
      .where(and(...conditions))
      .orderBy(asc(candidateAvailability.startTime));
    
    return results.map(this.mapDbToAvailability);
  }
  
  /**
   * Update an existing availability slot
   */
  async updateAvailability(
    userId: string,
    availabilityId: string,
    request: UpdateAvailabilityRequest
  ): Promise<CandidateAvailability> {
    // First, verify the availability belongs to the user
    const existing = await this.getAvailabilityById(availabilityId);
    if (!existing || existing.userId !== userId) {
      throw new Error('Availability slot not found or access denied');
    }
    
    const updateData: any = {};
    
    if (request.startTime) {
      updateData.startTime = new Date(request.startTime);
    }
    
    if (request.endTime) {
      updateData.endTime = new Date(request.endTime);
    }
    
    if (request.timezone) {
      updateData.timezone = request.timezone;
    }
    
    if (request.status) {
      updateData.status = request.status;
    }
    
    if (request.recurrencePattern !== undefined) {
      updateData.recurrencePattern = request.recurrencePattern;
    }
    
    // Validate updated time slot if times are being changed
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || existing.startTime;
      const endTime = updateData.endTime || existing.endTime;
      const timezone = updateData.timezone || existing.timezone;
      
      this.validateTimeSlot(startTime, endTime, timezone);
      
      // Check for conflicts (excluding the current slot)
      const conflicts = await this.checkAvailabilityConflicts(
        userId, 
        startTime, 
        endTime, 
        availabilityId
      );
      if (conflicts.length > 0) {
        throw new Error(`Updated availability conflicts with existing slots: ${conflicts.map(c => c.description).join(', ')}`);
      }
    }
    
    updateData.updatedAt = new Date();
    
    const [updated] = await db.update(candidateAvailability)
      .set(updateData)
      .where(eq(candidateAvailability.id, availabilityId))
      .returning();
    
    return this.mapDbToAvailability(updated);
  }
  
  /**
   * Delete an availability slot
   */
  async deleteAvailability(
    userId: string,
    availabilityId: string
  ): Promise<{ deleted: boolean; conflictingInterviews: InterviewSession[] }> {
    // First, verify the availability belongs to the user
    const existing = await this.getAvailabilityById(availabilityId);
    if (!existing || existing.userId !== userId) {
      throw new Error('Availability slot not found or access denied');
    }
    
    // Check for conflicting scheduled interviews
    const conflictingInterviews = await this.getConflictingInterviews(
      userId,
      existing.startTime,
      existing.endTime
    );
    
    if (conflictingInterviews.length > 0) {
      return {
        deleted: false,
        conflictingInterviews
      };
    }
    
    await db.delete(candidateAvailability)
      .where(eq(candidateAvailability.id, availabilityId));
    
    return {
      deleted: true,
      conflictingInterviews: []
    };
  }
  
  /**
   * Get availability by ID
   */
  async getAvailabilityById(availabilityId: string): Promise<CandidateAvailability | null> {
    const [result] = await db.select()
      .from(candidateAvailability)
      .where(eq(candidateAvailability.id, availabilityId))
      .limit(1);
    
    return result ? this.mapDbToAvailability(result) : null;
  }
  
  /**
   * Find mutual availability between candidate and recruiter
   */
  async findMutualAvailability(
    candidateId: string,
    recruiterId: string,
    preferredTimes: TimeSlot[],
    duration: number // minutes
  ): Promise<TimeSlot[]> {
    // Get candidate availability
    const candidateAvailability = await this.getCandidateAvailability(candidateId, {
      status: 'available',
      startDate: new Date() // Only future availability
    });
    
    // For now, we'll assume recruiter availability is flexible
    // In a full implementation, you'd also check recruiter availability
    
    const mutualSlots: TimeSlot[] = [];
    
    for (const preferredTime of preferredTimes) {
      // Check if any candidate availability overlaps with preferred time
      for (const availability of candidateAvailability) {
        const overlap = this.findTimeSlotOverlap(
          {
            start: preferredTime.start,
            end: preferredTime.end,
            timezone: preferredTime.timezone
          },
          {
            start: availability.startTime,
            end: availability.endTime,
            timezone: availability.timezone
          }
        );
        
        if (overlap && this.getSlotDurationMinutes(overlap) >= duration) {
          // Adjust the slot to the requested duration
          const adjustedSlot: TimeSlot = {
            start: overlap.start,
            end: new Date(overlap.start.getTime() + duration * 60 * 1000),
            timezone: overlap.timezone
          };
          
          mutualSlots.push(adjustedSlot);
        }
      }
    }
    
    // Remove duplicates and sort by start time
    const uniqueSlots = this.removeDuplicateTimeSlots(mutualSlots);
    return uniqueSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  
  /**
   * Check for availability conflicts
   */
  private async checkAvailabilityConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<ConflictInfo[]> {
    const conditions = [
      eq(candidateAvailability.userId, userId),
      or(
        and(
          lte(candidateAvailability.startTime, startTime),
          gte(candidateAvailability.endTime, startTime)
        ),
        and(
          lte(candidateAvailability.startTime, endTime),
          gte(candidateAvailability.endTime, endTime)
        ),
        and(
          gte(candidateAvailability.startTime, startTime),
          lte(candidateAvailability.endTime, endTime)
        )
      )
    ];
    
    let query = db.select().from(candidateAvailability).where(and(...conditions));
    
    const conflictingSlots = await query;
    
    const conflicts: ConflictInfo[] = [];
    
    for (const slot of conflictingSlots) {
      if (excludeId && slot.id === excludeId) {
        continue; // Skip the slot being updated
      }
      
      conflicts.push({
        type: 'existing_interview',
        conflictingSlot: {
          start: slot.startTime,
          end: slot.endTime,
          timezone: slot.timezone
        },
        description: `Conflicts with existing availability from ${slot.startTime.toISOString()} to ${slot.endTime.toISOString()}`
      });
    }
    
    return conflicts;
  }
  
  /**
   * Get conflicting scheduled interviews
   */
  private async getConflictingInterviews(
    candidateId: string,
    startTime: Date,
    endTime: Date
  ): Promise<InterviewSession[]> {
    const conflictingInterviews = await db.select()
      .from(interviewSessionsScheduled)
      .where(
        and(
          eq(interviewSessionsScheduled.candidateId, candidateId),
          or(
            and(
              lte(interviewSessionsScheduled.scheduledStart, startTime),
              gte(interviewSessionsScheduled.scheduledEnd, startTime)
            ),
            and(
              lte(interviewSessionsScheduled.scheduledStart, endTime),
              gte(interviewSessionsScheduled.scheduledEnd, endTime)
            ),
            and(
              gte(interviewSessionsScheduled.scheduledStart, startTime),
              lte(interviewSessionsScheduled.scheduledEnd, endTime)
            )
          )
        )
      );
    
    return conflictingInterviews.map(interview => ({
      id: interview.id,
      jobPostingId: interview.jobPostingId,
      candidateId: interview.candidateId,
      recruiterId: interview.recruiterId,
      scheduledStart: interview.scheduledStart,
      scheduledEnd: interview.scheduledEnd,
      timezone: interview.timezone,
      status: interview.status as any,
      interviewType: interview.interviewType as any,
      meetingLink: interview.meetingLink || undefined,
      notes: interview.notes || undefined,
      candidateConfirmed: interview.candidateConfirmed,
      recruiterConfirmed: interview.recruiterConfirmed,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt
    }));
  }
  
  /**
   * Generate recurring availability slots
   */
  private async generateRecurringSlots(
    userId: string,
    baseSlot: any,
    pattern: RecurrencePattern
  ): Promise<void> {
    const slots: any[] = [];
    const startDate = new Date(baseSlot.startTime);
    const duration = baseSlot.endTime.getTime() - baseSlot.startTime.getTime();
    
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    const maxOccurrences = pattern.maxOccurrences || 52; // Default to 1 year of weekly slots
    const endDate = pattern.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
      // Skip the first occurrence (already created)
      if (occurrenceCount > 0) {
        const slotStart = new Date(currentDate);
        const slotEnd = new Date(currentDate.getTime() + duration);
        
        // Check if this day is included (for weekly recurrence)
        if (pattern.type === 'weekly' && pattern.daysOfWeek) {
          const dayOfWeek = slotStart.getDay();
          if (!pattern.daysOfWeek.includes(dayOfWeek)) {
            this.incrementDate(currentDate, pattern);
            continue;
          }
        }
        
        slots.push({
          id: nanoid(),
          userId,
          startTime: slotStart,
          endTime: slotEnd,
          timezone: baseSlot.timezone,
          isRecurring: true,
          recurrencePattern: pattern,
          status: 'available'
        });
      }
      
      this.incrementDate(currentDate, pattern);
      occurrenceCount++;
    }
    
    if (slots.length > 0) {
      await db.insert(candidateAvailability).values(slots);
    }
  }
  
  /**
   * Increment date based on recurrence pattern
   */
  private incrementDate(date: Date, pattern: RecurrencePattern): void {
    switch (pattern.type) {
      case 'daily':
        date.setDate(date.getDate() + pattern.interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (7 * pattern.interval));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + pattern.interval);
        break;
    }
  }
  
  /**
   * Validate time slot
   */
  private validateTimeSlot(startTime: Date, endTime: Date, timezone: string): void {
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
    
    if (startTime <= new Date()) {
      throw new Error('Start time must be in the future');
    }
    
    if (!timezone || timezone.trim() === '') {
      throw new Error('Timezone is required');
    }
    
    // Validate timezone format (basic check)
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch (error) {
      throw new Error('Invalid timezone format');
    }
  }
  
  /**
   * Find overlap between two time slots
   */
  private findTimeSlotOverlap(slot1: TimeSlot, slot2: TimeSlot): TimeSlot | null {
    const start = new Date(Math.max(slot1.start.getTime(), slot2.start.getTime()));
    const end = new Date(Math.min(slot1.end.getTime(), slot2.end.getTime()));
    
    if (start >= end) {
      return null; // No overlap
    }
    
    return {
      start,
      end,
      timezone: slot1.timezone // Use first slot's timezone
    };
  }
  
  /**
   * Get duration of a time slot in minutes
   */
  private getSlotDurationMinutes(slot: TimeSlot): number {
    return (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
  }
  
  /**
   * Remove duplicate time slots
   */
  private removeDuplicateTimeSlots(slots: TimeSlot[]): TimeSlot[] {
    const unique: TimeSlot[] = [];
    const seen = new Set<string>();
    
    for (const slot of slots) {
      const key = `${slot.start.getTime()}-${slot.end.getTime()}-${slot.timezone}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(slot);
      }
    }
    
    return unique;
  }
  
  /**
   * Map database result to CandidateAvailability interface
   */
  private mapDbToAvailability(dbResult: any): CandidateAvailability {
    return {
      id: dbResult.id,
      userId: dbResult.userId,
      startTime: dbResult.startTime,
      endTime: dbResult.endTime,
      timezone: dbResult.timezone,
      isRecurring: dbResult.isRecurring,
      recurrencePattern: dbResult.recurrencePattern,
      status: dbResult.status,
      createdAt: dbResult.createdAt,
      updatedAt: dbResult.updatedAt
    };
  }
}

// Export singleton instance
export const availabilityService = new AvailabilityService();