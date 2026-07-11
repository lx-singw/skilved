variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The region for the key ring (defaults to africa-south1)"
  type        = string
  default     = "africa-south1"
}
