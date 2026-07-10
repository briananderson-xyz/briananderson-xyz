import { describe, expect, it } from "vitest";
import { AI_EVENT_PROPERTY_ALLOWLIST, safeAiEventProperties } from "./aiAnalytics";
import { POSTHOG_PRIVACY_CONFIG } from "./posthog-lazy";

describe("AI analytics privacy", () => {
  it("disables DOM text capture and session replay locally", () => {
    expect(POSTHOG_PRIVACY_CONFIG).toMatchObject({
      autocapture: false,
      rageclick: false,
      disable_session_recording: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
      capture_exceptions: false,
      session_recording: { maskAllInputs: true }
    });
  });

  it.each(
    Object.keys(AI_EVENT_PROPERTY_ALLOWLIST) as Array<keyof typeof AI_EVENT_PROPERTY_ALLOWLIST>
  )("%s drops every supplied property", (event) => {
    expect(
      safeAiEventProperties(event, {
        jobDescription: "confidential role text",
        prompt: "private prompt",
        response: "private response",
        analysis: "private model output",
        modelOutput: { score: 91 },
        jdLength: 1234,
        fitScore: 91,
        confidence: "high",
        recommendedVariant: "builder",
        variant: "ops",
        linkType: "email",
        url: "https://example.com/private?q=secret",
        queryString: "?q=secret",
        arbitraryFutureKey: "must not escape"
      })
    ).toEqual({});
  });

  it("declares no properties for any AI event", () => {
    expect(
      Object.values(AI_EVENT_PROPERTY_ALLOWLIST).every((properties) => properties.length === 0)
    ).toBe(true);
  });
});
