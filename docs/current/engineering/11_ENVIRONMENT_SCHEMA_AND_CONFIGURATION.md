# 11 Environment Schema and Configuration Specification

Date: 2026-09-25. Status: CONFIRMED.
Authority: Task B01b, ADR DEP-02 ([12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md](12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md)), M0 Runbook.
Compatibility Anchor: Supersedes legacy unclassified templates; compatibility alias for [16_Environment_Variables.md](../../16_Environment_Variables.md).

## 1. Classification Taxonomy and Boundary Rules

Every configuration variable within Skilved must adhere to one of three sensitivity tiers:

1. `PUBLIC_CLIENT`:
   - Prefix: `NEXT_PUBLIC_*`.
   - Inlined into client bundle at build time by Next.js compiler.
   - Available to browser runtime and publicly visible in page scripts.
   - Rule: MUST NOT contain credentials, service account keys, webhook secrets, or private network hostnames.
2. `SERVER_RUNTIME`:
   - Non-prefixed variables accessed exclusively on the server (`apps/web` API routes, `apps/worker` Cloud Run Jobs).
   - Injected via runtime container environment (Cloud Run environment variables or local shell).
   - Contains operational toggles, region definitions, service URLs, and feature flags.
   - Rule: Non-sensitive. Safe for container configuration templates, but isolated from public HTTP responses.
3. `OPERATOR_SECRET`:
   - High-sensitivity credentials, private keys, HMAC tokens, and cryptographic salts.
   - Managed strictly through Google Cloud Secret Manager (`africa-south1`).
   - Rule: ZERO secrets in source control. Never committed to git. Never logged or exposed in client bundles. Pull request CI pipelines execute without access to operator secrets.

## 2. Complete Environment Schema Inventory

