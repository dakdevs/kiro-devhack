import { db } from '~/db';
import { 
  interviewSessionsScheduled, 
  candidateAvailability, 
  jobPostings, 
  recruiterProfiles,
  user 
} from '~/db/schema';
import { eq, and, gte, lte, or, desc, asc, ne } from 'drizzle-orm';
import { 
  InterviewSession,
  ScheduleInterviewRequest,
  ScheduleInterviewResponse,
  ConfirmInterviewRequest,
  RescheduleInterviewRequest,
  TimeSlot,
  ConflictInfo,
  InterviewStatus,
  InterviewType,
  CandidateAvailability
} from '~/types/interview-management';
import { nanoid } from 'nanoid';
import { availabilityService } from './availability';
import { notificationService } from './notification';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError, 
  SchedulingError,
  DatabaseError,
  AuthorizationError
} from '~/lib/errors';
import { logger, withLogging } from '~/lib/logger';
import { withServiceErrorHandling } from '~/lib/error-handler';

export class InterviewSchedulingService {
  /**
   * Validate schedule interview request
   */
  private validateScheduleRequest(request: ScheduleInterviewRequest): void {
    if (!request.jobPostingId || typeof request.jobPostingId !== 'string') {
      throw new ValidationError('Job posting ID is required', 'jobPostingId', request.jobPostingId);
    }
    
    if (!request.candidateId || typeof request.candidateId !== 'string') {
      throw new ValidationError('Candidate ID is required', 'candidateId', request.candidateId);
    }
    
    if (!request.preferredTimes || !Array.isArray(request.preferredTimes) || request.preferredTimes.length === 0) {
      throw new ValidationError('At least one preferred time slot is required', 'preferredTimes', request.preferredTimes);
    }
    
    if (!request.duration || typeof request.duration !== 'number' || request.duration <= 0 || request.duration > 480) {
      throw new ValidationError('Duration must be between 1 and 480 minutes', 'duration', request.duration);
    }
    
    if (!request.timezone || typeof request.timezone !== 'string') {
      throw new ValidationError('Timezone is required', 'timezone', request.timezone);
    }
    
    // Validate preferred times
    request.preferredTimes.forEach((slot, index) => {
      if (!slot.start || !slot.end) {
        throw new ValidationError(`Preferred time slot ${index + 1} must have start and end times`, `preferredTimes[${index}]`, slot);
      }
      
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new ValidationError(`Preferred time slot ${index + 1} has invalid date format`, `preferredTimes[${index}]`, slot);
      }
      
      if (startTime >= endTime) {
        throw new ValidationError(`Preferred time slot ${index + 1} start time must be before end time`, `preferredTimes[${index}]`, slot);
      }
      
      if (startTime < new Date()) {
        throw new ValidationError(`Preferred time slot ${index + 1} cannot be in the past`, `preferredTimes[${index}]`, slot);
      }
    });
    
