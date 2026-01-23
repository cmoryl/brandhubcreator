import { describe, it, expect } from "vitest";
import { normalizeHiddenSections, normalizeSectionOrder } from "@/lib/sectionOrder";
import { DEFAULT_SECTION_ORDER, SectionId } from "@/types/brand";

describe("Section Order Utilities", () => {
  describe("normalizeSectionOrder", () => {
    it("should return default order when input is undefined", () => {
      const result = normalizeSectionOrder(undefined);
      expect(result).toEqual(DEFAULT_SECTION_ORDER);
    });

    it("should return default order when input is empty array", () => {
      const result = normalizeSectionOrder([]);
      expect(result).toEqual(DEFAULT_SECTION_ORDER);
    });

    it("should preserve existing valid sections", () => {
      const input: SectionId[] = ["hero", "logos", "colors"];
      const result = normalizeSectionOrder(input);
      expect(result[0]).toBe("hero");
      expect(result).toContain("logos");
      expect(result).toContain("colors");
    });

    it("should add missing sections to the end", () => {
      const partialOrder: SectionId[] = ["hero", "logos"];
      const result = normalizeSectionOrder(partialOrder);
      expect(result.length).toBe(DEFAULT_SECTION_ORDER.length);
      expect(result[0]).toBe("hero");
      expect(result[1]).toBe("logos");
    });
  });

  describe("normalizeHiddenSections", () => {
    it("should return empty array when input is undefined", () => {
      const result = normalizeHiddenSections(undefined, DEFAULT_SECTION_ORDER);
      expect(result).toEqual([]);
    });

    it("should preserve valid hidden sections", () => {
      const hidden: SectionId[] = ["logos", "colors", "gradients"];
      const result = normalizeHiddenSections(hidden, DEFAULT_SECTION_ORDER);
      expect(result).toContain("logos");
      expect(result).toContain("colors");
      expect(result).toContain("gradients");
    });
  });
});

describe("UUID Validation", () => {
  const isUUID = (str: string) => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  it("should validate correct UUID format", () => {
    expect(isUUID("a47ce561-1e2c-4e3f-b745-7c5f4ac23f4f")).toBe(true);
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("should reject invalid UUID formats", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("a47ce561-1e2c-4e3f-b745")).toBe(false);
    expect(isUUID("")).toBe(false);
    expect(isUUID("a47ce561-1e2c-4e3f-b745-7c5f4ac23f4g")).toBe(false);
  });

  it("should handle slug strings correctly", () => {
    expect(isUUID("trial-interactive")).toBe(false);
    expect(isUUID("globallink-tms")).toBe(false);
    expect(isUUID("transperfect")).toBe(false);
  });
});

describe("Color Utilities", () => {
  it("should validate hex color format", () => {
    const isHexColor = (str: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(str);
    
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#ffffff")).toBe(true);
    expect(isHexColor("#000000")).toBe(true);
    expect(isHexColor("#139dd8")).toBe(true);
    expect(isHexColor("fff")).toBe(false);
    expect(isHexColor("#gggggg")).toBe(false);
  });
});

describe("Slug Generation", () => {
  const generateSlug = (name: string) => 
    name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  it("should convert spaces to hyphens", () => {
    expect(generateSlug("My Brand Name")).toBe("my-brand-name");
  });

  it("should remove special characters", () => {
    expect(generateSlug("Brand & Co!")).toBe("brand-co");
  });

  it("should convert to lowercase", () => {
    expect(generateSlug("UPPERCASE")).toBe("uppercase");
  });

  it("should handle multiple spaces", () => {
    expect(generateSlug("Multiple   Spaces")).toBe("multiple-spaces");
  });
});

describe("Array Utilities", () => {
  const asArray = <T,>(value: unknown, fallback: T[] = []): T[] =>
    Array.isArray(value) ? (value as T[]) : fallback;

  it("should return array when given array", () => {
    expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(asArray(["a", "b"])).toEqual(["a", "b"]);
  });

  it("should return fallback when given non-array", () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
    expect(asArray("string")).toEqual([]);
    expect(asArray(123)).toEqual([]);
    expect(asArray({})).toEqual([]);
  });

  it("should use custom fallback", () => {
    expect(asArray(null, ["default"])).toEqual(["default"]);
  });
});

describe("Object Utilities", () => {
  const asObject = <T extends object>(value: unknown, fallback: T): T =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

  it("should return object when given object", () => {
    expect(asObject({ a: 1 }, {})).toEqual({ a: 1 });
  });

  it("should return fallback when given non-object", () => {
    expect(asObject(null, { default: true })).toEqual({ default: true });
    expect(asObject(undefined, { default: true })).toEqual({ default: true });
    expect(asObject("string", { default: true })).toEqual({ default: true });
    expect(asObject(123, { default: true })).toEqual({ default: true });
  });

  it("should return fallback when given array", () => {
    expect(asObject([1, 2, 3], { default: true })).toEqual({ default: true });
  });
});
