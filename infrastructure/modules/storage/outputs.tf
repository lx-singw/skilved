output "documents_bucket_name" {
  description = "Name of the documents bucket"
  value       = google_storage_bucket.documents.name
}

output "identity_bucket_name" {
  description = "Name of the identity documents bucket"
  value       = google_storage_bucket.identity.name
}

output "screenshots_bucket_name" {
  description = "Name of the screenshots bucket"
  value       = google_storage_bucket.screenshots.name
}

output "government_reports_bucket_name" {
  description = "Name of the government reports bucket"
  value       = google_storage_bucket.government_reports.name
}

output "audit_logs_bucket_name" {
  description = "Name of the audit logs bucket"
  value       = google_storage_bucket.audit_logs.name
}
