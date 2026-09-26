# 11 Environment Schema and Configuration Specification

Date: 2026-09-25. Status: configuration specification; deployed settings and reserved consumers are unverified.

B03 implementation update: the [source publication runtime](15_SOURCE_PUBLICATION_RUNTIME.md) defines actual `SKILVED_CATALOGUE_*` variables, lazy SDK initialization, production emulator rejection and explicit demo/loopback requirements. These are implemented for the new catalogue entrypoints. Older reserved services and the example guard below do not establish application-wide enforcement. No Secret Manager configuration or hosted IAM was provisioned in this task.
Authority: Task B01b, ADR DEP-02 ([12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md](12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md)), M0 Runbook, Sprint 1 Review (R2, R10).
Compatibility Anchor: Supersedes legacy unclassified templates; compatibility alias for [16_Environment_Variables.md](../../16_Environment_Variables.md).

## 1. Classification Taxonomy and Boundary Rules

Every configuration variable within Skilved must adhere to one of three sensitivity tiers:

1. `PUBLIC_CLIENT`:
   - Prefix: `NEXT_PUBLIC_*`.
   - Inlined into client bundle at build time by Next.js compiler.
   - Available to browser runtime and publicly visible in page scripts.
   - Rule: MUST NOT contain credentials, service account keys, webhook secrets, or private network hostnames.
2. `SERVER_RUNTIME`:
   - Non-prefixed variables accessed exclusively on the server (`@skilved/web` API routes, and future private workers e.g. `apps/worker` [PROPOSED for B03+]).
   - Injected via runtime container environment (Cloud Run environment variables or local shell; Next.js standalone containerization `output: 'standalone'` is [PROPOSED for B03+], not active in B01).
   - Contains operational toggles, region definitions, service URLs, and feature flags.
   - Rule: Non-sensitive. Safe for container configuration templates, but isolated from public HTTP responses.
3. `OPERATOR_SECRET`:
   - High-sensitivity credentials, private keys, HMAC tokens, and cryptographic salts.
   - Managed strictly through Google Cloud Secret Manager (`africa-south1`).
   - Rule: ZERO secrets in source control. Never committed to git. Never logged or exposed in client bundles. Pull request CI pipelines execute without access to operator secrets.

## 2. Complete Environment Schema Inventory

### 2.1 Lifecycle Definitions
- **`ACTIVE`**: Implemented and actively consumed in current B01 runtime, CI workflows, or test harnesses (`NODE_ENV`, `NEXT_TELEMETRY_DISABLED`, `PORT`).
- **`RESERVED`**: Specified in baseline contract and `.env.example` schema; consumer implementation scheduled for core milestones prior to release.
- **`PROPOSED`**: Proposed capability for milestone B03 or later (e.g. standalone containerization, `apps/worker` private workers, Vertex AI, BigQuery, Redis, WhatsApp, PayFast).

### 2.2 Inventory Table

