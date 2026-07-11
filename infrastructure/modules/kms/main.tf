resource "google_kms_key_ring" "documents" {
  project  = var.project_id
  name     = "skilved-documents"
  location = var.region

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key" "document_encryption" {
  name            = "document-encryption-key"
  key_ring        = google_kms_key_ring.documents.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = "7776000s"

  lifecycle {
    prevent_destroy = true
  }
}
