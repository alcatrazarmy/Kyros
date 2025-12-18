/**
 * Kyros Agent Runtime - Language Service
 * Uses OpenAI ONLY for language tasks: classification, drafting, explanations
 * NO business logic or decision-making
 */

import type { MessageClassification } from '../types';

/**
 * Language service configuration
 */
interface LanguageServiceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
}

/**
 * Language Service class
 * Constrained to language-only tasks - no workflow decisions
 */
export class LanguageService {
  private config: LanguageServiceConfig;
  private useMock: boolean;

  constructor(config: LanguageServiceConfig) {
    this.config = config;
    this.useMock = !config.apiKey;
    
    if (this.useMock) {
      console.warn('[LanguageService] No API key configured, using mock responses');
    }
  }

  /**
   * Classify an SMS response from a lead
   * Returns classification ONLY - no business decisions
   */
  async classifyResponse(message: string): Promise<MessageClassification> {
    if (this.useMock) {
      return this.mockClassifyResponse(message);
    }

    try {
      const response = await this.callOpenAI({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a message classifier for a solar appointment scheduling system.
Classify the customer's SMS response into one of these categories:
- interested: Customer wants to learn more or schedule an appointment
- not_now: Customer is not interested at this time but not opting out
- stop: Customer wants to opt out of all messages (STOP, unsubscribe, etc.)
- question: Customer has a question that needs answering
- confirm: Customer is confirming an appointment or action
- reschedule: Customer wants to change an existing appointment
- unknown: Cannot determine intent

Also extract any useful information like preferred day/time or reason for response.

Respond with JSON only:
{
  "intent": "...",
  "confidence": 0.0-1.0,
  "extractedInfo": { "preferredDay": "...", "preferredTime": "...", "reason": "..." },
  "rawAnalysis": "brief explanation"
}`
          },
          {
            role: 'user',
            content: `Classify this SMS response: "${message}"`
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.3,
      });

      return this.parseClassificationResponse(response);
    } catch (error) {
      console.error('[LanguageService] Classification error:', error);
      return this.mockClassifyResponse(message);
    }
  }

  /**
   * Draft an SMS message based on context
   * Returns text ONLY - caller decides whether to send
   */
  async draftMessage(context: {
    purpose: 'initial_contact' | 'follow_up' | 'appointment_proposal' | 'confirmation' | 'response';
    leadName: string;
    previousMessages?: string[];
    appointmentSlots?: string[];
    additionalContext?: string;
  }): Promise<string> {
    if (this.useMock) {
      return this.mockDraftMessage(context);
    }

    try {
      const response = await this.callOpenAI({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant drafting SMS messages for a solar installation company.
Guidelines:
- Keep messages under 160 characters when possible
- Be friendly and professional
- Always include opt-out language (Reply STOP to opt out) for first contact
- Never make promises or commitments about pricing
- Focus on scheduling consultations
- Use the customer's first name

Purpose of this message: ${context.purpose}
Customer name: ${context.leadName}
${context.appointmentSlots ? `Available slots: ${context.appointmentSlots.join(', ')}` : ''}
${context.additionalContext || ''}`
          },
          {
            role: 'user',
            content: context.previousMessages 
              ? `Previous messages:\n${context.previousMessages.join('\n')}\n\nDraft the next message.`
              : 'Draft the initial message.'
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      return this.parseTextResponse(response);
    } catch (error) {
      console.error('[LanguageService] Draft error:', error);
      return this.mockDraftMessage(context);
    }
  }

  /**
   * Generate a response to a customer question
   */
  async generateResponse(
    question: string, 
    context?: { leadName: string; previousMessages?: string[] }
  ): Promise<string> {
    if (this.useMock) {
      return `Thank you for your question, ${context?.leadName || 'there'}! A solar consultant will get back to you shortly. Reply STOP to opt out.`;
    }

    try {
      const response = await this.callOpenAI({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful solar consultation assistant. Answer questions briefly via SMS (under 160 chars when possible).
- Don't make specific pricing promises
- Encourage scheduling a free consultation for detailed questions
- Be helpful and friendly
- Include opt-out info if this is a new conversation`
          },
          {
            role: 'user',
            content: `Customer "${context?.leadName || 'Customer'}" asks: "${question}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      return this.parseTextResponse(response);
    } catch (error) {
      console.error('[LanguageService] Response generation error:', error);
      return `Thank you for your question! A solar consultant will get back to you shortly. Reply STOP to opt out.`;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Call OpenAI API (stub - would use actual SDK in production)
   */
  private async callOpenAI(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens: number;
    temperature: number;
  }): Promise<string> {
    // In production, this would use the OpenAI SDK:
    // const openai = new OpenAI({ apiKey: this.config.apiKey });
    // const completion = await openai.chat.completions.create(params);
    // return completion.choices[0].message.content;

    // For now, throw to trigger mock fallback
    throw new Error('OpenAI SDK not configured');
  }

  /**
   * Parse classification JSON response
   */
  private parseClassificationResponse(response: string): MessageClassification {
    try {
      const parsed = JSON.parse(response);
      return {
        intent: parsed.intent || 'unknown',
        confidence: parsed.confidence || 0.5,
        extractedInfo: parsed.extractedInfo,
        rawAnalysis: parsed.rawAnalysis,
      };
    } catch {
      return {
        intent: 'unknown',
        confidence: 0,
        rawAnalysis: 'Failed to parse response',
      };
    }
  }

  /**
   * Parse text response
   */
  private parseTextResponse(response: string): string {
    return response.trim();
  }

  /**
   * Mock classification for testing without OpenAI
   */
  private mockClassifyResponse(message: string): MessageClassification {
    const lowerMessage = message.toLowerCase().trim();

    // STOP keywords - immediate opt-out
    if (
      lowerMessage === 'stop' ||
      lowerMessage === 'unsubscribe' ||
      lowerMessage === 'cancel' ||
      lowerMessage.includes('stop texting') ||
      lowerMessage.includes('remove me') ||
      lowerMessage.includes('opt out')
    ) {
      return {
        intent: 'stop',
        confidence: 0.99,
        rawAnalysis: 'Explicit opt-out request detected',
      };
    }

    // Positive responses
    if (
      lowerMessage === 'yes' ||
      lowerMessage === 'yeah' ||
      lowerMessage === 'sure' ||
      lowerMessage === 'interested' ||
      lowerMessage.includes('tell me more') ||
      lowerMessage.includes('sounds good') ||
      lowerMessage.includes('i\'m interested') ||
      lowerMessage.includes('schedule')
    ) {
      return {
        intent: 'interested',
        confidence: 0.9,
        rawAnalysis: 'Positive interest detected',
      };
    }

    // Negative but not opt-out
    if (
      lowerMessage === 'no' ||
      lowerMessage === 'not interested' ||
      lowerMessage.includes('not right now') ||
      lowerMessage.includes('maybe later') ||
      lowerMessage.includes('not a good time')
    ) {
      return {
        intent: 'not_now',
        confidence: 0.85,
        rawAnalysis: 'Negative response, not an opt-out',
      };
    }

    // Confirmation
    if (
      lowerMessage === 'confirm' ||
      lowerMessage === 'confirmed' ||
      lowerMessage === 'ok' ||
      lowerMessage === 'sounds good' ||
      lowerMessage.includes('see you then') ||
      lowerMessage.includes('that works')
    ) {
      return {
        intent: 'confirm',
        confidence: 0.85,
        rawAnalysis: 'Confirmation detected',
      };
    }

    // Reschedule
    if (
      lowerMessage.includes('reschedule') ||
      lowerMessage.includes('different time') ||
      lowerMessage.includes('change') ||
      lowerMessage.includes('can\'t make it')
    ) {
      return {
        intent: 'reschedule',
        confidence: 0.85,
        rawAnalysis: 'Reschedule request detected',
      };
    }

    // Question (contains question mark or question words)
    if (
      lowerMessage.includes('?') ||
      lowerMessage.startsWith('what') ||
      lowerMessage.startsWith('how') ||
      lowerMessage.startsWith('when') ||
      lowerMessage.startsWith('where') ||
      lowerMessage.startsWith('why') ||
      lowerMessage.startsWith('who')
    ) {
      return {
        intent: 'question',
        confidence: 0.8,
        rawAnalysis: 'Question detected',
      };
    }

    // Number selection (for appointment slots)
    const numberMatch = lowerMessage.match(/^[1-5]$/);
    if (numberMatch) {
      return {
        intent: 'confirm',
        confidence: 0.9,
        extractedInfo: {
          preferredTime: numberMatch[0],
        },
        rawAnalysis: 'Slot selection detected',
      };
    }

    // Unknown
    return {
      intent: 'unknown',
      confidence: 0.5,
      rawAnalysis: 'Could not determine intent from message',
    };
  }

  /**
   * Mock message drafting for testing without OpenAI
   */
  private mockDraftMessage(context: {
    purpose: string;
    leadName: string;
    appointmentSlots?: string[];
  }): string {
    switch (context.purpose) {
      case 'initial_contact':
        return `Hi ${context.leadName}! This is Solar Solutions. We noticed you're interested in solar for your home. Would you like to schedule a free consultation? Reply YES or STOP to opt out.`;
      case 'follow_up':
        return `Hi ${context.leadName}, just following up on solar savings for your home. We have availability this week. Interested? Reply YES or STOP to opt out.`;
      case 'appointment_proposal':
        return `Great news ${context.leadName}! Available times:\n${context.appointmentSlots?.map((s, i) => `${i + 1}. ${s}`).join('\n') || '1. Tomorrow 2pm'}\nReply with your preferred number.`;
      case 'confirmation':
        return `Confirmed ${context.leadName}! See you at your scheduled appointment. Reply CHANGE to reschedule or STOP to cancel.`;
      case 'response':
        return `Thanks for reaching out ${context.leadName}! A consultant will answer your question shortly. Reply STOP to opt out.`;
      default:
        return `Hi ${context.leadName}, thanks for your interest in solar! Reply STOP to opt out.`;
    }
  }
}

// Singleton instance
let languageServiceInstance: LanguageService | null = null;

export function initializeLanguageService(config: LanguageServiceConfig): LanguageService {
  languageServiceInstance = new LanguageService(config);
  return languageServiceInstance;
}

export function getLanguageService(): LanguageService {
  if (!languageServiceInstance) {
    languageServiceInstance = new LanguageService({
      model: 'gpt-4o-mini',
      maxTokens: 150,
    });
  }
  return languageServiceInstance;
}
