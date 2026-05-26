/**
 * Centralized AI model registry.
 *
 * Use purpose-keyed identifiers everywhere instead of hardcoded model strings.
 * Swapping a tier (e.g., upgrading the default chat model) becomes a one-line
 * change here instead of a fleet-wide grep.
 *
 * Model IDs must match a model supported by the Lovable AI Gateway.
 */

export const MODELS = {
  // Text / chat
  fastChat: 'google/gemini-3-flash-preview',         // default
  cheapChat: 'google/gemini-3.1-flash-lite-preview', // batch / classification
  deepReason: 'google/gemini-3.1-pro-preview',       // hard reasoning
  metaJudge: 'openai/gpt-5.2',                        // strict structured judging

  // Vision / multimodal grading
  visionJudge: 'google/gemini-3.1-pro-preview',

  // Image generation
  imageFast: 'google/gemini-3.1-flash-image-preview',
  imagePremium: 'google/gemini-3-pro-image-preview',
  imageEdit: 'google/gemini-2.5-flash-image',
} as const;

export type ModelPurpose = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelPurpose];

/** Resolve a purpose key to a model id, with optional override. */
export function resolveModel(purpose: ModelPurpose, override?: string): string {
  return override?.trim() || MODELS[purpose];
}
