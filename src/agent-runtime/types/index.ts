/**
 * Kyros Agent Runtime - Type Definitions
 * Core types for the execution layer handling SMS, workflows, and lead state
 */

// ============================================================================
// LEAD STATE MACHINE TYPES
// ============================================================================

/**
 * Lead states in the appointment setting workflow
 */
export type LeadState =
  | 'new'
  | 'consent_pending'
  | 'consent_verified'
  | 'contact_scheduled'
  | 'initial_contact_sent'
  | 'awaiting_response'
  | 'response_received'
  | 'interested'
  | 'appointment_proposed'
  | 'appointment_confirmed'
  | 'appointment_completed'
  | 'not_interested'
  | 'opted_out'
  | 'failed'
  | 'escalated';

/**
 * Valid state transitions
 */
export interface StateTransition {
  from: LeadState;
  to: LeadState;
  trigger: string;
  conditions?: string[];
}

/**
 * Lead record with full lifecycle tracking
 */
export interface Lead {
  id: string;
  externalId?: string; // OpenSolar project ID or external reference
  
  // Contact Information
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  
  // State Machine
  state: LeadState;
  stateHistory: StateChange[];
  
  // Consent
  consentVerified: boolean;
  consentTimestamp?: Date;
  consentMethod?: 'form' | 'sms' | 'phone' | 'api';
  
  // Contact Attempts
  contactAttempts: ContactAttempt[];
  lastContactAt?: Date;
  nextContactAt?: Date;
  maxContactAttempts: number;
  
  // Appointment
  appointmentSlot?: AppointmentSlot;
  proposedSlots?: AppointmentSlot[];
  
  // Metadata
  source: string;
  tokenId?: string; // Associated API token from NeonGlow
  projectId?: string; // OpenSolar project
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * State change record for audit trail
 */
export interface StateChange {
  id: string;
  fromState: LeadState;
  toState: LeadState;
  trigger: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Contact attempt record
 */
export interface ContactAttempt {
  id: string;
  leadId: string;
  type: 'sms' | 'email' | 'phone';
  direction: 'outbound' | 'inbound';
  timestamp: Date;
  message?: string;
  response?: string;
  status: 'sent' | 'delivered' | 'failed' | 'responded';
  providerId?: string; // External provider message ID (e.g., Twilio SID)
  classification?: MessageClassification;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SMS TYPES
// ============================================================================

/**
 * SMS message to be sent
 */
export interface SmsMessage {
  id: string;
  leadId: string;
  to: string;
  from: string;
  body: string;
  direction: 'outbound' | 'inbound';
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  providerId?: string;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
}

/**
 * Classification result from OpenAI
 */
export interface MessageClassification {
  intent: 'interested' | 'not_now' | 'stop' | 'question' | 'confirm' | 'reschedule' | 'unknown';
  confidence: number;
  extractedInfo?: {
    preferredDay?: string;
    preferredTime?: string;
    reason?: string;
  };
  rawAnalysis?: string;
}

/**
 * SMS provider configuration
 */
export interface SmsProviderConfig {
  provider: 'twilio' | 'mock';
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  webhookUrl?: string;
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

/**
 * Appointment slot
 */
export interface AppointmentSlot {
  id: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string;
  available: boolean;
  leadId?: string;
  calendarId?: string;
  confirmationSent: boolean;
  confirmedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Calendar provider configuration
 */
export interface CalendarConfig {
  provider: 'google' | 'outlook' | 'mock';
  credentials?: Record<string, string>;
  defaultDuration: number; // minutes
  bufferBetween: number; // minutes
  availableHours: {
    start: string; // HH:MM
    end: string;
  };
  availableDays: number[]; // 0-6, Sunday-Saturday
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  retryPolicy: RetryPolicy;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  action: WorkflowAction;
  conditions?: WorkflowCondition[];
  onSuccess?: string; // Next step ID
  onFailure?: string; // Failure step ID
  retryable: boolean;
  timeout: number; // seconds
}

/**
 * Workflow actions
 */
export type WorkflowAction =
  | { type: 'send_sms'; template: string }
  | { type: 'classify_response'; leadId: string }
  | { type: 'propose_appointment'; slots: number }
  | { type: 'book_appointment'; slotId: string }
  | { type: 'update_lead_state'; newState: LeadState }
  | { type: 'escalate'; reason: string }
  | { type: 'wait'; duration: number }
  | { type: 'custom'; handler: string };

/**
 * Workflow condition
 */
export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}

/**
 * Retry policy
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number; // seconds
  maxDelay: number; // seconds
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Workflow execution record
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  leadId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: string;
  startedAt: Date;
  completedAt?: Date;
  attempts: number;
  error?: string;
  context: Record<string, unknown>;
}

// ============================================================================
// AGENT RUNTIME TYPES
// ============================================================================

/**
 * Agent runtime configuration
 */
export interface AgentRuntimeConfig {
  sms: SmsProviderConfig;
  calendar: CalendarConfig;
  openai: {
    apiKey?: string;
    model: string;
    maxTokens: number;
  };
  workflows: {
    maxConcurrent: number;
    defaultRetryPolicy: RetryPolicy;
  };
  contact: {
    maxAttemptsPerLead: number;
    minDelayBetweenAttempts: number; // hours
    quietHoursStart: string; // HH:MM
    quietHoursEnd: string;
    timezone: string;
  };
}

/**
 * Agent runtime status
 */
export interface AgentRuntimeStatus {
  running: boolean;
  startedAt?: Date;
  activeWorkflows: number;
  pendingLeads: number;
  processedToday: number;
  errors: AgentError[];
  health: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Agent error record
 */
export interface AgentError {
  id: string;
  timestamp: Date;
  type: 'sms' | 'calendar' | 'workflow' | 'openai' | 'system';
  message: string;
  leadId?: string;
  workflowId?: string;
  stack?: string;
  resolved: boolean;
}

// ============================================================================
// API CONTRACTS
// ============================================================================

/**
 * Dashboard → Agent Runtime: Trigger workflow
 */
export interface TriggerWorkflowRequest {
  workflowId: string;
  leadId: string;
  context?: Record<string, unknown>;
}

/**
 * Dashboard → Agent Runtime: Create lead
 */
export interface CreateLeadRequest {
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
  metadata?: Record<string, unknown>;
}

/**
 * Agent Runtime → Dashboard: State update event
 */
export interface LeadStateUpdateEvent {
  type: 'lead_state_update';
  leadId: string;
  fromState: LeadState;
  toState: LeadState;
  trigger: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Agent Runtime → Dashboard: SMS event
 */
export interface SmsEvent {
  type: 'sms_sent' | 'sms_received' | 'sms_delivered' | 'sms_failed';
  messageId: string;
  leadId: string;
  direction: 'outbound' | 'inbound';
  body?: string;
  classification?: MessageClassification;
  timestamp: Date;
}

/**
 * Agent Runtime → Dashboard: Appointment event
 */
export interface AppointmentEvent {
  type: 'appointment_proposed' | 'appointment_confirmed' | 'appointment_cancelled';
  leadId: string;
  slot: AppointmentSlot;
  timestamp: Date;
}

/**
 * Agent Runtime API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}
