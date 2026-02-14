/**
 * Webhook Manager Service
 * Manages bidirectional webhooks for real-time HIS event notifications
 * Supports delivery guarantees and retry logic
 */

interface WebhookConfig {
  id: string;
  url: string;
  events: string[]; // e.g., ['patient.created', 'observation.updated']
  active: boolean;
  secret?: string; // For HMAC signature verification
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, any>;
  timestamp: Date;
  deliveryAttempts: WebhookDeliveryAttempt[];
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
}

interface WebhookDeliveryAttempt {
  timestamp: Date;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export class WebhookManagerService {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private events: WebhookEvent[] = [];
  private maxEventsPerWebhook: number = 1000;
  private enablePersistence: boolean = true;

  constructor(enablePersistence: boolean = true) {
    this.enablePersistence = enablePersistence;
    if (enablePersistence) {
      this.loadWebhooks();
    }
  }

  /**
   * Register a webhook
   */
  registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): WebhookConfig {
    const webhook: WebhookConfig = {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);
    this.saveWebhooks();

    return webhook;
  }

  /**
   * Update a webhook configuration
   */
  updateWebhook(webhookId: string, updates: Partial<Omit<WebhookConfig, 'id' | 'createdAt'>>): WebhookConfig | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    Object.assign(webhook, updates);
    webhook.updatedAt = new Date();
    this.webhooks.set(webhookId, webhook);
    this.saveWebhooks();

