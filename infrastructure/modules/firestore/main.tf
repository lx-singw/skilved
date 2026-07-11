resource "google_firestore_database" "database" {
  project                           = var.project_id
  name                              = "(default)"
  location_id                       = var.location_id
  type                              = "FIRESTORE_NATIVE"
  concurrency_mode                  = "OPTIMISTIC"
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"
}
