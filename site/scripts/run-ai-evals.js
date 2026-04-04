#!/usr/bin/env node

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { createRequire } from "module";
import { spawnSync } from "child_process";

const require = createRequire(import.meta.url);
const reportPath = process.env.AI_EVAL_REPORT_PATH;
const judgeProvider = process.env.AI_EVAL_JUDGE_PROVIDER;
const judgeModel = process.env.AI_EVAL_JUDGE_MODEL || null;

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function success(message) {
  log(`✓ ${message}`, "green");
}

function error(message) {
  log(`✗ ${message}`, "red");
}

function info(message) {
  log(`ℹ ${message}`, "blue");
}

function warn(message) {
  log(`⚠ ${message}`, "yellow");
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => String(vars[key] ?? ""));
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    return "{}";
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

function parseJudgeOutput(text) {
  const parsed = JSON.parse(extractJsonObject(text));
  const normalized = parsed?.structured_output && typeof parsed.structured_output === "object"
    ? parsed.structured_output
    : parsed;
  return {
    pass: Boolean(normalized.pass),
    score: Number(normalized.score),
    summary: String(normalized.summary || "").trim(),
  };
}

function evaluateJudgeResult(assertion, judgment) {
  const minScore = Number(assertion.threshold ?? assertion.minScore ?? 0);
  const scoreOk = Number.isFinite(minScore) ? judgment.score >= minScore : true;
  return {
    ok: judgment.pass && scoreOk,
    minScore,
  };
}

function appendStepSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath || !Array.isArray(lines) || lines.length === 0) {
    return;
  }

  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function loadProvider(providerRef, configDir) {
  if (!providerRef.startsWith("file://")) {
    throw new Error(`Unsupported provider reference: ${providerRef}`);
  }

  const relPath = providerRef.replace("file://", "");
  const providerPath = path.resolve(configDir, relPath);
  const Provider = require(providerPath);
  return new Provider({ id: relPath });
}

function hasJudgeConfig() {
  if (judgeProvider === "codex") {
    return true;
  }

  if (judgeProvider === "claude") {
    return true;
  }

  if (judgeProvider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY && process.env.AI_EVAL_JUDGE_MODEL);
  }

  if (judgeProvider === "anthropic") {
    return Boolean(process.env.ANTHROPIC_API_KEY && process.env.AI_EVAL_JUDGE_MODEL);
  }

  return false;
}

