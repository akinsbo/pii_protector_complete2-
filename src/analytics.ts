/**
 * @fileoverview Analytics system for plugin usage tracking
 */

export interface AnalyticsEvent {
  event: string;
  plugin_id?: string;
  model?: string;
  timestamp: number;
  session_id: string;
  user_id: string;
  metadata?: Record<string, any>;
}

export interface UsageMetrics {
  plugin_usage: Record<string, number>;
  model_usage: Record<string, number>;
  conversation_count: number;
  message_count: number;
  session_duration: number;
  features_used: string[];
}

export class AnalyticsManager {
  private enabled = false;
  private sessionId: string;
  private userId: string;
  private sessionStart: number;
  private events: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateId();
    this.userId = this.getOrCreateUserId();
    this.sessionStart = Date.now();
    this.loadSettings();
    this.startFlushTimer();
  }

  /**
   * Enable or disable analytics collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('ledebe-analytics-enabled', enabled.toString());
    
    if (enabled) {
      this.track('analytics_enabled');
    } else {
      this.track('analytics_disabled');
      this.flush(); // Send any pending events before disabling
    }
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Track a plugin usage event
   */
  trackPluginUsage(pluginId: string, action: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.track(`plugin_${action}`, {
      plugin_id: pluginId,
      ...metadata
    });
  }

  /**
   * Track AI model usage
   */
  trackModelUsage(pluginId: string, model: string, messageCount: number = 1): void {
    if (!this.enabled) return;

    this.track('model_usage', {
      plugin_id: pluginId,
      model,
      message_count: messageCount
    });
  }

  /**
   * Track conversation events
   */
  trackConversation(action: 'created' | 'deleted' | 'exported', metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.track(`conversation_${action}`, metadata);
  }

  /**
   * Track feature usage
   */
  trackFeature(feature: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.track(`feature_${feature}`, metadata);
  }

  /**
   * Track error events
   */
  trackError(error: string, context?: Record<string, any>): void {
    if (!this.enabled) return;

    this.track('error', {
      error_message: error,
      ...context
    });
  }

  /**
   * Get usage metrics for display
   */
  getUsageMetrics(): UsageMetrics {
    const pluginUsage: Record<string, number> = {};
    const modelUsage: Record<string, number> = {};
    const featuresUsed: Set<string> = new Set();
    let conversationCount = 0;
    let messageCount = 0;

    this.events.forEach(event => {
      if (event.event.startsWith('plugin_') && event.plugin_id) {
        pluginUsage[event.plugin_id] = (pluginUsage[event.plugin_id] || 0) + 1;
      }
      
      if (event.event === 'model_usage' && event.model) {
        modelUsage[event.model] = (modelUsage[event.model] || 0) + (event.metadata?.message_count || 1);
        messageCount += event.metadata?.message_count || 1;
      }
      
      if (event.event === 'conversation_created') {
        conversationCount++;
      }
      
      if (event.event.startsWith('feature_')) {
        featuresUsed.add(event.event.replace('feature_', ''));
      }
    });

    return {
      plugin_usage: pluginUsage,
      model_usage: modelUsage,
      conversation_count: conversationCount,
      message_count: messageCount,
      session_duration: Date.now() - this.sessionStart,
      features_used: Array.from(featuresUsed)
    };
  }

  /**
   * Export analytics data for user review
   */
  exportData(): string {
    const data = {
      user_id: this.userId,
      session_id: this.sessionId,
      enabled: this.enabled,
      events: this.events,
      metrics: this.getUsageMetrics()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.events = [];
    localStorage.removeItem('ledebe-analytics-events');
    this.track('data_cleared');
  }

  private track(event: string, metadata?: Record<string, any>): void {
    if (!this.enabled && event !== 'analytics_enabled' && event !== 'analytics_disabled') {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
      ...metadata
    };

    this.events.push(analyticsEvent);
    this.saveEvents();

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    // Analytics disabled - just clear events
    this.events = [];
    this.saveEvents();
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // Analytics disabled - no-op
    return Promise.resolve();
  }

  private loadSettings(): void {
    const enabled = localStorage.getItem('ledebe-analytics-enabled');
    this.enabled = enabled === 'true';
    
    // Load saved events
    const savedEvents = localStorage.getItem('ledebe-analytics-events');
    if (savedEvents) {
      try {
        this.events = JSON.parse(savedEvents);
      } catch (error) {
        console.error('Failed to load saved analytics events:', error);
        this.events = [];
      }
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem('ledebe-analytics-events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save analytics events:', error);
    }
  }

  private startFlushTimer(): void {
    // Analytics disabled - no timer needed
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('ledebe-user-id');
    if (!userId) {
      userId = this.generateId();
      localStorage.setItem('ledebe-user-id', userId);
    }
    return userId;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Cleanup when app closes
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.destroy();
  });
}