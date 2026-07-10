import {
  AiEvalHistorySchema,
  EvalRunSummarySchema,
  type AiEvalHistory,
  type EvalRunSummary
} from "$lib/schemas/aiEvalHistory";

interface PrivateEvalTest {
  scenarioId?: unknown;
  passed?: unknown;
  assertions?: unknown;
}

interface PrivateEvalConfig {
  path?: unknown;
  tests?: unknown;
}

interface PrivateEvalReport {
  configs?: unknown;
}

export interface PublicRunMetadata {
  runId: string;
  runDate: string;
  commit: string;
  environment: "local" | "ci" | "staging" | "production";
}

function suiteIdFromPath(value: unknown): string {
  if (typeof value !== "string") throw new Error("Eval suite path is required");
  const filename = value.split(/[\\/]/).pop() ?? "";
  const suiteId = filename.replace(/\.promptfoo\.ya?ml$/i, "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(suiteId)) throw new Error("Eval suite id is unsafe");
  return suiteId;
}

function isSkipped(test: PrivateEvalTest): boolean {
  if (!Array.isArray(test.assertions) || test.assertions.length === 0) return false;
  return test.assertions.every(
    (assertion) => typeof assertion === "object" && assertion !== null && assertion.skipped === true
  );
}

function passRate(passed: number, total: number): number {
  return total === 0 ? 0 : Number((passed / total).toFixed(4));
}

export function normalizePrivateEvalReport(
  raw: unknown,
  metadata: PublicRunMetadata
): EvalRunSummary {
  if (typeof raw !== "object" || raw === null)
    throw new Error("Private eval report must be an object");
  const configs = (raw as PrivateEvalReport).configs;
  if (!Array.isArray(configs) || configs.length === 0) {
    throw new Error("Private eval report must contain at least one suite");
  }

  const suites = configs.map((configValue) => {
    if (typeof configValue !== "object" || configValue === null) {
      throw new Error("Private eval suite must be an object");
    }
    const config = configValue as PrivateEvalConfig;
    if (!Array.isArray(config.tests) || config.tests.length === 0) {
      throw new Error("Private eval suite must contain at least one scenario");
    }

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const scenarioIds = config.tests.map((testValue) => {
      if (typeof testValue !== "object" || testValue === null) {
        throw new Error("Private eval scenario must be an object");
      }
      const test = testValue as PrivateEvalTest;
      if (typeof test.scenarioId !== "string") {
        throw new Error("Private eval scenario is missing its public id");
      }
      if (isSkipped(test)) skipped += 1;
      else if (test.passed === true) passed += 1;
      else failed += 1;
      return test.scenarioId;
    });
    const total = scenarioIds.length;
    return {
      suiteId: suiteIdFromPath(config.path),
      scenarioIds,
      counts: { passed, failed, skipped, total },
      passRate: passRate(passed, total)
    };
  });

  const counts = suites.reduce(
    (sum, suite) => ({
      passed: sum.passed + suite.counts.passed,
      failed: sum.failed + suite.counts.failed,
      skipped: sum.skipped + suite.counts.skipped,
      total: sum.total + suite.counts.total
    }),
    { passed: 0, failed: 0, skipped: 0, total: 0 }
  );

  // Construct from an allowlist. No private report field is spread into the public record.
  return EvalRunSummarySchema.parse({
    runId: metadata.runId,
    runDate: metadata.runDate,
    commit: metadata.commit,
    environment: metadata.environment,
    suites,
    counts,
    passRate: passRate(counts.passed, counts.total)
  });
}

export function appendPublicEvalRun(history: unknown, run: EvalRunSummary): AiEvalHistory {
  const current = AiEvalHistorySchema.parse(history);
  const runs = [...current.runs.filter((candidate) => candidate.runId !== run.runId), run].sort(
    (a, b) => a.runDate.localeCompare(b.runDate) || a.runId.localeCompare(b.runId)
  );
  return AiEvalHistorySchema.parse({ schemaVersion: 1, status: "available", runs });
}
