/**
 * NeonGlow Memory Core - Token Management Service
 * Handles token operations, rotation, and audit logging
 */

import type { 
  ApiToken, 
  TokenStatus, 
  AuditEntry, 
  TokenInteraction,
  OpenSolarProject 
} from '@/types';
import { generateId, generateNeonColor } from '@/lib/utils';

/**
 * Mock token storage (in production, this would be a secure backend)
 */
class TokenMemoryCore {
  private tokens: Map<string, ApiToken> = new Map();
  private auditLog: AuditEntry[] = [];

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleTokens: ApiToken[] = [
      {
        id: generateId(),
        name: 'Production API Key',
        token: 'sk_prod_' + Math.random().toString(36).substring(2, 34),
        scope: ['read', 'write', 'api'],
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        activeEndpoints: [
          {
            id: 'ep1',
            name: 'Get Projects',
            category: 'projects',
            url: '/api/v1/projects',
            method: 'GET',
            accessCount: 1247,
            lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: 'ep2',
            name: 'Create Project',
            category: 'projects',
            url: '/api/v1/projects',
            method: 'POST',
            accessCount: 43,
            lastAccessed: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
        ],
        interactionHistory: [],
        linkedProjects: [],
        color: '#00FFFF',
        auditTrail: [],
        metadata: {
          rotationCount: 2,
          lastRotation: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          environment: 'production',
        },
      },
      {
        id: generateId(),
        name: 'Development Token',
        token: 'sk_dev_' + Math.random().toString(36).substring(2, 34),
        scope: ['read', 'write'],
        status: 'active',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 30 * 60 * 1000),
        activeEndpoints: [
          {
            id: 'ep3',
            name: 'Get Users',
            category: 'users',
            url: '/api/v1/users',
            method: 'GET',
            accessCount: 523,
            lastAccessed: new Date(Date.now() - 30 * 60 * 1000),
          },
        ],
        interactionHistory: [],
        linkedProjects: [],
        color: '#39FF14',
        auditTrail: [],
        metadata: {
          rotationCount: 0,
          environment: 'development',
        },
      },
      {
        id: generateId(),
        name: 'Admin Access Key',
        token: 'sk_admin_' + Math.random().toString(36).substring(2, 34),
        scope: ['admin', 'read', 'write', 'billing'],
        status: 'active',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        activeEndpoints: [
          {
            id: 'ep4',
            name: 'System Analytics',
            category: 'analytics',
            url: '/api/v1/analytics',
            method: 'GET',
            accessCount: 89,
            lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ],
        interactionHistory: [],
        linkedProjects: [],
        color: '#B026FF',
        auditTrail: [],
        metadata: {
          rotationCount: 5,
          lastRotation: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          environment: 'production',
        },
      },
    ];

    sampleTokens.forEach(token => {
      this.tokens.set(token.id, token);
    });
  }

  /**
   * Get all tokens
   */
  getAllTokens(): ApiToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Get token by ID
   */
  getToken(id: string): ApiToken | undefined {
    return this.tokens.get(id);
  }

  /**
   * Create new token
   */
  createToken(
    name: string,
    scope: ApiToken['scope'],
    expiresInDays?: number
  ): ApiToken {
    const token: ApiToken = {
      id: generateId(),
      name,
      token: 'sk_' + Math.random().toString(36).substring(2, 34),
      scope,
      status: 'active',
      createdAt: new Date(),
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      activeEndpoints: [],
      interactionHistory: [],
      linkedProjects: [],
      color: generateNeonColor(),
      auditTrail: [],
      metadata: {
        rotationCount: 0,
        environment: 'production',
      },
    };

    this.tokens.set(token.id, token);
    this.logAudit({
      id: generateId(),
      timestamp: new Date(),
      action: 'created',
      tokenId: token.id,
      details: `Token "${name}" created`,
    });

    return token;
  }

