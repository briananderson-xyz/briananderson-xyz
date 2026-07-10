#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  appendPublicEvalRun,
  normalizePrivateEvalReport,
  type PublicRunMetadata
} from "../src/lib/server/normalizeAiEvalHistory.ts";
import { parseAiEvalHistory } from "../src/lib/schemas/aiEvalHistory.ts";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for an opt-in public eval-history write`);
  return value;
}

const outputPath = path.resolve(required("AI_EVAL_PUBLIC_HISTORY_PATH"));
const metadata: PublicRunMetadata = {
  runId: required("AI_EVAL_PUBLIC_RUN_ID"),
  runDate: required("AI_EVAL_PUBLIC_RUN_DATE"),
  commit: required("AI_EVAL_PUBLIC_COMMIT"),
  environment: required("AI_EVAL_PUBLIC_ENVIRONMENT") as PublicRunMetadata["environment"]
};
const input = fs.readFileSync(0, "utf8");
const privateReport: unknown = JSON.parse(input);
const existing = fs.existsSync(outputPath)
  ? parseAiEvalHistory(JSON.parse(fs.readFileSync(outputPath, "utf8")))
  : { schemaVersion: 1 as const, status: "baseline-pending" as const, runs: [] };
const next = appendPublicEvalRun(existing, normalizePrivateEvalReport(privateReport, metadata));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`, { flag: "w" });
console.log(`Wrote sanitized public AI eval history to ${outputPath}`);
