variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "location" {
  description = "The location for the Discovery Engine / Vertex AI search (defaults to global)"
  type        = string
  default     = "global"
}
