/**
 * Kyros Agent Runtime - Appointment Service
 * Handles calendar operations and appointment scheduling
 * All booking logic is deterministic and rule-based
 */

import type { AppointmentSlot, CalendarConfig, Lead } from '../types';
import { generateId } from '@/lib/utils';

/**
 * Calendar Provider interface
 */
interface CalendarProvider {
  getAvailableSlots(startDate: Date, endDate: Date): Promise<AppointmentSlot[]>;
  bookSlot(slotId: string, leadId: string): Promise<{ success: boolean; error?: string }>;
  cancelSlot(slotId: string): Promise<boolean>;
  getSlot(slotId: string): Promise<AppointmentSlot | null>;
}

/**
 * Mock Calendar Provider for development/testing
 */
class MockCalendarProvider implements CalendarProvider {
  private slots: Map<string, AppointmentSlot> = new Map();
  private config: CalendarConfig;

  constructor(config: CalendarConfig) {
    this.config = config;
    this.generateSlots();
  }

  private generateSlots() {
    const now = new Date();
    const slots: AppointmentSlot[] = [];

    // Generate slots for the next 14 days
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      
      // Check if this day is available
      const dayOfWeek = date.getDay();
      if (!this.config.availableDays.includes(dayOfWeek)) {
        continue;
      }

      // Generate time slots
      const [startHour] = this.config.availableHours.start.split(':').map(Number);
      const [endHour] = this.config.availableHours.end.split(':').map(Number);
      
      for (let hour = startHour; hour < endHour; hour++) {
        // Skip some slots randomly to simulate existing bookings
        if (Math.random() > 0.7) continue;

        const slot: AppointmentSlot = {
          id: generateId(),
          date: new Date(date.setHours(hour, 0, 0, 0)),
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          available: true,
          confirmationSent: false,
        };
        
        slots.push(slot);
        this.slots.set(slot.id, slot);
      }
    }

    console.log(`[MockCalendar] Generated ${slots.length} available slots`);
  }

  async getAvailableSlots(startDate: Date, endDate: Date): Promise<AppointmentSlot[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Array.from(this.slots.values()).filter(slot => {
      return (
        slot.available &&
        slot.date >= startDate &&
        slot.date <= endDate
      );
    });
  }

  async bookSlot(slotId: string, leadId: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const slot = this.slots.get(slotId);
    if (!slot) {
      return { success: false, error: 'Slot not found' };
    }
    if (!slot.available) {
      return { success: false, error: 'Slot already booked' };
    }

    slot.available = false;
    slot.leadId = leadId;
    this.slots.set(slotId, slot);

    console.log(`[MockCalendar] Booked slot ${slotId} for lead ${leadId}`);
    return { success: true };
  }

  async cancelSlot(slotId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const slot = this.slots.get(slotId);
    if (!slot) return false;

    slot.available = true;
    slot.leadId = undefined;
    slot.confirmedAt = undefined;
    slot.confirmationSent = false;
    this.slots.set(slotId, slot);

    console.log(`[MockCalendar] Cancelled slot ${slotId}`);
    return true;
  }

  async getSlot(slotId: string): Promise<AppointmentSlot | null> {
    return this.slots.get(slotId) ?? null;
  }
}

/**
 * Appointment Service class
 */
export class AppointmentService {
  private provider: CalendarProvider;
  private config: CalendarConfig;

  constructor(config: CalendarConfig) {
    this.config = config;
    
    // Currently only mock provider; Google/Outlook would be added here
    this.provider = new MockCalendarProvider(config);
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AppointmentSlot[]> {
    const now = new Date();
    const startDate = options?.startDate ?? now;
    const endDate = options?.endDate ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const slots = await this.provider.getAvailableSlots(startDate, endDate);
    
    // Sort by date/time
    slots.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Apply limit if specified
    if (options?.limit) {
      return slots.slice(0, options.limit);
    }
    
    return slots;
  }

  /**
   * Book an appointment slot for a lead
   * This is DETERMINISTIC - no AI involved in booking logic
   */
  async bookAppointment(
    lead: Lead, 
    slotId: string
  ): Promise<{ success: boolean; slot?: AppointmentSlot; error?: string }> {
    // Validate lead can book
    if (lead.state === 'opted_out') {
      return { success: false, error: 'Lead has opted out' };
    }
    if (lead.state === 'appointment_confirmed') {
      return { success: false, error: 'Lead already has an appointment' };
    }

    // Attempt to book
    const result = await this.provider.bookSlot(slotId, lead.id);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const slot = await this.provider.getSlot(slotId);
    if (!slot) {
      return { success: false, error: 'Slot not found after booking' };
    }

    return { success: true, slot };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(slotId: string): Promise<boolean> {
    return this.provider.cancelSlot(slotId);
  }

  /**
   * Get a specific slot
   */
  async getSlot(slotId: string): Promise<AppointmentSlot | null> {
    return this.provider.getSlot(slotId);
  }

  /**
   * Format slots for SMS display
   */
  formatSlotsForSms(slots: AppointmentSlot[]): string[] {
    return slots.map(slot => {
      const date = slot.date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return `${date} at ${slot.startTime}`;
    });
  }

  /**
   * Propose appointment slots to a lead
   */
  async proposeSlots(lead: Lead, count: number = 3): Promise<{
    slots: AppointmentSlot[];
    formatted: string[];
  }> {
    const availableSlots = await this.getAvailableSlots({ limit: count });
    
    return {
      slots: availableSlots,
      formatted: this.formatSlotsForSms(availableSlots),
    };
  }

  /**
   * Mark appointment as confirmed
   */
  async confirmAppointment(slotId: string): Promise<{ success: boolean; slot?: AppointmentSlot }> {
    const slot = await this.provider.getSlot(slotId);
    if (!slot) {
      return { success: false };
    }

    slot.confirmedAt = new Date();
    slot.confirmationSent = true;

    return { success: true, slot };
  }

  /**
   * Check if a time is within quiet hours
   */
  isQuietHours(date: Date, quietStart: string, quietEnd: string, timezone: string): boolean {
    // Convert to specified timezone
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: timezone 
    };
    const timeStr = date.toLocaleTimeString('en-US', options);
    const [hour, minute] = timeStr.split(':').map(Number);
    const currentMinutes = hour * 60 + minute;

    const [quietStartHour, quietStartMinute] = quietStart.split(':').map(Number);
    const [quietEndHour, quietEndMinute] = quietEnd.split(':').map(Number);
    const quietStartMinutes = quietStartHour * 60 + quietStartMinute;
    const quietEndMinutes = quietEndHour * 60 + quietEndMinute;

    // Handle quiet hours that span midnight
    if (quietStartMinutes > quietEndMinutes) {
      return currentMinutes >= quietStartMinutes || currentMinutes < quietEndMinutes;
    }

    return currentMinutes >= quietStartMinutes && currentMinutes < quietEndMinutes;
  }
}

// Singleton instance
let appointmentServiceInstance: AppointmentService | null = null;

export function initializeAppointmentService(config: CalendarConfig): AppointmentService {
  appointmentServiceInstance = new AppointmentService(config);
  return appointmentServiceInstance;
}

export function getAppointmentService(): AppointmentService {
  if (!appointmentServiceInstance) {
    appointmentServiceInstance = new AppointmentService({
      provider: 'mock',
      defaultDuration: 60,
      bufferBetween: 15,
      availableHours: { start: '09:00', end: '17:00' },
      availableDays: [1, 2, 3, 4, 5], // Monday-Friday
    });
  }
  return appointmentServiceInstance;
}
