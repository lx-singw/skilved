variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "environment" {
  description = "The target environment"
  type        = string
}

variable "region" {
  description = "The region for the dataset (defaults to africa-south1)"
  type        = string
  default     = "africa-south1"
}
