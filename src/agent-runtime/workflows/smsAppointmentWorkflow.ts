/**
 * Kyros Agent Runtime - SMS Appointment Setter Workflow
 * Core workflow orchestrating SMS outreach and appointment booking
 * 
 * IMPORTANT: This is the single source of truth for workflow logic.
 * OpenAI is used ONLY for language tasks (classification, drafting).
 * All decisions are deterministic and rule-based.
 */

import type { 
  Lead, 
  LeadState, 
  ContactAttempt, 
  MessageClassification,
  AppointmentSlot,
  WorkflowExecution,
  LeadStateUpdateEvent,
  SmsEvent,
  AppointmentEvent,
} from '../types';
import { LeadStateMachine, createLead } from '../state-machine/leadStateMachine';
import { SmsService, getSmsService, SMS_TEMPLATES } from '../services/smsService';
import { LanguageService, getLanguageService } from '../services/languageService';
import { AppointmentService, getAppointmentService } from '../services/appointmentService';
import { 
  leadStorage, 
  getLead, 
  updateLead, 
  addContactAttempt,
  getLeadsReadyForContact,
} from '../services/leadStorage';
import { generateId } from '@/lib/utils';

/**
 * Event emitter for dashboard updates
 */
type EventCallback = (event: LeadStateUpdateEvent | SmsEvent | AppointmentEvent) => void;
const eventListeners: EventCallback[] = [];

export function onAgentEvent(callback: EventCallback): () => void {
  eventListeners.push(callback);
  return () => {
    const index = eventListeners.indexOf(callback);
    if (index > -1) eventListeners.splice(index, 1);
  };
}

function emitEvent(event: LeadStateUpdateEvent | SmsEvent | AppointmentEvent): void {
  eventListeners.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error('[Workflow] Event listener error:', error);
    }
  });
}

/**
 * SMS Appointment Setter Workflow
 */
