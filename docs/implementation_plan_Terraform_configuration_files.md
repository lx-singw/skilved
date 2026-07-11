# Populate empty Terraform modules and environment files

We will populate all the empty `.tf` and configuration files in the `infrastructure/` directory to build a robust, multi-environment infrastructure-as-code setup for Skilved. This plan covers the configurations for modules (IAM, KMS, Storage, Firestore, BigQuery, Secret Manager, Vertex AI, Pub/Sub, Cloud Run, Cloud Scheduler, Monitoring) and the `dev`, `staging`, and `prod` environments.

## User Review Required

> [!IMPORTANT]
> - **Vertex AI Search Location**: Vertex AI Search (Discovery Engine) is not available in `africa-south1`, so we will configure it to use the `global` location. Other primary services default to `africa-south1` to ensure compliance with South African POPIA data residency.
> - **KMS Key Destruction**: The Cloud KMS key used for document encryption is configured with `prevent_destroy = true` to protect against accidental deletion.
> - **Cloud Run Images**: Since we don't have built Docker images ready, the Cloud Run module configuration will accept an image URL parameter and support placeholder deployments.

## Open Questions

- None at this stage. The requirements map directly to the GCP CLI reference architecture previously designed.

---

## Proposed Changes

### Root Infrastructure Configurations

We will set up the root wrapper configurations that coordinate module execution.

#### [MODIFY] [providers.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/providers.tf)
Configures the required Google provider versions.

#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/variables.tf)
Declares root-level variables like `project_id`, `region`, `environment`, and secret names.

#### [MODIFY] [outputs.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/outputs.tf)
Outputs service account emails and storage bucket names.

#### [MODIFY] [backend.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/backend.tf)
Configures GCS backend with placeholders for environment states.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/main.tf)
Instantiates all submodules and threads resources (e.g., KMS keys to Storage buckets, Service account emails to IAM policy bindings).

---

### Infrastructure Modules

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/iam/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/iam/variables.tf)
- Creates service accounts: `skilved-web`, `skilved-agents`, `skilved-document-service`, `skilved-verification`, `skilved-admin`.
- Sets up project-level IAM bindings (least-privilege).

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/firestore/main.tf)
#### [MODIFY] [indexes.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/firestore/indexes.tf)
- Enables Firestore database in Datastore/Firestore mode.
- Configures 5 composite indexes for the `opportunities` collection.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/bigquery/main.tf)
- Provisions `skilved_${environment}` dataset in `africa-south1`.
- Creates 8 tables (`events`, `outcomes`, `agent_runs`, `quality_decisions`, `graph_skills`, `security_events`, `document_verification_events`, `users`) utilizing local schema JSON files.
- Creates views (`agent_autonomy`, `daily_metrics`, `agent_health`, `graph_insights`, `revenue_metrics`).

#### [NEW] [security_events.json](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/bigquery/schema/security_events.json)
#### [NEW] [document_verification_events.json](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/bigquery/schema/document_verification_events.json)
JSON schema definitions for the security audit tables.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/secret-manager/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/secret-manager/variables.tf)
- Provisions all required secrets (`GEMINI_API_KEY`, etc.) replicated to the primary region.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/vertex-ai/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/vertex-ai/variables.tf)
- Provisions the Vertex AI Search (Discovery Engine) data store `skilved-opportunities`.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/pubsub/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/pubsub/variables.tf)
- Provisions topics: `dlp-log-scan`, `new-opportunity`, `opportunity-analysed`.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/cloud-run/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/cloud-run/variables.tf)
- Configures Cloud Run services for `web` and `agents` (CS, Scout, Analyst, CS agents).

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/cloud-scheduler/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/cloud-scheduler/variables.tf)
- Creates Cloud Scheduler jobs to trigger web crawlers (every 4 hours).

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/modules/monitoring/main.tf)
- Combines alerts and dashboards under a single module wrapper.

---

### Environment-Specific Configurations

For `dev`, `staging`, and `prod`:

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/dev/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/dev/variables.tf)
#### [MODIFY] [terraform.tfvars](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/dev/terraform.tfvars)
Instantiates the root infrastructure using the configuration appropriate for `dev`.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/staging/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/staging/variables.tf)
#### [MODIFY] [terraform.tfvars](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/staging/terraform.tfvars)
Instantiates the root infrastructure configuration for `staging`.

#### [MODIFY] [main.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/prod/main.tf)
#### [MODIFY] [variables.tf](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/prod/variables.tf)
#### [MODIFY] [terraform.tfvars](file:///wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/infrastructure/environments/prod/terraform.tfvars)
Instantiates the root infrastructure configuration for `prod`.

---

## Verification Plan

### Automated Tests
- Running `terraform validate` inside `infrastructure/environments/dev`, `staging`, and `prod` directories to verify the configuration syntax is correct.
- Running `terraform plan` for `dev` (with a dummy GCP billing account or project placeholder if necessary) to inspect the plan output.

### Manual Verification
- Review generated Terraform plan outputs to verify resource relationship mappings (e.g. CMEK keys linked to GCS buckets).
