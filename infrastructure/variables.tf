variable "project_id" {
  description = "The GCP Project ID to host resources"
  type        = string
}

variable "region" {
  description = "The primary region for resource provisioning (defaults to africa-south1 for POPIA)"
  type        = string
  default     = "africa-south1"
}

variable "environment" {
  description = "The target environment (e.g. dev, staging, prod)"
  type        = string
}

variable "cloud_run_services" {
  description = "Map of Cloud Run service configs"
  type = map(object({
    image                 = string
    service_account_email = string
    env_vars              = optional(map(string), {})
    secrets               = optional(map(string), {})
  }))
  default = {}
}

variable "scout_target_uri" {
  description = "URI of the scout agent Cloud Run service for scheduler"
  type        = string
  default     = ""
}

variable "analyst_target_uri" {
  description = "URI of the analyst agent Cloud Run service for scheduler"
  type        = string
  default     = ""
}

variable "cs_target_uri" {
  description = "URI of the customer success agent Cloud Run service for scheduler"
  type        = string
  default     = ""
}
