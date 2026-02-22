/**
 * Activity Logger — batched frontend event tracking
 *
 * Replaces the previous console-only Analytics stub with real event delivery.
 * Events are batched (flush every 5s or 20 events) and sent via POST /api/logs.
 * On page unload, remaining events are flushed via navigator.sendBeacon.
 */

interface QueuedEvent {
  eventType: string;
  eventName: string;
  sessionId: string;
  metadata?: string;
  referrer?: string;
}

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 20;
const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002')
  : '';
const ENDPOINT = `${API_BASE}/api/logs`;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('anplexa_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('anplexa_session_id', id);
  }
  return id;
}

class ActivityLogger {
  private queue: QueuedEvent[] = [];
  private sessionId = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = getSessionId();
      setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushBeacon();
        }
      });

      window.addEventListener('pagehide', () => {
        this.flushBeacon();
      });
    }
  }

  // ── Generic API ──────────────────────────────────────────────

  track(eventName: string, properties?: Record<string, unknown>): void {
    this.enqueue('custom', eventName, properties);
  }

  trackPageView(path: string): void {
    this.enqueue('page_view', path, { path });
  }

  trackAPIError(endpoint: string, statusCode: number, message: string): void {
    this.enqueue('error', `api_error:${endpoint}`, { endpoint, statusCode, message });
  }

  // ── Domain-specific helpers (backward-compatible) ────────────

  trackPhaseTransition(from: string, to: string): void {
    this.enqueue('navigation', `phase_transition:${from}->${to}`, { from, to });
  }

  trackTraitClicked(id: string, name: string, category: string, strength: number): void {
    this.enqueue('click', 'trait_clicked', { id, name, category, strength });
  }

  trackFallbackModeUsed(reason: string): void {
    this.enqueue('error', 'fallback_mode_used', { reason });
  }

  trackCompanionGenerationStarted(userId: string): void {
    this.enqueue('custom', 'companion_generation_started', { userId });
  }

  // ── API call tracking (used by api-client) ───────────────────

  trackApiCall(opts: {
    requestId: string;
    method: string;
    path: string;
    statusCode?: number;
    durationMs?: number;
    errorMessage?: string;
  }): void {
    this.queue.push({
      eventType: 'api_request',
      eventName: `${opts.method} ${opts.path}`,
      sessionId: this.sessionId,
      metadata: JSON.stringify({
        requestId: opts.requestId,
        method: opts.method,
        path: opts.path,
        statusCode: opts.statusCode,
        durationMs: opts.durationMs,
        errorMessage: opts.errorMessage,
      }),
    });

    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  // ── Internals ────────────────────────────────────────────────

  private enqueue(eventType: string, eventName: string, properties?: Record<string, unknown>): void {
    this.queue.push({
      eventType,
      eventName,
      sessionId: this.sessionId,
      metadata: properties ? JSON.stringify(properties) : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });

    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flush();
    }
  }

  flush(): void {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, MAX_BATCH_SIZE);
    const body = JSON.stringify({ events });

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {
      // Silently drop — logging should never break the app
    });
  }

  private flushBeacon(): void {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0);
    const body = JSON.stringify({ events });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    }
  }
}

const activityLogger = new ActivityLogger();

// Backward-compatible named export
export const analytics = activityLogger;

export { activityLogger };
