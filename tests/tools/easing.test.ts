import { describe, it, expect } from "vitest";
import {
  generateEasingReference,
  type EasingParams,
} from "../../src/tools/core/easing.js";
import { EASING_CATALOG } from "../../src/knowledge/easings.js";

function defaults(overrides: Partial<EasingParams> = {}): EasingParams {
  return {
    category: "all",
    preview: true,
    ...overrides,
  };
}

// ── Lookup by exact name ───────────────────────────────────

describe("lookup by name (found)", () => {
  it("finds an exact easing name and returns found: true", () => {
    const result = generateEasingReference(defaults({ name: "power2.inOut" }));
    expect(result.found).toBe(true);
    expect(result.text).toContain("power2.inOut");
  });

  it("includes category in the output", () => {
    const result = generateEasingReference(defaults({ name: "power2.inOut" }));
    expect(result.text).toContain("(standard)");
  });

  it("includes description", () => {
    const result = generateEasingReference(defaults({ name: "elastic.out" }));
    expect(result.text).toContain("elastic.out");
    expect(result.text).toContain("(special)");
    // Should have some description text
    expect(result.text.split("\n").length).toBeGreaterThanOrEqual(2);
  });

  it("includes CSS equivalent when present", () => {
    const result = generateEasingReference(defaults({ name: "none" }));
    expect(result.text).toContain("CSS equivalent: linear");
  });

  it("omits CSS equivalent line when not present", () => {
    const result = generateEasingReference(defaults({ name: "power2.inOut" }));
    expect(result.text).not.toContain("CSS equivalent:");
  });

  it("includes preview code when preview is true", () => {
    const result = generateEasingReference(
      defaults({ name: "elastic.out", preview: true })
    );
    expect(result.text).toContain("Preview:");
    expect(result.text).toContain("gsap.to(");
  });

  it("omits preview code when preview is false", () => {
    const result = generateEasingReference(
      defaults({ name: "elastic.out", preview: false })
    );
    expect(result.text).not.toContain("Preview:");
    expect(result.text).not.toContain("gsap.to(");
  });

  it("finds custom easings like steps(n)", () => {
    const result = generateEasingReference(defaults({ name: "steps(n)" }));
    expect(result.found).toBe(true);
    expect(result.text).toContain("steps(n)");
    expect(result.text).toContain("(custom)");
  });
});

// ── Lookup by name (not found) ─────────────────────────────

describe("lookup by name (not found)", () => {
  it("returns found: false for unknown name", () => {
    const result = generateEasingReference(defaults({ name: "nonexistent" }));
    expect(result.found).toBe(false);
    expect(result.text).toContain('not found');
  });

  it("suggests similar names when partial match exists", () => {
    const result = generateEasingReference(defaults({ name: "elastic" }));
    expect(result.found).toBe(false);
    expect(result.text).toContain("Did you mean:");
    expect(result.text).toContain("elastic.in");
    expect(result.text).toContain("elastic.out");
    expect(result.text).toContain("elastic.inOut");
  });

  it("suggests names for partial power match", () => {
    const result = generateEasingReference(defaults({ name: "power2" }));
    expect(result.found).toBe(false);
    expect(result.text).toContain("power2.in");
    expect(result.text).toContain("power2.out");
    expect(result.text).toContain("power2.inOut");
  });

  it("shows a tip when no suggestions match at all", () => {
    const result = generateEasingReference(
      defaults({ name: "zzzznothing" })
    );
    expect(result.found).toBe(false);
    expect(result.text).toContain("Tip:");
  });
});

// ── Name lookup takes priority over category ───────────────

describe("name priority", () => {
  it("returns single easing info even when category is set", () => {
    const result = generateEasingReference(
      defaults({ name: "bounce.out", category: "standard" })
    );
    expect(result.found).toBe(true);
    expect(result.text).toContain("bounce.out");
    expect(result.text).toContain("(special)");
    // Should NOT be a category listing — no header dividers
    expect(result.text).not.toContain("\u2550");
  });
});

// ── Category: standard ─────────────────────────────────────

describe("category: standard", () => {
  it("lists only standard easings", () => {
    const result = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    expect(result.found).toBe(true);
    expect(result.text).toContain("Standard Easings");
    expect(result.text).toContain("none");
    expect(result.text).toContain("power1.in");
    expect(result.text).toContain("power4.inOut");
    // Should not contain special or custom
    expect(result.text).not.toContain("Special Easings");
    expect(result.text).not.toContain("Custom");
  });

  it("includes all power easings", () => {
    const result = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    for (const level of ["power1", "power2", "power3", "power4"]) {
      for (const variant of [".in", ".out", ".inOut"]) {
        expect(result.text).toContain(`${level}${variant}`);
      }
    }
  });
});