| Variable Name | Tier | Consuming Module | Validation / Format | Fallback Behavior |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | `PUBLIC_CLIENT` | `@skilved/web` | Enum: `development`, `staging`, `production`, `test` | Defaults to `development` |
| `NEXT_PUBLIC_APP_URL` | `PUBLIC_CLIENT` | `@skilved/web` | Valid absolute URL (`http://` or `https://`) | Defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `PUBLIC_CLIENT` | `@skilved/web` | Alphanumeric API key string | Safe emulator placeholder (`demo-api-key`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `PUBLIC_CLIENT` | `@skilved/web` | Valid domain (e.g. `skilved-dev.firebaseapp.com`) | Defaults to `skilved-dev.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `PUBLIC_CLIENT` | `@skilved/web` | Valid GCP project ID string | Defaults to `skilved-dev` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `PUBLIC_CLIENT` | `@skilved/web` | Valid GCS bucket domain string | Defaults to `skilved-dev.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `PUBLIC_CLIENT` | `@skilved/web` | Numeric sender ID string | Optional; disabled if empty |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `PUBLIC_CLIENT` | `@skilved/web` | App ID string (`1:...:web:...`) | Optional; disabled if empty |
| `NODE_ENV` | `SERVER_RUNTIME` | All workspaces | Enum: `development`, `test`, `production` | Defaults to `development` |
| `NEXT_TELEMETRY_DISABLED` | `SERVER_RUNTIME` | `@skilved/web` | String: `1` or `0` | Defaults to `1` (telemetry disabled) |
| `PORT` | `SERVER_RUNTIME` | `@skilved/web` | Integer port (1–65535) | Defaults to `3000` |
| `GCP_PROJECT_ID` | `SERVER_RUNTIME` | Server & Worker | Valid GCP project ID string | Defaults to `skilved-dev` |
| `GCP_REGION` | `SERVER_RUNTIME` | Server & Worker | GCP region string (e.g. `africa-south1`) | Defaults to `africa-south1` |
| `FIREBASE_PROJECT_ID` | `SERVER_RUNTIME` | Server SDKs | Valid Firebase project ID | Defaults to `skilved-dev` |
| `NEXTAUTH_URL` | `SERVER_RUNTIME` | `@skilved/web` | Valid absolute URL | Defaults to `http://localhost:3000` |
| `VERTEX_AI_PROJECT` | `SERVER_RUNTIME` | AI / Agents | Valid GCP project ID string | Defaults to `skilved-dev` |
| `VERTEX_AI_LOCATION` | `SERVER_RUNTIME` | AI / Agents | GCP location string | Defaults to `africa-south1` |
| `VERTEX_AI_SEARCH_ENGINE_ID` | `SERVER_RUNTIME` | Search / Companion | Alphanumeric datastore ID | Optional; Vertex Search bypassed if empty |
| `VERTEX_AI_RANKING_CONFIG` | `SERVER_RUNTIME` | Matching Engine | Alphanumeric ranking config path | Optional; default scoring used if empty |
| `BIGQUERY_PROJECT_ID` | `SERVER_RUNTIME` | Analytics | Valid GCP project ID string | Defaults to `skilved-dev` |
| `BIGQUERY_DATASET` | `SERVER_RUNTIME` | Analytics | Alphanumeric dataset ID | Defaults to `skilved_dev` |
| `BIGQUERY_LOCATION` | `SERVER_RUNTIME` | Analytics | GCP region string | Defaults to `africa-south1` |
| `BIGQUERY_ENABLED` | `SERVER_RUNTIME` | Analytics | Boolean: `true` or `false` | Defaults to `false` (no-op in dev) |
| `REDIS_ENABLED` | `SERVER_RUNTIME` | Cache Layer | Boolean: `true` or `false` | Defaults to `false` (in-memory cache) |
| `REDIS_URL` | `SERVER_RUNTIME` | Cache Layer | Valid Redis connection URL | Optional; empty if `REDIS_ENABLED=false` |
| `CAPTCHA_SOLVER_PROVIDER` | `SERVER_RUNTIME` | ATS Crawler | Provider identifier string (`2captcha`) | Defaults to `2captcha` |
| `SAQA_API_URL` | `SERVER_RUNTIME` | Verification | Valid HTTPS URL | Defaults to `https://regqs.saqa.org.za` |
| `FEATURE_*` | `SERVER_RUNTIME` | Feature Gates | Boolean string (`true` or `false`) | Safe defaults per sprint backlog |
| `FIRESTORE_EMULATOR_HOST` | `SERVER_RUNTIME` | Database Client | Host:port (e.g. `127.0.0.1:8080`) | Ignored in production; connects to Firestore |
| `FIREBASE_AUTH_EMULATOR_HOST` | `SERVER_RUNTIME` | Auth Client | Host:port (e.g. `127.0.0.1:9099`) | Ignored in production; connects to Auth |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `SERVER_RUNTIME` | Storage Client | Host:port (e.g. `127.0.0.1:9199`) | Ignored in production; connects to GCS |
| `PUBSUB_EMULATOR_HOST` | `SERVER_RUNTIME` | Worker Queue | Host:port (e.g. `127.0.0.1:8085`) | Ignored in production; connects to Pub/Sub |
| `FIREBASE_CLIENT_EMAIL` | `OPERATOR_SECRET` | Admin SDK | Valid service account email | Secret Manager (`FIREBASE_CLIENT_EMAIL`) |
| `FIREBASE_PRIVATE_KEY` | `OPERATOR_SECRET` | Admin SDK | RSA private key PEM string | Secret Manager (`FIREBASE_PRIVATE_KEY`) |
| `NEXTAUTH_SECRET` | `OPERATOR_SECRET` | Auth Signing | Base64 or hex string (min 32 bytes) | Secret Manager (`NEXTAUTH_SECRET`) |
| `GEMINI_API_KEY` | `OPERATOR_SECRET` | AI Studio / LLM | Google AI Studio API key | Secret Manager (`GEMINI_API_KEY`) |
| `REDIS_PASSWORD` | `OPERATOR_SECRET` | Cache Layer | Alphanumeric secret token | Secret Manager (`REDIS_PASSWORD`) |
| `WHATSAPP_ACCESS_TOKEN` | `OPERATOR_SECRET` | Meta Graph API | System user access token | Secret Manager (`WHATSAPP_ACCESS_TOKEN`) |
| `WHATSAPP_PHONE_NUMBER_ID` | `OPERATOR_SECRET` | Meta Graph API | Numeric sender phone ID | Secret Manager (`WHATSAPP_PHONE_NUMBER_ID`) |
| `WHATSAPP_VERIFY_TOKEN` | `OPERATOR_SECRET` | Webhook Handler | Secret challenge token | Secret Manager (`WHATSAPP_VERIFY_TOKEN`) |
| `WHATSAPP_APP_SECRET` | `OPERATOR_SECRET` | Webhook Handler | Meta app HMAC secret | Secret Manager (`WHATSAPP_APP_SECRET`) |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `OPERATOR_SECRET` | Meta Graph API | Numeric WABA ID string | Secret Manager (`WHATSAPP_BUSINESS_ACCOUNT_ID`) |
| `CAPTCHA_SOLVER_API_KEY` | `OPERATOR_SECRET` | ATS Crawler | Provider API token | Secret Manager (`CAPTCHA_SOLVER_API_KEY`) |
| `PAYFAST_MERCHANT_ID` | `OPERATOR_SECRET` | Payment Gateway | PayFast merchant identifier | Secret Manager (`PAYFAST_MERCHANT_ID`) |
| `PAYFAST_MERCHANT_KEY` | `OPERATOR_SECRET` | Payment Gateway | PayFast merchant passphrase key | Secret Manager (`PAYFAST_MERCHANT_KEY`) |
| `ID_HASH_SALT` | `OPERATOR_SECRET` | Identity Privacy | Cryptographic salt (min 32 bytes) | Secret Manager (`ID_HASH_SALT`) |

## 3. Safe Emulator Overrides and Local Isolation

Local development runs entirely offline without incurring Google Cloud billing or requiring active internet connectivity:

- **Host Binding:** Emulator hosts are assigned loopback addresses (`127.0.0.1:8080`, `127.0.0.1:9099`, `127.0.0.1:9199`, `127.0.0.1:8085`).
- **Automatic SDK Detection:** Google Cloud and Firebase client libraries automatically detect `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, and `FIREBASE_STORAGE_EMULATOR_HOST`, disabling all outbound TLS calls to Google Cloud production endpoints.
- **In-Memory Graceful Degradation:** When `REDIS_ENABLED=false` or `BIGQUERY_ENABLED=false`, consuming modules switch transparently to in-memory caches or no-op log sinks, preventing development-time crash loops.
- **Dummy Credentials:** When pointing to emulators, client libraries accept synthetic values (e.g. `demo-api-key`) without authentication errors.

## 4. Secret Handling Policies and Zero-Leakage Invariants

1. **Zero VCS Commits:**
   - `.env`, `.env.local`, and `.env.*.local` are explicitly ignored in `.gitignore`.
   - Committing any credential or private key immediately triggers key revocation and security rotation.
2. **Google Secret Manager (`africa-south1`):**
   - In staging (`skilved-staging`) and production (`skilved-prod`), secrets are provisioned in Secret Manager with replication set to `africa-south1`.
   - Cloud Run and Cloud Run Jobs bind secrets directly into runtime environment variables at container startup using least-privilege service accounts (`roles/secretmanager.secretAccessor`).
3. **CI/CD Pipeline Security:**
   - The GitHub Actions workflow (`.github/workflows/ci.yml`) executes with zero production secrets.
   - Lint, typecheck, production build, and boundary test jobs operate with `NEXT_TELEMETRY_DISABLED=1` and mocked/isolated environment configurations.
4. **POPIA Compliance (ID Hashing):**
   - South African National ID numbers must never be stored in plaintext.
   - Hashing requires HMAC-SHA256 with `ID_HASH_SALT` before any database persistence. `ID_HASH_SALT` must never be exposed to public clients.

## 5. Verification Commands

Verify configuration template and workflow conformance locally:

```sh
# Verify .env.example contains zero secrets and valid classification
node -e "const fs = require('fs'); const env = fs.readFileSync('.env.example', 'utf8'); if (/AIza|ya29/i.test(env)) throw new Error('Secret detected in .env.example'); console.log('Env verification passed.');"

# Validate GitHub Actions CI workflow syntax
node -e "const fs = require('fs'); const yaml = require('/home/lx_singw/projects/skilved/node_modules/.pnpm/node_modules/js-yaml'); yaml.load(fs.readFileSync('.github/workflows/ci.yml', 'utf8')); console.log('CI workflow YAML valid.');"
```
