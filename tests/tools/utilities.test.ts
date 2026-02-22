import { describe, it, expect } from "vitest";
import {
  generateUtilitiesCode,
  type UtilitiesParams,
} from "../../src/tools/dev/utilities.js";

function defaults(overrides: Partial<UtilitiesParams> = {}): UtilitiesParams {
  return {
    method: "clamp",
    params: {},
    example: true,
    ...overrides,
  };
}

// ── interpolate ──────────────────────────────────────────

describe("interpolate", () => {
  it("generates gsap.utils.interpolate call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "interpolate",
        params: { start: 0, end: 100, progress: 0.5 },
      })
    );
    expect(code).toContain("gsap.utils.interpolate(0, 100, 0.5)");
  });

  it("includes computed result in example", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "interpolate",
        params: { start: 0, end: 100, progress: 0.5 },
      })
    );
    expect(code).toContain("// Returns: 50");
  });

  it("includes explanation comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "interpolate",
        params: { start: 0, end: 100, progress: 0.5 },
      })
    );
    expect(code).toContain("// Interpolate between two values");
  });

  it("warns on missing params", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "interpolate", params: {} })
    );
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    expect(warnings.some((w) => w.includes('"start"'))).toBe(true);
    expect(warnings.some((w) => w.includes('"end"'))).toBe(true);
    expect(warnings.some((w) => w.includes('"progress"'))).toBe(true);
  });

  it("uses defaults when params missing", () => {
    const { code } = generateUtilitiesCode(
      defaults({ method: "interpolate", params: {} })
    );
    expect(code).toContain("gsap.utils.interpolate(0, 100, 0.5)");
  });

  it("computes non-trivial result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "interpolate",
        params: { start: 10, end: 20, progress: 0.3 },
      })
    );
    expect(code).toContain("// Returns: 13");
  });
});

// ── mapRange ─────────────────────────────────────────────

describe("mapRange", () => {
  it("generates gsap.utils.mapRange call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "mapRange",
        params: { inMin: 0, inMax: 100, outMin: 0, outMax: 1, value: 50 },
      })
    );
    expect(code).toContain("gsap.utils.mapRange(0, 100, 0, 1, 50)");
  });

  it("includes computed result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "mapRange",
        params: { inMin: 0, inMax: 100, outMin: 0, outMax: 1, value: 50 },
      })
    );
    expect(code).toContain("// Returns: 0.5");
  });

  it("warns on missing params", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "mapRange", params: {} })
    );
    expect(warnings.length).toBeGreaterThanOrEqual(5);
  });

  it("omits comment when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "mapRange",
        params: { inMin: 0, inMax: 100, outMin: 0, outMax: 1, value: 50 },
        example: false,
      })
    );
    expect(code).not.toContain("//");
  });
});

// ── clamp ────────────────────────────────────────────────

describe("clamp", () => {
  it("generates gsap.utils.clamp call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "clamp",
        params: { min: 0, max: 100, value: 150 },
      })
    );
    expect(code).toContain("gsap.utils.clamp(0, 100, 150)");
  });

  it("computes clamped result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "clamp",
        params: { min: 0, max: 100, value: 150 },
      })
    );
    expect(code).toContain("// Returns: 100");
  });

  it("clamps below minimum", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "clamp",
        params: { min: 10, max: 50, value: -5 },
      })
    );
    expect(code).toContain("// Returns: 10");
  });

  it("passes through value within range", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "clamp",
        params: { min: 0, max: 100, value: 42 },
      })
    );
    expect(code).toContain("// Returns: 42");
  });
});

// ── wrap (numeric form) ──────────────────────────────────

