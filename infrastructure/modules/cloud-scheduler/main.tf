resource "google_cloud_scheduler_job" "scout" {
  name        = "scout-agent-trigger"
  project     = var.project_id
  region      = var.region
  schedule    = var.scout_schedule
  time_zone   = "Africa/Johannesburg"

  retry_config {
    retry_count = 3
  }

  http_target {
    http_method = "POST"
    uri         = var.scout_target_uri

    oidc_token {
      service_account_email = var.service_account_email
      audience              = var.scout_target_uri
    }
  }
}

resource "google_cloud_scheduler_job" "analyst" {
  name        = "analyst-agent-trigger"
  project     = var.project_id
  region      = var.region
  schedule    = var.analyst_schedule
  time_zone   = "Africa/Johannesburg"

  retry_config {
    retry_count = 3
  }

  http_target {
    http_method = "POST"
    uri         = var.analyst_target_uri

    oidc_token {
      service_account_email = var.service_account_email
      audience              = var.analyst_target_uri
    }
  }
}

resource "google_cloud_scheduler_job" "customer_success" {
  name        = "customer-success-trigger"
  project     = var.project_id
  region      = var.region
  schedule    = var.cs_schedule
  time_zone   = "Africa/Johannesburg"

  retry_config {
    retry_count = 3
  }

  http_target {
    http_method = "POST"
    uri         = var.cs_target_uri

    oidc_token {
      service_account_email = var.service_account_email
      audience              = var.cs_target_uri
    }
  }
}
