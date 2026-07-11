resource "google_storage_bucket" "documents" {
  name                        = "skilved-documents-${var.environment}"
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
  encryption {
    default_kms_key_name = var.cmek_key_id
  }
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 3
    }
  }
}

resource "google_storage_bucket" "identity" {
  name                        = "skilved-identity-${var.environment}"
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
  encryption {
    default_kms_key_name = var.cmek_key_id
  }
  retention_policy {
    retention_period = 31536000
  }
}

resource "google_storage_bucket" "screenshots" {
  name                        = "skilved-screenshots-${var.environment}"
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "government_reports" {
  name                        = "skilved-government-reports-${var.environment}"
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "audit_logs" {
  name                        = "skilved-audit-logs-${var.environment}"
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
}

# Bucket-level IAM

resource "google_storage_bucket_iam_member" "documents_doc_service_admin" {
  bucket = google_storage_bucket.documents.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.document_service_sa_email}"
}

resource "google_storage_bucket_iam_member" "identity_doc_service_admin" {
  bucket = google_storage_bucket.identity.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.document_service_sa_email}"
}

resource "google_storage_bucket_iam_member" "documents_agents_viewer" {
  bucket = google_storage_bucket.documents.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.agents_sa_email}"
}

resource "google_storage_bucket_iam_member" "screenshots_agents_admin" {
  bucket = google_storage_bucket.screenshots.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.agents_sa_email}"
}

resource "google_storage_bucket_iam_member" "documents_verification_viewer" {
  bucket = google_storage_bucket.documents.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.verification_sa_email}"
}
