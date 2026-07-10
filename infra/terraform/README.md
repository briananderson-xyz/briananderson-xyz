# GCP infrastructure and GitHub trust

This directory manages the static-site buckets, API repository, runtime identities and secrets, and
the GitHub workload identity boundary. Terraform state can contain secrets; never publish state,
raw plan JSON, saved binary plans, outputs, or before/after values.

## Delivery contract

A reviewed pull request is the Terraform production gate:

1. Every PR to `main` runs the stable `Terraform Gate`. Credential-free format, backend-disabled
   initialization, validation, and policy tests always run, even when Terraform did not change.
2. A same-repository PR that changes Terraform or its trust workflows also authenticates as the
   read-only planner, reads the exact backend bucket with `-lock=false`, and creates a local plan.
   Forked Terraform changes fail closed.
3. PR evidence is a sanitized evidence manifest containing only the exact source SHA, backend
   prefix, add/change/destroy counts, resource addresses, and action arrays. The job updates one bot
   comment and its summary, then deletes the plan, raw JSON, and text files. Nothing is uploaded.
4. Merging the reviewed PR to protected `main` automatically starts one non-cancelling,
   backend-serialized apply job. It verifies that `GITHUB_SHA` is the current `origin/main`, creates
   a fresh locked saved plan against current state, and applies that exact local file in the same
   job. There is no dispatch input, confirmation string, downloaded PR plan, or second approval.
5. Production application deployment remains a separate manual-only workflow. Terraform delivery
   never dispatches it.

The authenticated PR plan executes code from the branch with read access to sensitive state. This
design assumes same-repository branches are controlled by the trusted owner. If write access is
expanded, add a protected planning approval boundary before allowing those contributors to plan.

If automatic apply fails, do not rerun blindly. Inspect state and live IAM, confirm the backend is
unlocked, and submit a reviewed corrective or revert PR through this same path. A provider error can
occur after partial mutation, so the next fresh plan is the recovery record.

## Trust domains

Each capability has a distinct pool, provider, service account, and exact OIDC subject:

| Capability      | Exact subject                                                          | Intended authority                                                   |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| PR plan         | `repo:briananderson-xyz/briananderson-xyz:pull_request`                | Metadata reads, state-object reads, and bucket-IAM policy reads only |
| Image publish   | `repo:briananderson-xyz/briananderson-xyz:ref:refs/heads/main`         | Writer on the `site-functions` repository                            |
| Dev deploy      | `repo:briananderson-xyz/briananderson-xyz:environment:dev`             | Dev services, bucket, runtime `actAs`, and image reads               |
| Prod deploy     | `repo:briananderson-xyz/briananderson-xyz:environment:prod`            | Equivalent production-only resources                                 |
| Terraform apply | `repo:briananderson-xyz/briananderson-xyz:environment:terraform-apply` | Infrastructure administration after a reviewed merge                 |

Provider conditions also require the exact repository, event type, branch where applicable, and
allowed owner ID. Bindings use exact `principal://.../subject/...` members; repository-wide
`principalSet` grants are forbidden. The planner has no project-level Storage role and no mutation
role. Publisher, dev, prod, and apply cannot impersonate one another.

Terraform refreshes the IAM resources on the production site, dev site, and state buckets during a
remote plan. The planner therefore receives a custom role containing only
`storage.buckets.getIamPolicy`, bound separately at those three managed buckets. It has no
`storage.buckets.setIamPolicy`, object-write, object-delete, Storage Admin, or project-level binding.
The state bucket separately grants `roles/storage.objectViewer` so the backend can read state
objects at the exact backend bucket only.

The apply identity alone receives `roles/iam.roleAdmin` because Terraform manages the planner's
custom bucket-IAM reader role and must read, create, update, or retire that role after a reviewed
merge. Planner, publisher, dev, and production deployment identities never receive Role Admin.

Dev/prod may read images only from `site-functions`; publisher alone writes them. Cloud Run rollout
uses resource-level `roles/run.developer` and preserves service IAM. A trusted administrator must
separately grant `allUsers` `roles/run.invoker` for an intended public service. Both PR and apply
pass `manage_deployment_service_iam=true` so they plan with identical, verified service-IAM inputs.

