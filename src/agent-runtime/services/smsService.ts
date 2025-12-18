/**
 * Kyros Agent Runtime - SMS Service
 * Handles SMS sending/receiving via providers like Twilio
 */

import type { 
  SmsMessage, 
  SmsProviderConfig, 
  ContactAttempt,
  MessageClassification,
  Lead,
} from '../types';
import { generateId } from '@/lib/utils';

/**
 * SMS Provider interface
 */
interface SmsProvider {
  send(message: SmsMessage): Promise<{ success: boolean; providerId?: string; error?: string }>;
  getStatus(providerId: string): Promise<string>;
}

/**
 * Mock SMS Provider for development/testing
 */
class MockSmsProvider implements SmsProvider {
  private messages: Map<string, SmsMessage> = new Map();

  async send(message: SmsMessage): Promise<{ success: boolean; providerId?: string; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const providerId = `mock_${generateId()}`;
    const sentMessage: SmsMessage = {
      ...message,
      providerId,
      status: 'sent',
      sentAt: new Date(),
    };
    
    this.messages.set(providerId, sentMessage);
    
    console.log(`[MockSMS] Sent to ${message.to}: ${message.body}`);
    
    return { success: true, providerId };
  }

  async getStatus(providerId: string): Promise<string> {
    const message = this.messages.get(providerId);
    return message?.status ?? 'unknown';
  }
}

/**
 * Twilio SMS Provider (stub - requires actual Twilio credentials)
 */
class TwilioSmsProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(config: SmsProviderConfig) {
    this.accountSid = config.accountSid ?? '';
    this.authToken = config.authToken ?? '';
    this.fromNumber = config.fromNumber;
  }

  async send(message: SmsMessage): Promise<{ success: boolean; providerId?: string; error?: string }> {
    // In production, this would use the Twilio SDK
    // For now, we simulate the call
    
    if (!this.accountSid || !this.authToken) {
      // Fall back to mock if not configured
      console.warn('[Twilio] Not configured, using mock');
      return new MockSmsProvider().send(message);
    }

    try {
      // This would be the actual Twilio API call:
      // const client = require('twilio')(this.accountSid, this.authToken);
      // const result = await client.messages.create({
      //   body: message.body,
      //   from: this.fromNumber,
      //   to: message.to,
      // });
      
      // For now, simulate success
      const providerId = `twilio_${generateId()}`;
      console.log(`[Twilio] Would send to ${message.to}: ${message.body.substring(0, 50)}...`);
      
      return { success: true, providerId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown Twilio error' 
      };
    }
  }

  async getStatus(providerId: string): Promise<string> {
    // In production, query Twilio for message status
    return 'delivered';
  }
}

/**
 * SMS Service class
 */
export class SmsService {
  private provider: SmsProvider;
  private config: SmsProviderConfig;
  private messageLog: SmsMessage[] = [];

  constructor(config: SmsProviderConfig) {
    this.config = config;
    
    if (config.provider === 'twilio') {
      this.provider = new TwilioSmsProvider(config);
    } else {
      this.provider = new MockSmsProvider();
    }
  }

  /**
   * Send an SMS message
   */
  async sendSms(
    lead: Lead, 
    body: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; message?: SmsMessage; attempt?: ContactAttempt; error?: string }> {
    // Check if lead can be contacted
    if (lead.state === 'opted_out') {
      return { success: false, error: 'Lead has opted out' };
    }

    const message: SmsMessage = {
      id: generateId(),
      leadId: lead.id,
      to: lead.phone,
      from: this.config.fromNumber,
      body,
      direction: 'outbound',
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      const result = await this.provider.send(message);
      
      if (result.success) {
        message.status = 'sent';
        message.providerId = result.providerId;
        message.sentAt = new Date();
      } else {
        message.status = 'failed';
        message.failureReason = result.error;
      }

      this.messageLog.push(message);

      // Create contact attempt record
      const attempt: ContactAttempt = {
        id: generateId(),
        leadId: lead.id,
        type: 'sms',
        direction: 'outbound',
        timestamp: new Date(),
        message: body,
        status: result.success ? 'sent' : 'failed',
        providerId: result.providerId,
        metadata,
      };

      return { 
        success: result.success, 
        message, 
        attempt,
        error: result.error,
      };
    } catch (error) {
      message.status = 'failed';
      message.failureReason = error instanceof Error ? error.message : 'Unknown error';
      this.messageLog.push(message);
      
      return { 
        success: false, 
        message,
        error: message.failureReason,
      };
    }
  }

