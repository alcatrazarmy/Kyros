/**
 * Kyros Agent Runtime - Lead State Machine
 * Manages lead lifecycle transitions and validations
 */

import type { Lead, LeadState, StateChange, StateTransition } from '../types';
import { generateId } from '@/lib/utils';

/**
 * Valid state transitions for the lead state machine
 */
const STATE_TRANSITIONS: StateTransition[] = [
  // Initial states
  { from: 'new', to: 'consent_pending', trigger: 'request_consent' },
  { from: 'new', to: 'consent_verified', trigger: 'consent_already_verified' },
  
  // Consent flow
  { from: 'consent_pending', to: 'consent_verified', trigger: 'consent_received' },
  { from: 'consent_pending', to: 'opted_out', trigger: 'consent_declined' },
  { from: 'consent_pending', to: 'failed', trigger: 'consent_timeout' },
  
  // Contact scheduling
  { from: 'consent_verified', to: 'contact_scheduled', trigger: 'schedule_contact' },
  
  // Initial contact
  { from: 'contact_scheduled', to: 'initial_contact_sent', trigger: 'send_initial_sms' },
  { from: 'initial_contact_sent', to: 'awaiting_response', trigger: 'await_response' },
  
  // Response handling
  { from: 'awaiting_response', to: 'response_received', trigger: 'receive_response' },
  { from: 'awaiting_response', to: 'contact_scheduled', trigger: 'schedule_retry' },
  { from: 'awaiting_response', to: 'failed', trigger: 'max_attempts_reached' },
  
  // Response classification outcomes
  { from: 'response_received', to: 'interested', trigger: 'classify_interested' },
  { from: 'response_received', to: 'not_interested', trigger: 'classify_not_interested' },
  { from: 'response_received', to: 'opted_out', trigger: 'classify_stop' },
  { from: 'response_received', to: 'awaiting_response', trigger: 'classify_question' },
  
  // Appointment flow
  { from: 'interested', to: 'appointment_proposed', trigger: 'propose_appointment' },
  { from: 'appointment_proposed', to: 'awaiting_response', trigger: 'await_confirmation' },
  { from: 'appointment_proposed', to: 'appointment_confirmed', trigger: 'confirm_appointment' },
  { from: 'appointment_proposed', to: 'interested', trigger: 'reschedule_requested' },
  { from: 'appointment_confirmed', to: 'appointment_completed', trigger: 'complete_appointment' },
  { from: 'appointment_confirmed', to: 'interested', trigger: 'appointment_cancelled' },
  
  // Opt-out (can happen from almost any state)
  { from: 'initial_contact_sent', to: 'opted_out', trigger: 'opt_out_received' },
  { from: 'awaiting_response', to: 'opted_out', trigger: 'opt_out_received' },
  { from: 'response_received', to: 'opted_out', trigger: 'opt_out_received' },
  { from: 'interested', to: 'opted_out', trigger: 'opt_out_received' },
  { from: 'appointment_proposed', to: 'opted_out', trigger: 'opt_out_received' },
  { from: 'appointment_confirmed', to: 'opted_out', trigger: 'opt_out_received' },
  
  // Escalation
  { from: 'failed', to: 'escalated', trigger: 'escalate' },
  { from: 'interested', to: 'escalated', trigger: 'escalate' },
  { from: 'not_interested', to: 'escalated', trigger: 'escalate' },
];

/**
 * Terminal states where no further transitions are allowed
 */
const TERMINAL_STATES: LeadState[] = [
  'appointment_completed',
  'opted_out',
  'escalated',
];

/**
 * States that block all outbound contact
 */
const CONTACT_BLOCKED_STATES: LeadState[] = [
  'opted_out',
  'escalated',
  'failed',
  'not_interested',
  'appointment_completed',
];

/**
 * Lead State Machine class
 */
export class LeadStateMachine {
  private lead: Lead;

  constructor(lead: Lead) {
    this.lead = lead;
  }

  /**
   * Get current state
   */
  getCurrentState(): LeadState {
    return this.lead.state;
  }

  /**
   * Check if a transition is valid
   */
  canTransition(trigger: string): boolean {
    if (TERMINAL_STATES.includes(this.lead.state)) {
      return false;
    }

    return STATE_TRANSITIONS.some(
      t => t.from === this.lead.state && t.trigger === trigger
    );
  }

  /**
   * Get the target state for a trigger
   */
  getTargetState(trigger: string): LeadState | null {
    const transition = STATE_TRANSITIONS.find(
      t => t.from === this.lead.state && t.trigger === trigger
    );
    return transition?.to ?? null;
  }

