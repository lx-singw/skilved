resource "google_bigquery_dataset" "dataset" {
  dataset_id                  = "skilved_${var.environment}"
  friendly_name               = "Skilved Analytics Dataset (${var.environment})"
  description                 = "Analytical and tracking dataset for Skilved AI Agents"
  location                    = var.region
  project                     = var.project_id
  default_table_expiration_ms = null
}

resource "google_bigquery_table" "events" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "events"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "event_at"
  }

  clustering = ["event_type", "user_id", "opportunity_id"]

  schema = file("${path.module}/schema/events.json")
}

resource "google_bigquery_table" "outcomes" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "outcomes"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "outcome_at"
  }

  clustering = ["outcome_type", "opp_trade", "opp_province"]

  schema = file("${path.module}/schema/outcomes.json")
}

resource "google_bigquery_table" "agent_runs" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "agent_runs"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "started_at"
  }

  clustering = ["agent_name", "status"]

  schema = file("${path.module}/schema/agent_runs.json")
}

resource "google_bigquery_table" "quality_decisions" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "quality_decisions"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "decided_at"
  }

  clustering = ["decision", "source_name"]

  schema = file("${path.module}/schema/quality_decisions.json")
}

resource "google_bigquery_table" "graph_skills" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "graph_skills"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "last_updated"
  }

  clustering = ["trade", "nqf_level"]

  schema = file("${path.module}/schema/graph_skills.json")
}

resource "google_bigquery_table" "security_events" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "security_events"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "event_at"
  }

  clustering = ["event_type", "user_id"]

  schema = file("${path.module}/schema/security_events.json")
}

resource "google_bigquery_table" "document_verification_events" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "document_verification_events"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "verified_at"
  }

  clustering = ["document_type", "verification_status"]

  schema = file("${path.module}/schema/document_verification_events.json")
}

# --- Analytical Views ---

resource "google_bigquery_table" "view_daily_metrics" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "daily_metrics"
  project             = var.project_id
  deletion_protection = false

  view {
    query = templatefile("${path.module}/views/daily_metrics.sql", {
      PROJECT = var.project_id
      DATASET = google_bigquery_dataset.dataset.dataset_id
    })
    use_legacy_sql = false
  }

  depends_on = [
    google_bigquery_table.events
  ]
}

resource "google_bigquery_table" "view_agent_autonomy" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "agent_autonomy"
  project             = var.project_id
  deletion_protection = false

  view {
    query = templatefile("${path.module}/views/agent_autonomy.sql", {
      PROJECT = var.project_id
      DATASET = google_bigquery_dataset.dataset.dataset_id
    })
    use_legacy_sql = false
  }

  depends_on = [
    google_bigquery_table.agent_runs
  ]
}

resource "google_bigquery_table" "view_agent_health" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "agent_health"
  project             = var.project_id
  deletion_protection = false

  view {
    query = templatefile("${path.module}/views/agent_health.sql", {
      PROJECT = var.project_id
      DATASET = google_bigquery_dataset.dataset.dataset_id
    })
    use_legacy_sql = false
  }

  depends_on = [
    google_bigquery_table.agent_runs
  ]
}

resource "google_bigquery_table" "view_graph_insights" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "graph_insights"
  project             = var.project_id
  deletion_protection = false

  view {
    query = templatefile("${path.module}/views/graph_insights.sql", {
      PROJECT = var.project_id
      DATASET = google_bigquery_dataset.dataset.dataset_id
    })
    use_legacy_sql = false
  }

  depends_on = [
    google_bigquery_table.graph_skills
  ]
}

resource "google_bigquery_table" "view_revenue_metrics" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = "revenue_metrics"
  project             = var.project_id
  deletion_protection = false

  view {
    query = templatefile("${path.module}/views/revenue_metrics.sql", {
      PROJECT = var.project_id
      DATASET = google_bigquery_dataset.dataset.dataset_id
    })
    use_legacy_sql = false
  }

  depends_on = [
    google_bigquery_table.outcomes
  ]
}
