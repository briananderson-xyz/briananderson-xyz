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

# Service account for Cloud Run runtime
resource "google_service_account" "cloud_run_runtime" {
  account_id   = "cloud-run-runtime"
  display_name = "Cloud Run Runtime"
  description  = "Runtime service account for briananderson.xyz API functions"
}

# Allow Cloud Run runtime SA to read the Gemini API key
resource "google_secret_manager_secret_iam_member" "cloud_run_secret_accessor" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
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

# IAM: Cloud Run runtime SA can read secrets (for future secrets too)
resource "google_project_iam_member" "run_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

output "artifact_registry_repo" { value = google_artifact_registry_repository.functions.name }
output "cloud_run_runtime_sa" { value = google_service_account.cloud_run_runtime.email }
output "gemini_secret_name" { value = google_secret_manager_secret.gemini_api_key.name }
