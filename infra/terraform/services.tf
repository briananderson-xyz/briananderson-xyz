# Enable required Google APIs (Phase 1)

locals {
  required_services = [
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    # Recommended for WIF and IAM
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    # Cloud Run functions deployment
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
  ]
}

resource "google_project_service" "required" {
  for_each = toset(local.required_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
