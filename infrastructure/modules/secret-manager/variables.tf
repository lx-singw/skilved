variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The primary region for secret replication (defaults to africa-south1)"
  type        = string
  default     = "africa-south1"
}

variable "secrets" {
  description = "The list of secrets to provision"
  type        = list(string)
  default = [
    "GEMINI_API_KEY",
    "CAPTCHA_SOLVER_API_KEY",
    "WHATSAPP_API_TOKEN",
    "SAQA_API_URL",
    "PAYFAST_MERCHANT_ID",
    "PAYFAST_MERCHANT_KEY",
    "ID_HASH_SALT"
  ]
}
