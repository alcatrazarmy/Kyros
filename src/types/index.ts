/**
 * NeonGlow Memory Core - Type Definitions
 * Core types for the biometric memory bank system
 */

// Re-export integration types for easy access
export * from './integration';

export type TokenScope = 
  | 'read' 
  | 'write' 
  | 'admin' 
  | 'api' 
  | 'project' 
  | 'billing';

export type TokenStatus = 
  | 'active' 
  | 'revoked' 
  | 'expired' 
  | 'rotating';

export type EndpointCategory = 
  | 'projects' 
  | 'users' 
  | 'billing' 
  | 'analytics' 
  | 'system';

export interface ApiEndpoint {
  id: string;
  name: string;
  category: EndpointCategory;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  lastAccessed?: Date;
  accessCount: number;
}

export interface ProjectMetadata {
  panels?: number;
  inverterType?: string;
  batteryStorage?: boolean;
  batteryCapacity?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface InteractionMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface TokenInteraction {
  id: string;
  timestamp: Date;
  endpoint: ApiEndpoint;
  statusCode: number;
  responseTime: number;
  success: boolean;
  metadata?: InteractionMetadata;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'accessed' | 'rotated' | 'revoked' | 'exposed' | 'hidden';
  tokenId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface OpenSolarProject {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'archived';
  owner: string;
  createdAt: Date;
  lastModified: Date;
  location?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  systemSize?: number;
  estimatedCost?: number;
  metadata?: ProjectMetadata;
}

export interface ApiToken {
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
  color: string; // Neon color for visualization
  auditTrail: AuditEntry[];
  metadata?: {
    rotationCount?: number;
    lastRotation?: Date;
    environment?: 'development' | 'staging' | 'production';
  };
}

export interface MemoryRecallData {
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface MemoryRecall {
  id: string;
  timestamp: Date;
  type: 'log' | 'project_status' | 'audit' | 'interaction';
  tokenId: string;
  data: MemoryRecallData;
  query?: string;
}

export interface NeonGlowConfig {
  animationSpeed: 'slow' | 'normal' | 'fast';
  glowIntensity: number; // 0-100
  enableRippleEffects: boolean;
  enableColorShifts: boolean;
  autoHideTokens: boolean;
  auditLogging: boolean;
}

// ============================================
// Lead Management Types
// ============================================

export type LeadStatus = 'new' | 'hot' | 'warm' | 'cold' | 'contacted' | 'converted' | 'lost';
export type LeadSource = 'permit' | 'referral' | 'web' | 'outbound' | 'partner';
export type LeadPriority = 'high' | 'medium' | 'low';

export interface LeadLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  location: LeadLocation;
  permitNumber?: string;
  systemSize?: number;
  estimatedValue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  assignedTo?: string;
  tags: string[];
}

export interface LeadFilter {
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  region?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// ============================================
// Voice Interface Types (Bauliver)
// ============================================

export type VoiceMode = 'flirt' | 'calm' | 'executive' | 'hype' | 'storyteller';
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  parameters?: Record<string, unknown>;
  timestamp: Date;
}

export interface VoiceResponse {
  id: string;
  text: string;
  audioUrl?: string;
  mode: VoiceMode;
  timestamp: Date;
}

export interface VoiceSession {
  id: string;
  state: VoiceState;
  currentMode: VoiceMode;
  commands: VoiceCommand[];
  responses: VoiceResponse[];
  startedAt: Date;
  lastActivityAt: Date;
}

// ============================================
// Dashboard Navigation Types
// ============================================

export type DashboardPanel = 'tokens' | 'leads' | 'map' | 'voice' | 'settings';

export interface DashboardState {
  activePanel: DashboardPanel;
  sidebarOpen: boolean;
  selectedLeadId?: string;
  selectedTokenId?: string;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
}
