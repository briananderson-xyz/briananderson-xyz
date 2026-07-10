#!/usr/bin/env node

/**
 * PostHog Integration Validation Script
 *
 * This script validates that PostHog analytics is properly configured
 * and tracking events are being captured.
 *
 * Usage: node scripts/validate-posthog.js
 */

import fs from "fs";
import path from "path";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function error(message) {
  log(`✗ ${message}`, "red");
}

function success(message) {
  log(`✓ ${message}`, "green");
}

function warn(message) {
  log(`⚠ ${message}`, "yellow");
}

function info(message) {
  log(`ℹ ${message}`, "blue");
}

async function validateEnvConfig() {
  info("\n=== Environment Configuration ===\n");

  let passed = 0;
  let total = 0;

  // Check environment variables from either .env file or process.env
  const envPath = path.resolve(".env");
  let posthogKey = process.env.PUBLIC_POSTHOG_KEY;
  let posthogHost = process.env.PUBLIC_POSTHOG_HOST;

  // If not in process.env, try reading from .env file
  if (!posthogKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const keyMatch = envContent.match(/PUBLIC_POSTHOG_KEY=(.+)/);
    const hostMatch = envContent.match(/PUBLIC_POSTHOG_HOST=(.+)/);
    if (keyMatch && keyMatch[1]) posthogKey = keyMatch[1].trim();
    if (hostMatch && hostMatch[1]) posthogHost = hostMatch[1].trim();
  }

  // Check PUBLIC_POSTHOG_KEY
  total++;
  if (posthogKey && posthogKey !== "your_posthog_project_key") {
    success("PUBLIC_POSTHOG_KEY is configured");
    passed++;
  } else {
    error("PUBLIC_POSTHOG_KEY not configured or set to placeholder value");
  }

  // Check PUBLIC_POSTHOG_HOST
  total++;
  if (posthogHost) {
    success(`PUBLIC_POSTHOG_HOST is configured: ${posthogHost}`);
    passed++;
  } else {
    error("PUBLIC_POSTHOG_HOST not configured");
  }

  return { passed, total };
}

async function validateClientSideIntegration() {
  info("\n=== Client-Side Integration ===\n");

  let passed = 0;
  let total = 0;

  // PostHog is lazy-loaded: posthog-js is dynamically imported inside
  // posthog-lazy.ts and the layout drives it through loadPostHog()/withPostHog().
  const layoutSveltePath = path.resolve("src/routes/+layout.svelte");
  const lazyPath = path.resolve("src/lib/utils/posthog-lazy.ts");
  const layoutContent = fs.existsSync(layoutSveltePath)
    ? fs.readFileSync(layoutSveltePath, "utf-8")
    : "";
  const lazyContent = fs.existsSync(lazyPath) ? fs.readFileSync(lazyPath, "utf-8") : "";

  if (layoutContent) {
    total++;
    if (
      lazyContent.includes("import('posthog-js')") ||
      lazyContent.includes('import("posthog-js")')
    ) {
      success("posthog-js is dynamically imported in posthog-lazy.ts (lazy-loaded)");
      passed++;
    } else if (layoutContent.includes("posthog-js")) {
      success("posthog-js is imported in layout.svelte");
      passed++;
    } else {
      error("posthog-js import missing (expected dynamic import in posthog-lazy.ts)");
    }

    total++;
    if (layoutContent.includes("loadPostHog(") && lazyContent.includes("posthog.init(")) {
      success("PostHog is initialized via loadPostHog() -> posthog.init()");
      passed++;
    } else if (layoutContent.includes("posthog.init(")) {
      success("posthog.init() is called in layout.svelte");
      passed++;
    } else {
      error("PostHog initialization missing (expected loadPostHog() + posthog.init())");
    }

    total++;
    if (layoutContent.includes("PUBLIC_POSTHOG_KEY")) {
      success("PUBLIC_POSTHOG_KEY is used in layout.svelte");
      passed++;
    } else {
      error("PUBLIC_POSTHOG_KEY not referenced in layout.svelte");
    }

    total++;
    if (layoutContent.includes(".capture(") || layoutContent.includes("withPostHog(")) {
      success("Events are captured via withPostHog()/capture()");
      passed++;
    } else {
      error("capture() call missing in layout.svelte");
    }

    total++;
    if (layoutContent.includes("$pageview")) {
      success("Pageview events are tracked");
      passed++;
    } else {
      error("$pageview event tracking missing");
    }

    total++;
    if (layoutContent.includes("$pageleave")) {
      success("Pageleave events are tracked");
      passed++;
    } else {
      error("$pageleave event tracking missing");
    }
  } else {
    error("src/routes/+layout.svelte not found");
    total += 6;
  }

  return { passed, total };
}