## Credential-free validation

Run from this directory:

```bash
set -euo pipefail
terraform fmt -check -recursive
TF_DATA_DIR="$(mktemp -d)"
export TF_DATA_DIR
trap 'rm -rf "$TF_DATA_DIR"' EXIT
terraform init -backend=false -lockfile=readonly
terraform validate -no-color
./check-policy.sh
./test-check-policy.sh
```

Provider installation may contact the Terraform Registry but does not inspect GCP state.

## One-time bootstrap

The initial creation of the separated identities is the unavoidable local trust root because the
new apply identity cannot create itself. Perform this once as a named administrator from reviewed
source; it is not routine delivery authorization.

1. Confirm the authenticated account, project `briananderson-xyz-468620`, state bucket
   `briananderson-xyz-tf-state`, prefix `gcp/infra`, current `main`, and live resource inventory.
   Keep a local state backup and all saved plans in a mode-`0700` directory outside the repository.
2. Initialize the real backend and create a normal full saved plan with explicit project, region,
   bucket, repository, state bucket, and `manage_deployment_service_iam=true` values.
3. From its JSON, mechanically select only addresses whose action is exactly `create`. Generate a
   second create-only targeted saved plan from those addresses. Abort unless it has zero update,
   delete, replace, service-image, data, bucket, secret, or unrelated application actions.
4. Review and apply that exact reviewed plan locally. This targeted bootstrap is the only exception;
   routine plans must never use `-target`.
5. After IAM propagation, run a complete non-applying plan. It may show only the separately reviewed
   legacy identity/grant removals. Do not remove legacy access until the new PR plan and main apply
   identities authenticate successfully.

Before the cleanup merge, rollback means removing the new GitHub settings while retaining legacy
access. After cleanup, rollback is a reviewed revert PR; never recreate a broad shared identity ad
hoc.

## GitHub settings and activation order

Populate values from Terraform outputs without printing them:

- Repository secrets: `GCP_WIF_PLAN_PROVIDER`, `GCP_WIF_PLAN_SA_EMAIL`,
  `GCP_WIF_PUBLISHER_PROVIDER`, `GCP_WIF_PUBLISHER_SA_EMAIL`, and `TF_STATE_BUCKET` for planning.
- Repository variables: `GCP_PROJECT_ID`, `GCP_REGION`, and `SITE_BUCKET_NAME`.
- `dev` secrets: `GCP_WIF_DEV_PROVIDER`, `GCP_WIF_DEV_SA_EMAIL`, and existing dev-only application
  values. Restrict deployment branches to `main`.
- `terraform-apply` secrets: `GCP_WIF_APPLY_PROVIDER`, `GCP_WIF_APPLY_SA_EMAIL`, and
  `TF_STATE_BUCKET`. Restrict deployment branches to `main` and configure no reviewer gate.
- `prod` secrets: `GCP_WIF_PROD_PROVIDER` and `GCP_WIF_PROD_SA_EMAIL`. Keep the environment and
  application deployment workflow manual/protected.

Do not configure legacy `GCP_WIF_PROVIDER` or `GCP_WIF_SA_EMAIL` fallbacks. Install branch
protection only after observing the exact successful `Terraform Gate` context: require PRs,
up-to-date checks, conversation resolution, and disallow force pushes/deletion.

Keep `DEV_DEPLOY_ENABLED` absent or false until planner/apply/publisher/dev authentication, negative
cross-identity probes, dev DNS/origin routing, rollback digests, and public invoker policy are all
verified. Then set it to `true` immediately before one controlled `main` proof. On failure, set it
false and use the recorded prior digest/static build rollback. Production must remain untouched.

## Provider baseline

Terraform is `1.15.x`; `hashicorp/google` is locked to `5.45.2`. A provider-major upgrade requires a
separate authenticated state/schema review and PR. Never combine it with bootstrap or run
`init -upgrade` casually.
