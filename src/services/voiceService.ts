/**
 * Kyros Dashboard - Voice Interface Service (Bauliver)
 * Handles voice commands, responses, and emotional modes
 */

import type { VoiceMode, VoiceState, VoiceCommand, VoiceResponse, VoiceSession } from '@/types';
import { generateId } from '@/lib/utils';

/**
 * Trigger phrases and their associated actions
 */
const TRIGGER_PHRASES: Record<string, string> = {
  'kyros what are my active leads': 'getActiveLeads',
  'kyros show me hot leads': 'getHotLeads',
  'kyros how many new permits': 'getNewPermits',
  'kyros token status': 'getTokenStatus',
  'kyros show the map': 'showMap',
  'kyros summarize today': 'getDailySummary',
  'kyros who needs follow up': 'getFollowUps',
  'kyros switch to': 'switchMode',
  'kyros help': 'getHelp',
};

/**
 * Mode-specific response styles
 */
const MODE_STYLES: Record<VoiceMode, { greeting: string; style: string }> = {
  flirt: {
    greeting: "Hey there, gorgeous! Ready to close some deals together? 😏",
    style: "playful, confident, slightly teasing",
  },
  calm: {
    greeting: "Good to see you. Let's review your leads with focus and clarity.",
    style: "measured, peaceful, reassuring",
  },
  executive: {
    greeting: "Status report ready. Let's optimize your pipeline efficiency.",
    style: "professional, data-driven, concise",
  },
  hype: {
    greeting: "LET'S GO! Time to CRUSH those leads and DOMINATE the market! 🔥",
    style: "energetic, motivational, intense",
  },
  storyteller: {
    greeting: "Ah, another chapter in your solar journey begins... Let me guide you through today's opportunities.",
    style: "narrative, engaging, descriptive",
  },
};

/**
 * Voice Service for Bauliver persona
 */
class VoiceService {
  private currentSession: VoiceSession | null = null;
  private currentMode: VoiceMode = 'executive';
  private state: VoiceState = 'idle';

  /**
   * Start a new voice session
   */
  startSession(): VoiceSession {
    this.currentSession = {
      id: generateId(),
      state: 'idle',
      currentMode: this.currentMode,
      commands: [],
      responses: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };
    return this.currentSession;
  }

  /**
   * Get current session
   */
  getSession(): VoiceSession | null {
    return this.currentSession;
  }

  /**
   * Set voice mode
   */
  setMode(mode: VoiceMode): VoiceResponse {
    this.currentMode = mode;
    if (this.currentSession) {
      this.currentSession.currentMode = mode;
    }

    const modeInfo = MODE_STYLES[mode];
    const response: VoiceResponse = {
      id: generateId(),
      text: modeInfo.greeting,
      mode,
      timestamp: new Date(),
    };

    if (this.currentSession) {
      this.currentSession.responses.push(response);
      this.currentSession.lastActivityAt = new Date();
    }

    return response;
  }

  /**
   * Get current mode
   */
  getMode(): VoiceMode {
    return this.currentMode;
  }

  /**
   * Get mode info
   */
  getModeInfo(mode: VoiceMode): { greeting: string; style: string } {
    return MODE_STYLES[mode];
  }

  /**
   * Get all available modes
   */
  getAllModes(): VoiceMode[] {
    return ['flirt', 'calm', 'executive', 'hype', 'storyteller'];
  }

  /**
   * Set voice state
   */
  setState(state: VoiceState): void {
    this.state = state;
    if (this.currentSession) {
      this.currentSession.state = state;
      this.currentSession.lastActivityAt = new Date();
    }
  }

  /**
   * Get voice state
   */
  getState(): VoiceState {
    return this.state;
  }

  /**
   * Process voice command
   */
  processCommand(input: string): { command: VoiceCommand; response: VoiceResponse } {
    const normalizedInput = input.toLowerCase().trim();
    
    // Find matching trigger phrase
    let matchedAction = 'unknown';
    for (const [phrase, action] of Object.entries(TRIGGER_PHRASES)) {
      if (normalizedInput.includes(phrase.replace('kyros ', ''))) {
        matchedAction = action;
        break;
      }
    }

    const command: VoiceCommand = {
      id: generateId(),
      phrase: input,
      action: matchedAction,
      timestamp: new Date(),
    };

    // Generate response based on mode and action
    const responseText = this.generateResponse(matchedAction, this.currentMode);
    
    const response: VoiceResponse = {
      id: generateId(),
      text: responseText,
      mode: this.currentMode,
      timestamp: new Date(),
    };

    if (this.currentSession) {
      this.currentSession.commands.push(command);
      this.currentSession.responses.push(response);
      this.currentSession.lastActivityAt = new Date();
    }

    return { command, response };
  }

