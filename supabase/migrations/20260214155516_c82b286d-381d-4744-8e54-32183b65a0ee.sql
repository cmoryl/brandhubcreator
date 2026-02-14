-- Add advanced module columns to bias_awareness_scans
ALTER TABLE public.bias_awareness_scans 
ADD COLUMN IF NOT EXISTS pie_module JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS wfa_module JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS policy_as_code_module JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inclusive_imagery_module JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inclusion_checklist_module JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bias_awareness_scans.pie_module IS 'Product Inclusion & Equity (PI&E) Who Else? Framework results';
COMMENT ON COLUMN public.bias_awareness_scans.wfa_module IS 'WFA 12 Key Areas Bias Litmus Test results';
COMMENT ON COLUMN public.bias_awareness_scans.policy_as_code_module IS 'Automated Policy-as-Code Disparate Impact thresholds';
COMMENT ON COLUMN public.bias_awareness_scans.inclusive_imagery_module IS 'Stop/Go Inclusive Imagery Framework results';
COMMENT ON COLUMN public.bias_awareness_scans.inclusion_checklist_module IS '2026 Master Inclusion Checklist (26 Actions) results';