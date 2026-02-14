/**
 * Client-side guard that strips base64 data from guide_data before saving to the database.
 * This prevents the guide_data JSONB from growing beyond PostgREST payload limits.
 * 
 * Base64 data should be uploaded to storage BEFORE saving. This guard is a safety net
 * that replaces any remaining base64 strings with an empty string and logs a warning.
 */

const BASE64_PATTERN = /^data:([\w\/+.-]+);base64,.{5000,}$/s;
const MAX_STRING_LENGTH = 5000; // Strings longer than this are checked for base64

let warnedFields: Set<string> = new Set();

function processValue(value: unknown, path: string): unknown {
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    if (BASE64_PATTERN.test(value)) {
      // Only warn once per field path per session to avoid console spam
      if (!warnedFields.has(path)) {
        console.warn(
          `[stripBase64] Removing base64 blob from ${path} (${(value.length / 1024 / 1024).toFixed(2)} MB). ` +
          `This data should be uploaded to storage first.`
        );
        warnedFields.add(path);
      }
      return ''; // Strip the base64 data
    }
  }

  if (Array.isArray(value)) {
    return value.map((item, i) => processValue(item, `${path}[${i}]`));
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = processValue(val, `${path}.${key}`);
    }
    return result;
  }

  return value;
}

/**
 * Strips base64-encoded data from a guide_data object before database persistence.
 * Returns a cleaned copy — does NOT mutate the original.
 */
export function stripBase64FromGuideData<T extends Record<string, unknown>>(guideData: T): T {
  return processValue(guideData, 'guide_data') as T;
}

/**
 * Checks if a guide_data object contains any base64 blobs.
 * Useful for diagnostics without stripping.
 */
export function hasBase64Blobs(guideData: unknown): boolean {
  if (typeof guideData === 'string' && guideData.length > MAX_STRING_LENGTH) {
    return BASE64_PATTERN.test(guideData);
  }
  if (Array.isArray(guideData)) {
    return guideData.some(item => hasBase64Blobs(item));
  }
  if (guideData && typeof guideData === 'object') {
    return Object.values(guideData as Record<string, unknown>).some(val => hasBase64Blobs(val));
  }
  return false;
}
