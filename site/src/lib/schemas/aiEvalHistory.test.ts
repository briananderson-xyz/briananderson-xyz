import { describe, expect, it } from "vitest";
import { AiEvalHistorySchema } from "./aiEvalHistory";
import {
  appendPublicEvalRun,
  normalizePrivateEvalReport
} from "$lib/server/normalizeAiEvalHistory";

const metadata = {
  runId: "ci-abc1234",
  runDate: "2026-07-09",
  commit: "abc1234",
  environment: "ci" as const
};

const privateReport = {
  endpointBaseUrl: "https://private.example",
  generatedAt: "2026-07-09T12:34:56Z",
  judgeModel: "private-model",
  configs: [
    {
      path: "ai-evals/chat.promptfoo.yaml",
      tests: [
        {
          scenarioId: "scenario-a1b2c3d4e5f6",
          description: "private prompt description",
          passed: true,
          output: "private model answer",
          assertions: [{ type: "llm-rubric", ok: true, reason: "private judge text" }]
        },
        {
          scenarioId: "scenario-0f1e2d3c4b5a",
          description: "another private description",
          passed: false,
          error: "private failure details"
        }
      ]
    }
  ]
};

describe("public AI eval history", () => {
  it("normalizes private reports through a strict aggregate allowlist", () => {
    const run = normalizePrivateEvalReport(privateReport, metadata);
    const serialized = JSON.stringify(run);

    expect(run.counts).toEqual({ passed: 1, failed: 1, skipped: 0, total: 2 });
    expect(run.passRate).toBe(0.5);
    expect(serialized).not.toMatch(/private|prompt|answer|judge|endpoint|model|description|error/i);
  });

  it("rejects forbidden or unknown fields in a public artifact", () => {
    const run = normalizePrivateEvalReport(privateReport, metadata);
    expect(
      AiEvalHistorySchema.safeParse({
        schemaVersion: 1,
        status: "available",
        runs: [{ ...run, prompt: "leak" }]
      }).success
    ).toBe(false);
  });

  it("rejects semantic scenario labels that could carry private text", () => {
    expect(() =>
      normalizePrivateEvalReport(
        {
          configs: [
            {
              path: "ai-evals/chat.promptfoo.yaml",
              tests: [{ scenarioId: "prompt-with-secret-answer", passed: true }]
            }
          ]
        },
        metadata
      )
    ).toThrow(/opaque scenario digest/);
  });

  it("keeps an honest empty baseline until a real normalized run exists", () => {
    const pending = AiEvalHistorySchema.parse({
      schemaVersion: 1,
      status: "baseline-pending",
      runs: []
    });
    expect(pending.runs).toHaveLength(0);

    const run = normalizePrivateEvalReport(privateReport, metadata);
    expect(appendPublicEvalRun(pending, run).status).toBe("available");
  });

  it("rejects inconsistent aggregate counts", () => {
    const run = normalizePrivateEvalReport(privateReport, metadata);
    expect(
      AiEvalHistorySchema.safeParse({
        schemaVersion: 1,
        status: "available",
        runs: [{ ...run, counts: { ...run.counts, passed: 2 } }]
      }).success
    ).toBe(false);
  });
});
