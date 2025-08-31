import { db } from '~/db';
import { interviewNotifications, user, recruiterProfiles, jobPostings, interviewSessionsScheduled } from '~/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { 
  InterviewNotification, 
  NotificationType, 
  NotificationData,
  NotificationPreferences,
  InterviewSession,
  JobPosting,
  RecruiterProfile
} from '~/types/interview-management';
import { serverConfig } from '~/config/server-config';
import { logger, withLogging } from '~/lib/logger';
import { interviewMonitoring } from '~/lib/monitoring';
import { withServiceErrorHandling } from '~/lib/error-handler';
import { ValidationError, NotFoundError, DatabaseError } from '~/lib/errors';

// Email service interface
interface EmailService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

// Simple email service implementation (can be replaced with SendGrid, etc.)
class SimpleEmailService implements EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // In a real implementation, you would use a service like SendGrid, AWS SES, etc.
      console.log(`Email would be sent to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html}`);
      
      // For now, just log and return true
      // TODO: Implement actual email sending
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}

// Notification templates
interface NotificationTemplate {
  subject: string;
  html: string;
  inAppTitle: string;
  inAppMessage: string;
}

class NotificationTemplateService {
  private templates: Record<NotificationType, (data: NotificationData) => NotificationTemplate> = {
    interview_scheduled: (data) => ({
      subject: `Interview Scheduled - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">Interview Scheduled</h2>
          <p>Hello,</p>
          <p>Your interview has been scheduled for the position: <strong>${data.jobTitle}</strong></p>
          <div style="background: #f5f5f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Date & Time:</strong> ${data.scheduledTime ? new Date(data.scheduledTime).toLocaleString() : 'TBD'}</p>
            <p><strong>Interviewer:</strong> ${data.recruiterName || 'TBD'}</p>
            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
          </div>
          <p>Please confirm your attendance by clicking the link in your dashboard.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'Interview Scheduled',
      inAppMessage: `Your interview for ${data.jobTitle} has been scheduled${data.scheduledTime ? ` for ${new Date(data.scheduledTime).toLocaleDateString()}` : ''}.`
    }),

    interview_confirmed: (data) => ({
      subject: `Interview Confirmed - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #34C759;">Interview Confirmed</h2>
          <p>Hello,</p>
          <p>Your interview for <strong>${data.jobTitle}</strong> has been confirmed.</p>
          <div style="background: #f5f5f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Date & Time:</strong> ${data.scheduledTime ? new Date(data.scheduledTime).toLocaleString() : 'TBD'}</p>
            <p><strong>Interviewer:</strong> ${data.recruiterName || 'TBD'}</p>
            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
          </div>
          <p>We look forward to speaking with you!</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'Interview Confirmed',
      inAppMessage: `Your interview for ${data.jobTitle} has been confirmed${data.scheduledTime ? ` for ${new Date(data.scheduledTime).toLocaleDateString()}` : ''}.`
    }),

    interview_cancelled: (data) => ({
      subject: `Interview Cancelled - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF3B30;">Interview Cancelled</h2>
          <p>Hello,</p>
          <p>Unfortunately, your interview for <strong>${data.jobTitle}</strong> has been cancelled.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p>We apologize for any inconvenience. Please check your dashboard for any rescheduling options.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'Interview Cancelled',
      inAppMessage: `Your interview for ${data.jobTitle} has been cancelled${data.reason ? `: ${data.reason}` : ''}.`
    }),

    interview_rescheduled: (data) => ({
      subject: `Interview Rescheduled - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF9500;">Interview Rescheduled</h2>
          <p>Hello,</p>
          <p>Your interview for <strong>${data.jobTitle}</strong> has been rescheduled.</p>
          <div style="background: #f5f5f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            ${data.previousTime ? `<p><strong>Previous Time:</strong> ${new Date(data.previousTime).toLocaleString()}</p>` : ''}
            <p><strong>New Time:</strong> ${data.newTime ? new Date(data.newTime).toLocaleString() : 'TBD'}</p>
            <p><strong>Interviewer:</strong> ${data.recruiterName || 'TBD'}</p>
            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
          </div>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p>Please confirm your availability for the new time.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'Interview Rescheduled',
      inAppMessage: `Your interview for ${data.jobTitle} has been rescheduled${data.newTime ? ` to ${new Date(data.newTime).toLocaleDateString()}` : ''}.`
    }),

    availability_updated: (data) => ({
      subject: 'Availability Updated',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">Availability Updated</h2>
          <p>Hello,</p>
          <p>Your interview availability has been successfully updated.</p>
          <p>Recruiters will now be able to see your new availability when scheduling interviews.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'Availability Updated',
      inAppMessage: 'Your interview availability has been updated successfully.'
    }),

    job_posted: (data) => ({
      subject: `Job Posted Successfully - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #34C759;">Job Posted Successfully</h2>
          <p>Hello,</p>
          <p>Your job posting for <strong>${data.jobTitle}</strong> has been published successfully.</p>
          <p>Candidates can now view and apply for this position. You'll receive notifications when candidates match your requirements.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'Job Posted',
      inAppMessage: `Your job posting for ${data.jobTitle} has been published successfully.`
    }),

    candidate_matched: (data) => ({
      subject: `New Candidate Match - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">New Candidate Match</h2>
          <p>Hello,</p>
          <p>A new candidate has been matched to your job posting: <strong>${data.jobTitle}</strong></p>
          <p><strong>Candidate:</strong> ${data.candidateName}</p>
          <p>Review their profile and schedule an interview through your recruiter dashboard.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'New Candidate Match',
      inAppMessage: `${data.candidateName} has been matched to your ${data.jobTitle} position.`
    }),

    application_received: (data) => ({
      subject: `New Application - ${data.jobTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">New Application Received</h2>
          <p>Hello,</p>
          <p>You have received a new application for: <strong>${data.jobTitle}</strong></p>
          <p><strong>Candidate:</strong> ${data.candidateName}</p>
          <p>Review the application in your recruiter dashboard.</p>
          <p>Best regards,<br>The Interview Team</p>
        </div>
      `,
      inAppTitle: 'New Application',
      inAppMessage: `${data.candidateName} has applied for your ${data.jobTitle} position.`
    })
  };