describe("wrap (numeric form)", () => {
  it("generates gsap.utils.wrap with min/max/value", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { min: 0, max: 100, value: 150 },
      })
    );
    expect(code).toContain("gsap.utils.wrap(0, 100, 150)");
  });

  it("computes wrapped result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { min: 0, max: 100, value: 150 },
      })
    );
    expect(code).toContain("// Returns: 50");
  });

  it("includes explanation comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { min: 0, max: 100, value: 50 },
      })
    );
    expect(code).toContain("// Wrap a value within a numeric range");
  });
});

// ── wrap (array form) ────────────────────────────────────

describe("wrap (array form)", () => {
  it("generates gsap.utils.wrap with array and index", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { array: ["red", "green", "blue"], index: 4 },
      })
    );
    expect(code).toContain("gsap.utils.wrap(");
    expect(code).toContain('"red"');
    expect(code).toContain(", 4)");
  });

  it("computes wrapped array result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { array: ["red", "green", "blue"], index: 4 },
      })
    );
    expect(code).toContain('// Returns: "green"');
  });

  it("wraps index 0", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { array: [10, 20, 30], index: 0 },
      })
    );
    expect(code).toContain("// Returns: 10");
  });

  it("includes explanation comment for array form", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrap",
        params: { array: [1, 2, 3], index: 5 },
      })
    );
    expect(code).toContain("// Wrap an index around an array");
  });
});

// ── wrapYoyo ─────────────────────────────────────────────

describe("wrapYoyo", () => {
  it("generates gsap.utils.wrapYoyo call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrapYoyo",
        params: { min: 0, max: 100, value: 150 },
      })
    );
    expect(code).toContain("gsap.utils.wrapYoyo(0, 100, 150)");
  });

  it("includes explanation comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "wrapYoyo",
        params: { min: 0, max: 100, value: 50 },
      })
    );
    expect(code).toContain("yoyo");
  });
});

// ── distribute ───────────────────────────────────────────

describe("distribute", () => {
  it("generates gsap.utils.distribute call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "distribute",
        params: { amount: 100 },
      })
    );
    expect(code).toContain("gsap.utils.distribute(");
    expect(code).toContain("amount: 100");
  });

  it("includes optional base, from, ease", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "distribute",
        params: { base: 0, amount: 200, from: "center", ease: "power2" },
      })
    );
    expect(code).toContain("base: 0");
    expect(code).toContain("amount: 200");
    expect(code).toContain('from: "center"');
    expect(code).toContain('ease: "power2"');
  });

  it("includes usage example", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "distribute",
        params: { amount: 50 },
      })
    );
    expect(code).toContain("gsap.to");
  });

  it("warns on missing amount", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "distribute", params: {} })
    );
    expect(warnings.some((w) => w.includes('"amount"'))).toBe(true);
  });
});

// ── random ───────────────────────────────────────────────

describe("random", () => {
  it("generates gsap.utils.random call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "random",
        params: { min: 0, max: 100 },
      })
    );
    expect(code).toContain("gsap.utils.random(0, 100)");
  });

  it("includes snap increment when provided", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "random",
        params: { min: 0, max: 100, snap: 5 },
      })
    );
    expect(code).toContain("gsap.utils.random(0, 100, 5)");
  });

  it("includes example comment with snap", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "random",
        params: { min: 0, max: 100, snap: 10 },
      })
    );
    expect(code).toContain("snapped to increments of 10");
  });

  it("warns on missing params", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "random", params: {} })
    );
    expect(warnings.some((w) => w.includes('"min"'))).toBe(true);
    expect(warnings.some((w) => w.includes('"max"'))).toBe(true);
  });
});

// ── snap (increment form) ────────────────────────────────

describe("snap (increment form)", () => {
  it("generates gsap.utils.snap call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "snap",
        params: { snap: 5, value: 13 },
      })
    );
    expect(code).toContain("gsap.utils.snap(5, 13)");
  });

  it("computes snapped result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "snap",
        params: { snap: 5, value: 13 },
      })
    );
    expect(code).toContain("// Returns: 15");
  });

  it("snaps to nearest lower", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "snap",
        params: { snap: 10, value: 24 },
      })
    );
    expect(code).toContain("// Returns: 20");
  });
});

