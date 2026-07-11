module "kms" {
  source     = "./modules/kms"
  project_id = var.project_id
  region     = var.region
}

module "iam" {
  source      = "./modules/iam"
  project_id  = var.project_id
  environment = var.environment
}

module "storage" {
  source                  = "./modules/storage"
  project_id              = var.project_id
  environment             = var.environment
  region                  = var.region
  cmek_key_id             = module.kms.crypto_key_id
  document_service_sa_email = module.iam.document_service_sa_email
  agents_sa_email           = module.iam.agents_sa_email
  verification_sa_email     = module.iam.verification_sa_email

  depends_on = [module.kms]
}

module "secret_manager" {
  source     = "./modules/secret-manager"
  project_id = var.project_id
  region     = var.region
}

module "firestore" {
  source      = "./modules/firestore"
  project_id  = var.project_id
  location_id = "africa-south1"
}

module "bigquery" {
  source      = "./modules/bigquery"
  project_id  = var.project_id
  environment = var.environment
  region      = var.region
}

module "vertex_ai" {
  source     = "./modules/vertex-ai"
  project_id = var.project_id
  location   = "global"
}

module "pubsub" {
  source     = "./modules/pubsub"
  project_id = var.project_id
}

module "cloud_run" {
  for_each = var.cloud_run_services

  source                = "./modules/cloud-run"
  project_id            = var.project_id
  region                = var.region
  service_name          = each.key
  image                 = each.value.image
  service_account_email = each.value.service_account_email
  env_vars              = each.value.env_vars
  secrets               = each.value.secrets
}

module "cloud_scheduler" {
  source                = "./modules/cloud-scheduler"
  project_id            = var.project_id
  region                = var.region
  service_account_email = module.iam.agents_sa_email
  scout_target_uri      = var.scout_target_uri
  analyst_target_uri    = var.analyst_target_uri
  cs_target_uri         = var.cs_target_uri
}

module "monitoring" {
  source     = "./modules/monitoring"
  project_id = var.project_id
}

resource "google_kms_crypto_key_iam_member" "storage_agent_kms_access" {
  crypto_key_id = module.kms.crypto_key_id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:service-${data.google_project.current.number}@gs-project-accounts.iam.gserviceaccount.com"
}

data "google_project" "current" {
  project_id = var.project_id
}
