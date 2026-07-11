module "skilved" {
  source = "../../"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment

  cloud_run_services = var.cloud_run_services
  scout_target_uri   = var.scout_target_uri
  analyst_target_uri = var.analyst_target_uri
  cs_target_uri      = var.cs_target_uri
}