  /**
   * Process an incoming SMS message (webhook handler)
   */
  processIncomingMessage(
    from: string, 
    body: string, 
    providerId?: string
  ): SmsMessage {
    const message: SmsMessage = {
      id: generateId(),
      leadId: '', // Will be resolved by caller
      to: this.config.fromNumber,
      from,
      body,
      direction: 'inbound',
      status: 'received',
      providerId,
      createdAt: new Date(),
      deliveredAt: new Date(),
    };

    this.messageLog.push(message);
    return message;
  }

  /**
   * Get message history for a lead
   */
  getMessagesForLead(leadId: string): SmsMessage[] {
    return this.messageLog.filter(m => m.leadId === leadId);
  }

  /**
   * Get all messages
   */
  getAllMessages(): SmsMessage[] {
    return [...this.messageLog];
  }

  /**
   * Check message delivery status
   */
  async checkDeliveryStatus(providerId: string): Promise<string> {
    return this.provider.getStatus(providerId);
  }
}

// ============================================================================
// SMS TEMPLATES
// ============================================================================

/**
 * SMS message templates
 */
export const SMS_TEMPLATES = {
  initialContact: (firstName: string, companyName: string = 'Solar Solutions') => 
    `Hi ${firstName}! This is ${companyName}. We noticed you're interested in solar for your home. Would you like to schedule a free consultation? Reply YES or call us anytime. Reply STOP to opt out.`,

  followUp: (firstName: string, attemptNumber: number) => 
    `Hi ${firstName}, just following up on our solar consultation offer. We have availability this week. Would you like to learn more? Reply YES or STOP to opt out.`,

  appointmentProposal: (firstName: string, slots: string[]) =>
    `Hi ${firstName}! Great news! Here are our available appointment times:\n${slots.map((s, i) => `${i + 1}. ${s}`).join('\n')}\nReply with the number of your preferred time, or suggest another time.`,

  appointmentConfirmation: (firstName: string, date: string, time: string) =>
    `Hi ${firstName}! Your solar consultation is confirmed for ${date} at ${time}. We'll send a reminder before your appointment. Reply CHANGE to reschedule or STOP to cancel.`,

  appointmentReminder: (firstName: string, date: string, time: string) =>
    `Hi ${firstName}, this is a reminder about your solar consultation tomorrow (${date}) at ${time}. Reply CONFIRM to verify or CHANGE to reschedule.`,

  thankYou: (firstName: string) =>
    `Thank you ${firstName}! We appreciate your time and look forward to helping you go solar. Questions? Reply anytime.`,

  optOutConfirmation: () =>
    `You've been unsubscribed and will no longer receive messages from us. Thank you.`,

  notInterested: (firstName: string) =>
    `Thanks for letting us know, ${firstName}. If you change your mind about solar in the future, feel free to reach out. Take care!`,
};

/**
 * Generate SMS message from template
 */
export function generateSmsFromTemplate(
  templateName: keyof typeof SMS_TEMPLATES,
  params: Record<string, unknown>
): string {
  switch (templateName) {
    case 'initialContact':
      return SMS_TEMPLATES.initialContact(params.firstName as string, params.companyName as string);
    case 'followUp':
      return SMS_TEMPLATES.followUp(params.firstName as string, params.attemptNumber as number);
    case 'appointmentProposal':
      return SMS_TEMPLATES.appointmentProposal(params.firstName as string, params.slots as string[]);
    case 'appointmentConfirmation':
      return SMS_TEMPLATES.appointmentConfirmation(params.firstName as string, params.date as string, params.time as string);
    case 'appointmentReminder':
      return SMS_TEMPLATES.appointmentReminder(params.firstName as string, params.date as string, params.time as string);
    case 'thankYou':
      return SMS_TEMPLATES.thankYou(params.firstName as string);
    case 'notInterested':
      return SMS_TEMPLATES.notInterested(params.firstName as string);
    case 'optOutConfirmation':
      return SMS_TEMPLATES.optOutConfirmation();
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}

// Singleton instance (will be configured at runtime)
let smsServiceInstance: SmsService | null = null;

export function initializeSmsService(config: SmsProviderConfig): SmsService {
  smsServiceInstance = new SmsService(config);
  return smsServiceInstance;
}

export function getSmsService(): SmsService {
  if (!smsServiceInstance) {
    // Initialize with mock provider if not configured
    smsServiceInstance = new SmsService({
      provider: 'mock',
      fromNumber: '+1234567890',
    });
  }
  return smsServiceInstance;
}
