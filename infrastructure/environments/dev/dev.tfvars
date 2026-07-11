# infrastructure/environments/dev/dev.tfvars
# Used with: terraform apply -var-file=environments/dev/dev.tfvars

project_id  = "skilved-dev"
region      = "africa-south1"
environment = "dev"

# Cloud Run services — populated after first deploy
# Uncomment and fill once images are built and pushed to Artifact Registry
cloud_run_services = {}

# Cloud Scheduler target URIs — populated after Cloud Run services are deployed
scout_target_uri   = ""
analyst_target_uri = ""
cs_target_uri      = ""