  /**
   * Attempt to transition to a new state
   */
  transition(trigger: string, metadata?: Record<string, unknown>): StateChange | null {
    if (!this.canTransition(trigger)) {
      return null;
    }

    const targetState = this.getTargetState(trigger);
    if (!targetState) {
      return null;
    }

    const stateChange: StateChange = {
      id: generateId(),
      fromState: this.lead.state,
      toState: targetState,
      trigger,
      timestamp: new Date(),
      metadata,
    };

    // Update the lead
    this.lead.state = targetState;
    this.lead.stateHistory.push(stateChange);
    this.lead.updatedAt = new Date();

    return stateChange;
  }

  /**
   * Force transition (bypass validation) - use sparingly
   */
  forceTransition(newState: LeadState, trigger: string, metadata?: Record<string, unknown>): StateChange {
    const stateChange: StateChange = {
      id: generateId(),
      fromState: this.lead.state,
      toState: newState,
      trigger: `forced:${trigger}`,
      timestamp: new Date(),
      metadata: { ...metadata, forced: true },
    };

    this.lead.state = newState;
    this.lead.stateHistory.push(stateChange);
    this.lead.updatedAt = new Date();

    return stateChange;
  }

  /**
   * Check if lead can be contacted
   */
  canContact(): boolean {
    return !CONTACT_BLOCKED_STATES.includes(this.lead.state);
  }

  /**
   * Check if lead is in a terminal state
   */
  isTerminal(): boolean {
    return TERMINAL_STATES.includes(this.lead.state);
  }

  /**
   * Check if lead has opted out
   */
  isOptedOut(): boolean {
    return this.lead.state === 'opted_out';
  }

  /**
   * Get available triggers from current state
   */
  getAvailableTriggers(): string[] {
    return STATE_TRANSITIONS
      .filter(t => t.from === this.lead.state)
      .map(t => t.trigger);
  }

  /**
   * Get the updated lead object
   */
  getLead(): Lead {
    return this.lead;
  }
}

/**
 * Create a new lead with initial state
 */
export function createLead(params: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  source: string;
  tokenId?: string;
  projectId?: string;
  consentVerified?: boolean;
  consentMethod?: 'form' | 'sms' | 'phone' | 'api';
  maxContactAttempts?: number;
  metadata?: Record<string, unknown>;
}): Lead {
  const now = new Date();
  const initialState: LeadState = params.consentVerified ? 'consent_verified' : 'new';
  
  return {
    id: generateId(),
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    email: params.email,
    address: params.address,
    state: initialState,
    stateHistory: [{
      id: generateId(),
      fromState: 'new',
      toState: initialState,
      trigger: params.consentVerified ? 'initial_consent_verified' : 'lead_created',
      timestamp: now,
      metadata: { source: params.source },
    }],
    consentVerified: params.consentVerified ?? false,
    consentTimestamp: params.consentVerified ? now : undefined,
    consentMethod: params.consentMethod,
    contactAttempts: [],
    maxContactAttempts: params.maxContactAttempts ?? 5,
    source: params.source,
    tokenId: params.tokenId,
    projectId: params.projectId,
    createdAt: now,
    updatedAt: now,
    metadata: params.metadata,
  };
}

/**
 * Get human-readable state description
 */
export function getStateDescription(state: LeadState): string {
  const descriptions: Record<LeadState, string> = {
    new: 'New lead, pending consent verification',
    consent_pending: 'Awaiting consent from lead',
    consent_verified: 'Consent verified, ready for contact',
    contact_scheduled: 'Contact scheduled',
    initial_contact_sent: 'Initial SMS sent',
    awaiting_response: 'Waiting for lead response',
    response_received: 'Response received, classifying intent',
    interested: 'Lead expressed interest',
    appointment_proposed: 'Appointment times proposed',
    appointment_confirmed: 'Appointment confirmed',
    appointment_completed: 'Appointment completed',
    not_interested: 'Lead not interested',
    opted_out: 'Lead opted out (STOP)',
    failed: 'Failed to complete workflow',
    escalated: 'Escalated to human agent',
  };
  return descriptions[state] ?? 'Unknown state';
}

/**
 * Check if state transition would be valid
 */
export function isValidTransition(from: LeadState, to: LeadState): boolean {
  return STATE_TRANSITIONS.some(t => t.from === from && t.to === to);
}

// Export all transitions for reference
export { STATE_TRANSITIONS, TERMINAL_STATES, CONTACT_BLOCKED_STATES };
