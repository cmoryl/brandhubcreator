CREATE TABLE public.next2026_pptx_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL UNIQUE,
  design_id text NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_size_bytes bigint,
  source_canva_export_url text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.next2026_pptx_files TO anon, authenticated;
GRANT ALL ON public.next2026_pptx_files TO service_role;

ALTER TABLE public.next2026_pptx_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read next2026 pptx files"
  ON public.next2026_pptx_files
  FOR SELECT
  USING (true);