    return webhook;
  }

  /**
   * Deregister a webhook
   */
  deregisterWebhook(webhookId: string): boolean {
    const removed = this.webhooks.delete(webhookId);
    if (removed) {
      this.saveWebhooks();
      // Remove related events
      this.events = this.events.filter((e) => e.webhookId !== webhookId);
    }
    return removed;
  }

  /**
   * Get all webhooks
   */
  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookConfig | null {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * Emit an event to matching webhooks
   */
  async emitEvent(eventType: string, payload: Record<string, any>): Promise<string[]> {
    const deliveredWebhookIds: string[] = [];

    for (const [webhookId, webhook] of this.webhooks) {
      if (!webhook.active || !webhook.events.includes(eventType)) {
        continue;
      }

      const event: WebhookEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        webhookId,
        eventType,
        payload,
        timestamp: new Date(),
        deliveryAttempts: [],
        status: 'pending',
      };

      this.events.push(event);

      // Attempt delivery
      const delivered = await this.deliverEvent(webhook, event);
      if (delivered) {
        deliveredWebhookIds.push(webhookId);
      }

      this.maintainEventLog();
    }

    return deliveredWebhookIds;
  }

  /**
   * Deliver a webhook event with retry logic
   */
  private async deliverEvent(webhook: WebhookConfig, event: WebhookEvent): Promise<boolean> {
    const retryPolicy = webhook.retryPolicy || {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < retryPolicy.maxRetries) {
      try {
        event.status = attempt > 0 ? 'retrying' : 'pending';

        const response = await this.sendWebhookRequest(webhook, event);

        event.deliveryAttempts.push({
          timestamp: new Date(),
          statusCode: response.status,
          responseTime: response.duration,
        });

        if (response.success) {
          event.status = 'delivered';
          return true;
        }

        // Non-retryable error
        if (response.status && response.status >= 400 && response.status < 500) {
          event.status = 'failed';
          return false;
        }
      } catch (error) {
        lastError = error as Error;

        event.deliveryAttempts.push({
          timestamp: new Date(),
          error: (error as Error).message,
        });
      }

      attempt++;

      if (attempt < retryPolicy.maxRetries) {
        // Wait before retry with exponential backoff
        const delay = retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, attempt - 1);
        await this.delay(delay);
      }
    }

    event.status = 'failed';
    if (lastError && event.deliveryAttempts.length === 0) {
      event.deliveryAttempts.push({
        timestamp: new Date(),
        error: lastError.message,
      });
    }

    return false;
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhookRequest(
    webhook: WebhookConfig,
    event: WebhookEvent
  ): Promise<{ success: boolean; status?: number; duration?: number }> {
    const startTime = Date.now();

    try {
      const payload = JSON.stringify({
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.payload,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhook.id,
        'X-Event-Type': event.eventType,
        'X-Delivery-ID': event.id,
        'X-Delivery-Timestamp': new Date().toISOString(),
        ...webhook.headers,
      };

      // Add HMAC signature if secret configured
      if (webhook.secret) {
        const crypto = await this.getCrypto();
        const signature = await crypto.generateHMAC(webhook.secret, payload);
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: AbortSignal.timeout(30000),
      });

      const duration = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        duration,
      };
    } catch (error) {
      console.error(`[Webhook] Delivery failed for ${webhook.url}:`, error);
      throw error;
    }
  }

  /**
   * Get events for a webhook
   */
  getWebhookEvents(webhookId: string, limit?: number): WebhookEvent[] {
    let events = this.events.filter((e) => e.webhookId === webhookId);

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Get delivery status of an event
   */
  getEventStatus(eventId: string): WebhookEvent | undefined {
    return this.events.find((e) => e.id === eventId);
  }

  /**
   * Retry failed webhook delivery
   */
  async retryWebhookDelivery(eventId: string): Promise<boolean> {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return false;

    const webhook = this.webhooks.get(event.webhookId);
    if (!webhook) return false;

    // Reset attempts and try again
    event.deliveryAttempts = [];
    event.status = 'retrying';

    return this.deliverEvent(webhook, event);
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, responseTime: 0, error: 'Webhook not found' };
    }

    const testPayload = {
      id: 'test-' + Date.now(),
      eventType: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { test: true, webhookId },
    };

    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Test': 'true',
        'X-Webhook-ID': webhook.id,
        ...webhook.headers,
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 300,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get webhook delivery statistics
   */
  getWebhookStats(webhookId?: string): Record<string, any> {
    const events = webhookId ? this.events.filter((e) => e.webhookId === webhookId) : this.events;

    return {
      totalEvents: events.length,
      deliveredEvents: events.filter((e) => e.status === 'delivered').length,
      failedEvents: events.filter((e) => e.status === 'failed').length,
      pendingEvents: events.filter((e) => e.status === 'pending' || e.status === 'retrying').length,
      averageAttempts: Math.round(
        events.reduce((sum, e) => sum + e.deliveryAttempts.length, 0) / Math.max(events.length, 1)
      ),
      successRate:
        events.length > 0
          ? Math.round((events.filter((e) => e.status === 'delivered').length / events.length) * 100)
          : 0,
    };
  }

  /**
   * Clear old events
   */
  clearOldEvents(beforeDate: Date): number {
    const originalSize = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= beforeDate);
    return originalSize - this.events.length;
  }

  /**
   * Get webhook health status
   */
  getWebhookHealth(webhookId: string): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    successRate: number;
    averageResponseTime: number;
  } {
    const events = this.events.filter((e) => e.webhookId === webhookId).slice(-100); // Last 100 events

    if (events.length === 0) {
      return { status: 'healthy', lastCheck: new Date(), successRate: 100, averageResponseTime: 0 };
    }

    const successful = events.filter((e) => e.status === 'delivered').length;
    const successRate = (successful / events.length) * 100;

    const totalResponseTime = events.reduce((sum, e) => {
      const delivery = e.deliveryAttempts[0];
      return sum + (delivery?.responseTime || 0);
    }, 0);

    const averageResponseTime = Math.round(totalResponseTime / events.length);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (successRate >= 99) {
      status = 'healthy';
    } else if (successRate >= 95) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      lastCheck: events[events.length - 1].timestamp,
      successRate: Math.round(successRate),
      averageResponseTime,
    };
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get crypto utilities (simplified for browser)
   */
  private async getCrypto() {
    return {
      generateHMAC: async (secret: string, data: string): Promise<string> => {
        // Simplified HMAC - in production use proper crypto library
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(data);

        const key = await (globalThis as any).crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );

        const signature = await (globalThis as any).crypto.subtle.sign('HMAC', key, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      },
    };
  }

  /**
   * Maintain event log size
   */
  private maintainEventLog(): void {
    // Group by webhook and limit per webhook
    const webhookEvents = new Map<string, WebhookEvent[]>();

    for (const event of this.events) {
      if (!webhookEvents.has(event.webhookId)) {
        webhookEvents.set(event.webhookId, []);
      }
      webhookEvents.get(event.webhookId)!.push(event);
    }

    // Trim old events per webhook
    for (const [webhookId, events] of webhookEvents) {
      if (events.length > this.maxEventsPerWebhook) {
        const toRemove = events.length - this.maxEventsPerWebhook;
        this.events = this.events.filter((e) => {
          if (e.webhookId === webhookId && events.indexOf(e) < toRemove) {
            return false;
          }
          return true;
        });
      }
    }
  }

  /**
   * Load webhooks from storage
   */
  private loadWebhooks(): void {
    try {
      const stored = localStorage.getItem('his_webhooks');
      if (stored) {
        const webhooks = JSON.parse(stored) as WebhookConfig[];
        for (const webhook of webhooks) {
          webhook.createdAt = new Date(webhook.createdAt);
          webhook.updatedAt = new Date(webhook.updatedAt);
          this.webhooks.set(webhook.id, webhook);
        }
      }
    } catch (error) {
      console.error('[Webhook] Failed to load webhooks:', error);
    }
  }

  /**
   * Save webhooks to storage
   */
  private saveWebhooks(): void {
    if (!this.enablePersistence) return;

    try {
      const webhooks = Array.from(this.webhooks.values());
      localStorage.setItem('his_webhooks', JSON.stringify(webhooks));
    } catch (error) {
      console.error('[Webhook] Failed to save webhooks:', error);
    }
  }
}

// Singleton instance
export const webhookManagerService = new WebhookManagerService();
