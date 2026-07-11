output "dataset_id" {
  description = "The BigQuery dataset ID"
  value       = google_bigquery_dataset.dataset.dataset_id
}

output "dataset_project" {
  description = "The project of the BigQuery dataset"
  value       = google_bigquery_dataset.dataset.project
}
