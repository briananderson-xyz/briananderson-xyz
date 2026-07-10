import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const policyPath = resolve(root, "security-policy.json");
const artifactPath = resolve(root, "security/cloudflare-activation-policy.json");
const appHtmlPath = resolve(root, "src/app.html");
const hooksPath = resolve(root, "src/hooks.server.ts");
const buildPath = resolve(root, "build");
const write = process.argv.includes("--write");

const policy = JSON.parse(await readFile(policyPath, "utf8"));
const directives = policy.csp.directives;
const renderCsp = (names) =>
  names.map((name) => `${name} ${directives[name].join(" ")}`).join("; ");
const fullCsp = renderCsp(Object.keys(directives));
const metaCsp = renderCsp(policy.csp.metaDirectives);

const quoteSet = (values) => `{${values.map((value) => `"${value}"`).join(" ")}}`;
const hostExpression = `(http.host in ${quoteSet(policy.hosts.site)})`;
const rateExpression = [
  `(http.host in ${quoteSet(policy.hosts.api)})`,
  `(http.request.method in ${quoteSet(policy.rateLimit.methods)})`,
  `(http.request.uri.path in ${quoteSet(policy.rateLimit.paths)})`
].join(" and ");

const edgeHeaders = {
  "Content-Security-Policy": fullCsp,
  ...policy.httpHeaders
};

const artifact = {
  generatedFrom: "site/security-policy.json",
  activationStatus: "EXTERNAL_NOT_VERIFIED",
  instructions:
    "Resolve each phase's entrypoint RULESET_ID, substitute CLOUDFLARE_ZONE_ID and RULESET_ID, then POST the rule with a scoped token. This appends without replacing unrelated rules. Live curl evidence is required before marking active.",
  responseHeadersTransform: {
    method: "POST",
    endpoint:
      "https://api.cloudflare.com/client/v4/zones/CLOUDFLARE_ZONE_ID/rulesets/RULESET_ID/rules",
    body: {
      action: "rewrite",
      action_parameters: {
        headers: Object.fromEntries(
          Object.entries(edgeHeaders).map(([name, value]) => [name, { operation: "set", value }])
        )
      },
      description: "Canonical browser security headers for briananderson.xyz",
      enabled: true,
      expression: hostExpression
    }
  },
  sharedAiRateLimit: {
    method: "POST",
    endpoint:
      "https://api.cloudflare.com/client/v4/zones/CLOUDFLARE_ZONE_ID/rulesets/RULESET_ID/rules",
    body: {
      action: policy.rateLimit.action,
      description: policy.rateLimit.description,
      enabled: true,
      expression: rateExpression,
      ratelimit: {
        characteristics: policy.rateLimit.characteristics,
        period: policy.rateLimit.periodSeconds,
        requests_per_period: policy.rateLimit.requestsPerPeriod,
        mitigation_timeout: policy.rateLimit.mitigationTimeoutSeconds
      }
    }
  }
};

const expectedArtifact = `${JSON.stringify(artifact, null, 2)}\n`;
if (write) {
  await mkdir(resolve(root, "security"), { recursive: true });
  await writeFile(artifactPath, expectedArtifact);
}

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(policy.version === 1, "security policy version must be 1");
assert(
  Object.keys(edgeHeaders).sort().join("|") ===
    [
      "Content-Security-Policy",
      "Permissions-Policy",
      "Referrer-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options"
    ]
      .sort()
      .join("|"),
  "canonical policy must define exactly the five required HTTP security headers"
);
assert(directives["frame-ancestors"]?.includes("'none'"), "full CSP must deny framing");
assert(
  !policy.csp.metaDirectives.includes("frame-ancestors"),
  "meta CSP must omit frame-ancestors because browsers ignore it in meta delivery"
);
assert(
  directives["object-src"]?.includes("'none'") && directives["base-uri"]?.includes("'self'"),
  "CSP must deny plugins and restrict base URLs"
);
assert(
  policy.csp.unsafeInlineReason?.length > 40,
  "unsafe-inline must have a concrete compatibility rationale"
);
assert(
  policy.rateLimit.characteristics.includes("ip.src") &&
    policy.rateLimit.requestsPerPeriod > 0 &&
    policy.rateLimit.periodSeconds > 0,
  "shared edge rate limit must have a bounded per-client contract"
);

const appHtml = await readFile(appHtmlPath, "utf8");
const metaCspMatch = appHtml.match(
  /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/>/s
);
assert(metaCspMatch?.[1] === metaCsp, "app.html meta CSP differs from canonical safe subset");
assert(
  appHtml.includes(`<meta name="referrer" content="${policy.httpHeaders["Referrer-Policy"]}" />`),
  "app.html referrer meta differs from canonical policy"
);
for (const unsupported of [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Permissions-Policy"
]) {
  assert(
    !new RegExp(`http-equiv=["']${unsupported}["']`, "i").test(appHtml),
    `${unsupported} must not be represented as an ineffective meta tag`
  );
}

const hooks = await readFile(hooksPath, "utf8");
assert(
  hooks.includes('import { securityHeaders } from "$lib/security-policy"') &&
    hooks.includes("Object.entries(securityHeaders)"),
  "hooks.server.ts must consume the canonical security header map"
);

let existingArtifact = "";
try {
  existingArtifact = await readFile(artifactPath, "utf8");
} catch {
  // Reported below with the same actionable remediation as stale output.
}
assert(
  existingArtifact === expectedArtifact,
  "Cloudflare activation artifact is missing or stale; run: node scripts/validate-security-policy.mjs --write"
);

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory)) {
    const path = resolve(directory, entry);
    const details = await stat(path);
    if (details.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (entry.endsWith(".html")) files.push(path);
  }
  return files;
}

let builtHtml = [];
try {
  builtHtml = await htmlFiles(buildPath);
} catch {
  failures.push("site/build is missing; run pnpm build before policy validation");
}
assert(builtHtml.length > 0, "production build contains no HTML pages");
for (const path of builtHtml) {
  const html = await readFile(path, "utf8");
  assert(
    html.includes(`http-equiv="Content-Security-Policy"`) && html.includes(metaCsp),
    `${path.slice(root.length + 1)} lacks the canonical meta CSP`
  );
  if (html.includes("/_app/immutable/entry/start.")) {
    assert(
      directives["script-src"].includes("'self'") &&
        directives["script-src"].includes("'unsafe-inline'"),
      `${path.slice(root.length + 1)} hydration requires self-hosted and inline script support`
    );
  }
}

if (failures.length > 0) {
  console.error("Security policy validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Security policy valid: 5 HTTP headers, ${builtHtml.length} built HTML pages, Cloudflare activation status EXTERNAL_NOT_VERIFIED.`
);
