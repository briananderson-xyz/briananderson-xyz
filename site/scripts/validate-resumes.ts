#!/usr/bin/env node

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the schema from the project
let ResumeSchema;
try {
  const schemaModule = await import("../src/lib/schemas/resume.ts");
  ResumeSchema = schemaModule.ResumeSchema;
} catch (e) {
  console.error("Failed to import schema:", e);
  console.error("Make sure tsx is installed and the project has been built.");
  process.exit(1);
}

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function error(message: string) {
  log(`✗ ${message}`, "red");
}

function success(message: string) {
  log(`✓ ${message}`, "green");
}

function info(message: string) {
  log(`ℹ ${message}`, "blue");
}

function validateFile(filename: string): boolean {
  try {
    const filePath = path.resolve(__dirname, "..", "content", filename);

    if (!fs.existsSync(filePath)) {
      error(`File not found: ${filename}`);
      return false;
    }

    info(`Validating ${filename}...`);
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const data = yaml.load(fileContents);

    ResumeSchema.parse(data);
    success(`${filename} is valid.`);
    return true;
  } catch (e: any) {
    if (e.errors) {
      error(`${filename} validation failed:`);
      e.errors.forEach((err: any) => {
        log(`  - Path: ${err.path.join(".")} : ${err.message}`, "red");
      });
    } else {
      error(`${filename} error: ${e.message}`);
    }
    return false;
  }
}

function main() {
  info("\n=== Resume Schema Validation ===\n");

  const contentDir = path.resolve("content");
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  let allValid = true;

  // Explicitly check known files ensuring they exist
  const requiredFiles = ["resume.yaml"];

  requiredFiles.forEach((f) => {
    if (!validateFile(f)) allValid = false;
  });

  // Check all other resume-* files
  files.forEach((f) => {
    if (requiredFiles.includes(f)) return; // already checked
    if (f.startsWith("resume-")) {
      if (!validateFile(f)) allValid = false;
    }
  });

  if (allValid) {
    success("\nAll resume YAML files passed validation.");
    process.exit(0);
  } else {
    error("\nSome resume YAML files failed validation.");
    process.exit(1);
  }
}

main();
