// Cal.com Integration Service
// This service handles all interactions with the Cal.com API

export interface CalEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  price: number;
  currency: string;
  requiresConfirmation: boolean;
  userId: number;
}

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    email: string;
    name: string;
    timeZone: string;
  }>;
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED';
  eventTypeId: number;
  userId: number;
}

export interface CreateBookingRequest {
  eventTypeId: number;
  start: string; // ISO date string
  end: string; // ISO date string
  attendee: {
    email: string;
    name: string;
    timeZone: string;
  };
  metadata?: Record<string, any>;
}

class CalIntegrationService {
  private baseUrl = 'https://api.cal.com/v1';

  /**
   * Fetch event types for a specific user
   */
  async getEventTypes(username: string): Promise<CalEventType[]> {
    try {
      const response = await fetch(`/api/cal/event-types?username=${username}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch event types: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching event types:', error);
      throw error;
    }
  }

  /**
   * Fetch bookings for a user
   */
  async getBookings(userId?: string): Promise<CalBooking[]> {
    try {
      const url = userId ? `/api/cal/bookings?userId=${userId}` : '/api/cal/bookings';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: CreateBookingRequest): Promise<CalBooking> {
    try {
      const response = await fetch('/api/cal/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create booking: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Generate Cal.com embed URL for a user's event type
   */
  generateEmbedUrl(username: string, eventSlug: string, options?: {
    theme?: 'light' | 'dark' | 'auto';
    hideEventTypeDetails?: boolean;
    layout?: 'month_view' | 'week_view' | 'column_view';
  }): string {
    const baseUrl = `https://cal.com/${username}/${eventSlug}`;
    const params = new URLSearchParams();
    
    if (options?.theme) {
      params.append('theme', options.theme);
    }
    
    if (options?.hideEventTypeDetails) {
      params.append('hideEventTypeDetails', 'true');
    }
    
    if (options?.layout) {
      params.append('layout', options.layout);
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }

  /**
   * Generate Cal.com booking link for direct navigation
   */
  generateBookingLink(username: string, eventSlug: string): string {
    return `https://cal.com/${username}/${eventSlug}`;
  }

  /**
   * Validate Cal.com username format
   */
  validateUsername(username: string): boolean {
    // Cal.com usernames should be lowercase, alphanumeric with hyphens
    const usernameRegex = /^[a-z0-9-]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 39;
  }

  /**
   * Format booking time for display
   */
  formatBookingTime(startTime: string, endTime: string, timeZone?: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    const startFormatted = start.toLocaleDateString('en-US', options);
    const endTime12h = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    
    return `${startFormatted} - ${endTime12h}`;
  }
}

// Export singleton instance
export const calIntegration = new CalIntegrationService();

// Export types for use in components
export type { CalEventType, CalBooking, CreateBookingRequest };