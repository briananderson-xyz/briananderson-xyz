import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(siteRoot, "..");
const automaticPath = join(repoRoot, ".github", "workflows", "build-and-deploy.yml");
const productionPath = join(repoRoot, ".github", "workflows", "deploy-production.yml");
const terraformPrPath = join(repoRoot, ".github", "workflows", "terraform-pr.yml");
const terraformApplyPath = join(repoRoot, ".github", "workflows", "terraform-apply.yml");
const failures = [];

async function loadWorkflow(path) {
  const source = await readFile(path, "utf8");
  const workflow = yaml.load(source);
  return { source, workflow };
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function acceptsProductionBinding({ sourceSha, imageRef, tagDigest }) {
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) return false;
  const digest = imageRef.match(/@((?:sha256:)[0-9a-f]{64})$/)?.[1];
  return Boolean(digest && tagDigest === digest);
}

const automatic = await loadWorkflow(automaticPath);
const production = await loadWorkflow(productionPath);
const terraformPr = await loadWorkflow(terraformPrPath);
const terraformApply = await loadWorkflow(terraformApplyPath);
const automaticOn = automatic.workflow.on;
const productionOn = production.workflow.on;
const terraformPrOn = terraformPr.workflow.on;
const terraformApplyOn = terraformApply.workflow.on;

expect(Boolean(automaticOn?.push), "automatic workflow must run on push");
expect(!automaticOn?.workflow_dispatch, "automatic workflow must not expose workflow_dispatch");
expect(
  !automaticOn?.pull_request && !automaticOn?.schedule,
  "automatic workflow must be push-only"
);
expect(Boolean(automatic.workflow.jobs?.validate), "automatic workflow must retain validation");
expect(
  Boolean(automatic.workflow.jobs?.["build-functions"]),
  "automatic workflow must test the container without credentials"
);

const validationEnv = automatic.workflow.jobs?.validate?.steps?.find(
  (step) => step?.name === "Validate site"
)?.env;
expect(
  validationEnv?.PUBLIC_POSTHOG_KEY === "phc_ci_validation_only",
  "automatic validation must provide the deterministic non-secret PostHog key placeholder"
);
expect(
  validationEnv?.PUBLIC_POSTHOG_HOST === "https://posthog.invalid",
  "automatic validation must provide the deterministic non-secret PostHog host placeholder"
);
expect(
  !JSON.stringify(validationEnv ?? {}).includes("secrets."),
  "automatic validation must remain credential-free"
);

for (const jobName of ["publish-functions", "deploy-functions-dev", "deploy-site-dev"]) {
  const job = automatic.workflow.jobs?.[jobName];
  expect(Boolean(job), `automatic workflow is missing ${jobName}`);
  expect(
    String(job?.if ?? "").includes("vars.DEV_DEPLOY_ENABLED == 'true'"),
    `${jobName} must be gated by DEV_DEPLOY_ENABLED`
  );
  expect(
    job?.steps?.some((step) => step?.id === "config"),
    `${jobName} must safely detect missing bootstrap configuration`
  );
}

expect(
  automatic.workflow.jobs?.["publish-functions"]?.environment === undefined,
  "publisher identity must remain scoped to the exact main-ref subject, not an environment subject"
);
for (const jobName of ["deploy-functions-dev", "deploy-site-dev"]) {
  expect(
    automatic.workflow.jobs?.[jobName]?.environment === "dev",
    `${jobName} credentials must be scoped to the dev environment`
  );
}

for (const forbidden of [
  "GCP_WIF_PROVIDER",
  "GCP_WIF_SA_EMAIL",
  "GCP_PROD_",
  "deploy_prod",
  "prod-stable",
  "gs://briananderson.xyz",
  "api.briananderson.xyz"
]) {
  expect(
    !automatic.source.includes(forbidden),
    `automatic workflow contains forbidden production or legacy token: ${forbidden}`
  );
}