// ── snap (array form) ────────────────────────────────────

describe("snap (array form)", () => {
  it("generates gsap.utils.snap with array", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "snap",
        params: { array: [0, 25, 50, 75, 100], value: 37 },
      })
    );
    expect(code).toContain("gsap.utils.snap(");
    expect(code).toContain("[0, 25, 50, 75, 100]");
    expect(code).toContain(", 37)");
  });

  it("computes closest array value", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "snap",
        params: { array: [0, 25, 50, 75, 100], value: 37 },
      })
    );
    expect(code).toContain("// Returns: 25");
  });

  it("snaps to exact match", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "snap",
        params: { array: [10, 20, 30], value: 20 },
      })
    );
    expect(code).toContain("// Returns: 20");
  });
});

// ── normalize ────────────────────────────────────────────

describe("normalize", () => {
  it("generates gsap.utils.normalize call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "normalize",
        params: { min: 0, max: 200, value: 100 },
      })
    );
    expect(code).toContain("gsap.utils.normalize(0, 200, 100)");
  });

  it("computes normalized result", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "normalize",
        params: { min: 0, max: 200, value: 100 },
      })
    );
    expect(code).toContain("// Returns: 0.5");
  });

  it("normalizes to 0", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "normalize",
        params: { min: 0, max: 100, value: 0 },
      })
    );
    expect(code).toContain("// Returns: 0");
  });

  it("normalizes to 1", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "normalize",
        params: { min: 0, max: 100, value: 100 },
      })
    );
    expect(code).toContain("// Returns: 1");
  });
});

// ── pipe ─────────────────────────────────────────────────

describe("pipe", () => {
  it("generates gsap.utils.pipe call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "pipe",
        params: { functions: ["clamp(0, 100)", "snap(5)"] },
      })
    );
    expect(code).toContain(
      "gsap.utils.pipe(clamp(0, 100), snap(5))"
    );
  });

  it("includes usage example", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "pipe",
        params: { functions: ["normalize", "mapRange"] },
      })
    );
    expect(code).toContain("transform(inputValue)");
  });

  it("warns on missing functions", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "pipe", params: {} })
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("pipe requires a functions array");
  });

  it("warns on empty functions array", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "pipe", params: { functions: [] } })
    );
    expect(warnings).toHaveLength(1);
  });

  it("uses placeholder when functions missing", () => {
    const { code } = generateUtilitiesCode(
      defaults({ method: "pipe", params: {} })
    );
    expect(code).toContain("gsap.utils.pipe(func1, func2)");
  });
});

// ── unitize ──────────────────────────────────────────────

describe("unitize", () => {
  it("generates gsap.utils.unitize call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "unitize",
        params: { func: "clamp(0, 100)", unit: "px" },
      })
    );
    expect(code).toContain('gsap.utils.unitize("clamp(0, 100)", "px")');
  });

  it("includes usage example with unit", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "unitize",
        params: { func: "myFunc", unit: "%" },
      })
    );
    expect(code).toContain('100%"');
  });

  it("warns on missing params", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "unitize", params: {} })
    );
    expect(warnings.some((w) => w.includes('"func"'))).toBe(true);
    expect(warnings.some((w) => w.includes('"unit"'))).toBe(true);
  });
});

// ── toArray ──────────────────────────────────────────────

describe("toArray", () => {
  it("generates gsap.utils.toArray call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "toArray",
        params: { selector: ".cards" },
      })
    );
    expect(code).toContain('gsap.utils.toArray(".cards")');
  });

  it("includes explanation comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "toArray",
        params: { selector: ".items" },
      })
    );
    expect(code).toContain("Convert a selector");
  });

  it("includes result comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "toArray",
        params: { selector: ".items" },
      })
    );
    expect(code).toContain("Array of matching DOM elements");
  });

  it("warns on missing selector", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "toArray", params: {} })
    );
    expect(warnings.some((w) => w.includes('"selector"'))).toBe(true);
  });
});

