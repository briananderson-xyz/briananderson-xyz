/**
 * PostHog analytics utility functions
 * Centralizes event tracking with proper browser and key checks
 */

import { browser } from '$app/environment';
import posthog from 'posthog-js';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

/**
 * Track an event if PostHog is configured and available
 * @param event - Event name to track
 * @param properties - Optional event properties
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}

/**
 * Identify a user in PostHog
 * @param userId - User identifier
 * @param properties - Optional user properties
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset the PostHog user identity (for logout)
 */
export function resetUser(): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    posthog.reset();
  }
}

/**
 * Check if PostHog tracking is available
 */
export function isTrackingAvailable(): boolean {
  return browser && !!PUBLIC_POSTHOG_KEY;
}
