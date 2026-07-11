resource "google_discovery_engine_data_store" "opportunities" {
  project           = var.project_id
  location          = var.location
  data_store_id     = "skilved-opportunities"
  display_name      = "Skilved Opportunities"
  industry_vertical = "GENERIC"
  content_config    = "CONTENT_REQUIRED"
}
