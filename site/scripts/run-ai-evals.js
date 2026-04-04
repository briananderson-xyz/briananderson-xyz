#!/usr/bin/env node

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const reportPath = process.env.AI_EVAL_REPORT_PATH;

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

function renderTemplate(template, vars) {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => String(vars[key] ?? ""));
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

  const tests = [];
  for (const testCase of config.tests || []) {
    total++;
    try {
      const vars = testCase.vars || {};
      const prompt = renderTemplate(promptTemplate, vars);
      const result = await provider.callApi(prompt, { vars });
      const output = result?.output ?? "";

      let assertionsPassed = true;
      for (const assertion of testCase.assert || []) {
        if (assertion.type !== "javascript") {
          throw new Error(`Unsupported assertion type: ${assertion.type}`);
        }

        const fn = new Function("output", "context", assertion.value);
        const ok = Boolean(fn(output, { vars, testCase }));
        if (!ok) {
          assertionsPassed = false;
          break;
        }
      }

      if (assertionsPassed) {
        success(`${path.basename(configPath)} :: ${testCase.description}`);
        passed++;
        tests.push({
          config: path.basename(configPath),
          description: testCase.description,
          passed: true,
        });
      } else {
        error(`${path.basename(configPath)} :: ${testCase.description}`);
        tests.push({
          config: path.basename(configPath),
          description: testCase.description,
          passed: false,
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

  return { passed, total, tests };
}

async function main() {
  const configs = process.argv.slice(2);
  if (configs.length === 0) {
    console.error("Usage: node scripts/run-ai-evals.js <config1> <config2> ...");
    process.exit(1);
  }

  info("Running AI eval configs");

  let totalPassed = 0;
  let totalTests = 0;
  const report = {
    endpointBaseUrl: process.env.AI_EVAL_BASE_URL || "https://api.briananderson.xyz",
    generatedAt: new Date().toISOString(),
    configs: [],
  };

  for (const configPath of configs) {
    const result = await runConfig(configPath);
    totalPassed += result.passed;
    totalTests += result.total;
    report.configs.push({
      path: configPath,
      passed: result.passed,
      total: result.total,
      tests: result.tests,
    });
  }

  info(`AI eval summary: ${totalPassed}/${totalTests}`);
  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          ...report,
          passed: totalPassed,
          total: totalTests,
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