  /**
   * Generate response based on action and mode
   */
  private generateResponse(action: string, mode: VoiceMode): string {
    const responses: Record<string, Record<VoiceMode, string>> = {
      getActiveLeads: {
        flirt: "Ooh, checking out your active leads? You've got 8 beauties waiting for your attention! 💋",
        calm: "You have 8 active leads in your pipeline. 3 are marked as high priority.",
        executive: "Pipeline status: 8 active leads. 2 hot, 3 warm, 3 new. Total potential value: $347,000.",
        hype: "BOOM! 8 leads are LIVE and ready! 2 are HOT HOT HOT! Let's CLOSE them! 🚀",
        storyteller: "In the kingdom of leads, 8 prospects await their solar destiny. Two burn bright with urgency...",
      },
      getHotLeads: {
        flirt: "Hot leads? Just like you asked! 2 smokin' hot opportunities ready for your charm! 🔥",
        calm: "Two leads are currently marked as hot and ready for immediate follow-up.",
        executive: "2 hot leads identified. Combined value: $113,000. Recommend immediate action.",
        hype: "TWO HOT LEADS ON FIRE! John Smith and Emily Davis are READY TO SIGN! GO GO GO! 🔥🔥",
        storyteller: "Two stars shine brightest tonight - John Smith seeks the sun's power, and Emily Davis stands ready to transform her enterprise...",
      },
      getNewPermits: {
        flirt: "Fresh permits just for you! 2 new ones dropped today. Want me to show you the details? 😉",
        calm: "There are 2 new permits that came in recently. Sarah Johnson and Lisa Martinez.",
        executive: "2 new permits detected. PA-2025-005678 and NP-2025-002345. Combined system size: 27kW.",
        hype: "DING DING DING! 2 FRESH PERMITS just landed! That's $97K in potential! LET'S HUNT! 🎯",
        storyteller: "The permit scrolls have arrived! Two new tales begin - one in Palo Alto, another in wine country...",
      },
      getTokenStatus: {
        flirt: "Your tokens? All safe and sound in my memory core, handsome. 3 active, 0 revoked. 💝",
        calm: "Token status is healthy. 3 active tokens, all functioning normally.",
        executive: "Token audit complete. 3 active, 0 revoked, 0 expired. 4 endpoints monitored.",
        hype: "TOKEN CHECK! All 3 are LIVE and LOCKED! Security is TIGHT! 💪",
        storyteller: "The three guardians of access stand vigilant - Production, Development, and Admin keep watch...",
      },
      showMap: {
        flirt: "Opening the map for you, sweetie. Let's see where all your leads are hiding! 🗺️",
        calm: "Displaying the lead map. All 8 leads are now visible with their locations.",
        executive: "Map view activated. 8 leads displayed across Bay Area. Clustering analysis available.",
        hype: "MAP MODE ENGAGED! Check out those PINS! Your territory is COVERED! 🗺️🔥",
        storyteller: "Behold the realm of opportunity! From the streets of San Francisco to the valleys of Napa...",
      },
      getDailySummary: {
        flirt: "Your day so far? 2 new leads came in, 1 was contacted. You're doing great! 😘",
        calm: "Today's summary: 2 new leads, 1 contact made, no conversions yet. Steady progress.",
        executive: "Daily metrics: +2 leads, 1 contact, $97K pipeline addition. Conversion rate pending.",
        hype: "TODAY'S SCORE: 2 NEW LEADS! 1 CONTACT MADE! The momentum is BUILDING! 📈",
        storyteller: "As the sun set on another day, two new souls joined your quest, and one connection was forged...",
      },
      getFollowUps: {
        flirt: "3 cuties need a follow-up! Mike, Robert, and Amanda are waiting for your call! 📞",
        calm: "3 leads require follow-up: Mike Chen, Robert Wilson, and Amanda Taylor.",
        executive: "Action required: 3 follow-ups overdue. Priority: Robert Wilson (site visit).",
        hype: "3 FOLLOW-UPS READY! Don't leave them hanging! PICK UP THAT PHONE! 📱💥",
        storyteller: "Three tales hang in the balance, awaiting the next chapter of your outreach...",
      },
      getHelp: {
        flirt: "Need help? I'm here for you! Just say 'Kyros' followed by your command. I'll take care of you! 💕",
        calm: "Available commands: 'show leads', 'hot leads', 'new permits', 'token status', 'show map', 'summarize today'.",
        executive: "Voice commands available: leads query, token status, map view, daily summary, follow-ups.",
        hype: "HERE'S WHAT I CAN DO: Leads! Tokens! Maps! Summaries! Just SAY THE WORD! 🎤",
        storyteller: "Speak your wish and I shall grant it - ask of leads, of tokens, of maps, of the day's journey...",
      },
      unknown: {
        flirt: "Hmm, I didn't quite catch that, gorgeous. Try saying 'Kyros, help' for a list of commands! 💋",
        calm: "I didn't understand that command. Please try 'Kyros, help' for available options.",
        executive: "Command not recognized. Say 'Kyros, help' for available voice commands.",
        hype: "WHAT WAS THAT?! Speak up and try again! Say 'Kyros, help' if you're stuck! 🎯",
        storyteller: "Your words dance just beyond my understanding... Speak 'Kyros, help' and I shall reveal my powers...",
      },
    };

    return responses[action]?.[mode] || responses['unknown'][mode];
  }

  /**
   * Get greeting for current mode
   */
  getGreeting(): string {
    return MODE_STYLES[this.currentMode].greeting;
  }

  /**
   * End current session
   */
  endSession(): void {
    this.currentSession = null;
    this.state = 'idle';
  }
}

// Singleton instance
export const voiceService = new VoiceService();

// Export helper functions
export function startVoiceSession() {
  return voiceService.startSession();
}

export function getVoiceSession() {
  return voiceService.getSession();
}

export function setVoiceMode(mode: VoiceMode) {
  return voiceService.setMode(mode);
}

export function getVoiceMode() {
  return voiceService.getMode();
}

export function processVoiceCommand(input: string) {
  return voiceService.processCommand(input);
}

export function getVoiceState() {
  return voiceService.getState();
}

export function setVoiceState(state: VoiceState) {
  return voiceService.setState(state);
}

export function getAllVoiceModes() {
  return voiceService.getAllModes();
}

export function getVoiceGreeting() {
  return voiceService.getGreeting();
}

export function getModeInfo(mode: VoiceMode) {
  return voiceService.getModeInfo(mode);
}
