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

for (const kind of contentKinds) {
  const dir = path.join(contentRoot, kind);
  for (const filename of fs.readdirSync(dir).sort()) {
    if (!filename.endsWith(".md")) continue;
    const file = path.join(dir, filename);
    const raw = fs.readFileSync(file, "utf8");
    const frontmatterSource = raw.startsWith("---") ? (raw.split(/^---\s*$/m, 3)[1] ?? "") : "";
    for (const line of frontmatterSource.split(/\r?\n/)) {
      const match = /^(date|updated):\s*(.*)$/.exec(line);
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

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${count} Markdown files: frontmatter, links, and image alt text are valid.`);
