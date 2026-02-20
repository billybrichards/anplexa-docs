/**
 * Analytics module for tracking user events
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

class Analytics {
  /**
   * Track a page view
   */
  trackPageView(path: string): void {
    this.track('page_view', { path });
  }

  /**
   * Track a generic event
   */
  track(eventName: string, properties?: Record<string, unknown>): void {
    // In a real implementation, this would send to analytics service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties);
    }
  }

  /**
   * Track API error
   */
  trackAPIError(endpoint: string, statusCode: number, message: string): void {
    this.track('api_error', { endpoint, statusCode, message });
  }

  /**
   * Track phase transition
   */
  trackPhaseTransition(from: string, to: string): void {
    this.track('phase_transition', { from, to });
  }

  /**
   * Track trait clicked
   */
  trackTraitClicked(
    id: string,
    name: string,
    category: string,
    strength: number
  ): void {
    this.track('trait_clicked', { id, name, category, strength });
  }

  /**
   * Track fallback mode used
   */
  trackFallbackModeUsed(reason: string): void {
    this.track('fallback_mode_used', { reason });
  }

  /**
   * Track companion generation started
   */
  trackCompanionGenerationStarted(userId: string): void {
    this.track('companion_generation_started', { userId });
  }
}

export const analytics = new Analytics();