  getTemplate(type: NotificationType, data: NotificationData): NotificationTemplate {
    const templateFn = this.templates[type];
    if (!templateFn) {
      throw new Error(`No template found for notification type: ${type}`);
    }
    return templateFn(data);
  }
}

// Main notification service
export class NotificationService {
  private emailService: EmailService;
  private templateService: NotificationTemplateService;

  constructor() {
    this.emailService = new SimpleEmailService();
    this.templateService = new NotificationTemplateService();
  }

  // Create and store a notification
  async createNotification(
    userId: string,
    type: NotificationType,
    data: NotificationData,
    sendEmail: boolean = true
  ): Promise<InterviewNotification> {
    try {
      const template = this.templateService.getTemplate(type, data);
      
      // Generate unique ID
      const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create notification record
      const notification: InterviewNotification = {
        id,
        userId,
        type,
        title: template.inAppTitle,
        message: template.inAppMessage,
        data,
        read: false,
        sentAt: sendEmail ? new Date() : undefined,
        createdAt: new Date()
      };

      // Store in database
      await db.insert(interviewNotifications).values({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt
      });

      // Send email if requested
      if (sendEmail) {
        await this.sendEmailNotification(userId, template);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Send email notification
  private async sendEmailNotification(userId: string, template: NotificationTemplate): Promise<void> {
    try {
      // Get user email
      const userRecord = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (userRecord.length === 0) {
        throw new Error('User not found');
      }

      const userEmail = userRecord[0].email;
      
      // Send email
      await this.emailService.sendEmail(userEmail, template.subject, template.html);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw error - notification was still created
    }
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<{ notifications: InterviewNotification[]; total: number }> {
    try {
      const { limit = 50, offset = 0, unreadOnly = false, types } = options;

      let query = db
        .select()
        .from(interviewNotifications)
        .where(eq(interviewNotifications.userId, userId));

      // Add filters
      const conditions = [eq(interviewNotifications.userId, userId)];
      
      if (unreadOnly) {
        conditions.push(eq(interviewNotifications.read, false));
      }
      
      if (types && types.length > 0) {
        conditions.push(inArray(interviewNotifications.type, types));
      }

      // Apply conditions
      if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }

      // Get notifications with pagination
      const notifications = await query
        .orderBy(desc(interviewNotifications.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalQuery = db
        .select({ count: interviewNotifications.id })
        .from(interviewNotifications);
      
      if (conditions.length > 1) {
        totalQuery.where(and(...conditions));
      } else {
        totalQuery.where(conditions[0]);
      }
      
      const totalResult = await totalQuery;
      const total = totalResult.length;

      return {
        notifications: notifications.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
          sentAt: n.sentAt ? new Date(n.sentAt) : undefined
        })),
        total
      };
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw new Error('Failed to retrieve notifications');
    }
  }

  // Mark notifications as read
  async markNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await db
        .update(interviewNotifications)
        .set({ read: true })
        .where(
          and(
            eq(interviewNotifications.userId, userId),
            inArray(interviewNotifications.id, notificationIds)
          )
        );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: interviewNotifications.id })
        .from(interviewNotifications)
        .where(
          and(
            eq(interviewNotifications.userId, userId),
            eq(interviewNotifications.read, false)
          )
        );

