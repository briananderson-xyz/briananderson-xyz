terraform {
  required_version = "~> 1.15.0"

  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.45.0" }
  }

  # Configure in CI with -backend-config="bucket=..." -backend-config="prefix=..."
  backend "gcs" {}
}