export class SmsAppointmentWorkflow {
  private smsService: SmsService;
  private languageService: LanguageService;
  private appointmentService: AppointmentService;
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.smsService = getSmsService();
    this.languageService = getLanguageService();
    this.appointmentService = getAppointmentService();
  }

  // ============================================================================
  // MAIN WORKFLOW ENTRY POINTS
  // ============================================================================

  /**
   * Start workflow for a new lead
   */
  async startForLead(leadId: string): Promise<WorkflowExecution> {
    const lead = getLead(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const execution: WorkflowExecution = {
      id: generateId(),
      workflowId: 'sms_appointment_setter',
      leadId,
      status: 'running',
      currentStep: 'start',
      startedAt: new Date(),
      attempts: 0,
      context: {},
    };

    this.executions.set(execution.id, execution);

    try {
      await this.executeWorkflow(lead, execution);
      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
    }

    return execution;
  }

  /**
   * Process incoming SMS response
   */
  async processIncomingMessage(
    fromPhone: string, 
    messageBody: string,
    providerId?: string
  ): Promise<{ success: boolean; lead?: Lead; action?: string }> {
    // Find lead by phone
    const lead = leadStorage.getByPhone(fromPhone);
    if (!lead) {
      console.log(`[Workflow] No lead found for phone: ${fromPhone}`);
      return { success: false, action: 'lead_not_found' };
    }

    // Process the incoming message
    const incomingMessage = this.smsService.processIncomingMessage(fromPhone, messageBody, providerId);
    incomingMessage.leadId = lead.id;

    // Emit SMS received event
    emitEvent({
      type: 'sms_received',
      messageId: incomingMessage.id,
      leadId: lead.id,
      direction: 'inbound',
      body: messageBody,
      timestamp: new Date(),
    });

    // Classify the message using OpenAI (language only)
    const classification = await this.languageService.classifyResponse(messageBody);

    // Record the contact attempt
    const attempt: ContactAttempt = {
      id: generateId(),
      leadId: lead.id,
      type: 'sms',
      direction: 'inbound',
      timestamp: new Date(),
      message: messageBody,
      status: 'responded',
      providerId,
      classification,
    };
    addContactAttempt(lead.id, attempt);

    // Handle based on classification - DETERMINISTIC LOGIC
    return await this.handleClassifiedResponse(lead, classification, messageBody);
  }

  /**
   * Run scheduled contact checks
   */
  async runScheduledContacts(): Promise<{ processed: number; errors: number }> {
    const readyLeads = getLeadsReadyForContact();
    let processed = 0;
    let errors = 0;

    for (const lead of readyLeads) {
      try {
        await this.contactLead(lead);
        processed++;
      } catch (error) {
        console.error(`[Workflow] Error contacting lead ${lead.id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  // ============================================================================
  // PRIVATE WORKFLOW LOGIC
  // ============================================================================

  /**
   * Execute the full workflow for a lead
   */
  private async executeWorkflow(lead: Lead, execution: WorkflowExecution): Promise<void> {
    const stateMachine = new LeadStateMachine(lead);

    execution.currentStep = 'check_consent';

    // Step 1: Verify consent
    if (!lead.consentVerified) {
      execution.currentStep = 'consent_required';
      throw new Error('Lead consent not verified');
    }

    // Step 2: Check if we can contact
    if (!stateMachine.canContact()) {
      execution.currentStep = 'contact_blocked';
      throw new Error(`Cannot contact lead in state: ${lead.state}`);
    }

    // Step 3: Schedule and send initial contact
    execution.currentStep = 'schedule_contact';
    const transition = stateMachine.transition('schedule_contact');
    if (transition) {
      this.emitStateUpdate(lead.id, transition.fromState, transition.toState, 'schedule_contact');
    }

    // Step 4: Send initial SMS
    await this.sendInitialContact(lead);
    updateLead(lead.id, stateMachine.getLead());

    execution.currentStep = 'awaiting_response';
  }

  /**
   * Send initial contact SMS
   */
  private async sendInitialContact(lead: Lead): Promise<void> {
    const stateMachine = new LeadStateMachine(lead);
    
    // Transition to initial contact sent
    const transition = stateMachine.transition('send_initial_sms');
    if (!transition) {
      throw new Error('Cannot transition to initial_contact_sent');
    }

    // Generate message
    const message = SMS_TEMPLATES.initialContact(lead.firstName);

    // Send SMS
    const result = await this.smsService.sendSms(lead, message);
    
    if (!result.success) {
      throw new Error(`Failed to send SMS: ${result.error}`);
    }

    // Record attempt
    if (result.attempt) {
      addContactAttempt(lead.id, result.attempt);
    }

    // Transition to awaiting response
    stateMachine.transition('await_response');
    updateLead(lead.id, stateMachine.getLead());

    // Emit events
    this.emitStateUpdate(lead.id, transition.fromState, transition.toState, 'send_initial_sms');
    if (result.message) {
      emitEvent({
        type: 'sms_sent',
        messageId: result.message.id,
        leadId: lead.id,
        direction: 'outbound',
        body: message,
        timestamp: new Date(),
      });
    }

    console.log(`[Workflow] Initial contact sent to ${lead.firstName} (${lead.phone})`);
  }

  /**
   * Contact a lead (for follow-ups)
   */
  private async contactLead(lead: Lead): Promise<void> {
    const stateMachine = new LeadStateMachine(lead);
    
    if (!stateMachine.canContact()) {
      return;
    }

    const attemptNumber = lead.contactAttempts.filter(a => a.direction === 'outbound').length + 1;

    // Check max attempts
    if (attemptNumber > lead.maxContactAttempts) {
      stateMachine.transition('max_attempts_reached');
      updateLead(lead.id, stateMachine.getLead());
      this.emitStateUpdate(lead.id, lead.state, 'failed', 'max_attempts_reached');
      return;
    }

    // Generate follow-up message
    const message = SMS_TEMPLATES.followUp(lead.firstName, attemptNumber);

    // Send SMS
    const result = await this.smsService.sendSms(lead, message);
    
    if (result.success && result.attempt) {
      addContactAttempt(lead.id, result.attempt);
      
      // Schedule next contact in 24 hours if no response
      const nextContact = new Date();
      nextContact.setHours(nextContact.getHours() + 24);
      updateLead(lead.id, { nextContactAt: nextContact });
    }
  }

  /**
   * Handle classified response - DETERMINISTIC DECISIONS
   */
  private async handleClassifiedResponse(
    lead: Lead, 
    classification: MessageClassification,
    originalMessage: string
  ): Promise<{ success: boolean; lead?: Lead; action: string }> {
    const stateMachine = new LeadStateMachine(lead);
    let action = '';

    // Update SMS event with classification
    emitEvent({
      type: 'sms_received',
      messageId: generateId(),
      leadId: lead.id,
      direction: 'inbound',
      body: originalMessage,
      classification,
      timestamp: new Date(),
    });

    // IMPORTANT: These are deterministic rules, NOT AI decisions
    switch (classification.intent) {
      case 'stop':
        // IMMEDIATE AND PERMANENT OPT-OUT
        action = 'opt_out';
        stateMachine.forceTransition('opted_out', 'opt_out_received', { 
          reason: 'user_requested',
          originalMessage 
        });
        updateLead(lead.id, stateMachine.getLead());
        
        // Send opt-out confirmation
        await this.smsService.sendSms(lead, SMS_TEMPLATES.optOutConfirmation());
        
        this.emitStateUpdate(lead.id, lead.state, 'opted_out', 'opt_out_received');
        console.log(`[Workflow] Lead ${lead.id} opted out`);
        break;

      case 'interested':
        // Transition to interested state and propose appointments
        action = 'interested';
        stateMachine.transition('receive_response');
        stateMachine.transition('classify_interested');
        updateLead(lead.id, stateMachine.getLead());
        
        // Propose appointment slots
        await this.proposeAppointmentSlots(lead);
        this.emitStateUpdate(lead.id, lead.state, 'interested', 'classify_interested');
        break;

      case 'not_now':
        action = 'not_interested';
        stateMachine.transition('receive_response');
        stateMachine.transition('classify_not_interested');
        updateLead(lead.id, stateMachine.getLead());
        
        // Send polite response
        await this.smsService.sendSms(lead, SMS_TEMPLATES.notInterested(lead.firstName));
        this.emitStateUpdate(lead.id, lead.state, 'not_interested', 'classify_not_interested');
        break;

      case 'confirm':
        action = 'appointment_confirmed';
        // Handle appointment confirmation
        await this.handleAppointmentConfirmation(lead, classification);
        break;

      case 'reschedule':
        action = 'reschedule_requested';
        // Handle reschedule request
        await this.handleRescheduleRequest(lead);
        break;

      case 'question':
        action = 'question_received';
        // Generate response to question (using OpenAI for language)
        const response = await this.languageService.generateResponse(
          originalMessage,
          { leadName: lead.firstName, previousMessages: [] }
        );
        await this.smsService.sendSms(lead, response);
        break;

      default:
        action = 'unknown_response';
        // Send a generic helpful response
        const helpMessage = await this.languageService.generateResponse(
          originalMessage,
          { leadName: lead.firstName }
        );
        await this.smsService.sendSms(lead, helpMessage);
    }

    return { success: true, lead: getLead(lead.id), action };
  }

  /**
   * Propose appointment slots
   */
  private async proposeAppointmentSlots(lead: Lead): Promise<void> {
    const stateMachine = new LeadStateMachine(lead);
    
    // Get available slots
    const { slots, formatted } = await this.appointmentService.proposeSlots(lead, 3);
    
    if (slots.length === 0) {
      // No slots available - escalate
      stateMachine.transition('escalate');
      updateLead(lead.id, { ...stateMachine.getLead(), metadata: { ...lead.metadata, escalationReason: 'no_slots' } });
      return;
    }

    // Store proposed slots
    updateLead(lead.id, { proposedSlots: slots });

    // Send SMS with slots
    const message = SMS_TEMPLATES.appointmentProposal(lead.firstName, formatted);
    await this.smsService.sendSms(lead, message);

    // Transition to appointment_proposed
    stateMachine.transition('propose_appointment');
    updateLead(lead.id, stateMachine.getLead());

    // Emit event
    emitEvent({
      type: 'appointment_proposed',
      leadId: lead.id,
      slot: slots[0], // First proposed slot
      timestamp: new Date(),
    });

    this.emitStateUpdate(lead.id, lead.state, 'appointment_proposed', 'propose_appointment');
  }

  /**
   * Handle appointment confirmation
   */
  private async handleAppointmentConfirmation(
    lead: Lead, 
    classification: MessageClassification
  ): Promise<void> {
    const stateMachine = new LeadStateMachine(lead);
    
    // Determine which slot was selected
    let selectedSlot: AppointmentSlot | null = null;
    
    if (classification.extractedInfo?.preferredTime && lead.proposedSlots) {
      const slotIndex = parseInt(classification.extractedInfo.preferredTime) - 1;
      if (slotIndex >= 0 && slotIndex < lead.proposedSlots.length) {
        selectedSlot = lead.proposedSlots[slotIndex];
      }
    }

    if (!selectedSlot && lead.proposedSlots?.length) {
      // Default to first slot if not specified
      selectedSlot = lead.proposedSlots[0];
    }

    if (!selectedSlot) {
      // No slot to confirm - ask again
      await this.proposeAppointmentSlots(lead);
      return;
    }

    // Book the appointment (DETERMINISTIC - no AI)
    const bookingResult = await this.appointmentService.bookAppointment(lead, selectedSlot.id);
    
    if (!bookingResult.success) {
      // Slot no longer available - propose new slots
      await this.proposeAppointmentSlots(lead);
      return;
    }

    // Update lead with appointment
    updateLead(lead.id, { 
      appointmentSlot: bookingResult.slot,
      proposedSlots: undefined, // Clear proposed slots
    });

    // Transition to confirmed
    stateMachine.transition('confirm_appointment');
    updateLead(lead.id, stateMachine.getLead());

    // Send confirmation SMS
    const date = bookingResult.slot!.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const message = SMS_TEMPLATES.appointmentConfirmation(
      lead.firstName, 
      date, 
      bookingResult.slot!.startTime
    );
    await this.smsService.sendSms(lead, message);

    // Emit events
    emitEvent({
      type: 'appointment_confirmed',
      leadId: lead.id,
      slot: bookingResult.slot!,
      timestamp: new Date(),
    });

    this.emitStateUpdate(lead.id, lead.state, 'appointment_confirmed', 'confirm_appointment');
    console.log(`[Workflow] Appointment confirmed for ${lead.firstName}`);
  }

  /**
   * Handle reschedule request
   */
  private async handleRescheduleRequest(lead: Lead): Promise<void> {
    const stateMachine = new LeadStateMachine(lead);
    
    // Cancel existing appointment if any
    if (lead.appointmentSlot) {
      await this.appointmentService.cancelAppointment(lead.appointmentSlot.id);
      updateLead(lead.id, { appointmentSlot: undefined });
      
      emitEvent({
        type: 'appointment_cancelled',
        leadId: lead.id,
        slot: lead.appointmentSlot,
        timestamp: new Date(),
      });
    }

    // Transition back to interested
    stateMachine.transition('reschedule_requested');
    updateLead(lead.id, stateMachine.getLead());

    // Propose new slots
    await this.proposeAppointmentSlots(lead);
  }

  /**
   * Emit state update event
   */
  private emitStateUpdate(
    leadId: string, 
    fromState: LeadState, 
    toState: LeadState, 
    trigger: string
  ): void {
    emitEvent({
      type: 'lead_state_update',
      leadId,
      fromState,
      toState,
      trigger,
      timestamp: new Date(),
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get workflow execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for a lead
   */
  getExecutionsForLead(leadId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.leadId === leadId);
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.status === 'running');
  }
}

// Singleton instance
let workflowInstance: SmsAppointmentWorkflow | null = null;

export function getWorkflow(): SmsAppointmentWorkflow {
  if (!workflowInstance) {
    workflowInstance = new SmsAppointmentWorkflow();
  }
  return workflowInstance;
}

export function initializeWorkflow(): SmsAppointmentWorkflow {
  workflowInstance = new SmsAppointmentWorkflow();
  return workflowInstance;
}