      return result.length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Helper methods for specific notification types
  async notifyInterviewScheduled(
    candidateId: string,
    recruiterId: string,
    interview: InterviewSession,
    jobPosting: JobPosting,
    recruiterProfile: RecruiterProfile
  ): Promise<void> {
    const data: NotificationData = {
      interviewId: interview.id,
      jobPostingId: interview.jobPostingId,
      candidateName: '', // Will be filled by caller if needed
      recruiterName: recruiterProfile.organizationName,
      jobTitle: jobPosting.title,
      scheduledTime: interview.scheduledStart,
      meetingLink: interview.meetingLink
    };

    // Notify candidate
    await this.createNotification(candidateId, 'interview_scheduled', data);

    // Notify recruiter
    await this.createNotification(recruiterId, 'interview_scheduled', {
      ...data,
      recruiterName: undefined // Don't show recruiter their own name
    });
  }

  async notifyInterviewConfirmed(
    candidateId: string,
    recruiterId: string,
    interview: InterviewSession,
    jobPosting: JobPosting,
    recruiterProfile: RecruiterProfile
  ): Promise<void> {
    const data: NotificationData = {
      interviewId: interview.id,
      jobPostingId: interview.jobPostingId,
      recruiterName: recruiterProfile.organizationName,
      jobTitle: jobPosting.title,
      scheduledTime: interview.scheduledStart,
      meetingLink: interview.meetingLink
    };

    // Notify both parties
    await this.createNotification(candidateId, 'interview_confirmed', data);
    await this.createNotification(recruiterId, 'interview_confirmed', {
      ...data,
      recruiterName: undefined
    });
  }

  async notifyInterviewCancelled(
    candidateId: string,
    recruiterId: string,
    interview: InterviewSession,
    jobPosting: JobPosting,
    reason?: string
  ): Promise<void> {
    const data: NotificationData = {
      interviewId: interview.id,
      jobPostingId: interview.jobPostingId,
      jobTitle: jobPosting.title,
      scheduledTime: interview.scheduledStart,
      reason
    };

    // Notify both parties
    await this.createNotification(candidateId, 'interview_cancelled', data);
    await this.createNotification(recruiterId, 'interview_cancelled', data);
  }

  async notifyInterviewRescheduled(
    candidateId: string,
    recruiterId: string,
    interview: InterviewSession,
    jobPosting: JobPosting,
    recruiterProfile: RecruiterProfile,
    previousTime: Date,
    reason?: string
  ): Promise<void> {
    const data: NotificationData = {
      interviewId: interview.id,
      jobPostingId: interview.jobPostingId,
      recruiterName: recruiterProfile.organizationName,
      jobTitle: jobPosting.title,
      previousTime,
      newTime: interview.scheduledStart,
      meetingLink: interview.meetingLink,
      reason
    };

    // Notify both parties
    await this.createNotification(candidateId, 'interview_rescheduled', data);
    await this.createNotification(recruiterId, 'interview_rescheduled', {
      ...data,
      recruiterName: undefined
    });
  }

  async notifyAvailabilityUpdated(candidateId: string): Promise<void> {
    await this.createNotification(candidateId, 'availability_updated', {}, false);
  }

  async notifyJobPosted(recruiterId: string, jobPosting: JobPosting): Promise<void> {
    const data: NotificationData = {
      jobPostingId: jobPosting.id,
      jobTitle: jobPosting.title
    };

    await this.createNotification(recruiterId, 'job_posted', data, false);
  }

  async notifyCandidateMatched(
    recruiterId: string,
    candidateName: string,
    jobPosting: JobPosting
  ): Promise<void> {
    const data: NotificationData = {
      jobPostingId: jobPosting.id,
      candidateName,
      jobTitle: jobPosting.title
    };

    await this.createNotification(recruiterId, 'candidate_matched', data);
  }

  async notifyApplicationReceived(
    recruiterId: string,
    candidateName: string,
    jobPosting: JobPosting
  ): Promise<void> {
    const data: NotificationData = {
      jobPostingId: jobPosting.id,
      candidateName,
      jobTitle: jobPosting.title
    };

    await this.createNotification(recruiterId, 'application_received', data);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();