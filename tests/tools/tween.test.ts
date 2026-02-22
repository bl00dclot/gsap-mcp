import { describe, it, expect } from "vitest";
import {
  generateTweenCode,
  type TweenParams,
} from "../../src/tools/core/tween.js";

function defaults(overrides: Partial<TweenParams> = {}): TweenParams {
  return {
    target: ".box",
    method: "to",
    duration: 1,
    properties: { x: 100 },
    ease: "power1.out",
    includeImports: true,
    ...overrides,
  };
}

// ── Method variants ────────────────────────────────────────

describe("gsap.to", () => {
  it("generates a basic gsap.to call", () => {
    const { code, warnings } = generateTweenCode(defaults());
    expect(code).toContain('gsap.to(".box"');
    expect(code).toContain("x: 100");
    expect(code).toContain("duration: 1");
    expect(code).toContain('ease: "power1.out"');
    expect(warnings).toHaveLength(0);
  });

  it("includes import when includeImports is true", () => {
    const { code } = generateTweenCode(defaults());
    expect(code).toContain('import gsap from "gsap";');
  });
});

describe("gsap.from", () => {
  it("generates a gsap.from call", () => {
    const { code } = generateTweenCode(defaults({ method: "from" }));
    expect(code).toContain('gsap.from(".box"');
    expect(code).toContain("x: 100");
    expect(code).toContain("duration: 1");
  });
});

describe("gsap.fromTo", () => {
  it("generates a gsap.fromTo call with both property sets", () => {
    const { code, warnings } = generateTweenCode(
      defaults({
        method: "fromTo",
        fromProperties: { opacity: 0 },
        properties: { opacity: 1 },
      })
    );
    expect(code).toContain('gsap.fromTo(".box"');
    expect(code).toContain("opacity: 0");
    expect(code).toContain("opacity: 1");
    expect(warnings).toHaveLength(0);
  });

  it("returns error when fromProperties is missing", () => {
    const { code, warnings } = generateTweenCode(
      defaults({ method: "fromTo" })
    );
    expect(code).toBe("");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("fromTo");
    expect(warnings[0]).toContain("fromProperties");
  });
});

describe("gsap.set", () => {
  it("generates a gsap.set call", () => {
    const { code } = generateTweenCode(
      defaults({ method: "set", properties: { x: 0, opacity: 1 } })
    );
    expect(code).toContain('gsap.set(".box"');
    expect(code).toContain("x: 0");
    expect(code).toContain("opacity: 1");
  });

  it("omits duration from set output", () => {
    const { code } = generateTweenCode(defaults({ method: "set" }));
    expect(code).not.toContain("duration");
  });

  it("omits ease from set output", () => {
    const { code } = generateTweenCode(defaults({ method: "set" }));
    expect(code).not.toContain("ease");
  });
});

// ── Import control ─────────────────────────────────────────

describe("includeImports", () => {
  it("omits import when includeImports is false", () => {
    const { code } = generateTweenCode(defaults({ includeImports: false }));
    expect(code).not.toContain("import");
    expect(code).toContain('gsap.to(".box"');
  });

  it("snippet-only output has no blank line preamble", () => {
    const { code } = generateTweenCode(defaults({ includeImports: false }));
    expect(code).toMatch(/^gsap\./);
  });
});

// ── Optional tween parameters ──────────────────────────────

describe("stagger", () => {
  it("includes numeric stagger", () => {
    const { code } = generateTweenCode(defaults({ stagger: 0.1 }));
    expect(code).toContain("stagger: 0.1");
  });

  it("includes object stagger", () => {
    const { code } = generateTweenCode(
      defaults({
        stagger: { amount: 0.5, from: "center", ease: "power2.out" },
      })
    );
    expect(code).toContain("stagger:");
    expect(code).toContain("amount: 0.5");
    expect(code).toContain('"center"');
    expect(code).toContain('"power2.out"');
  });

  it("includes object stagger with grid", () => {
    const { code } = generateTweenCode(
      defaults({
        stagger: { amount: 0.3, grid: [4, 5] },
      })
    );
    expect(code).toContain("stagger:");
    expect(code).toContain("[4, 5]");
  });
});

describe("delay", () => {
  it("includes delay in output", () => {
    const { code } = generateTweenCode(defaults({ delay: 0.5 }));
    expect(code).toContain("delay: 0.5");
  });
});

describe("repeat", () => {
  it("includes repeat in output", () => {
    const { code } = generateTweenCode(defaults({ repeat: 3 }));
    expect(code).toContain("repeat: 3");
  });

  it("supports repeat: -1 for infinite", () => {
    const { code } = generateTweenCode(defaults({ repeat: -1 }));
    expect(code).toContain("repeat: -1");
  });
});

describe("yoyo", () => {
  it("includes yoyo in output", () => {
    const { code } = generateTweenCode(defaults({ yoyo: true }));
    expect(code).toContain("yoyo: true");
  });

  it("includes yoyo: false explicitly when set", () => {
    const { code } = generateTweenCode(defaults({ yoyo: false }));
    expect(code).toContain("yoyo: false");
  });
});

