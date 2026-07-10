import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = join(siteRoot, "src/lib/styles/app.css");
const tailwindPath = join(siteRoot, "tailwind.config.cjs");
const css = readFileSync(cssPath, "utf8");
const tailwind = readFileSync(tailwindPath, "utf8");

const themes = {
  light: ":root",
  dark: "html.dark",
  catppuccin: 'html[data-theme="catppuccin"]'
};
const statuses = ["success", "warning", "error"];
const minimumContrast = 4.5;

function fail(message) {
  throw new Error(message);
}

function selectorBlock(source, selector) {
  const selectorStart = source.indexOf(`${selector} {`);
  if (selectorStart < 0) fail(`Missing theme selector: ${selector}`);

  const open = source.indexOf("{", selectorStart);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(open + 1, index);
  }
  fail(`Unclosed theme selector: ${selector}`);
}

function color(block, variable) {
  const match = block.match(new RegExp(`--${variable}:\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)`));
  if (!match) fail(`Missing or invalid --${variable}`);
  return match.slice(1).map(Number);
}

function luminance([red, green, blue]) {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground, background, alpha) {
  return foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
}

for (const [theme, selector] of Object.entries(themes)) {
  const block = selectorBlock(css, selector);
  const page = color(block, "color-bg-page");
  const terminalSurface = color(block, "color-terminal-dark");

  for (const status of statuses) {
    const base = color(block, `color-status-${status}`);
    const onStatus = color(block, `color-status-${status}-contrast`);
    const textRatio = contrast(base, page);
    const surfaceRatio = contrast(base, terminalSurface);
    const subtleRatios = [page, terminalSurface].map((background) =>
      contrast(base, blend(base, background, 0.1))
    );
    const filledRatio = contrast(onStatus, base);

    if (textRatio < minimumContrast) {
      fail(
        `${theme} ${status} text contrast ${textRatio.toFixed(2)} is below ${minimumContrast}:1`
      );
    }
    if (surfaceRatio < minimumContrast) {
      fail(
        `${theme} ${status} terminal-surface contrast ${surfaceRatio.toFixed(2)} is below ${minimumContrast}:1`
      );
    }
    if (Math.min(...subtleRatios) < minimumContrast) {
      fail(
        `${theme} ${status} subtle-panel contrast ${Math.min(...subtleRatios).toFixed(2)} is below ${minimumContrast}:1`
      );
    }
    if (filledRatio < minimumContrast) {
      fail(
        `${theme} ${status} filled contrast ${filledRatio.toFixed(2)} is below ${minimumContrast}:1`
      );
    }

    console.log(
      `${theme} ${status}: page ${textRatio.toFixed(2)}:1, terminal ${surfaceRatio.toFixed(2)}:1, subtle ${Math.min(...subtleRatios).toFixed(2)}:1, filled ${filledRatio.toFixed(2)}:1`
    );
  }
}

for (const status of statuses) {
  for (const suffix of ["", "-contrast"]) {
    const key = `${status}${suffix}`;
    const variable = `--color-status-${key}`;
    const mapping = new RegExp(`["']?${key}["']?:\\s*withOpacity\\(["']${variable}["']\\)`);
    if (!mapping.test(tailwind)) {
      fail(`Tailwind skin mapping missing for ${key}`);
    }
  }
}

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".svelte") ? [path] : [];
  });
}

// Fixed terminal traffic-light chrome and platform identity badges are the only
// hardcoded red/yellow/green source classes. They are visual/brand identities,
// not application status semantics.
const allowedHardcodedClasses = new Map([
  ["src/lib/components/ExternalLinkModal.svelte:bg-red-500", 1],
  ["src/lib/components/ExternalLinkModal.svelte:bg-yellow-500", 1],
  ["src/lib/components/ExternalLinkModal.svelte:bg-green-500", 1],
  ["src/lib/components/Homepage.svelte:bg-red-500", 1],
  ["src/lib/components/Homepage.svelte:bg-yellow-500", 1],
  ["src/lib/components/Homepage.svelte:bg-green-500", 1],
  ["src/routes/interests/+page.svelte:bg-red-600", 1]
]);
const observedAllowed = new Map();
const hardcodedPattern =
  /\b(?:text|bg|border)-(?:red|green|yellow|amber|orange|emerald|lime|rose)-\d{2,3}\b/g;

for (const file of sourceFiles(join(siteRoot, "src"))) {
  const source = readFileSync(file, "utf8");
  for (const className of source.match(hardcodedPattern) ?? []) {
    const key = `${relative(siteRoot, file)}:${className}`;
    if (!allowedHardcodedClasses.has(key))
      fail(`Hardcoded status-like color is not documented: ${key}`);
    observedAllowed.set(key, (observedAllowed.get(key) ?? 0) + 1);
  }
}

for (const [key, expected] of allowedHardcodedClasses) {
  const actual = observedAllowed.get(key) ?? 0;
  if (actual !== expected)
    fail(`Documented color exception ${key}: expected ${expected}, found ${actual}`);
}

console.log("Theme token validation passed.");
