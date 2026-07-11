output "project_id" {
  description = "The GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "The default GCP Region"
  value       = var.region
}

output "environment" {
  description = "The deployment environment"
  value       = var.environment
}

output "web_sa_email" {
  description = "Web application service account email"
  value       = module.iam.web_sa_email
}

output "agents_sa_email" {
  description = "AI agents service account email"
  value       = module.iam.agents_sa_email
}

output "document_service_sa_email" {
  description = "Document microservice service account email"
  value       = module.iam.document_service_sa_email
}

output "kms_key_id" {
  description = "KMS document encryption key ID"
  value       = module.kms.crypto_key_id
}

output "bucket_documents" {
  description = "Documents bucket name"
  value       = module.storage.documents_bucket_name
}

output "bucket_identity" {
  description = "Identity documents bucket name"
  value       = module.storage.identity_bucket_name
}

output "bucket_screenshots" {
  description = "Screenshots bucket name"
  value       = module.storage.screenshots_bucket_name
}

output "bigquery_dataset" {
  description = "BigQuery dataset ID"
  value       = module.bigquery.dataset_id
}
