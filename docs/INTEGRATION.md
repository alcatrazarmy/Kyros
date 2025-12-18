# Kyros Integration Architecture

> Complete integration specification between the Backend (Brain) and Frontend (Face) repositories.

## System Overview

### Repository Responsibilities

#### Backend Repository (The Brain)
**OWNS:**
- Execution of all business logic
- State management and persistence
- Memory and audit trails
- Orchestration of all workflows
- Adapters for external services:
  - OpenSolar API
  - SMS providers (Twilio, etc.)
  - Calendar services (Google Calendar, etc.)
  - City permit systems
  - ChatGPT App integration

**NEVER DOES:**
- Render UI
- Make presentation decisions
- Store display preferences
- Handle user input validation (only business validation)

#### Frontend Repository (The Face) - This Repository
**OWNS:**
- UI rendering and presentation
- User input handling
- Display and control surfaces
- Messaging display (SMS, ChatGPT, dashboards)
- Visual state representation

**NEVER DOES:**
- Execute business logic
- Make workflow decisions
- Persist authoritative state
- Decide outcomes independently
- Query external services directly

---

## API Contract

### Authentication

All API requests require a Bearer token:

```typescript
headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json',
  'X-Request-ID': '<unique-request-id>'
}
```

### Standard Response Format

```typescript
interface BackendResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
  };
  timestamp: string;
  requestId: string;
}
```

### Command Pattern

Frontend sends commands to backend. Backend decides what happens:

```typescript
interface BackendCommand<T = unknown> {
  type: string;        // e.g., 'lead.create', 'sms.send'
  payload: T;
  correlationId: string;
  timestamp: string;
}
```

### Event Pattern

Backend emits events. Frontend subscribes and updates display:

```typescript
interface BackendEvent<T = unknown> {
  type: string;           // e.g., 'lead.created', 'sms.delivered'
  payload: T;
  correlationId?: string; // Links to originating command
  timestamp: string;
  source: 'backend';
}
```

---

## API Endpoints

### Lead Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/leads` | List all leads |
| GET | `/api/v1/leads/:id` | Get single lead |
| POST | `/api/v1/commands` | Create lead (type: `lead.create`) |
| POST | `/api/v1/commands` | Update lead (type: `lead.update`) |
| POST | `/api/v1/commands` | Transition status (type: `lead.transition_status`) |

### SMS Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/leads/:leadId/sms` | Get SMS history for lead |
| POST | `/api/v1/commands` | Send SMS (type: `sms.send`) |
| POST | `/api/v1/commands` | Schedule SMS (type: `sms.schedule`) |

### Calendar Booking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/appointments/:id` | Get appointment |
| GET | `/api/v1/leads/:leadId/appointments` | Get lead appointments |
| POST | `/api/v1/commands` | Book appointment (type: `calendar.book`) |
| POST | `/api/v1/commands` | Cancel appointment (type: `calendar.cancel`) |

### Token Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tokens` | List all tokens |
| GET | `/api/v1/tokens/:id` | Get single token |
| POST | `/api/v1/commands` | Rotate token (type: `token.rotate`) |
| POST | `/api/v1/commands` | Revoke token (type: `token.revoke`) |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard` | Get aggregated dashboard state |
| GET | `/api/v1/health` | Get system health status |
| WS | `/api/v1/events/ws` | WebSocket for real-time events |

---

## Message Flow Diagrams

### Flow 1: Lead → SMS → Booking

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   FRONTEND  │    │   BACKEND   │    │  EXTERNAL   │
│    (Face)   │    │   (Brain)   │    │  SERVICES   │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      │  1. User creates │                  │
      │     new lead     │                  │
      ├─────────────────►│                  │
      │  lead.create     │                  │
      │                  │                  │
      │                  │ 2. Backend       │
      │                  │    validates &   │
      │                  │    persists      │
      │                  │                  │
      │◄─────────────────┤                  │
      │  lead.created    │                  │
      │  (event)         │                  │
      │                  │                  │
      │                  │ 3. Backend auto- │
      │                  │    triggers SMS  │
      │                  ├─────────────────►│
      │                  │  Send SMS via    │
      │                  │  Twilio          │
      │                  │                  │
      │                  │◄─────────────────┤
      │                  │  SMS delivered   │
      │                  │                  │
      │◄─────────────────┤                  │
      │  sms.sent        │                  │
      │  (event)         │                  │
      │                  │                  │
      │                  │◄─────────────────┤
      │                  │ 4. Lead replies  │
      │                  │    via SMS       │
      │                  │                  │
      │                  │ 5. Backend       │
      │                  │    processes     │
      │                  │    response      │
      │                  │                  │
      │◄─────────────────┤                  │
      │  sms.response_   │                  │
      │  received        │                  │
      │  (suggests:      │                  │
      │   book_appt)     │                  │
      │                  │                  │
      │                  │ 6. Backend auto- │
      │                  │    books appt    │
      │                  ├─────────────────►│
      │                  │  Create calendar │
      │                  │  event           │
      │                  │                  │
      │◄─────────────────┤                  │
      │  appointment.    │                  │
      │  created         │                  │
      │  (event)         │                  │
      │                  │                  │
      │  7. Frontend     │                  │
      │     displays     │                  │
      │     updated      │                  │
      │     state        │                  │
      ▼                  ▼                  ▼
```