// ── Category: special ──────────────────────────────────────

describe("category: special", () => {
  it("lists only special easings", () => {
    const result = generateEasingReference(
      defaults({ category: "special", preview: false })
    );
    expect(result.found).toBe(true);
    expect(result.text).toContain("Special Easings");
    expect(result.text).toContain("back.in");
    expect(result.text).toContain("elastic.out");
    expect(result.text).toContain("bounce.inOut");
    // Should not contain standard or custom
    expect(result.text).not.toContain("Standard Easings");
    expect(result.text).not.toContain("Custom");
  });

  it("includes all 6 special easing families", () => {
    const result = generateEasingReference(
      defaults({ category: "special", preview: false })
    );
    for (const name of ["back", "elastic", "bounce", "circ", "expo", "sine"]) {
      expect(result.text).toContain(`${name}.out`);
    }
  });
});

// ── Category: custom ───────────────────────────────────────

describe("category: custom", () => {
  it("lists only custom easings", () => {
    const result = generateEasingReference(
      defaults({ category: "custom", preview: false })
    );
    expect(result.found).toBe(true);
    expect(result.text).toContain("Custom");
    expect(result.text).toContain("steps(n)");
    expect(result.text).toContain("rough()");
    expect(result.text).toContain("slow()");
    expect(result.text).toContain("expoScale()");
    // Should not contain standard or special
    expect(result.text).not.toContain("Standard Easings");
    expect(result.text).not.toContain("Special Easings");
  });
});

// ── Category: all ──────────────────────────────────────────

describe("category: all", () => {
  it("lists all categories with headers", () => {
    const result = generateEasingReference(
      defaults({ category: "all", preview: false })
    );
    expect(result.found).toBe(true);
    expect(result.text).toContain("Standard Easings");
    expect(result.text).toContain("Special Easings");
    expect(result.text).toContain("Custom");
  });

  it("includes every easing in the catalog", () => {
    const result = generateEasingReference(
      defaults({ category: "all", preview: false })
    );
    for (const easing of EASING_CATALOG) {
      expect(result.text).toContain(easing.name);
    }
  });
});

// ── Preview toggle ─────────────────────────────────────────

describe("preview toggle (category listing)", () => {
  it("includes preview code for each easing when preview is true", () => {
    const result = generateEasingReference(
      defaults({ category: "custom", preview: true })
    );
    expect(result.text).toContain("gsap.to(");
  });

  it("omits preview code when preview is false", () => {
    const result = generateEasingReference(
      defaults({ category: "custom", preview: false })
    );
    expect(result.text).not.toContain("gsap.to(");
  });

  it("preview true produces longer output than false", () => {
    const withPreview = generateEasingReference(
      defaults({ category: "standard", preview: true })
    );
    const withoutPreview = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    expect(withPreview.text.length).toBeGreaterThan(
      withoutPreview.text.length
    );
  });
});

// ── Formatting ─────────────────────────────────────────────

describe("output formatting", () => {
  it("category headers use double-line dividers", () => {
    const result = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    expect(result.text).toContain("\u2550"); // ═ character
  });

  it("easing entries use em-dash separator", () => {
    const result = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    expect(result.text).toContain("\u2014"); // — character
  });

  it("name lookup shows category in parentheses", () => {
    const result = generateEasingReference(defaults({ name: "none" }));
    expect(result.text).toMatch(/none \(standard\)/);
  });

  it("CSS equivalent entries are noted in category listing", () => {
    const result = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    expect(result.text).toContain("(CSS: linear)");
  });

  it("easing names are padded for alignment in listings", () => {
    const result = generateEasingReference(
      defaults({ category: "standard", preview: false })
    );
    const lines = result.text.split("\n");
    // Find lines with em-dash separator (easing entries)
    const entryLines = lines.filter((l) => l.includes("\u2014"));
    // All entry lines should have consistent padding before the dash
    const dashPositions = entryLines.map((l) => l.indexOf("\u2014"));
    // All dashes should be at the same column (padded to 14 + 1 space)
    const uniquePositions = new Set(dashPositions);
    expect(uniquePositions.size).toBe(1);
  });
});
