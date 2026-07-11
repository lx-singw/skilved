SELECT
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
FROM `${PROJECT}.${DATASET}.agent_runs`
GROUP BY date, agent_name
ORDER BY date DESC
