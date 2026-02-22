import { describe, it, expect } from "vitest";
import {
  EASING_CATALOG,
  EASING_CATEGORIES,
  getEasingsByCategory,
  findEasing,
  type EasingEntry,
} from "../../src/knowledge/easings.js";

describe("EASING_CATALOG", () => {
  it("contains at least 30 easings", () => {
    expect(EASING_CATALOG.length).toBeGreaterThanOrEqual(30);
  });

  it("every entry has a non-empty name", () => {
    for (const easing of EASING_CATALOG) {
      expect(easing.name).toBeTruthy();
      expect(easing.name.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a valid category", () => {
    const validCategories: readonly string[] = EASING_CATEGORIES;
    for (const easing of EASING_CATALOG) {
      expect(validCategories).toContain(easing.category);
    }
  });

  it("every entry has a non-empty description", () => {
    for (const easing of EASING_CATALOG) {
      expect(easing.description).toBeTruthy();
      expect(easing.description.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a previewCode containing gsap", () => {
    for (const easing of EASING_CATALOG) {
      expect(easing.previewCode).toBeTruthy();
      expect(easing.previewCode).toContain("gsap.");
    }
  });

  it("cssEquivalent is a non-empty string when present", () => {
    const withCss = EASING_CATALOG.filter((e) => e.cssEquivalent !== undefined);
    expect(withCss.length).toBeGreaterThan(0);
    for (const easing of withCss) {
      expect(easing.cssEquivalent!.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate names", () => {
    const names = EASING_CATALOG.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes 'none' as a linear easing", () => {
    const none = EASING_CATALOG.find((e) => e.name === "none");
    expect(none).toBeDefined();
    expect(none!.cssEquivalent).toBe("linear");
    expect(none!.category).toBe("standard");
  });

  it("includes all power easings (power1-power4) with in/out/inOut variants", () => {
    for (const level of ["power1", "power2", "power3", "power4"]) {
      for (const variant of [".in", ".out", ".inOut"]) {
        expect(EASING_CATALOG.find((e) => e.name === `${level}${variant}`)).toBeDefined();
      }
    }
  });

  it("includes all special easings with in/out/inOut variants", () => {
    for (const name of ["back", "elastic", "bounce", "circ", "expo", "sine"]) {
      for (const variant of [".in", ".out", ".inOut"]) {
        expect(EASING_CATALOG.find((e) => e.name === `${name}${variant}`)).toBeDefined();
      }
    }
  });

  it("includes custom easings: steps, rough, slow, expoScale", () => {
    expect(EASING_CATALOG.find((e) => e.name === "steps(n)")).toBeDefined();
    expect(EASING_CATALOG.find((e) => e.name === "rough()")).toBeDefined();
    expect(EASING_CATALOG.find((e) => e.name === "slow()")).toBeDefined();
    expect(EASING_CATALOG.find((e) => e.name === "expoScale()")).toBeDefined();
  });
});

describe("getEasingsByCategory", () => {
  it("returns only standard easings when filtering by 'standard'", () => {
    const results = getEasingsByCategory("standard");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.category).toBe("standard");
    }
  });

  it("returns only special easings when filtering by 'special'", () => {
    const results = getEasingsByCategory("special");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.category).toBe("special");
    }
  });

  it("returns only custom easings when filtering by 'custom'", () => {
    const results = getEasingsByCategory("custom");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.category).toBe("custom");
    }
  });

  it("all categories together account for the full catalog", () => {
    const all = [
      ...getEasingsByCategory("standard"),
      ...getEasingsByCategory("special"),
      ...getEasingsByCategory("custom"),
    ];
    expect(all.length).toBe(EASING_CATALOG.length);
  });
});

describe("findEasing", () => {
  it("finds an existing easing by name", () => {
    const result = findEasing("power2.inOut");
    expect(result).toBeDefined();
    expect(result!.name).toBe("power2.inOut");
  });

  it("returns undefined for a non-existent easing", () => {
    expect(findEasing("nonexistent")).toBeUndefined();
  });
});
