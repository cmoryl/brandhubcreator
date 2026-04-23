
UPDATE public.brands
SET guide_data = jsonb_set(
  COALESCE(guide_data, '{}'::jsonb),
  '{brandVisuals}',
  '{
    "staticAssets": [
      {
        "id": "tp-foundation-connect",
        "name": "Connect — two glowing spheres",
        "expressionState": "Foundation",
        "aspectRatio": "16:9",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/foundation-connect.jpg",
        "description": "Foundation expression state: two interacting glowing spheres expressing dialogue and connection.",
        "tags": ["foundation", "orb", "connect", "glow"]
      },
      {
        "id": "tp-foundation-orb",
        "name": "Foundation — single luminous orb",
        "expressionState": "Foundation",
        "aspectRatio": "1:1",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/foundation-orb.jpg",
        "description": "Foundation anchor: single soft glowing sphere on deep navy.",
        "tags": ["foundation", "orb", "anchor"]
      },
      {
        "id": "tp-collaborate-intersect",
        "name": "Collaborate — intersecting orbs",
        "expressionState": "Collaborate",
        "aspectRatio": "16:9",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/collaborate-intersect.jpg",
        "description": "Collaborate state: two glowing orbs intersect and share energy — partnership and progress.",
        "tags": ["collaborate", "intersect", "orb", "partnership"]
      },
      {
        "id": "tp-transform-continue",
        "name": "Continue — repeated vertical streaks",
        "expressionState": "Transform",
        "aspectRatio": "16:9",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/transform-continue.jpg",
        "description": "Continue state: cropped, repeated forms expressing motion and continuity.",
        "tags": ["transform", "continue", "streak", "motion"]
      },
      {
        "id": "tp-transform-streaks",
        "name": "Transform — vertical light streaks",
        "expressionState": "Transform",
        "aspectRatio": "16:9",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/transform-streaks.jpg",
        "description": "Brand visual treatment: vertical glowing light gradients — energy and rhythm.",
        "tags": ["transform", "streak", "gradient", "vertical"]
      },
      {
        "id": "tp-transform-vertical",
        "name": "Transform — vertical gradient column",
        "expressionState": "Transform",
        "aspectRatio": "9:16",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/transform-vertical.jpg",
        "description": "Vertical brand visual: cyan-to-purple gradient column for tall formats.",
        "tags": ["transform", "vertical", "gradient", "story"]
      },
      {
        "id": "tp-transform-diagonal",
        "name": "Transform — diagonal gradient flow",
        "expressionState": "Transform",
        "aspectRatio": "16:9",
        "imageUrl": "https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/brand-visuals/transform-diagonal.jpg",
        "description": "Diagonal gradient flow from purple to cyan — soft transformation.",
        "tags": ["transform", "diagonal", "gradient", "flow"]
      }
    ],
    "motionAssets": []
  }'::jsonb,
  true
)
WHERE id = '0d6d5a5f-0dd0-4e62-9ac2-285a4095de84';
