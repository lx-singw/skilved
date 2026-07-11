variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The region to deploy the Cloud Run service"
  type        = string
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
}

variable "image" {
  description = "The container image to deploy"
  type        = string
  default     = "gcr.io/cloudrun/placeholder"
}

variable "service_account_email" {
  description = "The service account email for the service"
  type        = string
}

variable "env_vars" {
  description = "Map of environment variables to inject"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Map of environment variable name to Secret Manager secret ID"
  type        = map(string)
  default     = {}
}
