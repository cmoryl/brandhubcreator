UPDATE brands 
SET guide_data = jsonb_set(
  guide_data, 
  '{colors}', 
  '[
    {"id": "1", "name": "Light Blue", "hex": "#139dd8", "cmyk": "91, 27, 0, 15", "pantone": "299C", "usage": "Primary brand color"},
    {"id": "2", "name": "Dark Blue", "hex": "#001320", "cmyk": "100, 41, 0, 87", "pantone": "296C", "usage": "Primary dark brand color"},
    {"id": "3", "name": "Chartreuse", "hex": "#dafb50", "cmyk": "19, 0, 84, 0", "pantone": "388C", "usage": "Accent color - 10% usage for CTAs, icons, highlights"},
    {"id": "4", "name": "Hot Pink", "hex": "#ff009d", "cmyk": "0, 95, 0, 0", "pantone": "Magenta", "usage": "Accent color - 10% usage for CTAs, icons, highlights"},
    {"id": "5", "name": "Dark Blue Accent", "hex": "#003b71", "cmyk": "100, 48, 0, 56", "pantone": "541C", "usage": "Accent color - 10% usage for CTAs, icons, highlights"},
    {"id": "6", "name": "Dark Gray", "hex": "#666666", "cmyk": "0, 0, 0, 60", "pantone": "", "usage": "Supporting neutral"},
    {"id": "7", "name": "Light Gray", "hex": "#f2f2f2", "cmyk": "0, 0, 0, 5", "pantone": "", "usage": "Supporting neutral"},
    {"id": "8", "name": "Blue White", "hex": "#e0e8f5", "cmyk": "10, 6, 0, 3", "pantone": "", "usage": "Supporting neutral"}
  ]'::jsonb
)
WHERE id = 'cb0f36e6-e533-44d1-a56f-6baf4a5eb2c2';