| Variable Name | Tier | Lifecycle | Consuming Module | Validation / Format | Fallback Behavior |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Enum: `development`, `staging`, `production`, `test` | Defaults to `development` |
| `NEXT_PUBLIC_APP_URL` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Valid absolute URL (`http://` or `https://`) | Defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Alphanumeric API key string | Safe placeholder (`demo-api-key`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Valid domain (e.g. `skilved-dev.firebaseapp.com`) | Defaults to `skilved-dev.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Valid GCP project ID string | Defaults to `skilved-dev` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Valid GCS bucket domain string | Defaults to `skilved-dev.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | Numeric sender ID string | Optional; disabled if empty |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `PUBLIC_CLIENT` | `RESERVED` | `@skilved/web` | App ID string (`1:...:web:...`) | Optional; disabled if empty |
| `NODE_ENV` | `SERVER_RUNTIME` | `ACTIVE` | All workspaces | Enum: `development`, `test`, `production` | Defaults to `development` |
| `NEXT_TELEMETRY_DISABLED` | `SERVER_RUNTIME` | `ACTIVE` | `@skilved/web`, CI | String: `1` or `0` | Defaults to `1` (telemetry disabled) |
| `PORT` | `SERVER_RUNTIME` | `ACTIVE` | `@skilved/web` | Integer port (1–65535) | Defaults to `3000` (`3001` for prototype) |
| `GCP_PROJECT_ID` | `SERVER_RUNTIME` | `RESERVED` | Server | Valid GCP project ID string | Defaults to `skilved-dev` |
| `GCP_REGION` | `SERVER_RUNTIME` | `RESERVED` | Server | GCP region string (e.g. `africa-south1`) | Defaults to `africa-south1` |
| `FIREBASE_PROJECT_ID` | `SERVER_RUNTIME` | `RESERVED` | Server SDKs | Valid Firebase project ID | Defaults to `skilved-dev` |
| `NEXTAUTH_URL` | `SERVER_RUNTIME` | `RESERVED` | `@skilved/web` | Valid absolute URL | Defaults to `http://localhost:3000` |
| `VERTEX_AI_PROJECT` | `SERVER_RUNTIME` | `PROPOSED` | AI / Agents (B03+) | Valid GCP project ID string | Defaults to `skilved-dev` |
| `VERTEX_AI_LOCATION` | `SERVER_RUNTIME` | `PROPOSED` | AI / Agents (B03+) | GCP location string | Defaults to `africa-south1` |
| `VERTEX_AI_SEARCH_ENGINE_ID` | `SERVER_RUNTIME` | `PROPOSED` | Search Engine (B03+) | Alphanumeric datastore ID | Optional; Vertex Search bypassed if empty |
| `VERTEX_AI_RANKING_CONFIG` | `SERVER_RUNTIME` | `PROPOSED` | Matching Engine (B03+) | Alphanumeric ranking config path | Optional; default scoring used if empty |
| `BIGQUERY_PROJECT_ID` | `SERVER_RUNTIME` | `PROPOSED` | Analytics (B03+) | Valid GCP project ID string | Defaults to `skilved-dev` |
| `BIGQUERY_DATASET` | `SERVER_RUNTIME` | `PROPOSED` | Analytics (B03+) | Alphanumeric dataset ID | Defaults to `skilved_dev` |
| `BIGQUERY_LOCATION` | `SERVER_RUNTIME` | `PROPOSED` | Analytics (B03+) | GCP region string | Defaults to `africa-south1` |
| `BIGQUERY_ENABLED` | `SERVER_RUNTIME` | `PROPOSED` | Analytics (B03+) | Boolean: `true` or `false` | Defaults to `false` (no-op in dev) |
| `REDIS_ENABLED` | `SERVER_RUNTIME` | `PROPOSED` | Cache Layer (B03+) | Boolean: `true` or `false` | Defaults to `false` (in-memory cache) |
| `REDIS_URL` | `SERVER_RUNTIME` | `PROPOSED` | Cache Layer (B03+) | Valid Redis connection URL | Optional; empty if `REDIS_ENABLED=false` |
| `CAPTCHA_SOLVER_PROVIDER` | `SERVER_RUNTIME` | `PROPOSED` | ATS Crawler (B03+) | Provider identifier string (`2captcha`) | Defaults to `2captcha` |
| `SAQA_API_URL` | `SERVER_RUNTIME` | `PROPOSED` | Verification (B03+) | Valid HTTPS URL | Defaults to `https://regqs.saqa.org.za` |
| `FEATURE_*` | `SERVER_RUNTIME` | `RESERVED` | Feature Gates | Boolean string (`true` or `false`) | Safe defaults per sprint backlog |
| `FIRESTORE_EMULATOR_HOST` | `SERVER_RUNTIME` | `RESERVED` | Firestore Client | Host:port (e.g. `127.0.0.1:8080`) | FORBIDDEN in prod (guard rejects); dev loopback |
| `FIREBASE_AUTH_EMULATOR_HOST` | `SERVER_RUNTIME` | `RESERVED` | Auth Client | Host:port (e.g. `127.0.0.1:9099`) | FORBIDDEN in prod (guard rejects; bypasses auth); dev loopback |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `SERVER_RUNTIME` | `RESERVED` | Storage Client | Host:port (e.g. `127.0.0.1:9199`) | FORBIDDEN in prod (guard rejects); dev loopback |
| `PUBSUB_EMULATOR_HOST` | `SERVER_RUNTIME` | `PROPOSED` | Worker Queue (B03+) | Host:port (e.g. `127.0.0.1:8085`) | FORBIDDEN in prod (guard rejects); dev loopback |
| `FIREBASE_CLIENT_EMAIL` | `OPERATOR_SECRET` | `RESERVED` | Admin SDK | Valid service account email | Secret Manager (`FIREBASE_CLIENT_EMAIL`) |
| `FIREBASE_PRIVATE_KEY` | `OPERATOR_SECRET` | `RESERVED` | Admin SDK | RSA private key PEM string | Secret Manager (`FIREBASE_PRIVATE_KEY`) |
| `NEXTAUTH_SECRET` | `OPERATOR_SECRET` | `RESERVED` | Auth Signing | Base64 or hex string (min 32 bytes) | Secret Manager (`NEXTAUTH_SECRET`) |
| `GEMINI_API_KEY` | `OPERATOR_SECRET` | `PROPOSED` | AI Studio / LLM (B03+) | Google AI Studio API key | Secret Manager (`GEMINI_API_KEY`) |
| `REDIS_PASSWORD` | `OPERATOR_SECRET` | `PROPOSED` | Cache Layer (B03+) | Alphanumeric secret token | Secret Manager (`REDIS_PASSWORD`) |
| `WHATSAPP_ACCESS_TOKEN` | `OPERATOR_SECRET` | `PROPOSED` | Meta Graph API (B03+) | System user access token | Secret Manager (`WHATSAPP_ACCESS_TOKEN`) |
| `WHATSAPP_PHONE_NUMBER_ID` | `OPERATOR_SECRET` | `PROPOSED` | Meta Graph API (B03+) | Numeric sender phone ID | Secret Manager (`WHATSAPP_PHONE_NUMBER_ID`) |
| `WHATSAPP_VERIFY_TOKEN` | `OPERATOR_SECRET` | `PROPOSED` | Webhook Handler (B03+) | Secret challenge token | Secret Manager (`WHATSAPP_VERIFY_TOKEN`) |
| `WHATSAPP_APP_SECRET` | `OPERATOR_SECRET` | `PROPOSED` | Webhook Handler (B03+) | Meta app HMAC secret | Secret Manager (`WHATSAPP_APP_SECRET`) |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `OPERATOR_SECRET` | `PROPOSED` | Meta Graph API (B03+) | Numeric WABA ID string | Secret Manager (`WHATSAPP_BUSINESS_ACCOUNT_ID`) |
| `CAPTCHA_SOLVER_API_KEY` | `OPERATOR_SECRET` | `PROPOSED` | ATS Crawler (B03+) | Provider API token | Secret Manager (`CAPTCHA_SOLVER_API_KEY`) |
| `PAYFAST_MERCHANT_ID` | `OPERATOR_SECRET` | `PROPOSED` | Payment Gateway (B03+) | PayFast merchant identifier | Secret Manager (`PAYFAST_MERCHANT_ID`) |
| `PAYFAST_MERCHANT_KEY` | `OPERATOR_SECRET` | `PROPOSED` | Payment Gateway (B03+) | PayFast merchant passphrase key | Secret Manager (`PAYFAST_MERCHANT_KEY`) |
| `ID_HASH_SALT` | `OPERATOR_SECRET` | `RESERVED` | Identity Privacy | Cryptographic salt (min 32 bytes) | Secret Manager (`ID_HASH_SALT`) |

## 3. Emulator Topology, Connection Boundaries, and Production Guards

### 3.1 Offline Execution Preconditions
Providing `.env.example` or creating a local `.env.local` file does **NOT** alone guarantee offline execution:
1. **Running Emulator Suite Required:** Offline development requires an actively running Firebase Emulator Suite (`firebase emulators:start`) listening on local loopback ports (`127.0.0.1:8080`, `127.0.0.1:9099`, `127.0.0.1:9199`, `127.0.0.1:8085`).
2. **Commented Defaults:** All emulator host variables are commented out by default in `.env.example` to prevent accidental inclusion in deployed configurations.
3. **Explicit Consumer Initialization:** If emulators are not running or client connections are not wired, network calls will fail or attempt cloud roundtrips.

### 3.2 Server Admin SDK Auto-Connection vs. Browser Client SDK
A critical architectural and security distinction exists between server-side and client-side emulator binding:
- **Firebase Admin SDK (Server / Node.js):** The Admin SDK inspects the operating system process environment directly upon initialization (`firebase-admin/app`, `firebase-admin/auth`, `@google-cloud/firestore`). When `FIREBASE_AUTH_EMULATOR_HOST` is detected, the Admin SDK automatically redirects all authentication verification calls to the unauthenticated emulator endpoint. In this mode, **the Admin SDK accepts unsigned, unverified mock tokens and forged session cookies**, bypassing all production cryptographic signature checks. Setting `NODE_ENV=production` alone does NOT suppress this auto-connection behavior!
- **Firebase Client SDK (Browser Runtime):** The browser client SDK does **NOT** auto-connect to emulators via environment variables. Browser code must explicitly invoke emulator connection helpers programmatically (e.g. `connectAuthEmulator(auth, 'http://127.0.0.1:9099')`, `connectFirestoreEmulator(db, '127.0.0.1', 8080)`). Public client environment variables (`NEXT_PUBLIC_FIREBASE_*`) provide initialization parameters but do not trigger emulator redirection on their own.

### 3.3 Mandatory Production Fail-Closed Startup Guard
Because `FIREBASE_AUTH_EMULATOR_HOST` in a production environment causes catastrophic authentication bypass, all server runtime entrypoints (`apps/web` server, Next.js instrumentation hooks, API route handlers, and future B03+ workers) **MUST** implement a mandatory fail-closed startup validation guard:

```ts
const FORBIDDEN_PROD_EMULATOR_VARS = [
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
  'PUBSUB_EMULATOR_HOST',
] as const;

export function enforceProductionEnvironmentGuard(): void {
  if (process.env.NODE_ENV === 'production') {
    const activeEmulators = FORBIDDEN_PROD_EMULATOR_VARS.filter(
      (varName) => Boolean(process.env[varName])
    );
    if (activeEmulators.length > 0) {
      const msg = `FATAL: Emulator host variables detected in production environment: ${activeEmulators.join(', ')}. Rejecting startup to prevent authentication bypass.`;
      console.error(msg);
      throw new Error(msg);
    }
  }
}
```

The guard must execute synchronously prior to any SDK initialization or network listener startup. If any emulator host variable is present when `NODE_ENV === 'production'`, the process fails closed immediately.

## 4. Secret Handling Policies and Zero-Leakage Invariants

1. **Zero VCS Commits:**
   - `.env`, `.env.local`, and `.env.*.local` are explicitly ignored in `.gitignore`.
   - Committing any credential or private key immediately triggers key revocation and security rotation.
2. **Google Secret Manager (`africa-south1`):**
   - In staging (`skilved-staging`) and production (`skilved-prod`), secrets are provisioned in Secret Manager with replication set to `africa-south1`.
   - Cloud Run and Cloud Run Jobs bind secrets directly into runtime environment variables at container startup using least-privilege service accounts (`roles/secretmanager.secretAccessor`).
3. **CI/CD Pipeline Security:**
   - The GitHub Actions workflow (`.github/workflows/ci.yml`) executes with zero production secrets.
   - Job-level environment maintains `NEXT_TELEMETRY_DISABLED=1` allowing development toolchain resolution, with `NODE_ENV=production` scoped strictly to build and test execution steps.
4. **POPIA Compliance (ID Hashing):**
   - South African National ID numbers must never be stored in plaintext.
   - Hashing requires HMAC-SHA256 with `ID_HASH_SALT` before any database persistence. `ID_HASH_SALT` must never be exposed to public clients.

## 5. Verification Commands

Verify configuration template and workflow conformance locally:

```sh
# Verify .env.example contains zero secrets and valid classification
node -e "const fs = require('fs'); const env = fs.readFileSync('.env.example', 'utf8'); if (/AIza|ya29/i.test(env)) throw new Error('Secret detected in .env.example'); console.log('Env verification passed.');"

# Validate GitHub Actions CI workflow syntax with js-yaml or python3
node -e "const fs = require('fs'); const yaml = require('/home/lx_singw/projects/skilved/node_modules/.pnpm/node_modules/js-yaml'); yaml.load(fs.readFileSync('.github/workflows/ci.yml', 'utf8')); console.log('CI workflow YAML valid.');"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('CI workflow YAML valid via PyYAML.')"
```