describe("overwrite", () => {
  it("includes overwrite: true", () => {
    const { code } = generateTweenCode(defaults({ overwrite: true }));
    expect(code).toContain("overwrite: true");
  });

  it('includes overwrite: "auto"', () => {
    const { code } = generateTweenCode(defaults({ overwrite: "auto" }));
    expect(code).toContain('overwrite: "auto"');
  });
});

describe("onComplete", () => {
  it("includes onComplete function name", () => {
    const { code } = generateTweenCode(
      defaults({ onComplete: "handleDone" })
    );
    expect(code).toContain('onComplete: "handleDone"');
  });
});

// ── Multiple optional params together ──────────────────────

describe("combined options", () => {
  it("includes delay, repeat, yoyo, and onComplete together", () => {
    const { code } = generateTweenCode(
      defaults({
        delay: 0.2,
        repeat: 2,
        yoyo: true,
        onComplete: "done",
      })
    );
    expect(code).toContain("delay: 0.2");
    expect(code).toContain("repeat: 2");
    expect(code).toContain("yoyo: true");
    expect(code).toContain('onComplete: "done"');
  });
});

// ── Ease validation ────────────────────────────────────────

describe("ease validation", () => {
  it("does not warn for known easings", () => {
    const { warnings } = generateTweenCode(
      defaults({ ease: "power2.inOut" })
    );
    expect(warnings).toHaveLength(0);
  });

  it("warns for unknown ease strings", () => {
    const { code, warnings } = generateTweenCode(
      defaults({ ease: "myCustomEase" })
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Unknown ease");
    expect(warnings[0]).toContain("myCustomEase");
    // Still generates code
    expect(code).toContain('ease: "myCustomEase"');
  });

  it("does not warn for custom parametric easings", () => {
    for (const ease of [
      "steps(12)",
      "rough({ strength: 1 })",
      "slow(0.7, 0.7)",
      "expoScale(1, 4)",
    ]) {
      const { warnings } = generateTweenCode(defaults({ ease }));
      expect(warnings).toHaveLength(0);
    }
  });

  it("does not validate ease for set method", () => {
    const { warnings } = generateTweenCode(
      defaults({ method: "set", ease: "totallyFake" })
    );
    expect(warnings).toHaveLength(0);
  });
});

// ── Performance warnings ───────────────────────────────────

describe("performance warnings", () => {
  it("warns when animating width", () => {
    const { warnings } = generateTweenCode(
      defaults({ properties: { width: 200 } })
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes("width"))).toBe(true);
    expect(warnings.some((w) => w.includes("layout"))).toBe(true);
  });

  it("warns when animating height", () => {
    const { warnings } = generateTweenCode(
      defaults({ properties: { height: 100 } })
    );
    expect(warnings.some((w) => w.includes("height"))).toBe(true);
  });

  it("warns when animating margin", () => {
    const { warnings } = generateTweenCode(
      defaults({ properties: { margin: 20 } })
    );
    expect(warnings.some((w) => w.includes("margin"))).toBe(true);
  });

  it("warns when animating padding", () => {
    const { warnings } = generateTweenCode(
      defaults({ properties: { padding: 10 } })
    );
    expect(warnings.some((w) => w.includes("padding"))).toBe(true);
  });

  it("does not warn for GPU-accelerated properties", () => {
    const { warnings } = generateTweenCode(
      defaults({ properties: { x: 100, y: 50, opacity: 0, scale: 1.5 } })
    );
    expect(warnings).toHaveLength(0);
  });

  it("checks fromProperties for performance warnings too", () => {
    const { warnings } = generateTweenCode(
      defaults({
        method: "fromTo",
        fromProperties: { width: 0 },
        properties: { width: 200 },
      })
    );
    // Should warn about width (deduplicated or not, at least one mention)
    expect(warnings.some((w) => w.includes("width"))).toBe(true);
  });

  it("warns for multiple layout properties at once", () => {
    const { warnings } = generateTweenCode(
      defaults({ properties: { width: 200, height: 100, padding: 10 } })
    );
    expect(warnings.filter((w) => w.startsWith("Performance:"))).toHaveLength(3);
  });
});

// ── Output structure ───────────────────────────────────────

describe("output structure", () => {
  it("full build has import separated from code by blank line", () => {
    const { code } = generateTweenCode(defaults());
    const lines = code.split("\n");
    expect(lines[0]).toBe('import gsap from "gsap";');
    expect(lines[1]).toBe("");
    expect(lines[2]).toContain("gsap.to");
  });

  it("generates valid-looking JS with semicolons", () => {
    const { code } = generateTweenCode(defaults());
    expect(code).toMatch(/;\s*$/);
  });

  it("handles custom duration value", () => {
    const { code } = generateTweenCode(defaults({ duration: 2.5 }));
    expect(code).toContain("duration: 2.5");
  });

  it("handles custom target selector", () => {
    const { code } = generateTweenCode(
      defaults({ target: "#hero .title" })
    );
    expect(code).toContain('"#hero .title"');
  });

  it("includes multiple animation properties", () => {
    const { code } = generateTweenCode(
      defaults({
        properties: { x: 100, y: -50, rotation: 45, scale: 1.2 },
      })
    );
    expect(code).toContain("x: 100");
    expect(code).toContain("y: -50");
    expect(code).toContain("rotation: 45");
    expect(code).toContain("scale: 1.2");
  });
});