    // Validate interview type
    const validTypes: InterviewType[] = ['video', 'phone', 'in-person'];
    if (request.interviewType && !validTypes.includes(request.interviewType)) {
      throw new ValidationError('Invalid interview type', 'interviewType', request.interviewType);
    }
  }
  
  /**
   * Check for existing interviews between candidate and job posting
   */
  private async checkForExistingInterviews(candidateId: string, jobPostingId: string): Promise<void> {
    try {
      const existingInterviews = await db
        .select()
        .from(interviewSessionsScheduled)
        .where(
          and(
            eq(interviewSessionsScheduled.candidateId, candidateId),
            eq(interviewSessionsScheduled.jobPostingId, jobPostingId),
            ne(interviewSessionsScheduled.status, 'cancelled')
          )
        )
        .limit(1);
      
      if (existingInterviews.length > 0) {
        const existing = existingInterviews[0];
        throw new ConflictError(
          'An interview already exists between this candidate and job posting',
          'existing_interview',
          {
            interviewId: existing.id,
            status: existing.status,
            scheduledStart: existing.scheduledStart
          }
        );
      }
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      
      logger.error('Error checking for existing interviews', {
        operation: 'interview-scheduling.check-existing',
        metadata: { candidateId, jobPostingId },
      }, error as Error);
      
      throw new DatabaseError(
        'Failed to check for existing interviews',
        'select',
        'interview_sessions_scheduled',
        error as Error
      );
    }
  }
  
  /**
   * Validate job posting access for recruiter
   */
  private async validateJobPostingAccess(recruiterId: string, jobPostingId: string): Promise<void> {
    try {
      const jobPosting = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, jobPostingId))
        .limit(1);
      
      if (jobPosting.length === 0) {
        throw new NotFoundError(
          'Job posting not found',
          'job_posting',
          jobPostingId
        );
      }
      
      if (jobPosting[0].recruiterId !== recruiterId) {
        throw new AuthorizationError(
          'You do not have permission to schedule interviews for this job posting'
        );
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof AuthorizationError) {
        throw error;
      }
      
      logger.error('Error validating job posting access', {
        operation: 'interview-scheduling.validate-job-access',
        metadata: { recruiterId, jobPostingId },
      }, error as Error);
      
      throw new DatabaseError(
        'Failed to validate job posting access',
        'select',
        'job_postings',
        error as Error
      );
    }
  }
  
  /**
   * Validate candidate exists
   */
  private async validateCandidateExists(candidateId: string): Promise<void> {
    try {
      const candidate = await db
        .select()
        .from(user)
        .where(eq(user.id, candidateId))
        .limit(1);
      
      if (candidate.length === 0) {
        throw new NotFoundError(
          'Candidate not found',
          'user',
          candidateId
        );
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error validating candidate exists', {
        operation: 'interview-scheduling.validate-candidate',
        metadata: { candidateId },
      }, error as Error);
      
      throw new DatabaseError(
        'Failed to validate candidate exists',
        'select',
        'user',
        error as Error
      );
    }
  }
  
  /**
   * Send interview notifications to all parties
   */
  private async sendInterviewNotifications(interview: InterviewSession): Promise<void> {
    const notifications = [
      // Notify candidate
      notificationService.createNotification({
        userId: interview.candidateId,
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Your interview has been scheduled for ${new Date(interview.scheduledStart).toLocaleString()}`,
        metadata: {
          interviewId: interview.id,
          jobPostingId: interview.jobPostingId,
        },
      }),
      // Notify recruiter
      notificationService.createNotification({
        userId: interview.recruiterId,
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Interview with candidate has been scheduled for ${new Date(interview.scheduledStart).toLocaleString()}`,
        metadata: {
          interviewId: interview.id,
          candidateId: interview.candidateId,
        },
      }),
    ];
    
    await Promise.all(notifications);
  }
  /**
   * Schedule a new interview
   */
  async scheduleInterview(
    recruiterId: string,
    request: ScheduleInterviewRequest
  ): Promise<ScheduleInterviewResponse> {
    // Validate input parameters
    this.validateScheduleRequest(request);
    
    return withServiceErrorHandling(
      'interview-scheduling.schedule',
      async () => {
        // Validate the job posting belongs to the recruiter
        await this.validateJobPostingAccess(recruiterId, request.jobPostingId);
        
        // Validate candidate exists
        await this.validateCandidateExists(request.candidateId);
        
        // Check for existing interviews between these parties
        await this.checkForExistingInterviews(request.candidateId, request.jobPostingId);
        
        // Find mutual availability
        const mutualSlots = await this.findMutualAvailability(
          request.candidateId,
          recruiterId,
          request.preferredTimes,
          request.duration,
          request.timezone
        );
        
        if (mutualSlots.length === 0) {
          // No mutual availability found, get conflicts and suggestions
          const conflicts = await this.getSchedulingConflicts(
            request.candidateId,
            request.preferredTimes
          );
          
          const suggestedTimes = await this.suggestAlternativeTimes(
            request.candidateId,
            recruiterId,
            request.duration,
            request.timezone
          );
          
          throw new SchedulingError(
            'No mutual availability found for the requested time slots',
            conflicts,
            suggestedTimes
          );
        }
        
        // Use the first available mutual slot
        const selectedSlot = mutualSlots[0];
        
        // Create the interview session
        const interview = await this.createInterviewSession({
          jobPostingId: request.jobPostingId,
          candidateId: request.candidateId,
          recruiterId,
          scheduledStart: selectedSlot.start,
          scheduledEnd: selectedSlot.end,
          timezone: request.timezone,
          interviewType: request.interviewType,
          notes: request.notes,
          duration: request.duration
        });
        
        // Mark the candidate availability as booked
        await this.markAvailabilityAsBooked(
          request.candidateId,
          selectedSlot.start,
          selectedSlot.end
        );
        
        // Send notifications
        try {
          await this.sendInterviewNotifications(interview);
        } catch (notificationError) {
          // Log notification error but don't fail the scheduling
          logger.warn('Failed to send interview notifications', {
            operation: 'interview-scheduling.notifications',
            metadata: { interviewId: interview.id },
          }, notificationError as Error);
        }
        
        logger.logSchedulingOperation('schedule', true, {
          metadata: { 
            interviewId: interview.id,
            candidateId: request.candidateId,
            jobPostingId: request.jobPostingId 
          },
        });
        
        return {
          success: true,
          data: {
            interview
          }
        };
      },
      {
        userId: recruiterId,
        resourceId: request.jobPostingId,
        metadata: { 
          candidateId: request.candidateId,
          duration: request.duration,
          preferredSlotsCount: request.preferredTimes.length 
        },
      }
    );
  }
  
  /**
   * Get scheduled interviews for a user (candidate or recruiter)
   */
  async getScheduledInterviews(
    userId: string,
    userType: 'candidate' | 'recruiter',
    options?: {
      status?: InterviewStatus[];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<InterviewSession[]> {
    const conditions = [];
    
    // Filter by user type
    if (userType === 'candidate') {
      conditions.push(eq(interviewSessionsScheduled.candidateId, userId));
    } else {
      // For recruiter, we need to join with recruiter profiles
      const recruiterProfile = await db.select({ id: recruiterProfiles.id })
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.userId, userId))
        .limit(1);
      
      if (recruiterProfile.length === 0) {
        return [];
      }
      
      conditions.push(eq(interviewSessionsScheduled.recruiterId, recruiterProfile[0].id));
    }
    
    // Filter by status
    if (options?.status && options.status.length > 0) {
      conditions.push(or(...options.status.map(status => 
        eq(interviewSessionsScheduled.status, status)
      )));
    }
    
    // Filter by date range
    if (options?.startDate) {
      conditions.push(gte(interviewSessionsScheduled.scheduledStart, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(interviewSessionsScheduled.scheduledEnd, options.endDate));
    }
    
    let query = db.select()
      .from(interviewSessionsScheduled)
      .where(and(...conditions))
      .orderBy(asc(interviewSessionsScheduled.scheduledStart));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    const results = await query;
    return results.map(this.mapDbToInterviewSession);
  }
  
  /**
   * Confirm an interview
   */
  async confirmInterview(
    userId: string,
    interviewId: string,
    userType: 'candidate' | 'recruiter',
    request: ConfirmInterviewRequest
  ): Promise<InterviewSession> {
    // Get the interview and validate access
    const interview = await this.getInterviewById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    // Validate user has access to this interview
    await this.validateInterviewAccess(userId, interview, userType);
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (request.notes) {
      updateData.notes = request.notes;
    }
    
    // Update confirmation status based on user type
    if (userType === 'candidate') {
      updateData.candidateConfirmed = request.confirmed;
    } else {
      updateData.recruiterConfirmed = request.confirmed;
    }
    
    // If both parties have confirmed, update status
    const otherPartyConfirmed = userType === 'candidate' 
      ? interview.recruiterConfirmed 
      : interview.candidateConfirmed;
    
    if (request.confirmed && otherPartyConfirmed) {
      updateData.status = 'confirmed';
    } else if (!request.confirmed) {
      updateData.status = 'scheduled'; // Reset to scheduled if someone unconfirms
    }
    
    const [updated] = await db.update(interviewSessionsScheduled)
      .set(updateData)
      .where(eq(interviewSessionsScheduled.id, interviewId))
      .returning();
    
    const updatedInterview = this.mapDbToInterviewSession(updated);
    
    // Send notifications if interview is now confirmed
    if (updateData.status === 'confirmed') {
      try {
        // Get job posting and recruiter profile for notification context
        const [jobPosting] = await db.select()
          .from(jobPostings)
          .where(eq(jobPostings.id, interview.jobPostingId))
          .limit(1);
        
        const [recruiterProfile] = await db.select()
          .from(recruiterProfiles)
          .where(eq(recruiterProfiles.id, interview.recruiterId))
          .limit(1);
        
        if (jobPosting && recruiterProfile) {
          await notificationService.notifyInterviewConfirmed(
            interview.candidateId,
            recruiterProfile.userId,
            updatedInterview,
            jobPosting,
            recruiterProfile
          );
        }
      } catch (error) {
        console.error('Failed to send interview confirmed notifications:', error);
        // Don't fail the confirmation if notifications fail
      }
    }
    
    return updatedInterview;
  }
  
  /**
   * Reschedule an interview
   */
  async rescheduleInterview(
    userId: string,
    interviewId: string,
    userType: 'candidate' | 'recruiter',
    request: RescheduleInterviewRequest
  ): Promise<InterviewSession> {
    // Get the interview and validate access
    const interview = await this.getInterviewById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    // Validate user has access to this interview
    await this.validateInterviewAccess(userId, interview, userType);
    
    const newStartTime = new Date(request.newStartTime);
    const newEndTime = new Date(request.newEndTime);
    
    // Validate new time slot
    this.validateTimeSlot(newStartTime, newEndTime, request.timezone);
    
    // Check for conflicts with the new time
    const conflicts = await this.getSchedulingConflicts(
      interview.candidateId,
      [{
        start: newStartTime,
        end: newEndTime,
        timezone: request.timezone
      }],
      interviewId // Exclude current interview from conflict check
    );
    
    if (conflicts.length > 0) {
      throw new Error(`New time conflicts with existing schedule: ${conflicts.map(c => c.description).join(', ')}`);
    }
    
    // Check candidate availability for new time
    const candidateAvailable = await this.checkCandidateAvailability(
      interview.candidateId,
      newStartTime,
      newEndTime
    );
    
    if (!candidateAvailable) {
      throw new Error('Candidate is not available at the requested time');
    }
    
    // Free up the old time slot
    await this.freeAvailabilitySlot(
      interview.candidateId,
      interview.scheduledStart,
      interview.scheduledEnd
    );
    
    // Update the interview
    const [updated] = await db.update(interviewSessionsScheduled)
      .set({
        scheduledStart: newStartTime,
        scheduledEnd: newEndTime,
        timezone: request.timezone,
        status: 'rescheduled',
        notes: request.reason ? `${interview.notes || ''}\n\nRescheduled: ${request.reason}`.trim() : interview.notes,
        candidateConfirmed: false, // Reset confirmations
        recruiterConfirmed: false,
        updatedAt: new Date()
      })
      .where(eq(interviewSessionsScheduled.id, interviewId))
      .returning();
    
    // Mark new time as booked
    await this.markAvailabilityAsBooked(
      interview.candidateId,
      newStartTime,
      newEndTime
    );
    
    return this.mapDbToInterviewSession(updated);
  }
  
  /**
   * Cancel an interview
   */
  async cancelInterview(
    userId: string,
    interviewId: string,
    userType: 'candidate' | 'recruiter',
    reason?: string
  ): Promise<InterviewSession> {
    // Get the interview and validate access
    const interview = await this.getInterviewById(interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    // Validate user has access to this interview
    await this.validateInterviewAccess(userId, interview, userType);
    
    // Free up the availability slot
    await this.freeAvailabilitySlot(
      interview.candidateId,
      interview.scheduledStart,
      interview.scheduledEnd
    );
    
    // Update the interview status
    const [updated] = await db.update(interviewSessionsScheduled)
      .set({
        status: 'cancelled',
        notes: reason ? `${interview.notes || ''}\n\nCancelled: ${reason}`.trim() : interview.notes,
        updatedAt: new Date()
      })
      .where(eq(interviewSessionsScheduled.id, interviewId))
      .returning();
    
    return this.mapDbToInterviewSession(updated);
  }
  
  /**
   * Get interview by ID
   */
  async getInterviewById(interviewId: string): Promise<InterviewSession | null> {
    const [result] = await db.select()
      .from(interviewSessionsScheduled)
      .where(eq(interviewSessionsScheduled.id, interviewId))
      .limit(1);
    
    return result ? this.mapDbToInterviewSession(result) : null;
  }
  
  /**
   * Find mutual availability between candidate and recruiter
   */
  private async findMutualAvailability(
    candidateId: string,
    recruiterId: string,
    preferredTimes: TimeSlot[],
    duration: number,
    timezone: string
  ): Promise<TimeSlot[]> {
    // Get candidate availability
    const candidateAvailability = await availabilityService.getCandidateAvailability(candidateId, {
      status: 'available',
      startDate: new Date() // Only future availability
    });
    
    // For now, assume recruiter is flexible during business hours
    // In a full implementation, you'd also check recruiter availability
    const mutualSlots: TimeSlot[] = [];
    
    for (const preferredTime of preferredTimes) {
      // Check if any candidate availability overlaps with preferred time
      for (const availability of candidateAvailability) {
        const overlap = this.findTimeSlotOverlap(
          preferredTime,
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
            timezone: timezone
          };
          
          // Verify no conflicts with existing interviews
          const conflicts = await this.getSchedulingConflicts(candidateId, [adjustedSlot]);
          if (conflicts.length === 0) {
            mutualSlots.push(adjustedSlot);
          }
        }
      }
    }
    
    // Remove duplicates and sort by start time
    const uniqueSlots = this.removeDuplicateTimeSlots(mutualSlots);
    return uniqueSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  
  /**
   * Suggest alternative times when no mutual availability exists
   */
  private async suggestAlternativeTimes(
    candidateId: string,
    recruiterId: string,
    duration: number,
    timezone: string,
    daysAhead: number = 14
  ): Promise<TimeSlot[]> {
    const startDate = new Date();
    const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    
    // Get all candidate availability in the next two weeks
    const candidateAvailability = await availabilityService.getCandidateAvailability(candidateId, {
      status: 'available',
      startDate,
      endDate
    });
    
    const suggestions: TimeSlot[] = [];
    
    for (const availability of candidateAvailability) {
      // Generate possible time slots within this availability window
      const possibleSlots = this.generateTimeSlots(
        availability.startTime,
        availability.endTime,
        duration,
        timezone
      );
      
      // Filter out slots that conflict with existing interviews
      for (const slot of possibleSlots) {
        const conflicts = await this.getSchedulingConflicts(candidateId, [slot]);
        if (conflicts.length === 0) {
          suggestions.push(slot);
        }
      }
    }
    
    // Sort by start time and return up to 10 suggestions
    return suggestions
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 10);
  }
  
  /**
   * Get scheduling conflicts for given time slots
   */
  private async getSchedulingConflicts(
    candidateId: string,
    timeSlots: TimeSlot[],
    excludeInterviewId?: string
  ): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];
    
    for (const slot of timeSlots) {
      // Check for existing interviews
      const conditions = [
        eq(interviewSessionsScheduled.candidateId, candidateId),
        ne(interviewSessionsScheduled.status, 'cancelled'),
        or(
          and(
            lte(interviewSessionsScheduled.scheduledStart, slot.start),
            gte(interviewSessionsScheduled.scheduledEnd, slot.start)
          ),
          and(
            lte(interviewSessionsScheduled.scheduledStart, slot.end),
            gte(interviewSessionsScheduled.scheduledEnd, slot.end)
          ),
          and(
            gte(interviewSessionsScheduled.scheduledStart, slot.start),
            lte(interviewSessionsScheduled.scheduledEnd, slot.end)
          )
        )
      ];
      
      if (excludeInterviewId) {
        conditions.push(ne(interviewSessionsScheduled.id, excludeInterviewId));
      }
      
      const conflictingInterviews = await db.select()
        .from(interviewSessionsScheduled)
        .where(and(...conditions));
      
      for (const interview of conflictingInterviews) {
        conflicts.push({
          type: 'existing_interview',
          conflictingSlot: {
            start: interview.scheduledStart,
            end: interview.scheduledEnd,
            timezone: interview.timezone
          },
          description: `Conflicts with existing interview from ${interview.scheduledStart.toISOString()} to ${interview.scheduledEnd.toISOString()}`,
          interviewId: interview.id
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Create a new interview session
   */
  private async createInterviewSession(data: {
    jobPostingId: string;
    candidateId: string;
    recruiterId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    timezone: string;
    interviewType: InterviewType;
    notes?: string;
    duration: number;
  }): Promise<InterviewSession> {
    const interviewId = nanoid();
    
    // Generate meeting link for video interviews
    let meetingLink: string | undefined;
    if (data.interviewType === 'video') {
      meetingLink = this.generateMeetingLink(interviewId);
    }
    
    const [created] = await db.insert(interviewSessionsScheduled).values({
      id: interviewId,
      jobPostingId: data.jobPostingId,
      candidateId: data.candidateId,
      recruiterId: data.recruiterId,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      timezone: data.timezone,
      status: 'scheduled',
      interviewType: data.interviewType,
      meetingLink,
      notes: data.notes,
      candidateConfirmed: false,
      recruiterConfirmed: false
    }).returning();
    
    const interview = this.mapDbToInterviewSession(created);
    
    // Send notifications
    try {
      // Get job posting and recruiter profile for notification context
      const [jobPosting] = await db.select()
        .from(jobPostings)
        .where(eq(jobPostings.id, data.jobPostingId))
        .limit(1);
      
      const [recruiterProfile] = await db.select()
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.id, data.recruiterId))
        .limit(1);
      
      if (jobPosting && recruiterProfile) {
        // Get recruiter user ID
        const recruiterUserId = recruiterProfile.userId;
        
        await notificationService.notifyInterviewScheduled(
          data.candidateId,
          recruiterUserId,
          interview,
          jobPosting,
          recruiterProfile
        );
      }
    } catch (error) {
      console.error('Failed to send interview scheduled notifications:', error);
      // Don't fail the interview creation if notifications fail
    }
    
    return interview;
  }
  
  /**
   * Mark candidate availability as booked
   */
  private async markAvailabilityAsBooked(
    candidateId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Find overlapping availability slots and mark them as booked
    const overlappingSlots = await db.select()
      .from(candidateAvailability)
      .where(
        and(
          eq(candidateAvailability.userId, candidateId),
          eq(candidateAvailability.status, 'available'),
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
        )
      );
    
    // For simplicity, mark the entire overlapping slots as booked
    // In a more sophisticated system, you might split slots
    for (const slot of overlappingSlots) {
      await db.update(candidateAvailability)
        .set({ status: 'booked', updatedAt: new Date() })
        .where(eq(candidateAvailability.id, slot.id));
    }
  }
  
  /**
   * Free up availability slot (when interview is cancelled/rescheduled)
   */
  private async freeAvailabilitySlot(
    candidateId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Find booked slots that overlap with the freed time
    const bookedSlots = await db.select()
      .from(candidateAvailability)
      .where(
        and(
          eq(candidateAvailability.userId, candidateId),
          eq(candidateAvailability.status, 'booked'),
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
        )
      );
    
    // Mark them as available again
    for (const slot of bookedSlots) {
      await db.update(candidateAvailability)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(candidateAvailability.id, slot.id));
    }
  }
  
  /**
   * Check if candidate is available at a specific time
   */
  private async checkCandidateAvailability(
    candidateId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const availableSlots = await db.select()
      .from(candidateAvailability)
      .where(
        and(
          eq(candidateAvailability.userId, candidateId),
          eq(candidateAvailability.status, 'available'),
          lte(candidateAvailability.startTime, startTime),
          gte(candidateAvailability.endTime, endTime)
        )
      );
    
    return availableSlots.length > 0;
  }
  
  /**
   * Validate job posting access
   */
  private async validateJobPostingAccess(recruiterId: string, jobPostingId: string): Promise<void> {
    const [jobPosting] = await db.select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobPostingId))
      .limit(1);
    
    if (!jobPosting) {
      throw new Error('Job posting not found');
    }
    
    // Get recruiter profile to check access
    const [recruiterProfile] = await db.select()
      .from(recruiterProfiles)
      .where(eq(recruiterProfiles.userId, recruiterId))
      .limit(1);
    
    if (!recruiterProfile || recruiterProfile.id !== jobPosting.recruiterId) {
      throw new Error('Access denied: Job posting does not belong to this recruiter');
    }
  }
  
  /**
   * Validate candidate exists
   */
  private async validateCandidateExists(candidateId: string): Promise<void> {
    const [candidate] = await db.select()
      .from(user)
      .where(eq(user.id, candidateId))
      .limit(1);
    
    if (!candidate) {
      throw new Error('Candidate not found');
    }
  }
  
  /**
   * Validate interview access
   */
  private async validateInterviewAccess(
    userId: string,
    interview: InterviewSession,
    userType: 'candidate' | 'recruiter'
  ): Promise<void> {
    if (userType === 'candidate') {
      if (interview.candidateId !== userId) {
        throw new Error('Access denied: Interview does not belong to this candidate');
      }
    } else {
      // For recruiter, check if they own the recruiter profile
      const [recruiterProfile] = await db.select()
        .from(recruiterProfiles)
        .where(eq(recruiterProfiles.userId, userId))
        .limit(1);
      
      if (!recruiterProfile || recruiterProfile.id !== interview.recruiterId) {
        throw new Error('Access denied: Interview does not belong to this recruiter');
      }
    }
  }
  
  /**
   * Generate meeting link for video interviews
   */
  private generateMeetingLink(interviewId: string): string {
    // In a real implementation, you'd integrate with Zoom, Google Meet, etc.
    // For now, return a placeholder
    return `https://meet.example.com/interview/${interviewId}`;
  }
  
  /**
   * Generate time slots within a given window
   */
  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number, // minutes
    timezone: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(startDate);
    
    while (current < endDate) {
      const slotEnd = new Date(current.getTime() + duration * 60 * 1000);
      if (slotEnd <= endDate) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
          timezone,
        });
      }
      // Move to next 30-minute slot
      current.setTime(current.getTime() + 30 * 60 * 1000);
    }
    
    return slots;
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
   * Map database result to InterviewSession interface
   */
  private mapDbToInterviewSession(dbResult: any): InterviewSession {
    return {
      id: dbResult.id,
      jobPostingId: dbResult.jobPostingId,
      candidateId: dbResult.candidateId,
      recruiterId: dbResult.recruiterId,
      scheduledStart: dbResult.scheduledStart,
      scheduledEnd: dbResult.scheduledEnd,
      timezone: dbResult.timezone,
      status: dbResult.status,
      interviewType: dbResult.interviewType,
      meetingLink: dbResult.meetingLink || undefined,
      notes: dbResult.notes || undefined,
      candidateConfirmed: dbResult.candidateConfirmed,
      recruiterConfirmed: dbResult.recruiterConfirmed,
      createdAt: dbResult.createdAt,
      updatedAt: dbResult.updatedAt
    };
  }
}

// Export singleton instance
export const interviewSchedulingService = new InterviewSchedulingService();