SELECT
  DATE(started_at) as date,
  agent_name,
  COUNT(*) as total_runs,
  COUNTIF(status = 'failed') as failed_runs,
  SAFE_DIVIDE(COUNTIF(status = 'failed'), COUNT(*)) * 100.0 as failure_rate_pct,
  AVG(duration_seconds) as avg_duration_seconds,
  SUM(error_count) as total_errors
FROM `${PROJECT}.${DATASET}.agent_runs`
GROUP BY date, agent_name
ORDER BY date DESC, agent_name ASC
