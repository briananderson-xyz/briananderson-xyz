/**
 * Web Vitals tracking utility
 * Tracks Core Web Vitals and sends them to PostHog for analysis
 */

import { browser } from "$app/environment";
import posthog from "posthog-js";
import { PUBLIC_POSTHOG_KEY } from "$env/static/public";
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

/**
 * Send web vital metric to PostHog
 */
function sendToPostHog(metric: Metric): void {
  if (browser && PUBLIC_POSTHOG_KEY) {
    posthog.capture("web_vital", {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      metric_id: metric.id,
      navigation_type: metric.navigationType,
    });
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app initialization (e.g., in +layout.svelte)
 */
export function initWebVitals(): void {
  if (!browser) return;

  // Track all Core Web Vitals
  onCLS(sendToPostHog);
  onFCP(sendToPostHog);
  onFID(sendToPostHog);
  onINP(sendToPostHog);
  onLCP(sendToPostHog);
  onTTFB(sendToPostHog);
}