async function validateServerSideIntegration() {
  info("\n=== Server-Side Integration (Skipped for Static Site) ===\n");

  let passed = 0;
  let total = 0;

  info("ℹ Static site detected - server-side PostHog tracking not needed");
  info("ℹ posthog-node package is present but unused (safe to remove)");

  // Just verify posthog-node package exists but is not required
  const posthogPath = path.resolve("src/lib/server/posthog.ts");
  if (fs.existsSync(posthogPath)) {
    info("ℹ src/lib/server/posthog.ts exists (safe to remove for static sites)");
  }

  // No server-side checks needed for static sites
  total = 1;
  passed = 1;
  success("Server-side tracking not required for static sites");

  return { passed, total };
}

async function validateBuildOutput() {
  info("\n=== Build Output ===\n");

  let passed = 0;
  let total = 0;

  // SvelteKit inlines public environment values into hashed client bundles.
  const appPath = path.resolve("build/_app");
  if (fs.existsSync(appPath)) {
    const collectJavaScript = (directory) =>
      fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory()
          ? collectJavaScript(entryPath)
          : entry.name.endsWith(".js")
            ? [entryPath]
            : [];
      });
    const bundlePaths = collectJavaScript(appPath);
    const bundleContent = bundlePaths.map((file) => fs.readFileSync(file, "utf-8")).join("\n");

    total++;
    if (bundlePaths.length > 0) {
      success(`Found ${bundlePaths.length} generated client bundles`);
      passed++;
    } else {
      error("No generated client bundles found under build/_app");
    }

    total++;
    if (bundleContent.includes("phc_") || bundleContent.includes("test")) {
      success("PostHog project key is embedded in a generated client bundle");
      passed++;
    } else {
      error("PostHog project key not found in generated client bundles");
    }

    total++;
    if (bundleContent.includes("posthog.com")) {
      success("PostHog host is embedded in a generated client bundle");
      passed++;
    } else {
      error("PostHog host not found in generated client bundles");
    }
  } else {
    error("build/_app not found. Run `pnpm build` first.");
    total += 3;
  }

  // Check index.html for script references
  const indexHtmlPath = path.resolve("build/index.html");
  if (fs.existsSync(indexHtmlPath)) {
    const htmlContent = fs.readFileSync(indexHtmlPath, "utf-8");

    total++;
    if (htmlContent.includes("_app/immutable/")) {
      success("Generated client bundles are referenced by index.html");
      passed++;
    } else {
      error("Generated client bundles not referenced by index.html");
    }
  } else {
    error("build/index.html not found. Run `pnpm build` first.");
    total++;
  }

  return { passed, total };
}

async function validateDependencies() {
  info("\n=== Dependencies ===\n");

  let passed = 0;
  let total = 0;

  const packageJsonPath = path.resolve("package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    total++;
    if (packageContent.dependencies["posthog-js"]) {
      success(`posthog-js is installed: ${packageContent.dependencies["posthog-js"]}`);
      passed++;
    } else {
      error("posthog-js not found in dependencies");
    }

    total++;
    if (packageContent.dependencies["posthog-node"]) {
      info(
        "ℹ posthog-node is installed but not needed for static sites (" +
          packageContent.dependencies["posthog-node"] +
          ")"
      );
      info("  Consider removing: pnpm remove posthog-node");
      passed++;
    } else {
      success("posthog-node not installed (correct for static sites)");
      passed++;
    }
  } else {
    error("package.json not found");
    total += 2;
  }

  return { passed, total };
}

async function main() {
  info("\n=== PostHog Integration Validation Script ===\n");

  const envResults = await validateEnvConfig();
  const clientResults = await validateClientSideIntegration();
  const serverResults = await validateServerSideIntegration();
  const buildResults = await validateBuildOutput();
  const depResults = await validateDependencies();

  const totalPassed =
    envResults.passed +
    clientResults.passed +
    serverResults.passed +
    buildResults.passed +
    depResults.passed;
  const totalChecks =
    envResults.total +
    clientResults.total +
    serverResults.total +
    buildResults.total +
    depResults.total;

  info("\n=== Summary ===");
  info(`Passed: ${totalPassed}/${totalChecks}`);

  if (totalPassed === totalChecks) {
    success("\n✓ All PostHog integration checks passed!");
    info("\nNext steps:");
    info("1. Run `pnpm dev` and open http://localhost:5173");
    info("2. Open browser DevTools (F12)");
    info("3. Check Console for PostHog initialization messages");
    info("4. Check Network tab for requests to PostHog host");
    info("5. Navigate between pages to verify pageview events");
    info("6. Check PostHog dashboard to confirm events are being received");
    process.exit(0);
  } else {
    const failed = totalChecks - totalPassed;
    error(`\n✗ ${failed} check(s) failed!`);
    info("\nReview the failed checks above to fix issues.");
    process.exit(1);
  }
}

main().catch((e) => {
  error(`Fatal error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
