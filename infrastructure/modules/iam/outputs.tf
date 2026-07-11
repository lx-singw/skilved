output "web_sa_email" {
  description = "The email of the web application service account"
  value       = google_service_account.web.email
}

output "agents_sa_email" {
  description = "The email of the AI agents service account"
  value       = google_service_account.agents.email
}

output "document_service_sa_email" {
  description = "The email of the document microservice service account"
  value       = google_service_account.document_service.email
}

output "verification_sa_email" {
  description = "The email of the verification service account"
  value       = google_service_account.verification.email
}

output "admin_sa_email" {
  description = "The email of the admin service account"
  value       = google_service_account.admin.email
}
