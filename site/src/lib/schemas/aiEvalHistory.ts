import { z } from "zod";

const PublicIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9._-]*$/, "must be a lowercase public identifier");

const ScenarioIdSchema = z
  .string()
  .regex(/^scenario-[0-9a-f]{12}$/, "must be an opaque scenario digest");

const CountSchema = z.number().int().nonnegative();

export const EvalCountsSchema = z
  .object({
    passed: CountSchema,
    failed: CountSchema,
    skipped: CountSchema,
    total: CountSchema
  })
  .strict()
  .superRefine((counts, ctx) => {
    if (counts.passed + counts.failed + counts.skipped !== counts.total) {
      ctx.addIssue({
        code: "custom",
        message: "passed, failed, and skipped must add up to total"
      });
    }
  });

export const EvalSuiteSummarySchema = z
  .object({
    suiteId: PublicIdentifierSchema,
    scenarioIds: z.array(ScenarioIdSchema).min(1),
    counts: EvalCountsSchema,
    passRate: z.number().min(0).max(1)
  })
  .strict()
  .superRefine((suite, ctx) => {
    if (new Set(suite.scenarioIds).size !== suite.scenarioIds.length) {
      ctx.addIssue({ code: "custom", path: ["scenarioIds"], message: "must be unique" });
    }
    if (suite.scenarioIds.length !== suite.counts.total) {
      ctx.addIssue({
        code: "custom",
        path: ["scenarioIds"],
        message: "must contain one id for every counted scenario"
      });
    }
    const expectedRate =
      suite.counts.total === 0 ? 0 : Number((suite.counts.passed / suite.counts.total).toFixed(4));
    if (suite.passRate !== expectedRate) {
      ctx.addIssue({ code: "custom", path: ["passRate"], message: "must match aggregate counts" });
    }
  });

export const EvalRunSummarySchema = z
  .object({
    runId: PublicIdentifierSchema,
    runDate: z.iso.date(),
    commit: z.string().regex(/^[0-9a-f]{7,40}$/, "must be a Git commit SHA"),
    environment: z.enum(["local", "ci", "staging", "production"]),
    suites: z.array(EvalSuiteSummarySchema).min(1),
    counts: EvalCountsSchema,
    passRate: z.number().min(0).max(1)
  })
  .strict()
  .superRefine((run, ctx) => {
    const suiteIds = run.suites.map((suite) => suite.suiteId);
    if (new Set(suiteIds).size !== suiteIds.length) {
      ctx.addIssue({ code: "custom", path: ["suites"], message: "suite ids must be unique" });
    }
    const totals = run.suites.reduce(
      (sum, suite) => ({
        passed: sum.passed + suite.counts.passed,
        failed: sum.failed + suite.counts.failed,
        skipped: sum.skipped + suite.counts.skipped,
        total: sum.total + suite.counts.total
      }),
      { passed: 0, failed: 0, skipped: 0, total: 0 }
    );
    if (JSON.stringify(totals) !== JSON.stringify(run.counts)) {
      ctx.addIssue({ code: "custom", path: ["counts"], message: "must equal suite totals" });
    }
    const expectedRate =
      run.counts.total === 0 ? 0 : Number((run.counts.passed / run.counts.total).toFixed(4));
    if (run.passRate !== expectedRate) {
      ctx.addIssue({ code: "custom", path: ["passRate"], message: "must match aggregate counts" });
    }
  });

export const AiEvalHistorySchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.enum(["baseline-pending", "available"]),
    runs: z.array(EvalRunSummarySchema)
  })
  .strict()
  .superRefine((history, ctx) => {
    if (history.status === "baseline-pending" && history.runs.length !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["runs"],
        message: "must be empty while baseline is pending"
      });
    }
    if (history.status === "available" && history.runs.length === 0) {
      ctx.addIssue({ code: "custom", path: ["runs"], message: "must contain a trustworthy run" });
    }
    const runIds = history.runs.map((run) => run.runId);
    if (new Set(runIds).size !== runIds.length) {
      ctx.addIssue({ code: "custom", path: ["runs"], message: "run ids must be unique" });
    }
  });

export type AiEvalHistory = z.infer<typeof AiEvalHistorySchema>;
export type EvalRunSummary = z.infer<typeof EvalRunSummarySchema>;

export function parseAiEvalHistory(value: unknown): AiEvalHistory {
  return AiEvalHistorySchema.parse(value);
}
