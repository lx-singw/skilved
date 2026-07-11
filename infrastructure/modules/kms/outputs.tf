output "key_ring_id" {
  description = "The ID of the KMS key ring"
  value       = google_kms_key_ring.documents.id
}

output "crypto_key_id" {
  description = "The ID of the KMS crypto key"
  value       = google_kms_crypto_key.document_encryption.id
}

output "crypto_key_name" {
  description = "The resource name of the crypto key (for CMEK bucket config)"
  value       = google_kms_crypto_key.document_encryption.id
}
