/**
 * PostHog analytics utility functions
 * Centralizes event tracking with proper browser and key checks
 */

import { browser } from "$app/environment";
import { withPostHog } from "./posthog-lazy";
import { PUBLIC_POSTHOG_KEY } from "$env/static/public";
import { safeAiEventProperties, type AiEventName } from "./aiAnalytics";

/**
 * Track an event if PostHog is configured and available
 * @param event - Event name to track
 * @param properties - Optional event properties
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    withPostHog((ph) => ph.capture(event, properties));
  }
}

export function trackAiEvent(event: AiEventName, properties: Record<string, unknown>): void {
  trackEvent(event, safeAiEventProperties(event, properties));
}

/**
 * Identify a user in PostHog
 * @param userId - User identifier
 * @param properties - Optional user properties
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    withPostHog((ph) => ph.identify(userId, properties));
  }
}

/**
 * Reset the PostHog user identity (for logout)
 */
export function resetUser(): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    withPostHog((ph) => ph.reset());
  }
}

/**
 * Check if PostHog tracking is available
 */
export function isTrackingAvailable(): boolean {
  return browser && !!PUBLIC_POSTHOG_KEY;
}
