# Kyros Agent Runtime - API Contracts

This document defines the API contracts between the different layers of the Kyros system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           KYROS SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐       ┌─────────────────────┐                 │
│  │   DASHBOARD (UI)    │       │  COMMUNICATION LAYER │                │
│  │   NeonGlow Vault    │       │     (Chat SDK)       │                │
│  │                     │       │                      │                │
│  │ - Token Management  │       │ - Message Drafting   │                │
│  │ - Visualization     │       │ - Intent Classification│               │
│  │ - Manual Overrides  │       │ - OpenAI (language)  │                │
│  │ - NO workflow logic │       │ - NO decisions       │                │
│  └──────────┬──────────┘       └──────────┬───────────┘                │
│             │                             │                            │
│             │    REST API / Events        │                            │
│             └─────────────┬───────────────┘                            │
│                           │                                            │
│                           ▼                                            │
│             ┌─────────────────────────────┐                            │
│             │     AGENT RUNTIME           │                            │
│             │                             │                            │
│             │ - Lead State Machine        │                            │
│             │ - SMS Appointment Setting   │                            │
│             │ - Workflow Orchestration    │                            │
│             │ - Retry & Failure Handling  │                            │
│             │ - Single Source of Truth    │                            │
│             └──────────────┬──────────────┘                            │
│                            │                                           │
│              ┌─────────────┼─────────────┐                            │
│              ▼             ▼             ▼                            │
│         ┌─────────┐  ┌─────────┐  ┌─────────────┐                     │
│         │ Twilio  │  │ Calendar│  │   OpenAI    │                     │
│         │ (SMS)   │  │ Provider│  │ (Language)  │                     │
│         └─────────┘  └─────────┘  └─────────────┘                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Agent Runtime Control

#### GET /api/agent
Get the current status of the Agent Runtime.

**Response:**
```typescript
{
  success: boolean;
  data: {
    running: boolean;
    startedAt?: Date;
    activeWorkflows: number;
    pendingLeads: number;
    processedToday: number;
    health: 'healthy' | 'degraded' | 'unhealthy';
    errors: AgentError[];
  };
  timestamp: Date;
}
```

#### POST /api/agent
Control the Agent Runtime.

**Request:**
```typescript
{
  action: 'start' | 'stop';
}
```

**Response:**
```typescript
{
  success: boolean;
  data: { status: 'started' | 'stopped' };
  timestamp: Date;
}
```

### Lead Management

#### GET /api/agent/leads
Get all leads or lead statistics.

**Query Parameters:**
- `stats=true` - Return only statistics

**Response (leads):**
```typescript
{
  success: boolean;
  data: Lead[];
  timestamp: Date;
}
```

**Response (stats):**
```typescript
{
  success: boolean;
  data: {
    total: number;
    byState: Record<LeadState, number>;
    consentVerified: number;
    optedOut: number;
    appointmentsScheduled: number;
  };
  timestamp: Date;
}
```

#### POST /api/agent/leads
Create a new lead.

**Request:**
```typescript
{
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  source?: string;
  tokenId?: string;
  projectId?: string;
  consentVerified?: boolean;
  consentMethod?: 'form' | 'sms' | 'phone' | 'api';
  metadata?: Record<string, unknown>;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: Lead;
  timestamp: Date;
}
```

#### GET /api/agent/leads/[id]
Get a specific lead by ID.

**Response:**
```typescript
{
  success: boolean;
  data: Lead;
  timestamp: Date;
}
```

#### POST /api/agent/leads/[id]
Trigger actions on a lead.

**Request:**
```typescript
{
  action: 'start_workflow' | 'get_workflows';
}
```

**Response:**
```typescript
{
  success: boolean;
  data: WorkflowExecution | WorkflowExecution[];
  timestamp: Date;
}
```

### SMS Webhook

#### POST /api/agent/sms
Receive incoming SMS messages from providers (e.g., Twilio).

**Request (Twilio format - form data):**
```
From: +15551234567
Body: Yes, I'm interested
MessageSid: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Request (JSON format):**
```typescript
{
  from: string;
  body: string;
  messageSid?: string;
}
```

**Response:**
- For Twilio: TwiML XML response
- For JSON: Standard API response

## Event Types

The Agent Runtime emits events that the Dashboard can subscribe to for real-time updates.

### LeadStateUpdateEvent
```typescript
{
  type: 'lead_state_update';
  leadId: string;
  fromState: LeadState;
  toState: LeadState;
  trigger: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
```

### SmsEvent
```typescript
{
  type: 'sms_sent' | 'sms_received' | 'sms_delivered' | 'sms_failed';
  messageId: string;
  leadId: string;
  direction: 'outbound' | 'inbound';
  body?: string;
  classification?: MessageClassification;
  timestamp: Date;
}
```

### AppointmentEvent
```typescript
{
  type: 'appointment_proposed' | 'appointment_confirmed' | 'appointment_cancelled';
  leadId: string;
  slot: AppointmentSlot;
  timestamp: Date;
}
```

## Data Types

### Lead
```typescript
interface Lead {
  id: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  state: LeadState;
  stateHistory: StateChange[];
  consentVerified: boolean;
  consentTimestamp?: Date;
  consentMethod?: 'form' | 'sms' | 'phone' | 'api';
  contactAttempts: ContactAttempt[];
  lastContactAt?: Date;
  nextContactAt?: Date;
  maxContactAttempts: number;
  appointmentSlot?: AppointmentSlot;
  proposedSlots?: AppointmentSlot[];
  source: string;
  tokenId?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}
```

### LeadState
```typescript
type LeadState =
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
```

### MessageClassification
```typescript
interface MessageClassification {
  intent: 'interested' | 'not_now' | 'stop' | 'question' | 'confirm' | 'reschedule' | 'unknown';
  confidence: number;
  extractedInfo?: {
    preferredDay?: string;
    preferredTime?: string;
    reason?: string;
  };
  rawAnalysis?: string;
}
```

## Role Boundaries

### Dashboard (NeonGlow)
**ALLOWED:**
- Display tokens and their status
- Create, rotate, revoke tokens
- View lead status and history
- Manual overrides (with caution)
- Visualize agent state

**NOT ALLOWED:**
- Execute workflows
- Make business decisions
- Send SMS directly
- Classify messages
- Book appointments

### Communication Layer (Chat SDK)
**ALLOWED:**
- Draft SMS messages
- Classify message intents
- Generate responses to questions
- Use OpenAI for language tasks

**NOT ALLOWED:**
- Decide when to contact
- Book appointments
- Update lead state
- Make workflow decisions
- Persist business state

### Agent Runtime
**ALLOWED:**
- Execute lead state machine
- Send SMS through workflows
- Book appointments
- Retry failed operations
- Emit events to dashboard
- Make deterministic decisions

**NOT ALLOWED:**
- Render UI
- Store tokens
- Use OpenAI for decisions
- Bypass consent verification
- Contact opted-out leads
