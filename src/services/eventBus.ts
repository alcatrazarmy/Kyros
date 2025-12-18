/**
 * Event Bus Service
 * 
 * Handles real-time events from the backend via WebSocket.
 * The frontend subscribes to events to update the UI in response to backend state changes.
 * The frontend never decides outcomes - it only displays state from backend events.
 */

import type { BackendEvent, EventType } from '@/types/integration';

// ========================
// EVENT HANDLER TYPES
// ========================

type EventHandler<T = unknown> = (event: BackendEvent<T>) => void;
type UnsubscribeFn = () => void;

interface EventSubscription {
  eventType: EventType | '*';
  handler: EventHandler;
}

// ========================
// EVENT BUS CLASS
// ========================

class EventBus {
  private ws: WebSocket | null = null;
  private subscriptions: EventSubscription[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private wsUrl: string;

  constructor(wsUrl?: string) {
    this.wsUrl = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/events/ws';
  }

  /**
   * Connect to the backend WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          console.log('[EventBus] Connected to backend WebSocket');
          resolve();
        };

        this.ws.onmessage = (message) => {
          this.handleMessage(message);
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          console.log('[EventBus] WebSocket closed:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          console.error('[EventBus] WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the backend WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[EventBus] Max reconnection attempts reached');
      this.emitLocalEvent({
        type: 'error.escalation',
        payload: {
          errorId: 'ws_reconnect_failed',
          severity: 'high',
          message: 'WebSocket reconnection failed after maximum attempts',
          context: { attempts: this.reconnectAttempts },
          requiresHumanIntervention: true,
        },
        timestamp: new Date().toISOString(),
        source: 'backend',
      });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[EventBus] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: MessageEvent): void {
    try {
      const event = JSON.parse(message.data) as BackendEvent;
      this.dispatchEvent(event);
    } catch (error) {
      console.error('[EventBus] Failed to parse message:', error);
    }
  }

  /**
   * Dispatch event to all matching subscribers
   */
  private dispatchEvent(event: BackendEvent): void {
    console.log('[EventBus] Received event:', event.type);
    
    this.subscriptions.forEach(subscription => {
      if (subscription.eventType === '*' || subscription.eventType === event.type) {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error('[EventBus] Handler error:', error);
        }
      }
    });
  }

  /**
   * Emit a local event (used for internal notifications)
   */
  private emitLocalEvent(event: BackendEvent): void {
    this.dispatchEvent(event);
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T = unknown>(eventType: EventType, handler: EventHandler<T>): UnsubscribeFn {
    const subscription: EventSubscription = {
      eventType,
      handler: handler as EventHandler,
    };
    
    this.subscriptions.push(subscription);
    
    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(handler: EventHandler): UnsubscribeFn {
    const subscription: EventSubscription = {
      eventType: '*',
      handler,
    };
    
    this.subscriptions.push(subscription);
    
    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Check if connected to backend
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.isConnecting || this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

// ========================
// SINGLETON EXPORT
// ========================

export const eventBus = new EventBus();

// Export class for custom instances
export { EventBus };

// ========================
// REACT HOOK FOR EVENT SUBSCRIPTION
// ========================

import { useEffect, useCallback, useState } from 'react';

/**
 * React hook for subscribing to backend events
 */
export function useBackendEvent<T = unknown>(
  eventType: EventType,
  handler: (payload: T) => void
): void {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe<T>(eventType, (event) => {
      handler(event.payload as T);
    });
    
    return unsubscribe;
  }, [eventType, handler]);
}

/**
 * React hook for managing event bus connection
 */
export function useEventBusConnection(): {
  state: 'connected' | 'connecting' | 'disconnected';
  connect: () => Promise<void>;
  disconnect: () => void;
} {
  const [state, setState] = useState<'connected' | 'connecting' | 'disconnected'>(
    eventBus.getState()
  );

  useEffect(() => {
    // Check connection state periodically
    const interval = setInterval(() => {
      setState(eventBus.getState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    setState('connecting');
    try {
      await eventBus.connect();
      setState('connected');
    } catch {
      setState('disconnected');
    }
  }, []);

  const disconnect = useCallback(() => {
    eventBus.disconnect();
    setState('disconnected');
  }, []);

  return { state, connect, disconnect };
}
