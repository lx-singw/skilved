resource "google_monitoring_alert_policy" "agent_failure" {
  project      = var.project_id
  display_name = "Agent Run Failure"
  combiner     = "OR"
  enabled      = true

  documentation {
    content = "One or more agent runs have failed. Check agent_runs table in BigQuery."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "Agent failure rate > 10% in 1 hour"
    condition_threshold {
      filter     = "metric.type=\"logging.googleapis.com/log_entry_count\" AND resource.type=\"cloud_run_revision\" AND metric.labels.severity=\"ERROR\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 5
      aggregations {
        alignment_period     = "3600s"
        per_series_aligner   = "ALIGN_COUNT"
      }
    }
  }

  notification_channels = []
  alert_strategy {
    auto_close = "604800s"
  }
}

resource "google_monitoring_alert_policy" "high_latency" {
  project      = var.project_id
  display_name = "High Request Latency"
  combiner     = "OR"
  enabled      = true

  documentation {
    content = "Cloud Run request latency exceeds 5 seconds."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "p99 latency > 5s"
    condition_threshold {
      filter     = "metric.type=\"run.googleapis.com/request_latencies\" AND resource.type=\"cloud_run_revision\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 5000
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
      }
    }
  }
}

resource "google_monitoring_alert_policy" "low_opportunity_count" {
  project      = var.project_id
  display_name = "Low Opportunity Count"
  combiner     = "OR"
  enabled      = true

  documentation {
    content = "Fewer than 10 opportunities found in the last 24 hours. Check scout agent."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "Opportunities found < 10 in 24h"
    condition_threshold {
      filter     = "metric.type=\"logging.googleapis.com/log_entry_count\" AND resource.type=\"cloud_run_revision\" AND log=\"projects/${var.project_id}/logs/scout-agent\""
      duration   = "0s"
      comparison = "COMPARISON_LT"
      threshold_value = 10
      aggregations {
        alignment_period     = "86400s"
        per_series_aligner   = "ALIGN_COUNT"
      }
    }
  }
}
