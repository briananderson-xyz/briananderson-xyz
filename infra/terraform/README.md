# GCP infrastructure and GitHub trust

This Terraform configuration manages the static-site buckets, API image repository, runtime
service accounts and secrets, and the GitHub workload identity boundary.

## Release safety

- Pull requests run `fmt`, backend-disabled `init`, `validate`, and static policy checks without a
  Google credential, repository secret, remote backend, saved plan, or write permission.
- Merging Terraform changes does not run Terraform apply. The apply workflow is manual-only,
  requires the exact current `main` SHA plus `APPLY_TERRAFORM`, and uses the protected
  `terraform-apply` environment.
- Apply creates and consumes one saved plan in one job. An `always()` step deletes the binary and
  no workflow uploads it.
- This source change does not modify live IAM. Remote planning and application deployment stay
  disabled until a trusted administrator completes and verifies the bootstrap below.

## Trust domains

Each capability has a separate pool, provider, service account, and exact GitHub OIDC subject:

| Capability | Required subject | Maximum intended authority |
| --- | --- | --- |
| Review plan | `repo:briananderson-xyz/briananderson-xyz:pull_request` | Resource metadata reads; optional exact state-bucket object reads |
| Image publish | `repo:briananderson-xyz/briananderson-xyz:ref:refs/heads/main` | Artifact Registry writer on `site-functions` |
| Dev deploy | `repo:briananderson-xyz/briananderson-xyz:environment:dev` | Dev bucket objects, dev services, dev runtime `actAs`, `site-functions` image reads |
| Prod deploy | `repo:briananderson-xyz/briananderson-xyz:environment:prod` | Prod bucket objects, prod services, prod runtime `actAs`, `site-functions` image reads |
| Terraform apply | `repo:briananderson-xyz/briananderson-xyz:environment:terraform-apply` | Infrastructure administration |

Bindings use `principal://.../subject/...`, never a repository or pool-wide `principalSet`. The
publisher cannot deploy; dev cannot act as the production runtime or update production storage;
and no automatic workflow subject can impersonate the production deployer or Terraform applier.
Dev and prod can read images only from the `site-functions` Artifact Registry repository; neither
identity can publish images or receives a project-wide Artifact Registry role.
Cloud Run deployer IAM is resource-level and source-disabled by default. Set
`manage_deployment_service_iam=true` only after verifying that every configured service exists and
reviewing the authenticated state-backed plan.

Routine Cloud Run image rollouts use `roles/run.developer` and preserve each service's existing IAM
policy. They do not create or repair public access. A trusted administrator must separately grant
`allUsers` the `roles/run.invoker` role on each intended public service as an explicitly reviewed
service-IAM/bootstrap operation. Existing public invoker IAM and live service reachability remain
externally `NOT_VERIFIED`; never add IAM-mutating deploy flags as a shortcut.

## Credential-free local validation

This is the same class of check used on pull requests and does not contact the configured backend:

```bash
terraform fmt -check -recursive
TF_DATA_DIR="$(mktemp -d)" terraform init -backend=false -lockfile=readonly
TF_DATA_DIR="$(mktemp -d)" terraform validate -no-color
./check-policy.sh
```

Run those commands from this directory. Provider installation may contact the Terraform Registry;
it does not authenticate to GCP or inspect live state.

## Trusted-administrator bootstrap

Bootstrap is a separately approved infrastructure operation. Do not perform it as part of an
application delivery or merely because these source files changed.

1. Authenticate locally as a named administrator through the organization's approved GCP path.
2. Confirm the active project and account. Initialize the real backend with the expected bucket and
   `gcp/infra` prefix.
3. Inspect current state and import any already-existing identity resources needed to prevent
   replacement surprises. There is intentionally no generic import helper: derive every address and
   provider ID from the reviewed current inventory. Review the migration away from the retired
   shared pool and deployer.
4. Create a saved, narrow trust-boundary plan using explicit values for project, region, repository,
   and buckets. Do not use a GitHub workflow or an identity being created by that plan.
5. Inspect the full state-backed plan. Confirm five distinct pools/providers/accounts, exact-subject
   bindings, deletion of shared CI grants, resource-level deploy grants, and no unrelated change.
6. Only after separate human approval, the administrator may apply that exact reviewed plan. This
   repository change neither performs nor authorizes that apply.
7. Populate environment/repository credentials from Terraform outputs:
   - publisher: `GCP_WIF_PUBLISHER_PROVIDER`, `GCP_WIF_PUBLISHER_SA_EMAIL`
   - dev: `GCP_WIF_DEV_PROVIDER`, `GCP_WIF_DEV_SA_EMAIL`
   - prod: `GCP_WIF_PROD_PROVIDER`, `GCP_WIF_PROD_SA_EMAIL`
   - apply environment: `GCP_WIF_APPLY_PROVIDER`, `GCP_WIF_APPLY_SA_EMAIL`
   - optional review planning: `GCP_WIF_PLAN_PROVIDER`, `GCP_WIF_PLAN_SA_EMAIL`
8. Protect `dev`, `prod`, and `terraform-apply` environments as appropriate. Keep production and
   apply manual-only. Do not configure legacy `GCP_WIF_PROVIDER` / `GCP_WIF_SA_EMAIL` fallbacks.
9. From representative PR, main, and dev OIDC subjects, verify impersonation of the production and
   apply service accounts is denied. Verify the publisher cannot deploy and dev cannot mutate the
   production bucket or act as the production runtime.
10. Verify a dev-only deployment against the named dev services, then set the repository variable
    `DEV_DEPLOY_ENABLED=true`. Until that proof exists, automatic cloud jobs must skip safely.

### Optional read-only remote planning

Credential-free pull-request `fmt`, backend-disabled `init`, `validate`, and policy checks are the
required merge checks. Authenticated remote planning is optional and manual. Terraform state can
contain secrets, so the plan service account receives no project-level storage role in this
configuration.

If remote planning is needed, use this separate **external bootstrap**:

1. A trusted administrator selects the exact existing GCS state bucket after confirming its project,
   name, and backend prefix.
2. At that bucket only, grant the plan service account `roles/storage.objectViewer`. Do not grant a
   project-level storage role or access to any other bucket.
3. Keep remote `terraform plan` read-only and use `-lock=false`; never apply from the planning
   identity and never upload the resulting plan file as an artifact.
4. Verify the plan service account can read the required state object but cannot list or read an
   unrelated bucket and cannot create, replace, or delete state objects.
5. Record the bucket-level IAM binding and those negative checks as provider evidence before enabling
   a manual remote-plan workflow.

The exact state bucket, its object grant, remote state contents, and negative permission checks are
externally `NOT_VERIFIED` until that evidence is recorded.

The authenticated plan, live IAM bindings, environment protections, secret placement, negative
impersonation tests, and actual dev deployment remain externally `NOT_VERIFIED` by source checks.

## Provider decision

The reviewed baseline is Terraform `1.15.x` and `hashicorp/google` `5.45.2`. The lockfile records
that exact provider. A Google provider 7 migration is deferred to a dedicated, authenticated
infrastructure change because a provider-major upgrade requires remote-state schema review and a
separately approved plan. Do not combine it with application delivery or run `init -upgrade`
casually.

## Manual apply mechanics

The `Terraform Apply (manual)` workflow accepts only the 40-character SHA currently at the tip of
`main` and the exact confirmation `APPLY_TERRAFORM`. The protected environment supplies backend,
project, region, bucket, and apply-only WIF configuration. The job checks out that SHA, proves it is
the current remote main tip, plans it, applies the same local binary, and deletes the binary even on
failure. It never consumes PR output or an artifact from another run.