  /**
   * Rotate token (generate new token value)
   */
  rotateToken(id: string): ApiToken | null {
    const token = this.tokens.get(id);
    if (!token) return null;

    const newToken = 'sk_' + Math.random().toString(36).substring(2, 34);
    const updatedToken: ApiToken = {
      ...token,
      token: newToken,
      status: 'active',
      metadata: {
        ...token.metadata,
        rotationCount: (token.metadata?.rotationCount || 0) + 1,
        lastRotation: new Date(),
      },
    };

    this.tokens.set(id, updatedToken);
    this.logAudit({
      id: generateId(),
      timestamp: new Date(),
      action: 'rotated',
      tokenId: id,
      details: 'Token rotated successfully',
    });

    return updatedToken;
  }

  /**
   * Revoke token
   */
  revokeToken(id: string): boolean {
    const token = this.tokens.get(id);
    if (!token) return false;

    const updatedToken: ApiToken = {
      ...token,
      status: 'revoked',
    };

    this.tokens.set(id, updatedToken);
    this.logAudit({
      id: generateId(),
      timestamp: new Date(),
      action: 'revoked',
      tokenId: id,
      details: 'Token revoked',
    });

    return true;
  }

  /**
   * Update token status
   */
  updateTokenStatus(id: string, status: TokenStatus): boolean {
    const token = this.tokens.get(id);
    if (!token) return false;

    const updatedToken: ApiToken = {
      ...token,
      status,
    };

    this.tokens.set(id, updatedToken);
    return true;
  }

  /**
   * Log token access
   */
  logTokenAccess(id: string): void {
    const token = this.tokens.get(id);
    if (!token) return;

    const updatedToken: ApiToken = {
      ...token,
      lastUsed: new Date(),
    };

    this.tokens.set(id, updatedToken);
    this.logAudit({
      id: generateId(),
      timestamp: new Date(),
      action: 'accessed',
      tokenId: id,
    });
  }

  /**
   * Add interaction to token history
   */
  addInteraction(tokenId: string, interaction: TokenInteraction): void {
    const token = this.tokens.get(tokenId);
    if (!token) return;

    const updatedToken: ApiToken = {
      ...token,
      interactionHistory: [interaction, ...token.interactionHistory].slice(0, 100), // Keep last 100
      lastUsed: new Date(),
    };

    this.tokens.set(tokenId, updatedToken);
  }

  /**
   * Link project to token
   */
  linkProject(tokenId: string, project: OpenSolarProject): void {
    const token = this.tokens.get(tokenId);
    if (!token) return;

    const updatedToken: ApiToken = {
      ...token,
      linkedProjects: [...token.linkedProjects, project],
    };

    this.tokens.set(tokenId, updatedToken);
  }

  /**
   * Get audit trail for token
   */
  getTokenAuditTrail(tokenId: string): AuditEntry[] {
    return this.auditLog.filter(entry => entry.tokenId === tokenId);
  }

  /**
   * Get all audit logs
   */
  getAllAuditLogs(): AuditEntry[] {
    return this.auditLog;
  }

  /**
   * Log audit entry
   */
  private logAudit(entry: AuditEntry): void {
    this.auditLog.unshift(entry);
    
    // Add to token's audit trail
    const token = this.tokens.get(entry.tokenId);
    if (token) {
      token.auditTrail.unshift(entry);
    }
  }
}

// Singleton instance
export const tokenMemoryCore = new TokenMemoryCore();

// Export helper functions
export function getAllTokens() {
  return tokenMemoryCore.getAllTokens();
}

export function getToken(id: string) {
  return tokenMemoryCore.getToken(id);
}

export function createToken(name: string, scope: ApiToken['scope'], expiresInDays?: number) {
  return tokenMemoryCore.createToken(name, scope, expiresInDays);
}

export function rotateToken(id: string) {
  return tokenMemoryCore.rotateToken(id);
}

export function revokeToken(id: string) {
  return tokenMemoryCore.revokeToken(id);
}

export function logTokenAccess(id: string) {
  return tokenMemoryCore.logTokenAccess(id);
}

export function getTokenAuditTrail(tokenId: string) {
  return tokenMemoryCore.getTokenAuditTrail(tokenId);
}