async function runJudgeAssertion(assertion, context) {
  if (!judgeProvider || !hasJudgeConfig()) {
    return {
      ok: true,
      skipped: true,
      reason: "Judge assertion skipped because judge credentials/config are not set.",
    };
  }

  const rubric = assertion.rubric || "Evaluate the response for quality, groundedness, and usefulness.";
  const prompt = [
    "You are grading an AI response against a rubric.",
    "Return JSON only with keys: pass, score, summary.",
    `Rubric:\n${rubric}`,
    `User prompt:\n${context.prompt}`,
    `AI response:\n${context.output}`,
  ].join("\n\n");

  if (judgeProvider === "openai") {
    const response = await fetch(
      process.env.AI_EVAL_JUDGE_BASE_URL || "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_EVAL_JUDGE_MODEL,
          input: prompt,
          text: {
            format: {
              type: "json_schema",
              name: "eval_judgment",
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  pass: { type: "boolean" },
                  score: { type: "number" },
                  summary: { type: "string" },
                },
                required: ["pass", "score", "summary"],
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI judge request failed with status ${response.status}`);
    }

    const data = await response.json();
    const outputText = data.output_text || "{}";
    const parsed = parseJudgeOutput(outputText);
    const evaluated = evaluateJudgeResult(assertion, parsed);
    return {
      ok: evaluated.ok,
      skipped: false,
      reason: parsed.summary,
      score: parsed.score,
      minScore: evaluated.minScore,
    };
  }

  if (judgeProvider === "anthropic") {
    const response = await fetch(
      process.env.AI_EVAL_JUDGE_BASE_URL || "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.AI_EVAL_JUDGE_MODEL,
          max_tokens: 300,
          system:
            "You grade AI responses. Return JSON only with keys pass, score, summary.",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Anthropic judge request failed with status ${response.status}`);
    }

    const data = await response.json();
    const outputText = data.content?.[0]?.text || "{}";
    const parsed = parseJudgeOutput(outputText);
    const evaluated = evaluateJudgeResult(assertion, parsed);
    return {
      ok: evaluated.ok,
      skipped: false,
      reason: parsed.summary,
      score: parsed.score,
      minScore: evaluated.minScore,
    };
  }

  if (judgeProvider === "codex") {
    const schemaPath = path.join("/tmp", `codex-judge-schema-${process.pid}.json`);
    const outputPath = path.join("/tmp", `codex-judge-output-${process.pid}.json`);
    fs.writeFileSync(
      schemaPath,
      JSON.stringify({
        type: "object",
        additionalProperties: false,
        properties: {
          pass: { type: "boolean" },
          score: { type: "number" },
          summary: { type: "string" },
        },
        required: ["pass", "score", "summary"],
      })
    );

    const result = spawnSync(
      "codex",
      [
        "exec",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--color",
        "never",
        "--output-schema",
        schemaPath,
        "--output-last-message",
        outputPath,
        prompt,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      }
    );

    if (result.status !== 0) {
      throw new Error(
        `Codex judge failed with status ${result.status}: ${(result.stderr || result.stdout || "").trim()}`
      );
    }

    const outputText = fs.readFileSync(outputPath, "utf-8");
    const parsed = parseJudgeOutput(outputText);
    const evaluated = evaluateJudgeResult(assertion, parsed);
    return {
      ok: evaluated.ok,
      skipped: false,
      reason: parsed.summary,
      score: parsed.score,
      minScore: evaluated.minScore,
    };
  }

  if (judgeProvider === "claude") {
    const schema = JSON.stringify({
      type: "object",
      additionalProperties: false,
      properties: {
        pass: { type: "boolean" },
        score: { type: "number" },
        summary: { type: "string" },
      },
      required: ["pass", "score", "summary"],
    });

    const result = spawnSync(
      "claude",
      [
        "--print",
        "--output-format",
        "json",
        "--json-schema",
        schema,
        "--permission-mode",
        "dontAsk",
        "--system-prompt",
        "You grade AI responses. Return only the requested JSON object.",
        prompt,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      }
    );

    if (result.status !== 0) {
      throw new Error(
        `Claude judge failed with status ${result.status}: ${(result.stderr || result.stdout || "").trim()}`
      );
    }

    const parsed = parseJudgeOutput(result.stdout);
    const evaluated = evaluateJudgeResult(assertion, parsed);
    return {
      ok: evaluated.ok,
      skipped: false,
      reason: parsed.summary,
      score: parsed.score,
      minScore: evaluated.minScore,
    };
  }

  throw new Error(`Unsupported judge provider: ${judgeProvider}`);
}

