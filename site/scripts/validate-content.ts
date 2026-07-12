#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { isExactAuthoredDateLiteral, parseContentMetadata } from "../src/lib/schemas/content.ts";

const contentRoot = path.resolve("content");
const contentKinds = ["blog", "projects"] as const;
const knownContentRoutes = new Set<string>();

for (const kind of contentKinds) {
  for (const file of fs.readdirSync(path.join(contentRoot, kind)).sort()) {
    if (file.endsWith(".md")) knownContentRoutes.add(`/${kind}/${file.replace(/\.md$/, "")}/`);
  }
}

function validDestination(destination: string): boolean {
  if (destination.startsWith("#")) return true;
  if (destination.startsWith("/")) {
    if (destination.startsWith("/blog/") || destination.startsWith("/projects/")) {
      return knownContentRoutes.has(destination.split(/[?#]/)[0]);
    }
    return true;
  }
  try {
    const url = new URL(destination);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const errors: string[] = [];
let count = 0;

function readRepoText(relativePath: string): string {
  return fs.readFileSync(path.resolve(relativePath), "utf8");
}

function requireEditorialPattern(
  file: string,
  value: string,
  pattern: RegExp,
  message: string
): void {
  if (!pattern.test(value)) errors.push(`${file}: ${message}`);
}

function forbidEditorialPattern(
  file: string,
  value: string,
  pattern: RegExp,
  message: string
): void {
  if (pattern.test(value)) errors.push(`${file}: ${message}`);
}

for (const kind of contentKinds) {
  const dir = path.join(contentRoot, kind);
  for (const filename of fs.readdirSync(dir).sort()) {
    if (!filename.endsWith(".md")) continue;
    const file = path.join(dir, filename);
    const raw = fs.readFileSync(file, "utf8");
    const frontmatterSource = raw.startsWith("---") ? (raw.split(/^---\s*$/m, 3)[1] ?? "") : "";
    for (const line of frontmatterSource.split(/\r?\n/)) {
      const match = /^(date|updated|projectDate):\s*(.*)$/.exec(line);
      if (match && !isExactAuthoredDateLiteral(match[2])) {
        errors.push(`${file}:${match[1]}: must use an exact YYYY-MM-DD YAML scalar`);
      }
    }
    const parsed = matter(raw);
    try {
      parseContentMetadata(parsed.data, file);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${file}: ${String(error)}`);
    }

    for (const match of parsed.content.matchAll(
      /!\[([^\]]*)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g
    )) {
      if (!match[1].trim()) errors.push(`${file}: image ${match[2]} must have nonempty alt text`);
      if (!validDestination(match[2]))
        errors.push(`${file}: invalid image destination ${match[2]}`);
    }

    for (const match of parsed.content.matchAll(
      /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g
    )) {
      if (!validDestination(match[1])) errors.push(`${file}: invalid link destination ${match[1]}`);
    }
    count++;
  }
}

// High-risk editorial corrections are deliberate product constraints. Keep these checks close to the
// content validator so generated indexes cannot silently restore the old claims.
for (const file of [
  "content/projects/boo-agent-scheduler.md",
  "content/blog/scheduling-agents-on-laptops-that-sleep.md"
]) {
  const introduction = readRepoText(file).split("\n## ", 1)[0];
  requireEditorialPattern(file, introduction, /OpenClaw/i, "prominent copy must credit OpenClaw");
  requireEditorialPattern(
    file,
    introduction,
    /inspir(?:ed|ation)/i,
    "prominent copy must describe OpenClaw as inspiration"
  );
}

for (const file of [
  "content/blog/proveit-industrial-agents.md",
  "content/projects/proveit-industrial-ai.md"
]) {
  const text = readRepoText(file);
  requireEditorialPattern(file, text, /one-time/i, "ProveIT must remain a bounded one-time event");
  requireEditorialPattern(file, text, /simulated/i, "ProveIT must identify simulated scenarios");
  requireEditorialPattern(
    file,
    text,
    /not (?:a )?production/i,
    "ProveIT must explicitly reject production-deployment implications"
  );
  requireEditorialPattern(
    file,
    text,
    /Concept Reply/i,
    "ProveIT must retain collaborator attribution"
  );
}

for (const file of [
  "content/resume.yaml",
  "content/resume-ops.yaml",
  "content/resume-builder.yaml"
]) {
  const proveItHighlight = readRepoText(file)
    .split(/\r?\n/)
    .find((line) => /ProveIT/i.test(line));
  requireEditorialPattern(
    file,
    proveItHighlight ?? "",
    /Helped build/i,
    "resume must use collaborative authorship"
  );
  requireEditorialPattern(
    file,
    proveItHighlight ?? "",
    /one-time/i,
    "resume must bound ProveIT to one event"
  );
  requireEditorialPattern(
    file,
    proveItHighlight ?? "",
    /simulated/i,
    "resume must identify simulated data"
  );
}

forbidEditorialPattern(
  "content/now.yaml",
  readRepoText("content/now.yaml"),
  /ProveIT/i,
  "current-focus copy must not infer ProveIT as ongoing work"
);

const proveItCorpus = [
  "content/blog/proveit-industrial-agents.md",
  "content/projects/proveit-industrial-ai.md",
  "content/resume.yaml",
  "content/resume-ops.yaml",
  "content/resume-builder.yaml",
  "content/now.yaml"
];
for (const file of proveItCorpus) {
  forbidEditorialPattern(
    file,
    readRepoText(file),
    /my attempt to build the whole loop|real-time plant data|production line status|files work orders/i,
    "contains a retired ProveIT production or sole-authorship claim"
  );
}

for (const file of [
  "content/projects/mqtt-recorder.md",
  "content/blog/building-an-mqtt-dvr-in-rust.md"
]) {
  const text = readRepoText(file);
  const summary = /^summary:\s*["']?([^\n"']+)/m.exec(text)?.[1] ?? "";
  requireEditorialPattern(
    file,
    summary,
    /generic/i,
    "MQTT Recorder summary must lead with its generic contract"
  );
  requireEditorialPattern(
    file,
    text,
    /arbitrary MQTT/i,
    "MQTT Recorder must support arbitrary MQTT inputs"
  );
  forbidEditorialPattern(
    file,
    summary,
    /support tooling for ProveIT|ProveIT-specific/i,
    "MQTT Recorder must not be framed as ProveIT-specific"
  );
}

for (const file of [
  "content/projects/kiro-agent-workflows.md",
  "content/resume.yaml",
  "content/resume-ops.yaml",
  "content/resume-builder.yaml",
  "content/proof-ledger.yaml"
]) {
  const text = readRepoText(file);
  forbidEditorialPattern(
    file,
    text,
    /280k|internal Kiro CLI (?:users|usage)/i,
    "Kiro usage must not publish the retired denominator or internal-only wording"
  );
  requireEditorialPattern(
    file,
    text,
    /Top 0\.03% of global Kiro CLI usage, as of April 2026/i,
    "Kiro usage must retain the sourced percentile, global scope, and April 2026 snapshot"
  );
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${count} Markdown files: frontmatter, links, and image alt text are valid.`);
