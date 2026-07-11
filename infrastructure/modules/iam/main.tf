resource "google_service_account" "web" {
  account_id   = "skilved-web"
  display_name = "Skilved Web Application"
  project      = var.project_id
}

resource "google_service_account" "agents" {
  account_id   = "skilved-agents"
  display_name = "Skilved AI Agents"
  project      = var.project_id
}

resource "google_service_account" "document_service" {
  account_id   = "skilved-document-service"
  display_name = "Skilved Document Microservice"
  project      = var.project_id
}

resource "google_service_account" "verification" {
  account_id   = "skilved-verification"
  display_name = "Skilved SAQA/NAMB Verifier"
  project      = var.project_id
}

resource "google_service_account" "admin" {
  account_id   = "skilved-admin"
  display_name = "Skilved Admin"
  project      = var.project_id
}

# --- Project-level IAM bindings (least-privilege) ---

# Role allocations helper locals
locals {
  web_roles = [
    "roles/datastore.user",
    "roles/bigquery.dataEditor",
    "roles/secretmanager.secretAccessor"
  ]
  agents_roles = [
    "roles/datastore.user",
    "roles/bigquery.dataEditor",
    "roles/aiplatform.user"
  ]
  doc_service_roles = [
    "roles/datastore.user",
    "roles/bigquery.dataEditor",
    "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  ]
  verification_roles = [
    "roles/datastore.user"
  ]
  admin_roles = [
    "roles/datastore.viewer",
    "roles/bigquery.dataViewer"
  ]
}

resource "google_project_iam_member" "web_bindings" {
  for_each = toset(local.web_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.web.email}"
}

resource "google_project_iam_member" "agents_bindings" {
  for_each = toset(local.agents_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.agents.email}"
}

resource "google_project_iam_member" "doc_service_bindings" {
  for_each = toset(local.doc_service_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.document_service.email}"
}

resource "google_project_iam_member" "verification_bindings" {
  for_each = toset(local.verification_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.verification.email}"
}

resource "google_project_iam_member" "admin_bindings" {
  for_each = toset(local.admin_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.admin.email}"
}
