/**
 * Kyros Dashboard - Lead Management Service
 * Handles lead data, filtering, and CRUD operations
 */

import type { Lead, LeadFilter, LeadStatus, LeadSource, LeadPriority } from '@/types';
import { generateId } from '@/lib/utils';

/**
 * Mock lead data storage
 */
class LeadService {
  private leads: Map<string, Lead> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleLeads: Lead[] = [
      {
        id: generateId(),
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(415) 555-0123',
        status: 'hot',
        source: 'permit',
        priority: 'high',
        location: {
          address: '123 Solar Drive',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          coordinates: { lat: 37.7749, lng: -122.4194 },
        },
        permitNumber: 'SF-2025-001234',
        systemSize: 8.5,
        estimatedValue: 28000,
        notes: 'Interested in battery storage as well',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        assignedTo: 'Agent 1',
        tags: ['residential', 'battery-interest', 'quick-close'],
      },
      {
        id: generateId(),
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        phone: '(650) 555-0456',
        status: 'new',
        source: 'permit',
        priority: 'high',
        location: {
          address: '456 Green Valley Rd',
          city: 'Palo Alto',
          state: 'CA',
          zipCode: '94301',
          coordinates: { lat: 37.4419, lng: -122.1430 },
        },
        permitNumber: 'PA-2025-005678',
        systemSize: 12.0,
        estimatedValue: 42000,
        notes: 'Commercial property owner',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        tags: ['commercial', 'large-system'],
      },
      {
        id: generateId(),
        name: 'Mike Chen',
        email: 'mike.chen@gmail.com',
        phone: '(510) 555-0789',
        status: 'warm',
        source: 'web',
        priority: 'medium',
        location: {
          address: '789 Oak Street',
          city: 'Oakland',
          state: 'CA',
          zipCode: '94612',
          coordinates: { lat: 37.8044, lng: -122.2712 },
        },
        systemSize: 6.0,
        estimatedValue: 18000,
        notes: 'Requested quote last week',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        assignedTo: 'Agent 2',
        tags: ['residential', 'follow-up'],
      },
      {
        id: generateId(),
        name: 'Emily Davis',
        email: 'emily.d@startup.io',
        phone: '(408) 555-0321',
        status: 'hot',
        source: 'referral',
        priority: 'high',
        location: {
          address: '321 Innovation Way',
          city: 'San Jose',
          state: 'CA',
          zipCode: '95110',
          coordinates: { lat: 37.3382, lng: -121.8863 },
        },
        systemSize: 25.0,
        estimatedValue: 85000,
        notes: 'Tech company HQ - ready to sign',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        assignedTo: 'Agent 1',
        tags: ['commercial', 'enterprise', 'priority'],
      },
      {
        id: generateId(),
        name: 'Robert Wilson',
        email: 'rwilson@home.net',
        phone: '(925) 555-0654',
        status: 'contacted',
        source: 'outbound',
        priority: 'medium',
        location: {
          address: '654 Hillside Ave',
          city: 'Walnut Creek',
          state: 'CA',
          zipCode: '94596',
          coordinates: { lat: 37.9101, lng: -122.0652 },
        },
        systemSize: 10.0,
        estimatedValue: 32000,
        notes: 'Scheduled site visit for next week',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        assignedTo: 'Agent 3',
        tags: ['residential', 'site-visit-scheduled'],
      },
      {
        id: generateId(),
        name: 'Lisa Martinez',
        email: 'lisa.m@email.com',
        phone: '(707) 555-0987',
        status: 'new',
        source: 'permit',
        priority: 'medium',
        location: {
          address: '987 Vineyard Lane',
          city: 'Napa',
          state: 'CA',
          zipCode: '94558',
          coordinates: { lat: 38.2975, lng: -122.2869 },
        },
        permitNumber: 'NP-2025-002345',
        systemSize: 15.0,
        estimatedValue: 55000,
        notes: 'Winery property - large roof space',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        tags: ['commercial', 'agricultural', 'new-permit'],
      },
      {
        id: generateId(),
        name: 'David Brown',
        email: 'dbrown@gmail.com',
        phone: '(831) 555-0147',
        status: 'cold',
        source: 'web',
        priority: 'low',
        location: {
          address: '147 Beach Road',
          city: 'Santa Cruz',
          state: 'CA',
          zipCode: '95060',
          coordinates: { lat: 36.9741, lng: -122.0308 },
        },
        systemSize: 5.0,
        estimatedValue: 15000,
        notes: 'Initial inquiry - no response to follow-ups',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastContactedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        tags: ['residential', 'unresponsive'],
      },
      {
        id: generateId(),
        name: 'Amanda Taylor',
        email: 'ataylor@business.com',
        phone: '(530) 555-0258',
        status: 'warm',
        source: 'partner',
        priority: 'medium',
        location: {
          address: '258 Capitol Ave',
          city: 'Sacramento',
          state: 'CA',
          zipCode: '95814',
          coordinates: { lat: 38.5816, lng: -121.4944 },
        },
        systemSize: 20.0,
        estimatedValue: 72000,
        notes: 'Referred by SunPower partner',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        assignedTo: 'Agent 2',
        tags: ['commercial', 'partner-referral'],
      },
    ];

