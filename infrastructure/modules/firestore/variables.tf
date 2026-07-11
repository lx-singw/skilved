variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "location_id" {
  description = "The location for the Firestore database"
  type        = string
  default     = "africa-south1"
}
