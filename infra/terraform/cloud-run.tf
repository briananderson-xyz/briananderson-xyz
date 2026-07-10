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

# Publishing can write images, but cannot deploy them.
resource "google_artifact_registry_repository_iam_member" "publisher" {
  project    = google_artifact_registry_repository.functions.project
  location   = google_artifact_registry_repository.functions.location
  repository = google_artifact_registry_repository.functions.repository_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.publisher.email}"
}

# Deployment identities can resolve and deploy immutable images from this
# repository, but cannot publish, retag, or administer them.
resource "google_artifact_registry_repository_iam_member" "dev_reader" {
  project    = google_artifact_registry_repository.functions.project
  location   = google_artifact_registry_repository.functions.location
  repository = google_artifact_registry_repository.functions.repository_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_artifact_registry_repository_iam_member" "prod_reader" {
  project    = google_artifact_registry_repository.functions.project
  location   = google_artifact_registry_repository.functions.location
  repository = google_artifact_registry_repository.functions.repository_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.prod.email}"
}

# Deployment identities can act only as their environment's runtime account.
resource "google_service_account_iam_member" "dev_act_as_run" {
  service_account_id = google_service_account.cloud_run_runtime_dev.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_service_account_iam_member" "prod_act_as_run" {
  service_account_id = google_service_account.cloud_run_runtime_prod.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.prod.email}"
}

resource "google_storage_bucket_iam_member" "dev_deployer" {
  bucket = google_storage_bucket.site_dev.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_storage_bucket_iam_member" "prod_deployer" {
  bucket = google_storage_bucket.site.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.prod.email}"
}

# gcloud storage rsync reads bucket metadata after synchronizing objects.
# Legacy Bucket Reader is bucket-scoped and contains no write permissions.
resource "google_storage_bucket_iam_member" "dev_bucket_metadata_reader" {
  bucket = google_storage_bucket.site_dev.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_storage_bucket_iam_member" "prod_bucket_metadata_reader" {
  bucket = google_storage_bucket.site.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.prod.email}"
}

# Cloud Run service-level grants are disabled by default so a trust bootstrap
# does not require the application services to exist. Enable only after an
# administrator verifies the named services and reviews the state-backed plan.
resource "google_cloud_run_v2_service_iam_member" "dev_deployer" {
  for_each = var.manage_deployment_service_iam ? toset(var.dev_cloud_run_services) : toset([])

  project  = var.project_id
  location = var.region
  name     = each.value
  role     = "roles/run.developer"
  member   = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_cloud_run_v2_service_iam_member" "prod_deployer" {
  for_each = var.manage_deployment_service_iam ? toset(var.prod_cloud_run_services) : toset([])

  project  = var.project_id
  location = var.region
  name     = each.value
  role     = "roles/run.developer"
  member   = "serviceAccount:${google_service_account.prod.email}"
}

output "artifact_registry_repo" { value = google_artifact_registry_repository.functions.name }
output "cloud_run_runtime_sa" { value = google_service_account.cloud_run_runtime.email }
output "cloud_run_runtime_dev_sa" { value = google_service_account.cloud_run_runtime_dev.email }
output "cloud_run_runtime_prod_sa" { value = google_service_account.cloud_run_runtime_prod.email }
output "gemini_secret_name" { value = google_secret_manager_secret.gemini_api_key.name }
output "origin_verify_dev_secret_name" { value = google_secret_manager_secret.origin_verify_token_dev.name }
output "origin_verify_prod_secret_name" { value = google_secret_manager_secret.origin_verify_token_prod.name }
