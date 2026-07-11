resource "google_firestore_index" "opps_trade_province_status_discovered" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "opportunities"

  fields {
    field_path = "tradeCategory"
    order      = "ASCENDING"
  }
  fields {
    field_path = "province"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "discoveredAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "opps_trade_status_deadline" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "opportunities"

  fields {
    field_path = "tradeCategory"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "deadline"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "opps_type_province_status_discovered" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "opportunities"

  fields {
    field_path = "opportunityType"
    order      = "ASCENDING"
  }
  fields {
    field_path = "province"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "discoveredAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "opps_status_discovered" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "opportunities"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "discoveredAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "opps_quality_status" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "opportunities"

  fields {
    field_path = "qualityDecision"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}
