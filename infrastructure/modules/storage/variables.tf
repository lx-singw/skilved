variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "environment" {
  description = "The target environment (e.g. dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "The region for buckets (defaults to africa-south1)"
  type        = string
  default     = "africa-south1"
}

variable "cmek_key_id" {
  description = "The KMS crypto key ID for CMEK-encrypted buckets"
  type        = string
  default     = null
}

variable "document_service_sa_email" {
  description = "Email of the document service SA"
  type        = string
}

variable "agents_sa_email" {
  description = "Email of the agents SA"
  type        = string
}

variable "verification_sa_email" {
  description = "Email of the verification SA"
  type        = string
}
