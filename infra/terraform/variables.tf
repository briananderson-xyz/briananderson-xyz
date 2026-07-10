variable "project_id" { type = string }
variable "region" {
  type    = string
  default = "us-central1"
}
variable "bucket_name" {
  type    = string
  default = "briananderson.xyz"
}
variable "auth_proxy_domain" {
  type    = string
  default = "auth.briananderson.xyz"
}
variable "site_domain" {
  type    = string
  default = "briananderson.xyz"
}
variable "github_org" {
  type    = string
  default = "briananderson-xyz"
}
variable "github_repo" {
  type    = string
  default = "briananderson-xyz"
}
variable "github_branch" {
  type    = string
  default = "main"
}
variable "wif_plan_pool_id" {
  type    = string
  default = "github-plan-pool"
}
variable "wif_plan_provider_id" {
  type    = string
  default = "github-oidc-plan"
}
variable "wif_plan_sa_name" {
  type    = string
  default = "github-terraform-planner"
}
variable "terraform_state_bucket" {
  description = "Exact GCS bucket containing the Terraform backend state"
  type        = string
  default     = "briananderson-xyz-tf-state"
}
variable "wif_publisher_pool_id" {
  type    = string
  default = "github-publisher-pool"
}
variable "wif_publisher_provider_id" {
  type    = string
  default = "github-oidc-publisher"
}
variable "wif_publisher_sa_name" {
  type    = string
  default = "github-artifact-publisher"
}
variable "wif_dev_pool_id" {
  type    = string
  default = "github-dev-pool"
}
variable "wif_dev_provider_id" {
  type    = string
  default = "github-oidc-dev"
}
variable "wif_dev_sa_name" {
  type    = string
  default = "github-dev-deployer"
}
variable "wif_prod_pool_id" {
  type    = string
  default = "github-prod-pool"
}
variable "wif_prod_provider_id" {
  type    = string
  default = "github-oidc-prod"
}
variable "wif_prod_sa_name" {
  type    = string
  default = "github-prod-deployer"
}
variable "wif_apply_pool_id" {
  type    = string
  default = "github-apply-pool"
}
variable "wif_apply_provider_id" {
  type    = string
  default = "github-oidc-apply"
}
variable "wif_apply_sa_name" {
  type    = string
  default = "github-terraform-applier"
}
variable "auth_proxy_image" {
  type    = string
  default = ""
} # e.g., us-central1-docker.pkg.dev/PROJECT/containers/decap-auth-proxy:SHA

variable "allowed_repository_owner_ids" {
  description = "List of GitHub repository owner IDs allowed to authenticate"
  type        = list(string)
  default     = ["256009379", "4603907"]
}

variable "manage_deployment_service_iam" {
  description = "Manage resource-level Cloud Run deployer IAM after the named services are verified to exist"
  type        = bool
  default     = false
}

variable "dev_cloud_run_services" {
  description = "Existing dev Cloud Run services eligible for the dev deployer grant"
  type        = list(string)
  default     = ["chat-dev", "fitfinder-dev"]
}

variable "prod_cloud_run_services" {
  description = "Existing production Cloud Run services eligible for the prod deployer grant"
  type        = list(string)
  default     = ["chat", "fitfinder"]
}
