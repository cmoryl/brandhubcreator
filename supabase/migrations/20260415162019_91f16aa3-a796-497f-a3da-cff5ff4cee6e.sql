UPDATE brand_intelligence_jobs 
SET status = 'failed', 
    error_message = 'Stale pending job cleaned up during system audit',
    completed_at = NOW()
WHERE id = '5f200dab-1326-4297-9fdf-f8111a971c6a' 
  AND status = 'pending';