/**
 * Backend API Client Service
 * 
 * Handles all communication with the backend repository.
 * The frontend never decides outcomes - it only triggers actions and displays state.
 */

import type {
  BackendResponse,
  BackendCommand,
  Lead,
  LeadStatus,
  SmsMessage,
  SmsSendCommand,
  Appointment,
  BookAppointmentCommand,
  DashboardState,
  SystemHealth,
  API_ENDPOINTS,
} from '@/types/integration';
import { generateId } from '@/lib/utils';

// ========================
// CONFIGURATION
// ========================

interface BackendConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: BackendConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ========================
// API CLIENT CLASS
// ========================

class BackendApiClient {
  private config: BackendConfig;
  private authToken: string | null = null;

  constructor(config: Partial<BackendConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Make authenticated request to backend
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<BackendResponse<T>> {
    const requestId = generateId();
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: data.message || response.statusText,
              details: data.details,
              retryable: response.status >= 500,
            },
            timestamp: new Date().toISOString(),
            requestId,
          };
        }

        return {
          success: true,
          data: data as T,
          timestamp: new Date().toISOString(),
          requestId,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort
        if (lastError.name === 'AbortError') {
          break;
        }

        // Wait before retry
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * (attempt + 1))
          );
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed after retries',
        retryable: true,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * Send a command to the backend
   */
  async sendCommand<T>(command: BackendCommand): Promise<BackendResponse<T>> {
    return this.request<T>('POST', '/api/v1/commands', command);
  }

  // ========================
  // LEAD OPERATIONS
  // ========================

  async getLeads(): Promise<BackendResponse<Lead[]>> {
    return this.request<Lead[]>('GET', '/api/v1/leads');
  }

  async getLead(id: string): Promise<BackendResponse<Lead>> {
    return this.request<Lead>('GET', `/api/v1/leads/${id}`);
  }

  async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackendResponse<Lead>> {
    const command: BackendCommand = {
      type: 'lead.create',
      payload: lead,
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<Lead>(command);
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<BackendResponse<Lead>> {
    const command: BackendCommand = {
      type: 'lead.update',
      payload: { leadId: id, updates },
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<Lead>(command);
  }

  async transitionLeadStatus(
    id: string, 
    newStatus: LeadStatus, 
    note?: string
  ): Promise<BackendResponse<Lead>> {
    const command: BackendCommand = {
      type: 'lead.transition_status',
      payload: { leadId: id, newStatus, note },
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<Lead>(command);
  }

  // ========================
  // SMS OPERATIONS
  // ========================

  async sendSms(params: SmsSendCommand): Promise<BackendResponse<SmsMessage>> {
    const command: BackendCommand = {
      type: 'sms.send',
      payload: params,
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<SmsMessage>(command);
  }

  async getSmsHistory(leadId: string): Promise<BackendResponse<SmsMessage[]>> {
    return this.request<SmsMessage[]>('GET', `/api/v1/leads/${leadId}/sms`);
  }

  // ========================
  // CALENDAR OPERATIONS
  // ========================

  async bookAppointment(params: BookAppointmentCommand): Promise<BackendResponse<Appointment>> {
    const command: BackendCommand = {
      type: 'calendar.book',
      payload: params,
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<Appointment>(command);
  }

  async getAppointment(id: string): Promise<BackendResponse<Appointment>> {
    return this.request<Appointment>('GET', `/api/v1/appointments/${id}`);
  }

  async getLeadAppointments(leadId: string): Promise<BackendResponse<Appointment[]>> {
    return this.request<Appointment[]>('GET', `/api/v1/leads/${leadId}/appointments`);
  }

  async cancelAppointment(id: string, reason?: string): Promise<BackendResponse<Appointment>> {
    const command: BackendCommand = {
      type: 'calendar.cancel',
      payload: { appointmentId: id, reason },
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<Appointment>(command);
  }

  // ========================
  // TOKEN OPERATIONS
  // ========================

  async rotateToken(id: string): Promise<BackendResponse<{ token: string }>> {
    const command: BackendCommand = {
      type: 'token.rotate',
      payload: { tokenId: id },
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<{ token: string }>(command);
  }

  async revokeToken(id: string): Promise<BackendResponse<void>> {
    const command: BackendCommand = {
      type: 'token.revoke',
      payload: { tokenId: id },
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<void>(command);
  }

  // ========================
  // DASHBOARD STATE
  // ========================

  async getDashboardState(): Promise<BackendResponse<DashboardState>> {
    return this.request<DashboardState>('GET', '/api/v1/dashboard');
  }

  async getSystemHealth(): Promise<BackendResponse<SystemHealth>> {
    return this.request<SystemHealth>('GET', '/api/v1/health');
  }

  // ========================
  // PROJECT SYNC
  // ========================

  async syncProjects(): Promise<BackendResponse<{ synced: number }>> {
    const command: BackendCommand = {
      type: 'project.sync',
      payload: {},
      correlationId: generateId(),
      timestamp: new Date().toISOString(),
    };
    return this.sendCommand<{ synced: number }>(command);
  }
}

// ========================
// SINGLETON EXPORT
// ========================

export const backendApi = new BackendApiClient();

// Export class for custom instances
export { BackendApiClient };
