/**
 * NeonGlow Memory Core - Type Definitions
 * Core types for the biometric memory bank system
 */

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