expect(automatic.source.includes("GCP_WIF_PUBLISHER_PROVIDER"), "publisher identity is missing");
expect(automatic.source.includes("GCP_WIF_DEV_PROVIDER"), "dev identity is missing");
expect(
  automatic.source.includes("containerimage.digest"),
  "registry-confirmed build metadata digest is missing"
);
expect(
  automatic.source.includes("docker buildx imagetools inspect"),
  "registry digest confirmation is missing"
);
expect(
  automatic.source.includes('IMAGE_TAG="${IMAGE_NAME}:${GITHUB_SHA}"'),
  "publisher must publish the image under the full GITHUB_SHA tag"
);
expect(
  !automatic.source.includes("GITHUB_SHA:0:8"),
  "publisher must not shorten the source SHA tag"
);
expect(!automatic.source.includes("dev-stable"), "mutable dev-stable deployment is forbidden");
expect(
  automatic.source.includes('--image "$IMAGE_REF"'),
  "dev deploys must consume IMAGE_REF by digest"
);
expect(
  !automatic.source.includes("--allow-unauthenticated"),
  "routine dev deployment must preserve service IAM instead of granting public access"
);

for (const jobName of ["publish-functions", "deploy-functions-dev", "deploy-site-dev"]) {
  for (const step of automatic.workflow.jobs?.[jobName]?.steps ?? []) {
    const isCloudStep =
      String(step?.uses ?? "").startsWith("google-github-actions/") ||
      /\b(?:gcloud|docker buildx)\b/.test(String(step?.run ?? ""));
    if (isCloudStep) {
      expect(
        String(step.if ?? "").includes("steps.config.outputs.ready == 'true'"),
        `${jobName} cloud step ${step.name ?? step.uses} must skip when credentials are absent`
      );
    }
  }
}

expect(Boolean(productionOn?.workflow_dispatch), "production workflow must be manual-only");
expect(
  !productionOn?.push && !productionOn?.pull_request && !productionOn?.schedule,
  "production workflow has an automatic trigger"
);
for (const input of ["confirmation", "source_sha", "image_ref"]) {
  const definition = productionOn?.workflow_dispatch?.inputs?.[input];
  expect(definition?.required === true, `production ${input} input must be required`);
  expect(definition?.type === "string", `production ${input} input must be typed as string`);
}
expect(
  production.source.includes('"DEPLOY_PRODUCTION"'),
  "production workflow must require exact confirmation"
);
expect(
  production.source.includes("@sha256:[0-9a-f]{64}"),
  "production workflow must validate an immutable image digest"
);
expect(production.source.includes("GCP_WIF_PROD_PROVIDER"), "production-only identity is missing");
expect(
  !production.source.includes("GCP_WIF_DEV_") && !production.source.includes("GCP_WIF_PUBLISHER_"),
  "production workflow must not use dev or publisher identities"
);
expect(
  production.source.includes("EXPECTED_PREFIX"),
  "production image must be constrained to the configured registry path"
);
expect(
  production.source.includes("refs/remotes/origin/main") &&
    production.source.includes('= "$SOURCE_SHA"'),
  "production source_sha must be constrained to the current main commit"
);
expect(
  !production.source.includes("--allow-unauthenticated"),
  "routine production deployment must preserve service IAM instead of granting public access"
);
expect(
  production.source.includes('FULL_SHA_TAG="${IMAGE_NAME}:${SOURCE_SHA}"'),
  "production preflight must resolve IMAGE_NAME:SOURCE_SHA"
);
expect(
  production.source.includes('gcloud artifacts docker images describe "$FULL_SHA_TAG"'),
  "production preflight must resolve the full source SHA tag from Artifact Registry"
);
expect(
  production.source.includes('[ "$TAG_DIGEST" = "$EXPECTED_DIGEST" ]'),
  "production preflight must require the full source SHA tag digest to equal image_ref"
);
const tagResolutionIndex = production.source.indexOf(
  'gcloud artifacts docker images describe "$FULL_SHA_TAG"'
);
const provenanceComparisonIndex = production.source.indexOf(
  '[ "$TAG_DIGEST" = "$EXPECTED_DIGEST" ]'
);
const cloudRunReadIndex = production.source.indexOf("gcloud run services describe");
const staticMutationIndex = production.source.indexOf("gcloud storage rsync");
expect(
  tagResolutionIndex >= 0 &&
    provenanceComparisonIndex > tagResolutionIndex &&
    cloudRunReadIndex > provenanceComparisonIndex &&
    staticMutationIndex > provenanceComparisonIndex,
  "source-tag provenance must fail closed before Cloud Run reads or static-site mutation"
);

