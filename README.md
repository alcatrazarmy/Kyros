# Kyros - Enterprise Solar Operations Platform

> **Complete automation platform for solar operations** - Token management, SMS appointment setting, and workflow orchestration.

## 🌟 Overview

Kyros is an enterprise automation platform for solar operations consisting of three integrated layers:

1. **NeonGlow Dashboard** - Visual token management and admin interface
2. **Communication Layer** - AI-powered language processing (classification, drafting)
3. **Agent Runtime** - Headless workflow execution for SMS appointment setting

![NeonGlow Interface](https://github.com/user-attachments/assets/eb174575-f766-400c-acce-f35f47528ae9)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           KYROS SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐       ┌─────────────────────┐             │
│  │   DASHBOARD (UI)    │       │  COMMUNICATION LAYER │            │
│  │   NeonGlow Vault    │       │     (Chat SDK)       │            │
│  │                     │       │                      │            │
│  │ - Token Management  │       │ - Message Drafting   │            │
│  │ - Visualization     │       │ - Intent Classification│          │
│  │ - Manual Overrides  │       │ - OpenAI (language)  │            │
│  │ - NO workflow logic │       │ - NO decisions       │            │
│  └──────────┬──────────┘       └──────────┬───────────┘            │
│             │                             │                        │
│             │         REST API            │                        │
│             └─────────────┬───────────────┘                        │
│                           │                                        │
│                           ▼                                        │
│             ┌─────────────────────────────┐                        │
│             │     AGENT RUNTIME           │                        │
│             │                             │                        │
│             │ - Lead State Machine        │                        │
│             │ - SMS Appointment Setting   │                        │
│             │ - Workflow Orchestration    │                        │
│             │ - Retry & Failure Handling  │                        │
│             └─────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🤖 Agent Runtime (NEW)
- **Lead State Machine**: 15 states tracking the complete lead lifecycle
- **SMS Appointment Setting**: Automated outreach with consent verification
- **Intent Classification**: Classify responses (interested, stop, question, etc.)
- **Appointment Booking**: Deterministic, rule-based calendar integration
- **Workflow Orchestration**: Retry handling and failure recovery
- **Real-time Events**: Dashboard updates via event system

### 🔐 NeonGlow Token Management
- **Visual Token Vault**: Tokens displayed as animated neon orbs with unique colors
- **Secure Exposure Toggle**: Click to reveal/hide token contents with smooth blur/glow effects
- **Token Masking**: Automatic masking of sensitive token strings
- **Multi-scope Support**: Read, write, admin, API, project, and billing scopes

### 🔄 Token Lifecycle Operations
- **Token Rotation**: One-click JWT/OAuth token regeneration
- **Token Revocation**: Secure token invalidation with visual feedback
- **Token Creation**: Dynamic token generation with customizable scopes and expiration
- **Status Tracking**: Real-time status monitoring (active, revoked, expired, rotating)

### 📊 Project Integration
- **OpenSolar Projects**: Live project data linked to each token
- **Project Status**: Real-time project status and progress tracking
- **Multi-project Support**: Each token can manage multiple projects

### 📈 Interaction History
- **Endpoint Tracking**: Monitor all API endpoints accessed by each token
- **Call Statistics**: View access counts and response times
- **Success/Failure Tracking**: Visual indicators for successful/failed API calls
- **Timestamp Tracking**: Last accessed times for all endpoints

### 📝 Audit Trail & Memory Recall
- **Complete Audit Log**: Every token action is logged and auditable
- **Action Types**: Created, accessed, rotated, revoked, exposed, hidden
- **Metadata Tracking**: IP addresses, user agents, timestamps, and details
- **Memory Recalls**: Quick access to logs, project status, and audit history

### 🎨 Visual Design
- **Holographic Vault**: Dark theme with neon accents and glowing effects
- **Animated Orbs**: Pulsing, glowing token representations
- **Ripple Effects**: Visual feedback when tokens are accessed or modified
- **Color Shifts**: Dynamic color changes based on token status
- **Floating Particles**: Ambient animation for active tokens
- **Smooth Transitions**: Framer Motion powered animations throughout

### 🔍 Search & Filter
- **Real-time Search**: Search tokens by name or token string
- **Status Filtering**: Filter by active, revoked, expired status
- **Quick Stats**: Dashboard showing total tokens, active count, and endpoints

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/alcatrazarmy/Kyros.git
cd Kyros

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Lint code
npm run lint
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Kyros/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── agent/                    # Agent Runtime Dashboard
│   │   │   └── page.tsx              # Agent management UI
│   │   ├── api/                      # REST API endpoints
│   │   │   └── agent/                # Agent Runtime API
│   │   │       ├── route.ts          # Runtime control
│   │   │       ├── leads/            # Lead management
│   │   │       └── sms/              # SMS webhook
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # NeonGlow dashboard
│   ├── agent-runtime/                # 🤖 AGENT RUNTIME LAYER
│   │   ├── types/                    # Type definitions
│   │   ├── state-machine/            # Lead state machine
│   │   ├── services/                 # Core services
│   │   │   ├── smsService.ts         # SMS sending/receiving
│   │   │   ├── languageService.ts    # OpenAI language tasks
│   │   │   ├── appointmentService.ts # Calendar/booking
│   │   │   └── leadStorage.ts        # Lead persistence
│   │   ├── workflows/                # Workflow definitions
│   │   │   └── smsAppointmentWorkflow.ts
│   │   └── index.ts                  # Runtime core
│   ├── components/
│   │   ├── agent/                    # Agent UI components
│   │   │   ├── AgentStatus.tsx       # Runtime status
│   │   │   └── LeadManager.tsx       # Lead management
│   │   └── neonglow/                 # NeonGlow components
│   │       ├── NeonOrb.tsx           # Animated token orb
│   │       ├── TokenCard.tsx         # Token card
│   │       ├── TokenDetails.tsx      # Token details
│   │       └── TokenVault.tsx        # Main vault
│   ├── services/                     # Dashboard services
│   │   ├── tokenService.ts           # Token management
│   │   └── openSolarService.ts       # OpenSolar API
│   ├── types/                        # Dashboard types
│   └── lib/                          # Utilities
├── API_CONTRACTS.md                  # API documentation
├── DEFINITION_OF_DONE.md             # Completion criteria
└── package.json                      # Dependencies
```

## 🎯 Core Components

### NeonOrb
Visual representation of API tokens as pulsing neon orbs.

**Features:**
- Multiple size variants (sm, md, lg)
- Color-coded by token status
- Animated glow and pulse effects
- Ripple effects on interaction
- Floating particles for active tokens

### TokenCard
Interactive card displaying token information with controls.

**Features:**
- Token metadata display
- Secure toggle for visibility
- Rotation and revocation buttons
- Scope badges
- Endpoint summary
- Last used timestamp

### TokenDetails
Comprehensive view of token information, history, and audit trail.

**Features:**
- Active endpoints with statistics
- Linked OpenSolar projects
- Recent interaction history
- Complete audit trail
- Token metadata (rotation count, expiration, etc.)

### TokenVault
Main interface orchestrating the entire NeonGlow system.

**Features:**
- Token grid display
- Search and filtering
- Statistics dashboard
- Create token functionality
- Real-time updates

## 🔧 Services

### Token Service
Manages token lifecycle operations.

**Methods:**
- `getAllTokens()` - Retrieve all tokens
- `getToken(id)` - Get specific token
- `createToken(name, scope, expiresInDays)` - Create new token
- `rotateToken(id)` - Rotate token value
- `revokeToken(id)` - Revoke token access
- `logTokenAccess(id)` - Log access event
- `getTokenAuditTrail(tokenId)` - Get audit history

### OpenSolar Service
Integration with OpenSolar API (mock implementation).

**Methods:**
- `fetchProjects(tokenId)` - Get all projects
- `fetchProject(projectId)` - Get single project
- `fetchProjectStatus(projectId)` - Get project status
- `validateToken(token)` - Validate API token

## 🎨 Theming

The application uses a custom neon-themed color palette:

```typescript
neon: {
  cyan: "#00FFFF",
  purple: "#B026FF",
  pink: "#FF10F0",
  green: "#39FF14",
  blue: "#4D4DFF",
  orange: "#FF6600",
}
```

Each token is automatically assigned a neon color for visual identification throughout the interface.

## 🔐 Security Features

1. **Token Masking**: Tokens are masked by default showing only first and last 4 characters
2. **Secure Toggle**: Explicit user action required to reveal full tokens
3. **Audit Logging**: Every token interaction is logged with timestamp and metadata
4. **Access Tracking**: Complete history of which endpoints were accessed and when
5. **Revocation**: Immediate token invalidation with visual feedback

## 🌐 API Integration

The system is designed to integrate with OpenSolar's API. Current implementation includes mock data for demonstration. To integrate with real OpenSolar API:

1. Update `src/services/openSolarService.ts` with actual API endpoints
2. Configure authentication in environment variables
3. Implement proper error handling and retry logic
4. Add rate limiting and caching as needed

## 📊 Data Models

### ApiToken
```typescript
{
  id: string;
  name: string;
  token: string;
  scope: TokenScope[];
  status: TokenStatus;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  activeEndpoints: ApiEndpoint[];
  interactionHistory: TokenInteraction[];
  linkedProjects: OpenSolarProject[];
  color: string;
  auditTrail: AuditEntry[];
  metadata?: {
    rotationCount?: number;
    lastRotation?: Date;
    environment?: string;
  };
}
```

See `src/types/index.ts` for complete type definitions.

## 🚀 Performance

- **Code Splitting**: Next.js automatic code splitting for optimal loading
- **Server-Side Rendering**: Fast initial page loads
- **Client-Side Navigation**: Instant page transitions
- **Optimized Animations**: GPU-accelerated Framer Motion animations
- **Lazy Loading**: Components loaded on demand

## 🔮 Future Enhancements

- [ ] Real-time WebSocket updates for token status changes
- [ ] Advanced analytics dashboard with charts and graphs
- [ ] Token usage predictions using ML
- [ ] Multi-user support with role-based access control
- [ ] Export audit logs to CSV/JSON
- [ ] Scheduled token rotation
- [ ] Integration with password managers
- [ ] Mobile app version
- [ ] 2FA for sensitive operations
- [ ] Notification system for token events

## 🤝 Contributing

This is the neural spine of Kyros - contributions should maintain the high standard of visual design and functionality.

## 📄 License

See LICENSE file for details.

## 🎯 Built With

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon system
- **React 19** - Latest React features

---

**Made with ⚡ by the Kyros Team** - The Neural Spine of Kyros