### Flow 2: State Change → UI Update

```
┌─────────────┐    ┌─────────────┐
│   FRONTEND  │    │   BACKEND   │
│    (Face)   │    │   (Brain)   │
└─────┬───────┘    └─────┬───────┘
      │                  │
      │  WebSocket       │
      │  connection      │
      │◄────────────────►│
      │  established     │
      │                  │
      │                  │ 1. Backend
      │                  │    state changes
      │                  │    (any source)
      │                  │
      │◄─────────────────┤
      │  event: lead.    │ 2. Backend emits
      │  status_changed  │    event
      │                  │
      │  3. Frontend     │
      │     receives     │
      │     event        │
      │                  │
      │  4. Frontend     │
      │     updates      │
      │     UI state     │
      │                  │
      │  (No logic -     │
      │   just display)  │
      ▼                  ▼
```

### Flow 3: Failure → Escalation

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   FRONTEND  │    │   BACKEND   │    │    HUMAN    │
│    (Face)   │    │   (Brain)   │    │  OPERATOR   │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      │                  │ 1. Operation     │
      │                  │    fails (e.g.,  │
      │                  │    SMS delivery) │
      │                  │                  │
      │                  │ 2. Backend       │
      │                  │    logs error    │
      │                  │                  │
      │                  │ 3. Backend       │
      │                  │    retries       │
      │                  │    (automatic)   │
      │                  │                  │
      │                  │ 4. After max     │
      │                  │    retries,      │
      │                  │    escalate      │
      │                  │                  │
      │◄─────────────────┤                  │
      │  error.escalation│                  │
      │  (event)         │                  │
      │                  │                  │
      │  5. Frontend     │                  │
      │     displays     │                  │
      │     alert        │                  │
      │                  │                  │
      │                  │                  │
      │                  │─────────────────►│
      │                  │ 6. Notification  │
      │                  │    sent to       │
      │                  │    operator      │
      │                  │                  │
      │                  │◄─────────────────│
      │                  │ 7. Human takes   │
      │                  │    action        │
      │                  │                  │
      │◄─────────────────┤                  │
      │  Resolution      │                  │
      │  event           │                  │
      ▼                  ▼                  ▼
```

---

## Lead State Machine

The backend owns the lead state machine. The frontend only displays current state.

```
           ┌──────────────────────────────────────┐
           │                                      │
           ▼                                      │
      ┌─────────┐                                 │
      │   NEW   │                                 │
      └────┬────┘                                 │
           │                                      │
           │ (auto: SMS sent)                     │
           ▼                                      │
    ┌─────────────┐                               │
    │  CONTACTED  │◄──────────────────────────────┤
    └──────┬──────┘                               │
           │                                      │
           │ (positive response)                  │
           ▼                                      │
    ┌─────────────┐                               │
    │  QUALIFIED  │                               │
    └──────┬──────┘                               │
           │                                      │
           │ (proposal created)                   │
           ▼                                      │
  ┌───────────────────┐                           │
  │  PROPOSAL_SENT    │                           │
  └─────────┬─────────┘                           │
            │                                     │
            │ (negotiation starts)                │
            ▼                                     │
    ┌─────────────┐     ┌────────┐               │
    │ NEGOTIATING │────►│  WON   │               │
    └──────┬──────┘     └────────┘               │
           │                                      │
           │ (deal lost)     (no response)        │
           ▼                    │                 │
      ┌─────────┐              │                 │
      │  LOST   │              ▼                 │
      └─────────┘         ┌─────────┐            │
                          │  COLD   │────────────┘
                          └─────────┘
                          (re-engage later)
