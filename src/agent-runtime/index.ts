/**
 * Kyros Agent Runtime - Core Runtime
 * Main entry point for the headless agent runtime
 * 
 * Responsibilities:
 * - Owns execution, state machines, retries, orchestration
 * - Consumes tokens from NeonGlow
 * - Controls SMS outreach and appointment setting
 * - Runs headless (no UI)
 */

import type { 
  AgentRuntimeConfig, 
  AgentRuntimeStatus, 
  AgentError,
  Lead,
  WorkflowExecution,
} from './types';
import { initializeSmsService, getSmsService } from './services/smsService';
import { initializeLanguageService } from './services/languageService';
import { initializeAppointmentService } from './services/appointmentService';
import { 
  leadStorage, 
  getAllLeads, 
  getLead, 
  createNewLead, 
  getLeadStats,
} from './services/leadStorage';
import { 
  initializeWorkflow, 
  getWorkflow, 
  onAgentEvent,
} from './workflows/smsAppointmentWorkflow';
import { generateId } from '@/lib/utils';

/**
 * Agent Runtime class
 */
export class AgentRuntime {
  private config: AgentRuntimeConfig;
  private running: boolean = false;
  private startedAt?: Date;
  private errors: AgentError[] = [];
  private schedulerInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<AgentRuntimeConfig> = {}) {
    // Default configuration
    this.config = {
      sms: {
        provider: 'mock',
        fromNumber: '+1234567890',
        ...config.sms,
      },
      calendar: {
        provider: 'mock',
        defaultDuration: 60,
        bufferBetween: 15,
        availableHours: { start: '09:00', end: '17:00' },
        availableDays: [1, 2, 3, 4, 5],
        ...config.calendar,
      },
      openai: {
        model: 'gpt-4o-mini',
        maxTokens: 150,
        ...config.openai,
      },
      workflows: {
        maxConcurrent: 10,
        defaultRetryPolicy: {
          maxAttempts: 3,
          initialDelay: 60,
          maxDelay: 3600,
          backoffMultiplier: 2,
          retryableErrors: ['TIMEOUT', 'RATE_LIMIT'],
        },
        ...config.workflows,
      },
      contact: {
        maxAttemptsPerLead: 5,
        minDelayBetweenAttempts: 24, // hours
        quietHoursStart: '21:00',
        quietHoursEnd: '09:00',
        timezone: 'America/New_York',
        ...config.contact,
      },
    };
  }

  /**
   * Initialize the runtime
   */
  async initialize(): Promise<void> {
    console.log('[AgentRuntime] Initializing...');

    // Initialize services
    initializeSmsService(this.config.sms);
    initializeLanguageService(this.config.openai);
    initializeAppointmentService(this.config.calendar);
    initializeWorkflow();

    console.log('[AgentRuntime] Services initialized');
  }

  /**
   * Start the runtime
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('[AgentRuntime] Already running');
      return;
    }

    await this.initialize();

    this.running = true;
    this.startedAt = new Date();

    // Start scheduled task runner
    this.schedulerInterval = setInterval(() => {
      this.runScheduledTasks().catch(err => {
        this.logError('system', 'Scheduled task error', err);
      });
    }, 60000); // Run every minute

    console.log('[AgentRuntime] Started');
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    this.running = false;
    console.log('[AgentRuntime] Stopped');
  }

  /**
   * Get runtime status
   */
  getStatus(): AgentRuntimeStatus {
    const workflow = getWorkflow();
    const stats = getLeadStats();

    return {
      running: this.running,
      startedAt: this.startedAt,
      activeWorkflows: workflow.getActiveExecutions().length,
      pendingLeads: stats.byState.consent_verified || 0,
      processedToday: 0, // Would track actual count
      errors: this.errors.slice(0, 10), // Last 10 errors
      health: this.calculateHealth(),
    };
  }

  // ============================================================================
  // LEAD MANAGEMENT API
  // ============================================================================

  /**
   * Create a new lead
   */
  createLead(params: {
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
  }): Lead {
    return createNewLead(params);
  }

  /**
   * Get a lead by ID
   */
  getLead(id: string): Lead | undefined {
    return getLead(id);
  }

  /**
   * Get all leads
   */
  getAllLeads(): Lead[] {
    return getAllLeads();
  }

  /**
   * Get lead statistics
   */
  getLeadStats() {
    return getLeadStats();
  }

  // ============================================================================
  // WORKFLOW API
  // ============================================================================

  /**
   * Start workflow for a lead
   */
  async startWorkflow(leadId: string): Promise<WorkflowExecution> {
    if (!this.running) {
      throw new Error('Agent runtime is not running');
    }

    const workflow = getWorkflow();
    return workflow.startForLead(leadId);
  }

  /**
   * Process incoming SMS
   */
  async processIncomingSms(
    from: string, 
    body: string, 
    providerId?: string
  ): Promise<{ success: boolean; action?: string }> {
    const workflow = getWorkflow();
    return workflow.processIncomingMessage(from, body, providerId);
  }

  /**
   * Get workflow execution
   */
  getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
    const workflow = getWorkflow();
    return workflow.getExecution(executionId);
  }

  /**
   * Get executions for a lead
   */
  getLeadWorkflows(leadId: string): WorkflowExecution[] {
    const workflow = getWorkflow();
    return workflow.getExecutionsForLead(leadId);
  }

  // ============================================================================
  // EVENT SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to agent events (for dashboard updates)
   */
  onEvent(callback: Parameters<typeof onAgentEvent>[0]): () => void {
    return onAgentEvent(callback);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Run scheduled tasks
   */
  private async runScheduledTasks(): Promise<void> {
    if (!this.running) return;

    const workflow = getWorkflow();
    
    try {
      // Run scheduled contacts
      const result = await workflow.runScheduledContacts();
      
      if (result.processed > 0) {
        console.log(`[AgentRuntime] Processed ${result.processed} scheduled contacts`);
      }
      if (result.errors > 0) {
        console.warn(`[AgentRuntime] ${result.errors} contact errors`);
      }
    } catch (error) {
      this.logError('workflow', 'Scheduled contacts failed', error);
    }
  }

  /**
   * Log an error
   */
  private logError(
    type: AgentError['type'], 
    message: string, 
    error?: unknown,
    context?: { leadId?: string; workflowId?: string }
  ): void {
    const agentError: AgentError = {
      id: generateId(),
      timestamp: new Date(),
      type,
      message,
      leadId: context?.leadId,
      workflowId: context?.workflowId,
      stack: error instanceof Error ? error.stack : undefined,
      resolved: false,
    };

    this.errors.unshift(agentError);
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(0, 100);
    }

    console.error(`[AgentRuntime] ${type} error:`, message, error);
  }

  /**
   * Calculate health status
   */
  private calculateHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const recentErrors = this.errors.filter(
      e => !e.resolved && e.timestamp > new Date(Date.now() - 300000) // Last 5 min
    );

    if (recentErrors.length > 10) return 'unhealthy';
    if (recentErrors.length > 3) return 'degraded';
    return 'healthy';
  }
}

// Singleton instance
let runtimeInstance: AgentRuntime | null = null;

export function getAgentRuntime(): AgentRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new AgentRuntime();
  }
  return runtimeInstance;
}

export function initializeAgentRuntime(config?: Partial<AgentRuntimeConfig>): AgentRuntime {
  runtimeInstance = new AgentRuntime(config);
  return runtimeInstance;
}

// Export all types
export * from './types';

// Export services
export { getSmsService } from './services/smsService';
export { getLanguageService } from './services/languageService';
export { getAppointmentService } from './services/appointmentService';
export { leadStorage, getAllLeads, getLead, getLeadStats } from './services/leadStorage';

// Export state machine
export { LeadStateMachine, createLead, getStateDescription } from './state-machine/leadStateMachine';

// Export workflow
export { getWorkflow, onAgentEvent } from './workflows/smsAppointmentWorkflow';
