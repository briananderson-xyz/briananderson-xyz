# GCS site bucket (production) - trunk-based CI/CD test
resource "google_storage_bucket" "site" {
  name          = var.bucket_name
  location      = "US"
  force_destroy = false

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["https://${var.site_domain}", "https://www.${var.site_domain}"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
}

# Public read for objects (so CDN can cache) - trunk-based CI/CD test
resource "google_storage_bucket_iam_binding" "public_read" {
  bucket  = google_storage_bucket.site.name
  role    = "roles/storage.objectViewer"
  members = ["allUsers"]
}

# GCS site bucket (dev)
resource "google_storage_bucket" "site_dev" {
  name          = "dev.briananderson.xyz"
  location      = "US"
  force_destroy = false

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["https://dev.briananderson.xyz"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
}

# Public read for dev bucket
resource "google_storage_bucket_iam_binding" "public_read_dev" {
  bucket  = google_storage_bucket.site_dev.name
  role    = "roles/storage.objectViewer"
  members = ["allUsers"]
}

# Each authority has its own WIF pool, provider, and service account. Provider
# conditions and IAM bindings both select one exact GitHub OIDC subject.
locals {
  wif_subjects = {
    plan      = "repo:${var.github_org}/${var.github_repo}:pull_request"
    publisher = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
    dev       = "repo:${var.github_org}/${var.github_repo}:environment:dev"
    prod      = "repo:${var.github_org}/${var.github_repo}:environment:prod"
    apply     = "repo:${var.github_org}/${var.github_repo}:environment:terraform-apply"
  }
}

resource "google_iam_workload_identity_pool" "plan" {
  workload_identity_pool_id = var.wif_plan_pool_id
  display_name              = "GitHub Terraform Plan"
}

resource "google_iam_workload_identity_pool" "publisher" {
  workload_identity_pool_id = var.wif_publisher_pool_id
  display_name              = "GitHub Artifact Publisher"
}

resource "google_iam_workload_identity_pool" "dev" {
  workload_identity_pool_id = var.wif_dev_pool_id
  display_name              = "GitHub Dev Deploy"
}

resource "google_iam_workload_identity_pool" "prod" {
  workload_identity_pool_id = var.wif_prod_pool_id
  display_name              = "GitHub Prod Deploy"
}

resource "google_iam_workload_identity_pool" "apply" {
  workload_identity_pool_id = var.wif_apply_pool_id
  display_name              = "GitHub Terraform Apply"
}

resource "google_iam_workload_identity_pool_provider" "plan" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.plan.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_plan_provider_id
  display_name                       = "Terraform Plan"
  attribute_mapping                  = { "google.subject" = "assertion.sub" }
  attribute_condition                = "assertion.sub == '${local.wif_subjects.plan}' && assertion.repository == '${var.github_org}/${var.github_repo}' && assertion.event_name == 'pull_request' && assertion.repository_owner_id in ${jsonencode(var.allowed_repository_owner_ids)}"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_iam_workload_identity_pool_provider" "publisher" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.publisher.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_publisher_provider_id
  display_name                       = "Artifact Publisher"
  attribute_mapping                  = { "google.subject" = "assertion.sub" }
  attribute_condition                = "assertion.sub == '${local.wif_subjects.publisher}' && assertion.repository == '${var.github_org}/${var.github_repo}' && assertion.event_name == 'push' && assertion.ref == 'refs/heads/${var.github_branch}' && assertion.repository_owner_id in ${jsonencode(var.allowed_repository_owner_ids)}"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_iam_workload_identity_pool_provider" "dev" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.dev.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_dev_provider_id
  display_name                       = "Dev Deploy"
  attribute_mapping                  = { "google.subject" = "assertion.sub" }
  attribute_condition                = "assertion.sub == '${local.wif_subjects.dev}' && assertion.repository == '${var.github_org}/${var.github_repo}' && assertion.event_name == 'push' && assertion.ref == 'refs/heads/${var.github_branch}' && assertion.repository_owner_id in ${jsonencode(var.allowed_repository_owner_ids)}"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_iam_workload_identity_pool_provider" "prod" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.prod.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_prod_provider_id
  display_name                       = "Prod Deploy"
  attribute_mapping                  = { "google.subject" = "assertion.sub" }
  attribute_condition                = "assertion.sub == '${local.wif_subjects.prod}' && assertion.repository == '${var.github_org}/${var.github_repo}' && assertion.event_name == 'workflow_dispatch' && assertion.ref == 'refs/heads/${var.github_branch}' && assertion.repository_owner_id in ${jsonencode(var.allowed_repository_owner_ids)}"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_iam_workload_identity_pool_provider" "apply" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.apply.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_apply_provider_id
  display_name                       = "Terraform Apply"
  attribute_mapping                  = { "google.subject" = "assertion.sub" }
  attribute_condition                = "assertion.sub == '${local.wif_subjects.apply}' && assertion.repository == '${var.github_org}/${var.github_repo}' && assertion.event_name == 'push' && assertion.ref == 'refs/heads/${var.github_branch}' && assertion.repository_owner_id in ${jsonencode(var.allowed_repository_owner_ids)}"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_service_account" "plan" {
  account_id   = var.wif_plan_sa_name
  display_name = "GitHub Terraform Planner"
  description  = "Read-only review identity; not used by required PR validation"
}

resource "google_service_account" "publisher" {
  account_id   = var.wif_publisher_sa_name
  display_name = "GitHub Artifact Publisher"
}

resource "google_service_account" "dev" {
  account_id   = var.wif_dev_sa_name
  display_name = "GitHub Dev Deployer"
}

resource "google_service_account" "prod" {
  account_id   = var.wif_prod_sa_name
  display_name = "GitHub Prod Deployer"
}

resource "google_service_account" "apply" {
  account_id   = var.wif_apply_sa_name
  display_name = "GitHub Terraform Applier"
  description  = "Infrastructure authority available only to the terraform-apply environment"
}

resource "google_service_account_iam_member" "wif_plan" {
  service_account_id = google_service_account.plan.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.plan.name}/subject/${local.wif_subjects.plan}"
}

