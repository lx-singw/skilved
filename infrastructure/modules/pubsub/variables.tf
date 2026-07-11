variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "topics" {
  description = "The list of Pub/Sub topics to create"
  type        = list(string)
  default     = ["dlp-log-scan", "new_opportunity", "opportunity_analysed"]
}
