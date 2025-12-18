/**
 * Kyros Agent Runtime - Lead Storage Service
 * Manages lead persistence and retrieval
 */

import type { Lead, LeadState, ContactAttempt } from '../types';
import { createLead } from '../state-machine/leadStateMachine';
import { generateId } from '@/lib/utils';

/**
 * Lead storage (in-memory for now, would use database in production)
 */
class LeadStorage {
  private leads: Map<string, Lead> = new Map();
  private leadsByPhone: Map<string, string> = new Map(); // phone -> leadId

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleLeads: Lead[] = [
      createLead({
        firstName: 'John',
        lastName: 'Smith',
        phone: '+15551234567',
        email: 'john.smith@example.com',
        address: '123 Solar Street, Austin, TX 78701',
        source: 'website',
        consentVerified: true,
        consentMethod: 'form',
        metadata: { referrer: 'google_ads' },
      }),
      createLead({
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+15559876543',
        email: 'sarah.j@example.com',
        address: '456 Sunny Lane, Phoenix, AZ 85001',
        source: 'opensolar',
        consentVerified: true,
        consentMethod: 'form',
        metadata: { projectType: 'residential' },
      }),
      createLead({
        firstName: 'Michael',
        lastName: 'Brown',
        phone: '+15555555555',
        source: 'referral',
        consentVerified: false,
        metadata: { referredBy: 'lead_001' },
      }),
    ];

    sampleLeads.forEach(lead => {
      this.leads.set(lead.id, lead);
      this.leadsByPhone.set(lead.phone, lead.id);
    });

    console.log(`[LeadStorage] Initialized with ${sampleLeads.length} sample leads`);
  }

  /**
   * Get all leads
   */
  getAll(): Lead[] {
    return Array.from(this.leads.values());
  }

  /**
   * Get lead by ID
   */
  getById(id: string): Lead | undefined {
    return this.leads.get(id);
  }

  /**
   * Get lead by phone number
   */
  getByPhone(phone: string): Lead | undefined {
    const leadId = this.leadsByPhone.get(phone);
    return leadId ? this.leads.get(leadId) : undefined;
  }

  /**
   * Create a new lead
   */
  create(params: Parameters<typeof createLead>[0]): Lead {
    const lead = createLead(params);
    this.leads.set(lead.id, lead);
    this.leadsByPhone.set(lead.phone, lead.id);
    return lead;
  }

  /**
   * Update a lead
   */
  update(id: string, updates: Partial<Lead>): Lead | null {
    const lead = this.leads.get(id);
    if (!lead) return null;

    const updatedLead: Lead = {
      ...lead,
      ...updates,
      updatedAt: new Date(),
    };

    this.leads.set(id, updatedLead);
    
    // Update phone index if phone changed
    if (updates.phone && updates.phone !== lead.phone) {
      this.leadsByPhone.delete(lead.phone);
      this.leadsByPhone.set(updates.phone, id);
    }

    return updatedLead;
  }

  /**
   * Delete a lead
   */
  delete(id: string): boolean {
    const lead = this.leads.get(id);
    if (!lead) return false;

    this.leads.delete(id);
    this.leadsByPhone.delete(lead.phone);
    return true;
  }

  /**
   * Add contact attempt to lead
   */
  addContactAttempt(leadId: string, attempt: ContactAttempt): Lead | null {
    const lead = this.leads.get(leadId);
    if (!lead) return null;

    const updatedLead: Lead = {
      ...lead,
      contactAttempts: [...lead.contactAttempts, attempt],
      lastContactAt: attempt.timestamp,
      updatedAt: new Date(),
    };

    this.leads.set(leadId, updatedLead);
    return updatedLead;
  }

  /**
   * Query leads by state
   */
  getByState(state: LeadState): Lead[] {
    return Array.from(this.leads.values()).filter(lead => lead.state === state);
  }

  /**
   * Query leads ready for contact
   */
  getReadyForContact(): Lead[] {
    const now = new Date();
    const contactableStates: LeadState[] = [
      'consent_verified',
      'contact_scheduled',
      'awaiting_response',
    ];

    return Array.from(this.leads.values()).filter(lead => {
      // Must be in contactable state
      if (!contactableStates.includes(lead.state)) return false;
      
      // Must not have exceeded max attempts
      if (lead.contactAttempts.length >= lead.maxContactAttempts) return false;
      
      // Check if scheduled for contact
      if (lead.nextContactAt && lead.nextContactAt > now) return false;

      return true;
    });
  }

  /**
   * Query leads with pending responses
   */
  getAwaitingResponse(): Lead[] {
    return this.getByState('awaiting_response');
  }

  /**
   * Query leads with confirmed appointments
   */
  getWithConfirmedAppointments(): Lead[] {
    return this.getByState('appointment_confirmed');
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byState: Record<LeadState, number>;
    consentVerified: number;
    optedOut: number;
    appointmentsScheduled: number;
  } {
    const leads = Array.from(this.leads.values());
    
    const byState = leads.reduce((acc, lead) => {
      acc[lead.state] = (acc[lead.state] || 0) + 1;
      return acc;
    }, {} as Record<LeadState, number>);

    return {
      total: leads.length,
      byState,
      consentVerified: leads.filter(l => l.consentVerified).length,
      optedOut: leads.filter(l => l.state === 'opted_out').length,
      appointmentsScheduled: leads.filter(l => 
        l.state === 'appointment_proposed' || 
        l.state === 'appointment_confirmed'
      ).length,
    };
  }
}

// Singleton instance
export const leadStorage = new LeadStorage();

// Export helper functions
export function getAllLeads(): Lead[] {
  return leadStorage.getAll();
}

export function getLead(id: string): Lead | undefined {
  return leadStorage.getById(id);
}

export function getLeadByPhone(phone: string): Lead | undefined {
  return leadStorage.getByPhone(phone);
}

export function createNewLead(params: Parameters<typeof createLead>[0]): Lead {
  return leadStorage.create(params);
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | null {
  return leadStorage.update(id, updates);
}

export function addContactAttempt(leadId: string, attempt: ContactAttempt): Lead | null {
  return leadStorage.addContactAttempt(leadId, attempt);
}

export function getLeadsReadyForContact(): Lead[] {
  return leadStorage.getReadyForContact();
}

export function getLeadsAwaitingResponse(): Lead[] {
  return leadStorage.getAwaitingResponse();
}

export function getLeadStats() {
  return leadStorage.getStats();
}