resource "google_service_account_iam_member" "wif_publisher" {
  service_account_id = google_service_account.publisher.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.publisher.name}/subject/${local.wif_subjects.publisher}"
}

resource "google_service_account_iam_member" "wif_dev" {
  service_account_id = google_service_account.dev.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.dev.name}/subject/${local.wif_subjects.dev}"
}

resource "google_service_account_iam_member" "wif_prod" {
  service_account_id = google_service_account.prod.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.prod.name}/subject/${local.wif_subjects.prod}"
}

resource "google_service_account_iam_member" "wif_apply" {
  service_account_id = google_service_account.apply.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.apply.name}/subject/${local.wif_subjects.apply}"
}

# Planning requires resource metadata reads, but no mutation roles.
resource "google_project_iam_member" "plan_viewer" {
  project = var.project_id
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.plan.email}"
}

resource "google_project_iam_member" "plan_secret_viewer" {
  project = var.project_id
  role    = "roles/secretmanager.viewer"
  member  = "serviceAccount:${google_service_account.plan.email}"
}

# Remote planning can read only the configured backend bucket. This must never
# become a project-level Storage grant or a write-capable bucket role.
resource "google_storage_bucket_iam_member" "plan_state_reader" {
  bucket = var.terraform_state_bucket
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.plan.email}"
}

# The applier is separate from the application deployer. These roles cover the
# resource types declared in this directory and are never granted to PR jobs.
locals {
  terraform_apply_roles = toset([
    "roles/artifactregistry.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.workloadIdentityPoolAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/run.admin",
    "roles/secretmanager.admin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/storage.admin",
  ])
}

resource "google_project_iam_member" "terraform_apply" {
  for_each = local.terraform_apply_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.apply.email}"
}

output "wif_plan_provider_name" { value = google_iam_workload_identity_pool_provider.plan.name }
output "wif_publisher_provider_name" { value = google_iam_workload_identity_pool_provider.publisher.name }
output "wif_dev_provider_name" { value = google_iam_workload_identity_pool_provider.dev.name }
output "wif_prod_provider_name" { value = google_iam_workload_identity_pool_provider.prod.name }
output "wif_apply_provider_name" { value = google_iam_workload_identity_pool_provider.apply.name }
output "terraform_plan_service_account" { value = google_service_account.plan.email }
output "artifact_publisher_service_account" { value = google_service_account.publisher.email }
output "dev_deployer_service_account" { value = google_service_account.dev.email }
output "prod_deployer_service_account" { value = google_service_account.prod.email }
output "terraform_apply_service_account" { value = google_service_account.apply.email }
output "site_bucket" { value = google_storage_bucket.site.url }
output "site_dev_bucket" { value = google_storage_bucket.site_dev.url }
# Bucket location corrected to match remote (US)
