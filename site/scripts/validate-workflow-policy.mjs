import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(siteRoot, "..");
const workflowsRoot = process.argv[2]
  ? resolve(process.argv[2])
  : join(repoRoot, ".github", "workflows");
const shaPattern = /^[0-9a-f]{40}$/;
const versionCommentPattern = /^v\d+(?:\.\d+){0,2}$/;
const pnpmVersion = "10.33.0";
const nodeMajor = "22";

const workflowFiles = (await readdir(workflowsRoot)).filter((file) => /\.ya?ml$/.test(file)).sort();

const failures = [];
let externalActionCount = 0;
let nodeVersionCount = 0;
let pnpmSetupCount = 0;

for (const file of workflowFiles) {
  const path = join(workflowsRoot, file);
  const source = await readFile(path, "utf8");
  const lines = source.split(/\r?\n/);

  let workflow;
  try {
    workflow = yaml.load(source);
  } catch (error) {
    failures.push(`${file}: invalid YAML: ${error.message}`);
    continue;
  }

  if (!workflow || typeof workflow !== "object") {
    failures.push(`${file}: workflow must be a YAML object`);
    continue;
  }

  if (!workflow.permissions || Object.keys(workflow.permissions).length !== 0) {
    failures.push(`${file}: top-level permissions must be an explicit empty mapping`);
  }

  if (!workflow.jobs || typeof workflow.jobs !== "object") {
    failures.push(`${file}: jobs must be a mapping`);
  } else {
    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      if (!job || typeof job !== "object" || !("permissions" in job)) {
        failures.push(`${file}: job ${jobName} must declare least-privilege permissions`);
      }

      for (const step of job?.steps ?? []) {
        if (String(step?.uses ?? "").startsWith("pnpm/action-setup@")) {
          pnpmSetupCount += 1;
          if (String(step?.with?.version ?? "") !== pnpmVersion) {
            failures.push(
              `${file}: job ${jobName} must use pnpm ${pnpmVersion}, found ${String(step?.with?.version ?? "missing")}`
            );
          }
        }
      }
    }
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const usesMatch = line.match(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#\s*(\S.*?))?\s*$/);
    if (usesMatch) {
      const action = usesMatch[1];
      const versionComment = usesMatch[2];

      if (action.startsWith("./")) return;
      if (action.startsWith("docker://")) {
        if (!/@sha256:[0-9a-f]{64}$/.test(action)) {
          failures.push(
            `${file}:${lineNumber}: Docker actions must use an immutable sha256 digest`
          );
        }
        return;
      }

      externalActionCount += 1;
      const separator = action.lastIndexOf("@");
      const ref = separator === -1 ? "" : action.slice(separator + 1);
      if (!shaPattern.test(ref)) {
        failures.push(
          `${file}:${lineNumber}: external action must use a full 40-character commit SHA`
        );
      }
      if (!versionCommentPattern.test(versionComment ?? "")) {
        failures.push(
          `${file}:${lineNumber}: pinned action must end with a version comment such as # v5`
        );
      }
    }

    const nodeMatch = line.match(/^\s*node-version:\s*["']?([^\s"']+)["']?\s*(?:#.*)?$/);
    if (nodeMatch) {
      nodeVersionCount += 1;
      if (nodeMatch[1] !== nodeMajor) {
        failures.push(
          `${file}:${lineNumber}: node-version must be ${nodeMajor}, found ${nodeMatch[1]}`
        );
      }
    }
  });
}

if (externalActionCount === 0) failures.push("no external GitHub Actions were inspected");
if (nodeVersionCount === 0) failures.push("no node-version declarations were inspected");
if (pnpmSetupCount === 0) failures.push("no pnpm/action-setup declarations were inspected");

const siteManifest = JSON.parse(await readFile(join(siteRoot, "package.json"), "utf8"));
const functionsRoot = join(siteRoot, "functions");
const functionsManifest = JSON.parse(await readFile(join(functionsRoot, "package.json"), "utf8"));

for (const [name, manifest] of [
  ["site", siteManifest],
  ["functions", functionsManifest]
]) {
  if (manifest.packageManager !== `pnpm@${pnpmVersion}`) {
    failures.push(
      `${name}/package.json: packageManager must be pnpm@${pnpmVersion}, found ${manifest.packageManager ?? "missing"}`
    );
  }
  if (String(manifest.engines?.node ?? "") !== nodeMajor) {
    failures.push(
      `${name}/package.json: engines.node must be ${nodeMajor}, found ${manifest.engines?.node ?? "missing"}`
    );
  }
  const nodeTypes = String(manifest.devDependencies?.["@types/node"] ?? "");
  if (!/^\^?22(?:\.|$)/.test(nodeTypes)) {
    failures.push(
      `${name}/package.json: @types/node must target Node 22, found ${nodeTypes || "missing"}`
    );
  }
}

const dockerfile = await readFile(join(functionsRoot, "Dockerfile"), "utf8");
if (!/^ARG NODE_IMAGE=node:22\.23\.1-slim@sha256:[0-9a-f]{64}$/m.test(dockerfile)) {
  failures.push("functions/Dockerfile: NODE_IMAGE must pin the Node 22.23.1 slim index digest");
}
if (!dockerfile.includes(`corepack prepare pnpm@${pnpmVersion} --activate`)) {
  failures.push(`functions/Dockerfile: build stage must activate pnpm ${pnpmVersion}`);
}

const locks = new Map();
for (const [name, lockPath] of [
  ["site", join(siteRoot, "pnpm-lock.yaml")],
  ["functions", join(functionsRoot, "pnpm-lock.yaml")]
]) {
  const lock = yaml.load(await readFile(lockPath, "utf8"));
  locks.set(name, lock);
  const nodeTypes = String(lock?.importers?.["."]?.devDependencies?.["@types/node"]?.specifier ?? "");
  if (!/^\^?22(?:\.|$)/.test(nodeTypes)) {
    failures.push(`${name}/pnpm-lock.yaml: @types/node specifier must target Node 22`);
  }
}

for (const staleOverride of ["protobufjs", "dompurify", "devalue", "svelte", "brace-expansion@2.0.2"]) {
  if (staleOverride in (siteManifest.pnpm?.overrides ?? {})) {
    failures.push(`site/package.json: stale override ${staleOverride} must remain removed`);
  }
}

const expectedFunctionOverrides = {
  protobufjs: "7.6.3",
  ws: "8.21.0",
  minimatch: "9.0.9",
  "brace-expansion": "2.0.3",
  qs: "6.15.3",
  "express>path-to-regexp": "0.1.13"
};
for (const [dependency, version] of Object.entries(expectedFunctionOverrides)) {
  if (functionsManifest.pnpm?.overrides?.[dependency] !== version) {
    failures.push(
      `functions/package.json: override ${dependency} must be exact ${version}, found ${functionsManifest.pnpm?.overrides?.[dependency] ?? "missing"}`
    );
  }
}

const functionsLock = locks.get("functions");
if (String(functionsLock?.overrides?.protobufjs ?? "") !== "7.6.3") {
  failures.push("functions/pnpm-lock.yaml: protobufjs override must resolve to patched 7.6.3");
}

const expressRuntime = String(functionsManifest.dependencies?.express ?? "");
const expressTypes = String(functionsManifest.devDependencies?.["@types/express"] ?? "");
if (!/^\^?4\.22\.2$/.test(expressRuntime)) {
  failures.push(`functions/package.json: Express runtime must remain 4.22.2, found ${expressRuntime}`);
}
if (!/^\^?4\.17\./.test(expressTypes)) {
  failures.push(`functions/package.json: @types/express must target 4.17.x, found ${expressTypes}`);
}
const functionsImporter = functionsLock?.importers?.["."];
if (!String(functionsImporter?.devDependencies?.["@types/express"]?.version ?? "").startsWith("4.17.")) {
  failures.push("functions/pnpm-lock.yaml: @types/express must resolve to 4.17.x");
}
for (const packageName of Object.keys(functionsLock?.packages ?? {})) {
  if (/^@types\/express(?:-serve-static-core)?@5\./.test(packageName)) {
    failures.push(`functions/pnpm-lock.yaml: Express 5 type package is forbidden: ${packageName}`);
  }
}
const genaiSnapshot = Object.entries(functionsLock?.snapshots ?? {}).find(([key]) =>
  key.startsWith("@google/genai@1.52.0(")
)?.[1];
if (String(genaiSnapshot?.dependencies?.protobufjs ?? "") !== "7.6.3") {
  failures.push("functions/pnpm-lock.yaml: @google/genai 1.52.0 must consume protobufjs 7.6.3");
}

if (failures.length > 0) {
  console.error("GitHub Actions policy validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Workflow and toolchain policy validated: ${workflowFiles.length} workflows, ${externalActionCount} pinned action uses, ${nodeVersionCount} Node 22 declarations, ${pnpmSetupCount} pnpm ${pnpmVersion} setups.`
);
