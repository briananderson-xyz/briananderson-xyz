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

# Workload Identity Federation (GitHub OIDC)
resource "google_iam_workload_identity_pool" "pool" {
  workload_identity_pool_id = var.wif_pool_id
  display_name              = "GitHub OIDC"
}

resource "google_iam_workload_identity_pool_provider" "provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_provider_id
  display_name                       = "GitHub OIDC Provider"

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
    "attribute.ref"                 = "assertion.ref"
    "attribute.actor"               = "assertion.actor"
  }

  # Limit which GitHub repo/branch can assume this identity
  attribute_condition = "attribute.repository_owner_id in ${jsonencode(var.allowed_repository_owner_ids)} && (attribute.ref == 'refs/heads/main' || matches(attribute.ref, '^refs/pull/.*$'))"

  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

# CI service account impersonated by GitHub via WIF
resource "google_service_account" "github_ci" {
  account_id   = var.wif_sa_name
  display_name = "GitHub CI Deployer"
}

resource "google_service_account_iam_member" "wif_bind" {
  service_account_id = google_service_account.github_ci.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.pool.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

# Minimum roles for CI
resource "google_project_iam_member" "ci_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.github_ci.email}"
}

resource "google_project_iam_member" "ci_serviceusage_viewer" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageViewer"
  member  = "serviceAccount:${google_service_account.github_ci.email}"
}

output "wif_pool_name" { value = google_iam_workload_identity_pool.pool.name }
output "wif_provider_name" { value = google_iam_workload_identity_pool_provider.provider.name }
output "ci_service_account" { value = google_service_account.github_ci.email }
output "site_bucket" { value = google_storage_bucket.site.url }
output "site_dev_bucket" { value = google_storage_bucket.site_dev.url }
# Bucket location corrected to match remote (US)
