import { describe, expect, it } from "vitest";
import { architectureStages } from "./architectureFlow";

describe("Trace One Answer architecture flow", () => {
  it("keeps the ordered production boundary explicit", () => {
    expect(architectureStages.map((stage) => stage.id)).toEqual([
      "browser",
      "edge",
      "origin",
      "retrieve",
      "answer",
      "return"
    ]);
    expect(new Set(architectureStages.map((stage) => stage.id)).size).toBe(
      architectureStages.length
    );
  });

  it("does not describe Cloudflare deployment state as repository-verified", () => {
    expect(architectureStages.find((stage) => stage.id === "edge")?.scope).toBe(
      "external-contract"
    );
  });

  it("names per-instance limiting, deterministic answers, CTA allowlisting, and sanitization", () => {
    const text = JSON.stringify(architectureStages);

    expect(text).toMatch(/per Cloud Run instance/i);
    expect(text).toMatch(/deterministically/i);
    expect(text).toMatch(/allowlists Fit Finder CTA links/i);
    expect(text).toMatch(/sanitized in the browser/i);
  });
});