```

---

## Integration Checklist

### What Must Be Wired

- [x] Backend API client (`src/services/backendApiClient.ts`)
- [x] Event bus for WebSocket events (`src/services/eventBus.ts`)
- [x] Integration types and contracts (`src/types/integration.ts`)
- [ ] Connect token operations to backend
- [ ] Add lead management UI
- [ ] Add SMS panel integration
- [ ] Add calendar booking UI
- [ ] Connect dashboard to real-time events

### What Must Be Removed

- [ ] Direct business logic in frontend (move to backend calls)
- [ ] Local-only state mutations (replace with backend commands)
- [ ] Hardcoded mock data (replace with backend API calls)

### What Must Be Tested

- [ ] API client handles all error codes correctly
- [ ] WebSocket reconnection works with exponential backoff
- [ ] Commands properly correlate with response events
- [ ] UI updates correctly on all event types
- [ ] Offline mode gracefully degrades
- [ ] Token refresh flow works seamlessly

---

## "Done" Definition

The integration is complete when:

1. **Backend can run headless**
   - All business logic executes without frontend
   - SMS booking works via backend alone
   - Calendar integration works via backend alone
   - State transitions happen based on events, not UI

2. **Frontend can be replaced**
   - No business logic in frontend code
   - All state comes from backend
   - UI only displays and triggers
   - Any UI framework could replace this

3. **SMS booking works automatically**
   - Lead created → SMS sent (no human)
   - Response received → Appointment booked (no human)
   - Confirmation sent → Lead status updated (no human)

4. **Humans only intervene on exceptions**
   - Error escalations visible in UI
   - Clear action items for operators
   - All routine work is automated

5. **No component asks another what to do**
   - Backend makes all decisions
   - Frontend never decides outcomes
   - Events flow one direction (backend → frontend)
   - Commands flow one direction (frontend → backend)

---

## Environment Configuration

### Frontend Environment Variables

```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/events/ws

# Feature Flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=false
```

### Production Configuration

```env
NEXT_PUBLIC_BACKEND_URL=https://api.kyros.example.com
NEXT_PUBLIC_WS_URL=wss://api.kyros.example.com/api/v1/events/ws
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=false
```

---

## Usage Examples

### Sending a Command

```typescript
import { backendApi } from '@/services/backendApiClient';

// Create a new lead
const response = await backendApi.createLead({
  name: 'John Smith',
  phone: '+1234567890',
  source: 'permit',
  status: 'new',
  priority: 'hot',
});

if (response.success) {
  console.log('Lead created:', response.data);
} else {
  console.error('Failed:', response.error);
}
```

### Subscribing to Events

```typescript
import { useBackendEvent } from '@/services/eventBus';

function LeadStatusDisplay({ leadId }: { leadId: string }) {
  const [status, setStatus] = useState<LeadStatus>('new');

  // Subscribe to lead status changes
  useBackendEvent('lead.status_changed', (payload) => {
    if (payload.lead.id === leadId) {
      setStatus(payload.lead.status);
    }
  });

  return <div>Status: {status}</div>;
}
```

---

## Security Considerations

1. **All sensitive operations require authentication**
2. **Backend validates all inputs** (frontend validation is UX only)
3. **Tokens are never stored in frontend code**
4. **WebSocket connections are authenticated**
5. **All API calls use HTTPS in production**
6. **Rate limiting is handled by backend**

---

*Integration architecture designed for Kyros - The Neural Spine of Solar Operations*
