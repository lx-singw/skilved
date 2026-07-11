SELECT
  trade,
  nqf_level,
  COUNT(DISTINCT skill_id) as unique_skills_tracked,
  AVG(avg_salary_accessible) as average_salary,
  AVG(apply_to_interview_rate) as interview_rate,
  AVG(apply_to_offer_rate) as offer_rate,
  SUM(applicant_count) as total_applicants,
  SUM(outcome_count) as total_outcomes,
  AVG(confidence_score) as avg_confidence
FROM `${PROJECT}.${DATASET}.graph_skills`
GROUP BY trade, nqf_level
ORDER BY average_salary DESC, trade ASC, nqf_level DESC
