/**
 * Kyros Integration Layer - API Contract Types
 * 
 * Defines the contract between the frontend (Kyros) and backend repositories.
 * The backend is the single source of truth for all business logic and state.
 * The frontend is a stateless interface that triggers actions and displays state.
 */

// ========================
// CORE INTEGRATION TYPES
// ========================

/**
 * Standard API response wrapper from the backend
 */
export interface BackendResponse<T> {
  success: boolean;
  data?: T;
  error?: BackendError;
  timestamp: string;
  requestId: string;
}

/**
 * Backend error structure
 */
export interface BackendError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/**
 * Command sent from frontend to backend
 */
export interface BackendCommand<T = unknown> {
  type: string;
  payload: T;
  correlationId: string;
  timestamp: string;
}

/**
 * Event emitted from backend to frontend
 */
export interface BackendEvent<T = unknown> {
  type: string;
  payload: T;
  correlationId?: string;
  timestamp: string;
  source: 'backend';
}

// ========================
// LEAD STATE MACHINE
// ========================

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'cold';

export type LeadSource = 
  | 'permit'
  | 'referral'
  | 'web'
  | 'sms_inbound'
  | 'chatgpt_app'
  | 'manual';

export type LeadPriority = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  projectValue?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadStateTransition {
  from: LeadStatus;
  to: LeadStatus;
  triggeredBy: 'user' | 'system' | 'sms_response' | 'calendar_booking';
  timestamp: string;
  note?: string;
}

// ========================
// SMS APPOINTMENT SETTING
// ========================

export type SmsStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'response_received';

export type SmsIntent = 
  | 'initial_outreach'
  | 'follow_up'
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'custom';

export interface SmsMessage {
  id: string;
  leadId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: SmsStatus;
  intent?: SmsIntent;
  sentAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  error?: string;
}

export interface SmsSendCommand {
  leadId: string;
  content: string;
  intent: SmsIntent;
  scheduledFor?: string;
}

// ========================
// CALENDAR BOOKING
// ========================

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType = 
  | 'site_visit'
  | 'consultation'
  | 'installation'
  | 'follow_up'
  | 'permit_inspection';

export interface Appointment {
  id: string;
  leadId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookAppointmentCommand {
  leadId: string;
  type: AppointmentType;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  sendConfirmationSms: boolean;
}

// ========================
// BACKEND COMMANDS
// ========================

export type CommandType = 
  // Lead commands
  | 'lead.create'
  | 'lead.update'
  | 'lead.transition_status'
  | 'lead.assign'
  // SMS commands
  | 'sms.send'
  | 'sms.schedule'
  | 'sms.cancel'
  // Calendar commands
  | 'calendar.book'
  | 'calendar.reschedule'
  | 'calendar.cancel'
  // Token commands
  | 'token.rotate'
  | 'token.revoke'
  | 'token.create'
  // Project commands
  | 'project.sync'
  | 'project.update';

export interface CreateLeadCommand {
  type: 'lead.create';
  payload: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateLeadCommand {
  type: 'lead.update';
  payload: {
    leadId: string;
    updates: Partial<Lead>;
  };
}

export interface TransitionLeadStatusCommand {
  type: 'lead.transition_status';
  payload: {
    leadId: string;
    newStatus: LeadStatus;
    note?: string;
  };
}

export interface SendSmsCommand {
  type: 'sms.send';
  payload: SmsSendCommand;
}

export interface BookAppointmentBackendCommand {
  type: 'calendar.book';
  payload: BookAppointmentCommand;
}

// ========================
// BACKEND EVENTS
// ========================

export type EventType = 
  // Lead events
  | 'lead.created'
  | 'lead.updated'
  | 'lead.status_changed'
  | 'lead.assigned'
  // SMS events
  | 'sms.sent'
  | 'sms.delivered'
  | 'sms.failed'
  | 'sms.response_received'
  // Calendar events
  | 'appointment.created'
  | 'appointment.confirmed'
  | 'appointment.cancelled'
  | 'appointment.completed'
  // Token events
  | 'token.rotated'
  | 'token.revoked'
  | 'token.created'
  // Project events
  | 'project.synced'
  | 'project.updated'
  // System events
  | 'error.escalation'
  | 'system.health';

export interface LeadCreatedEvent {
  type: 'lead.created';
  payload: Lead;
}

export interface LeadStatusChangedEvent {
  type: 'lead.status_changed';
  payload: {
    lead: Lead;
    transition: LeadStateTransition;
  };
}

export interface SmsSentEvent {
  type: 'sms.sent';
  payload: SmsMessage;
}

export interface SmsResponseReceivedEvent {
  type: 'sms.response_received';
  payload: {
    message: SmsMessage;
    suggestedAction?: 'book_appointment' | 'escalate_to_human' | 'send_follow_up';
    confidence: number;
  };
}

export interface AppointmentCreatedEvent {
  type: 'appointment.created';
  payload: Appointment;
}

export interface ErrorEscalationEvent {
  type: 'error.escalation';
  payload: {
    errorId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    context: Record<string, unknown>;
    requiresHumanIntervention: boolean;
  };
}

// ========================
// API ENDPOINTS
// ========================

/**
 * Backend API endpoint definitions
 */
export const API_ENDPOINTS = {
  // Lead endpoints
  leads: {
    list: '/api/v1/leads',
    get: (id: string) => `/api/v1/leads/${id}`,
    create: '/api/v1/leads',
    update: (id: string) => `/api/v1/leads/${id}`,
    transition: (id: string) => `/api/v1/leads/${id}/transition`,
  },
  // SMS endpoints
  sms: {
    send: '/api/v1/sms/send',
    history: (leadId: string) => `/api/v1/leads/${leadId}/sms`,
  },
  // Calendar endpoints
  calendar: {
    book: '/api/v1/appointments',
    get: (id: string) => `/api/v1/appointments/${id}`,
    cancel: (id: string) => `/api/v1/appointments/${id}/cancel`,
    leadAppointments: (leadId: string) => `/api/v1/leads/${leadId}/appointments`,
  },
  // Token endpoints
  tokens: {
    list: '/api/v1/tokens',
    get: (id: string) => `/api/v1/tokens/${id}`,
    create: '/api/v1/tokens',
    rotate: (id: string) => `/api/v1/tokens/${id}/rotate`,
    revoke: (id: string) => `/api/v1/tokens/${id}/revoke`,
  },
  // Project endpoints
  projects: {
    list: '/api/v1/projects',
    get: (id: string) => `/api/v1/projects/${id}`,
    sync: '/api/v1/projects/sync',
  },
  // WebSocket endpoint for real-time events
  events: '/api/v1/events/ws',
} as const;

// ========================
// FRONTEND STATE DISPLAY
// ========================

/**
 * Aggregated state from backend for UI display
 */
export interface DashboardState {
  leads: {
    total: number;
    byStatus: Record<LeadStatus, number>;
    byPriority: Record<LeadPriority, number>;
    recentlyUpdated: Lead[];
  };
  appointments: {
    today: Appointment[];
    upcoming: Appointment[];
    total: number;
  };
  sms: {
    pendingResponses: number;
    sentToday: number;
    deliveryRate: number;
  };
  tokens: {
    active: number;
    expiringSoon: number;
  };
  lastUpdated: string;
}

/**
 * System health status from backend
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    lastCheck: string;
  }[];
  lastCheck: string;
}
