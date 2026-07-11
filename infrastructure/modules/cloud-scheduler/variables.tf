variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The region for the scheduler jobs"
  type        = string
}

variable "service_account_email" {
  description = "The service account email for OIDC authentication"
  type        = string
}

variable "scout_schedule" {
  description = "Cron schedule for the scout agent"
  type        = string
  default     = "0 */4 * * *"
}

variable "scout_target_uri" {
  description = "URI of the scout agent Cloud Run service"
  type        = string
}

variable "analyst_schedule" {
  description = "Cron schedule for the analyst agent"
  type        = string
  default     = "30 */4 * * *"
}

variable "analyst_target_uri" {
  description = "URI of the analyst agent Cloud Run service"
  type        = string
}

variable "cs_schedule" {
  description = "Cron schedule for the customer success agent"
  type        = string
  default     = "0 8 * * *"
}

variable "cs_target_uri" {
  description = "URI of the customer success agent Cloud Run service"
  type        = string
}
