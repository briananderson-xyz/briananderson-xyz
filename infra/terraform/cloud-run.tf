# Cloud Run infrastructure for site AI functions (chat + fit-finder)
# Consolidated into the main hosting project (briananderson-xyz-468620)
# to avoid the separate Firebase project (briananderson-xyz-ai).

# Artifact Registry repository for function container images
resource "google_artifact_registry_repository" "functions" {
  location      = var.region
  repository_id = "site-functions"
  format        = "DOCKER"
  description   = "Container images for briananderson.xyz AI functions"

  depends_on = [google_project_service.required]
}

# Secret Manager secret for Gemini API key
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"

  depends_on = [google_project_service.required]

  replication {
    auto {}
  }
}

# Shared secrets expected on Cloud Run API requests. Cloudflare Workers inject
# these as X-Origin-Verify; direct run.app callers do not have them.
resource "google_secret_manager_secret" "origin_verify_token_dev" {
  secret_id = "origin-verify-token-dev"

  depends_on = [google_project_service.required]

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "origin_verify_token_prod" {
  secret_id = "origin-verify-token-prod"

  depends_on = [google_project_service.required]

  replication {
    auto {}
  }
}

# Service account for Cloud Run runtime
resource "google_service_account" "cloud_run_runtime" {
  account_id   = "cloud-run-runtime"
  display_name = "Cloud Run Runtime"
  description  = "Legacy runtime service account for briananderson.xyz API functions"
}

resource "google_service_account" "cloud_run_runtime_dev" {
  account_id   = "cloud-run-runtime-dev"
  display_name = "Cloud Run Runtime Dev"
  description  = "Runtime service account for dev briananderson.xyz API functions"
}

resource "google_service_account" "cloud_run_runtime_prod" {
  account_id   = "cloud-run-runtime-prod"
  display_name = "Cloud Run Runtime Prod"
  description  = "Runtime service account for prod briananderson.xyz API functions"
}

# Allow Cloud Run runtime SAs to read the Gemini API key. The legacy grant is
# kept until existing services have rolled onto the environment-specific SAs.
resource "google_secret_manager_secret_iam_member" "cloud_run_secret_accessor" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_dev_gemini_accessor" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime_dev.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_prod_gemini_accessor" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime_prod.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_origin_verify_dev_accessor" {
  secret_id = google_secret_manager_secret.origin_verify_token_dev.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime_dev.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_origin_verify_prod_accessor" {
  secret_id = google_secret_manager_secret.origin_verify_token_prod.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime_prod.email}"
}

# IAM: CI service account can push images to Artifact Registry
resource "google_project_iam_member" "ci_artifactregistry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_ci.email}"
}

# IAM: CI service account can view secrets (needed for terraform plan)
resource "google_project_iam_member" "ci_secretmanager_viewer" {
  project = var.project_id
  role    = "roles/secretmanager.viewer"
  member  = "serviceAccount:${google_service_account.github_ci.email}"
}

# IAM: CI service account can deploy Cloud Run services
resource "google_project_iam_member" "ci_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_ci.email}"
}

# IAM: CI service account can act as the Cloud Run runtime SA
resource "google_service_account_iam_member" "ci_act_as_run" {
  service_account_id = google_service_account.cloud_run_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_ci.email}"
}

resource "google_service_account_iam_member" "ci_act_as_run_dev" {
  service_account_id = google_service_account.cloud_run_runtime_dev.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_ci.email}"
}

resource "google_service_account_iam_member" "ci_act_as_run_prod" {
  service_account_id = google_service_account.cloud_run_runtime_prod.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_ci.email}"
}

output "artifact_registry_repo" { value = google_artifact_registry_repository.functions.name }
output "cloud_run_runtime_sa" { value = google_service_account.cloud_run_runtime.email }
output "cloud_run_runtime_dev_sa" { value = google_service_account.cloud_run_runtime_dev.email }
output "cloud_run_runtime_prod_sa" { value = google_service_account.cloud_run_runtime_prod.email }
output "gemini_secret_name" { value = google_secret_manager_secret.gemini_api_key.name }
output "origin_verify_dev_secret_name" { value = google_secret_manager_secret.origin_verify_token_dev.name }
output "origin_verify_prod_secret_name" { value = google_secret_manager_secret.origin_verify_token_prod.name }