    sampleLeads.forEach(lead => {
      this.leads.set(lead.id, lead);
    });
  }

  /**
   * Get all leads
   */
  getAllLeads(): Lead[] {
    return Array.from(this.leads.values());
  }

  /**
   * Get lead by ID
   */
  getLead(id: string): Lead | undefined {
    return this.leads.get(id);
  }

  /**
   * Get leads by status
   */
  getLeadsByStatus(status: LeadStatus): Lead[] {
    return this.getAllLeads().filter(lead => lead.status === status);
  }

  /**
   * Get hot leads
   */
  getHotLeads(): Lead[] {
    return this.getLeadsByStatus('hot');
  }

  /**
   * Get new permits
   */
  getNewPermits(): Lead[] {
    return this.getAllLeads().filter(
      lead => lead.source === 'permit' && lead.status === 'new'
    );
  }

  /**
   * Filter leads
   */
  filterLeads(filter: LeadFilter): Lead[] {
    let results = this.getAllLeads();

    if (filter.status && filter.status.length > 0) {
      results = results.filter(lead => filter.status!.includes(lead.status));
    }

    if (filter.source && filter.source.length > 0) {
      results = results.filter(lead => filter.source!.includes(lead.source));
    }

    if (filter.priority && filter.priority.length > 0) {
      results = results.filter(lead => filter.priority!.includes(lead.priority));
    }

    if (filter.region) {
      results = results.filter(
        lead => 
          lead.location.city.toLowerCase().includes(filter.region!.toLowerCase()) ||
          lead.location.state.toLowerCase().includes(filter.region!.toLowerCase())
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      results = results.filter(
        lead =>
          lead.name.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.location.address.toLowerCase().includes(query) ||
          lead.location.city.toLowerCase().includes(query) ||
          lead.permitNumber?.toLowerCase().includes(query)
      );
    }

    if (filter.dateRange) {
      results = results.filter(
        lead =>
          lead.createdAt >= filter.dateRange!.start &&
          lead.createdAt <= filter.dateRange!.end
      );
    }

    return results;
  }

  /**
   * Update lead status
   */
  updateLeadStatus(id: string, status: LeadStatus): Lead | null {
    const lead = this.leads.get(id);
    if (!lead) return null;

    const updatedLead: Lead = {
      ...lead,
      status,
      updatedAt: new Date(),
    };

    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  /**
   * Update lead
   */
  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const lead = this.leads.get(id);
    if (!lead) return null;

    const updatedLead: Lead = {
      ...lead,
      ...updates,
      id: lead.id, // Preserve ID
      updatedAt: new Date(),
    };

    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  /**
   * Get lead statistics
   */
  getLeadStats(): {
    total: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
    byPriority: Record<LeadPriority, number>;
    totalValue: number;
  } {
    const leads = this.getAllLeads();
    
    const byStatus: Record<LeadStatus, number> = {
      new: 0, hot: 0, warm: 0, cold: 0, contacted: 0, converted: 0, lost: 0
    };
    
    const bySource: Record<LeadSource, number> = {
      permit: 0, referral: 0, web: 0, outbound: 0, partner: 0
    };
    
    const byPriority: Record<LeadPriority, number> = {
      high: 0, medium: 0, low: 0
    };

    let totalValue = 0;

    leads.forEach(lead => {
      byStatus[lead.status]++;
      bySource[lead.source]++;
      byPriority[lead.priority]++;
      totalValue += lead.estimatedValue || 0;
    });

    return {
      total: leads.length,
      byStatus,
      bySource,
      byPriority,
      totalValue,
    };
  }
}

// Singleton instance
export const leadService = new LeadService();

// Export helper functions
export function getAllLeads() {
  return leadService.getAllLeads();
}

export function getLead(id: string) {
  return leadService.getLead(id);
}

export function getHotLeads() {
  return leadService.getHotLeads();
}

export function getNewPermits() {
  return leadService.getNewPermits();
}

export function filterLeads(filter: LeadFilter) {
  return leadService.filterLeads(filter);
}

export function updateLeadStatus(id: string, status: LeadStatus) {
  return leadService.updateLeadStatus(id, status);
}

export function getLeadStats() {
  return leadService.getLeadStats();
}
