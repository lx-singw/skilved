#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"
ENV="${PROJECT##*-}"
DATASET_NAME="${DATASET_NAME:-skilved_${ENV}}"
DATASET="${PROJECT}:${DATASET_NAME}"

echo "=== Step 10-11: BigQuery Dataset + Tables + Views ==="

# Create dataset
bq mk --project_id="${PROJECT}" --location=africa-south1 --dataset "${DATASET_NAME}" 2>/dev/null && \
  echo "Created dataset ${DATASET_NAME}" || echo "Dataset ${DATASET_NAME} already exists."

# Write JSON schema files for tables with ARRAY columns
mkdir -p /tmp/bq-schemas

cat > /tmp/bq-schemas/agent_runs.json << 'EOF'
[
  {"name": "run_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "agent_name", "type": "STRING", "mode": "REQUIRED"},
  {"name": "started_at", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "completed_at", "type": "TIMESTAMP"},
  {"name": "duration_seconds", "type": "FLOAT64"},
  {"name": "status", "type": "STRING"},
  {"name": "sources_attempted", "type": "INT64"},
  {"name": "sources_succeeded", "type": "INT64"},
  {"name": "sources_failed", "type": "INT64"},
  {"name": "opportunities_found", "type": "INT64"},
  {"name": "opportunities_published", "type": "INT64"},
  {"name": "opportunities_rejected", "type": "INT64"},
  {"name": "opportunities_duplicate", "type": "INT64"},
  {"name": "opportunities_reviewed", "type": "INT64"},
  {"name": "auto_published", "type": "INT64"},
  {"name": "auto_rejected", "type": "INT64"},
  {"name": "flagged_for_review", "type": "INT64"},
  {"name": "users_targeted", "type": "INT64"},
  {"name": "digests_sent", "type": "INT64"},
  {"name": "digests_failed", "type": "INT64"},
  {"name": "followups_sent", "type": "INT64"},
  {"name": "outcomes_collected", "type": "INT64"},
  {"name": "error_count", "type": "INT64"},
  {"name": "error_messages", "type": "STRING", "mode": "REPEATED"},
  {"name": "human_approvals_required", "type": "INT64"}
]
EOF

cat > /tmp/bq-schemas/quality_decisions.json << 'EOF'
[
  {"name": "decision_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "opportunity_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "agent_run_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "decided_at", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "decision", "type": "STRING", "mode": "REQUIRED"},
  {"name": "quality_score", "type": "FLOAT64"},
  {"name": "rules_passed", "type": "STRING", "mode": "REPEATED"},
  {"name": "rules_failed", "type": "STRING", "mode": "REPEATED"},
  {"name": "gemini_score", "type": "FLOAT64"},
  {"name": "gemini_reasoning", "type": "STRING"},
  {"name": "source_score", "type": "FLOAT64"},
  {"name": "source_name", "type": "STRING"},
  {"name": "rejection_reason", "type": "STRING"},
  {"name": "user_reported_issue", "type": "BOOLEAN"},
  {"name": "user_report_reason", "type": "STRING"},
  {"name": "overridden_by_human", "type": "BOOLEAN"},
  {"name": "human_decision", "type": "STRING"}
]
EOF

# Helper: create table if not exists
create_table() {
  local table="$1" schema="$2" partition_field="$3" cluster_fields="$4"
  if bq show "${DATASET}.${table}" &>/dev/null; then
    echo "Table ${table} already exists, skipping."
    return
  fi
  bq mk --table \
    --time_partitioning_field="${partition_field}" \
    --time_partitioning_type=DAY \
    --clustering_fields="${cluster_fields}" \
    "${DATASET}.${table}" \
    "${schema}"
  echo "Created table: ${table}"
}

# Tables with inline schema (no ARRAY columns)
create_table "events" \
  "event_id:STRING,session_id:STRING,user_id:STRING,opportunity_id:STRING,event_type:STRING,event_at:TIMESTAMP,trade_filter:STRING,province_filter:STRING,sort_order:STRING,session_number:INTEGER,events_in_session:INTEGER,utm_source:STRING,utm_medium:STRING,utm_campaign:STRING,referrer:STRING,device_type:STRING,user_agent:STRING,opp_trade:STRING,opp_province:STRING,opp_type:STRING,opp_salary:FLOAT,opp_freshness_hours:FLOAT,match_score:FLOAT,match_position:INTEGER" \
  "event_at" "event_type,user_id,opportunity_id"

create_table "outcomes" \
  "outcome_id:STRING,user_id:STRING,opportunity_id:STRING,outcome_type:STRING,outcome_at:TIMESTAMP,outcome_reported_at:TIMESTAMP,reported_by:STRING,opp_trade:STRING,opp_type:STRING,opp_province:STRING,opp_salary:FLOAT,opp_source:STRING,opp_organisation:STRING,user_trade:STRING,user_province:STRING,user_qualification:STRING,user_nqf_level:INTEGER,user_experience:STRING,user_trade_tested:BOOLEAN,days_to_apply:INTEGER,days_to_outcome:INTEGER" \
  "outcome_at" "outcome_type,opp_trade,opp_province"

create_table "graph_skills" \
  "skill_id:STRING,trade:STRING,qualification:STRING,nqf_level:INTEGER,avg_salary_accessible:FLOAT,max_salary_accessible:FLOAT,min_salary_accessible:FLOAT,apply_to_interview_rate:FLOAT,apply_to_offer_rate:FLOAT,offer_to_accept_rate:FLOAT,avg_days_to_placement:FLOAT,applicant_count:INTEGER,outcome_count:INTEGER,confidence_score:FLOAT,last_updated:TIMESTAMP" \
  "last_updated" "trade,nqf_level"

create_table "security_events" \
  "event_id:STRING,event_type:STRING,user_id:STRING,ip_address:STRING,user_agent:STRING,document_id:STRING,document_type:STRING,action:STRING,success:BOOLEAN,failure_reason:STRING,risk_score:FLOAT,event_at:TIMESTAMP" \
  "event_at" "event_type,user_id"

create_table "document_verification_events" \
  "event_id:STRING,document_id:STRING,user_id:STRING,document_type:STRING,verification_source:STRING,verification_status:STRING,verification_reference:STRING,verified_at:TIMESTAMP,details:STRING" \
  "verified_at" "document_type,verification_status"

# Tables with JSON schema (ARRAY columns)
create_table "agent_runs" "/tmp/bq-schemas/agent_runs.json" "started_at" "agent_name,status"
create_table "quality_decisions" "/tmp/bq-schemas/quality_decisions.json" "decided_at" "decision,source_name"

# --- Views ---

create_view() {
  local view="$1" query="$2"
  if bq show "${DATASET}.${view}" &>/dev/null; then
    echo "View ${view} already exists, skipping."
    return
  fi
  bq mk --use_legacy_sql=false --view "${query}" "${DATASET}.${view}"
  echo "Created view: ${view}"
}

create_view "agent_autonomy" \
"SELECT
  DATE(started_at) as date,
  agent_name,
  COUNT(*) as runs,
  SUM(opportunities_found) as total_found,
  SUM(opportunities_published) as total_published,
  SUM(digests_sent) as total_digests,
  SUM(outcomes_collected) as total_outcomes,
  SUM(human_approvals_required) as human_interventions,
  SAFE_DIVIDE(
    SUM(human_approvals_required),
    COUNT(*)
  ) as human_intervention_rate
FROM \`${PROJECT}.${DATASET_NAME}.agent_runs\`
GROUP BY date, agent_name
ORDER BY date DESC"

create_view "daily_metrics" \
"SELECT
  DATE(event_at) as date,
  COUNT(DISTINCT session_id) as daily_sessions,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNTIF(event_type = 'opportunity_detail') as detail_views,
  COUNTIF(event_type = 'apply_click') as apply_clicks,
  COUNTIF(event_type = 'share') as shares,
  COUNTIF(event_type = 'signup_complete') as new_signups,
  SAFE_DIVIDE(
    COUNTIF(event_type = 'apply_click'),
    COUNTIF(event_type = 'opportunity_detail')
  ) as apply_click_rate,
  SAFE_DIVIDE(
    COUNTIF(event_type = 'share'),
    COUNTIF(event_type = 'opportunity_detail')
  ) as share_rate
FROM \`${PROJECT}.${DATASET_NAME}.events\`
GROUP BY date
ORDER BY date DESC"

# Cleanup temp schemas
rm -rf /tmp/bq-schemas

echo "BigQuery dataset, tables, and views created."
echo "Project: ${PROJECT}"
echo "Dataset: ${DATASET_NAME}"
echo "Tables: events, outcomes, agent_runs, quality_decisions, graph_skills, security_events, document_verification_events"
echo "Views: agent_autonomy, daily_metrics"