// ── selector ─────────────────────────────────────────────

describe("selector", () => {
  it("generates gsap.utils.selector call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "selector",
        params: { scope: "#app" },
      })
    );
    expect(code).toContain('gsap.utils.selector("#app")');
  });

  it("includes usage example", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "selector",
        params: { scope: ".container" },
      })
    );
    expect(code).toContain('q(".child")');
  });

  it("warns on missing scope", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "selector", params: {} })
    );
    expect(warnings.some((w) => w.includes('"scope"'))).toBe(true);
  });
});

// ── shuffle ──────────────────────────────────────────────

describe("shuffle", () => {
  it("generates gsap.utils.shuffle call", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "shuffle",
        params: { array: [1, 2, 3, 4, 5] },
      })
    );
    expect(code).toContain("gsap.utils.shuffle([1, 2, 3, 4, 5])");
  });

  it("includes explanation comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "shuffle",
        params: { array: [1, 2, 3] },
      })
    );
    expect(code).toContain("shuffle an array in place");
  });

  it("includes result comment", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "shuffle",
        params: { array: ["a", "b", "c"] },
      })
    );
    expect(code).toContain("shuffled in place");
  });

  it("warns on missing array", () => {
    const { warnings } = generateUtilitiesCode(
      defaults({ method: "shuffle", params: {} })
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("shuffle requires an array");
  });

  it("uses placeholder when array missing", () => {
    const { code } = generateUtilitiesCode(
      defaults({ method: "shuffle", params: {} })
    );
    expect(code).toContain("[1, 2, 3, 4, 5]");
  });
});

// ── example toggle ───────────────────────────────────────

describe("example toggle", () => {
  it("includes comments when example is true", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "clamp",
        params: { min: 0, max: 100, value: 50 },
        example: true,
      })
    );
    expect(code).toContain("//");
  });

  it("excludes comments when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "clamp",
        params: { min: 0, max: 100, value: 50 },
        example: false,
      })
    );
    expect(code).not.toContain("//");
  });

  it("interpolate omits comments when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "interpolate",
        params: { start: 0, end: 100, progress: 0.5 },
        example: false,
      })
    );
    expect(code).not.toContain("//");
    expect(code).toContain("gsap.utils.interpolate");
  });

  it("random omits comments when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "random",
        params: { min: 0, max: 100 },
        example: false,
      })
    );
    expect(code).not.toContain("//");
    expect(code).toContain("gsap.utils.random");
  });

  it("toArray omits comments when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "toArray",
        params: { selector: ".items" },
        example: false,
      })
    );
    expect(code).not.toContain("//");
  });

  it("shuffle omits comments when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "shuffle",
        params: { array: [1, 2, 3] },
        example: false,
      })
    );
    expect(code).not.toContain("//");
  });

  it("distribute omits comments when example is false", () => {
    const { code } = generateUtilitiesCode(
      defaults({
        method: "distribute",
        params: { amount: 100 },
        example: false,
      })
    );
    expect(code).not.toContain("//");
    expect(code).not.toContain("Usage:");
  });
});

// ── all methods produce gsap.utils.X ─────────────────────

describe("all methods produce gsap.utils.X()", () => {
  const methods = [
    "interpolate",
    "mapRange",
    "clamp",
    "wrap",
    "wrapYoyo",
    "distribute",
    "random",
    "snap",
    "normalize",
    "pipe",
    "unitize",
    "toArray",
    "selector",
    "shuffle",
  ] as const;

  for (const method of methods) {
    it(`${method} contains gsap.utils.${method}`, () => {
      const { code } = generateUtilitiesCode(
        defaults({ method, params: {}, example: false })
      );
      expect(code).toContain(`gsap.utils.${method}(`);
    });
  }
});
