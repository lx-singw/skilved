SELECT
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
FROM `${PROJECT}.${DATASET}.events`
GROUP BY date
ORDER BY date DESC