async function runConfig(configPath) {
  const fullPath = path.resolve(configPath);
  const configDir = path.dirname(fullPath);
  const config = yaml.load(fs.readFileSync(fullPath, "utf-8"));

  if (!config.providers || config.providers.length !== 1) {
    throw new Error(`${configPath} must define exactly one provider`);
  }

  const provider = loadProvider(config.providers[0], configDir);
  const promptTemplate = Array.isArray(config.prompts) ? config.prompts[0] : config.prompts;

  let passed = 0;
  let total = 0;
  let hardPassed = 0;
  let hardTotal = 0;
  let judgePassed = 0;
  let judgeTotal = 0;
  let judgeSkipped = 0;

  const tests = [];
  for (const testCase of config.tests || []) {
    total++;
    try {
      const vars = testCase.vars || {};
      const prompt = renderTemplate(promptTemplate, vars);
      const result = await provider.callApi(prompt, { vars });
      const output = result?.output ?? "";

      let assertionsPassed = true;
      let skipCount = 0;
      const assertionDetails = [];
      for (const assertion of testCase.assert || []) {
        if (assertion.type === "javascript") {
          hardTotal++;
          const fn = new Function("output", "context", assertion.value);
          const ok = Boolean(fn(output, { vars, testCase, prompt }));
          assertionDetails.push({ type: assertion.type, ok });
          if (ok) {
            hardPassed++;
          }
          if (!ok) {
            assertionsPassed = false;
            break;
          }
          continue;
        }

        if (assertion.type === "llm-rubric") {
          judgeTotal++;
          const judgment = await runJudgeAssertion(assertion, {
            vars,
            testCase,
            prompt,
            output,
          });
          if (judgment.skipped) {
            skipCount++;
            judgeSkipped++;
            assertionDetails.push({ type: assertion.type, skipped: true, reason: judgment.reason });
            continue;
          }
          if (judgment.ok) {
            judgePassed++;
          }
          assertionDetails.push({
            type: assertion.type,
            ok: judgment.ok,
            reason: judgment.reason,
            score: judgment.score,
            minScore: judgment.minScore,
          });
          if (!judgment.ok) {
            assertionsPassed = false;
            break;
          }
          continue;
        }

        throw new Error(`Unsupported assertion type: ${assertion.type}`);
      }

      if (assertionsPassed) {
        success(`${path.basename(configPath)} :: ${testCase.description}`);
        if (skipCount > 0) {
          warn(`${path.basename(configPath)} :: skipped ${skipCount} judge assertion(s)`);
        }
        passed++;
        tests.push({
          config: path.basename(configPath),
          description: testCase.description,
          passed: true,
          assertions: assertionDetails,
        });
      } else {
        error(`${path.basename(configPath)} :: ${testCase.description}`);
        tests.push({
          config: path.basename(configPath),
          description: testCase.description,
          passed: false,
          assertions: assertionDetails,
        });
      }
    } catch (err) {
      error(`${path.basename(configPath)} :: ${testCase.description}`);
      error(err instanceof Error ? err.message : String(err));
      tests.push({
        config: path.basename(configPath),
description: testCase.description,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    passed,
    total,
    tests,
    hardPassed,
    hardTotal,
    judgePassed,
    judgeTotal,
    judgeSkipped,
  };
}

async function main() {
  const configs = process.argv.slice(2);
  if (configs.length === 0) {
    console.error("Usage: node scripts/run-ai-evals.js <config1> <config2> ...");
    process.exit(1);
  }

  info("Running AI eval configs");
  if (judgeProvider && !hasJudgeConfig()) {
    warn(`Judge provider "${judgeProvider}" configured without required credentials/model. Judge assertions will be skipped.`);
  }

  let totalPassed = 0;
  let totalTests = 0;
  let totalHardPassed = 0;
  let totalHardTests = 0;
  let totalJudgePassed = 0;
  let totalJudgeTests = 0;
  let totalJudgeSkipped = 0;
  const report = {
    endpointBaseUrl: process.env.AI_EVAL_BASE_URL || "https://api.briananderson.xyz",
    generatedAt: new Date().toISOString(),
    judgeProvider: judgeProvider || null,
    judgeModel,
    judgeEnabled: Boolean(judgeProvider && hasJudgeConfig()),
    configs: [],
  };

  for (const configPath of configs) {
    const result = await runConfig(configPath);
    totalPassed += result.passed;
    totalTests += result.total;
    totalHardPassed += result.hardPassed;
    totalHardTests += result.hardTotal;
    totalJudgePassed += result.judgePassed;
    totalJudgeTests += result.judgeTotal;
    totalJudgeSkipped += result.judgeSkipped;
    report.configs.push({
      path: configPath,
      passed: result.passed,
      total: result.total,
      hardPassed: result.hardPassed,
      hardTotal: result.hardTotal,
      judgePassed: result.judgePassed,
      judgeTotal: result.judgeTotal,
      judgeSkipped: result.judgeSkipped,
      tests: result.tests,
    });
  }

  info(`AI eval summary: ${totalPassed}/${totalTests}`);
  info(`Hard checks: ${totalHardPassed}/${totalHardTests}`);
  if (totalJudgeTests > 0 || totalJudgeSkipped > 0) {
    info(`Judge checks: ${totalJudgePassed}/${totalJudgeTests} passed, ${totalJudgeSkipped} skipped`);
  }

  appendStepSummary([
    "## AI Eval Summary",
    `- Endpoint base URL: \`${report.endpointBaseUrl}\``,
    `- Hard checks: \`${totalHardPassed}/${totalHardTests}\``,
    `- Judge checks: \`${totalJudgePassed}/${totalJudgeTests}\` passed, \`${totalJudgeSkipped}\` skipped`,
    `- Judge provider: \`${judgeProvider || "none"}\``,
    `- Judge model: \`${judgeModel || "none"}\``,
  ]);

  for (const config of report.configs) {
    const failingTests = config.tests.filter((test) => !test.passed);
    if (failingTests.length === 0) {
      continue;
    }

    appendStepSummary([
      `### ${path.basename(config.path)}`,
      ...failingTests.map((test) => `- Failed: ${test.description}${test.error ? ` — ${test.error}` : ""}`),
    ]);
  }

  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          ...report,
          passed: totalPassed,
          total: totalTests,
          summary: {
            hardPassed: totalHardPassed,
            hardTotal: totalHardTests,
            judgePassed: totalJudgePassed,
            judgeTotal: totalJudgeTests,
            judgeSkipped: totalJudgeSkipped,
          },
        },
        null,
        2
      )
    );
    info(`Wrote AI eval report to ${reportPath}`);
  }
  process.exit(totalPassed === totalTests ? 0 : 1);
}

main();