// Policy-negative fixtures mirror the workflow's source/digest predicate so a
// short commit selector or independently supplied digest cannot be accepted.
const fixtureSha = "a".repeat(40);
const fixtureDigest = `sha256:${"b".repeat(64)}`;
const fixtureImage = `us-central1-docker.pkg.dev/example/site-functions/api@${fixtureDigest}`;
expect(
  acceptsProductionBinding({
    sourceSha: fixtureSha,
    imageRef: fixtureImage,
    tagDigest: fixtureDigest
  }),
  "production provenance positive fixture must be accepted"
);
expect(
  !acceptsProductionBinding({
    sourceSha: fixtureSha,
    imageRef: fixtureImage,
    tagDigest: `sha256:${"c".repeat(64)}`
  }),
  "production provenance policy must reject a mismatched source-tag digest"
);
expect(
  !acceptsProductionBinding({
    sourceSha: fixtureSha.slice(0, 8),
    imageRef: fixtureImage,
    tagDigest: fixtureDigest
  }),
  "production provenance policy must reject a shortened source tag"
);

for (const [jobName, job] of Object.entries(production.workflow.jobs ?? {})) {
  if (jobName.startsWith("deploy")) {
    expect(job.environment === "prod", `${jobName} must use the protected prod environment`);
  }
}

expect(Boolean(terraformPrOn?.pull_request), "Terraform PR gate must run on pull requests");
expect(
  terraformPrOn?.pull_request?.paths === undefined,
  "Terraform PR gate must not use path filters"
);
expect(
  Boolean(terraformPr.workflow.jobs?.validate),
  "Terraform PR gate needs credential-free validation"
);
expect(Boolean(terraformPr.workflow.jobs?.plan), "Terraform PR gate needs authenticated planning");
expect(
  terraformPr.workflow.jobs?.gate?.name === "Terraform Gate",
  "Terraform aggregate gate must retain its stable name"
);
const terraformValidate = JSON.stringify(terraformPr.workflow.jobs?.validate ?? {});
expect(
  !/id-token|google-github-actions\/auth|secrets\./.test(terraformValidate),
  "Terraform validation job must remain credential-free"
);
expect(
  String(terraformPr.workflow.jobs?.plan?.if ?? "").includes("same_repository == 'true'"),
  "Terraform remote plan must be restricted to same-repository pull requests"
);
expect(terraformPr.source.includes("-lock=false"), "Terraform PR plan must not lock remote state");
expect(
  terraformPr.source.includes("manage_deployment_service_iam=true"),
  "Terraform PR plan must explicitly include deployment-service IAM"
);
expect(
  terraformPr.source.includes("infra/terraform/sanitize-plan-evidence.sh"),
  "Terraform PR evidence must use the behavior-tested sanitizer"
);
expect(
  !/actions\/(?:upload|download)-artifact|\.before|\.after|\.planned_values|\.prior_state/.test(
    terraformPr.source
  ),
  "Terraform PR evidence must not expose plans, state-shaped values, or raw plan structures"
);

expect(Boolean(terraformApplyOn?.push), "Terraform apply must run automatically after main merge");
expect(
  !terraformApplyOn?.workflow_dispatch &&
    !terraformApplyOn?.pull_request &&
    !terraformApplyOn?.schedule,
  "Terraform apply must have no second manual or non-main trigger"
);
expect(
  terraformApply.workflow.concurrency?.["cancel-in-progress"] === false,
  "Terraform apply serialization must not cancel an in-flight backend operation"
);
expect(
  terraformApply.source.includes("refs/remotes/origin/main") &&
    terraformApply.source.includes("SOURCE_SHA: ${{ github.sha }}"),
  "Terraform apply must verify the exact current main SHA"
);
expect(
  terraformApply.source.includes("Create fresh locked plan for this main SHA") &&
    terraformApply.source.includes("Apply the same fresh saved plan"),
  "Terraform apply must create and consume one fresh local saved plan"
);
expect(
  terraformApply.source.includes("manage_deployment_service_iam=true"),
  "Terraform apply must use the same explicit deployment-service IAM input as PR planning"
);
expect(
  !/actions\/(?:upload|download)-artifact|workflow_run|APPLY_TERRAFORM|confirmation/.test(
    terraformApply.source
  ),
  "Terraform apply must not consume PR artifacts or require a second manual gate"
);

if (failures.length > 0) {
  console.error("Delivery workflow policy validation failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  "Delivery workflows validated: PR-gated Terraform apply, push-only dev automation, and manual immutable production deployment."
);
