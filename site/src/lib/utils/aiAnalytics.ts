export const AI_EVENT_PROPERTY_ALLOWLIST = {
  fit_finder_analyzed: [],
  fit_finder_completed: [],
  fit_finder_cta_clicked: [],
  fit_finder_resume_clicked: []
} as const;

export type AiEventName = keyof typeof AI_EVENT_PROPERTY_ALLOWLIST;

/**
 * AI telemetry intentionally records event occurrence only. Ignore every
 * supplied property, including future arbitrary keys, so request content,
 * model output, URLs, and derived metadata cannot cross this boundary.
 */
export function safeAiEventProperties(
  event: AiEventName,
  properties: Record<string, unknown>
): Record<string, unknown> {
  void event;
  void properties;
  return {};
}
