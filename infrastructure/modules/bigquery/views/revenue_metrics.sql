SELECT
  DATE(outcome_at) as date,
  opp_trade,
  opp_type,
  COUNTIF(outcome_type = 'placed') as total_placements,
  COUNTIF(outcome_type = 'applied') as total_applications,
  COUNTIF(outcome_type = 'placed') * 500.0 as estimated_referral_revenue
FROM `${PROJECT}.${DATASET}.outcomes`
GROUP BY date, opp_trade, opp_type
ORDER BY date DESC
