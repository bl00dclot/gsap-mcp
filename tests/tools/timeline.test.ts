import { describe, it, expect } from "vitest";
import {
  generateTimelineCode,
  type TimelineParams,
  type TimelineAnimation,
} from "../../src/tools/core/timeline.js";

function anim(overrides: Partial<TimelineAnimation> = {}): TimelineAnimation {
  return {
    target: ".box",
    method: "to",
    duration: 1,
    properties: { x: 100 },
    ...overrides,
  };
}

function defaults(overrides: Partial<TimelineParams> = {}): TimelineParams {
  return {
    animations: [anim()],
    variableName: "tl",
    includeImports: true,
    ...overrides,
  };
}

// ── Empty animations ───────────────────────────────────────

describe("empty animations", () => {
  it("returns error when animations array is empty", () => {
    const { code, warnings } = generateTimelineCode(
      defaults({ animations: [] })
    );
    expect(code).toBe("");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("empty");
  });
});

// ── Simple sequential timeline ─────────────────────────────

describe("sequential timeline", () => {
  it("generates a timeline with a single animation", () => {
    const { code, warnings } = generateTimelineCode(defaults());
    expect(code).toContain("gsap.timeline()");
    expect(code).toContain('tl.to(".box"');
    expect(code).toContain("x: 100");
    expect(warnings).toHaveLength(0);
  });

  it("generates sequential animations chained on the variable", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a", properties: { x: 100 } }),
          anim({ target: ".b", properties: { y: 50 } }),
          anim({ target: ".c", properties: { opacity: 0 } }),
        ],
      })
    );
    expect(code).toContain('tl.to(".a"');
    expect(code).toContain('.to(".b"');
    expect(code).toContain('.to(".c"');
  });

  it("first chain call uses variable name, subsequent use indented dot", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a" }),
          anim({ target: ".b" }),
        ],
      })
    );
    const lines = code.split("\n");
    const chainLines = lines.filter((l) => l.includes(".to("));
    expect(chainLines[0]).toMatch(/^tl\.to\(/);
    expect(chainLines[1]).toMatch(/^\s+\.to\(/);
  });

  it("ends the chain with a semicolon", () => {
    const { code } = generateTimelineCode(defaults());
    expect(code.trimEnd()).toMatch(/;\s*$/);
  });
});

// ── Position parameters ────────────────────────────────────

describe("position parameters", () => {
  it("includes position string for overlapping animations", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a" }),
          anim({ target: ".b", position: "-=0.3" }),
        ],
      })
    );
    expect(code).toContain('"-=0.3"');
  });

  it("handles '<' position (start of previous)", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a" }),
          anim({ target: ".b", position: "<" }),
        ],
      })
    );
    expect(code).toContain('"<"');
  });

  it("handles '+=1' absolute offset", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a" }),
          anim({ target: ".b", position: "+=1" }),
        ],
      })
    );
    expect(code).toContain('"+=1"');
  });

  it("handles label-based position", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a" }),
          anim({ target: ".b", position: "myLabel" }),
        ],
        labels: [{ name: "myLabel" }],
      })
    );
    expect(code).toContain('"myLabel"');
  });

  it("omits position when not specified", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ target: ".a" })],
      })
    );
    // The .to() call should end with the vars object, no trailing position
    const toLine = code.split("\n").find((l) => l.includes(".to("));
    expect(toLine).not.toContain(', "');
  });
});

// ── Labels ─────────────────────────────────────────────────

describe("labels", () => {
  it("inserts addLabel without position", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ target: ".a" }), anim({ target: ".b" })],
        labels: [{ name: "midpoint" }],
      })
    );
    expect(code).toContain('.addLabel("midpoint")');
  });

  it("inserts addLabel with position", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ target: ".a" })],
        labels: [{ name: "start", position: "0" }],
      })
    );
    expect(code).toContain('.addLabel("start", "0")');
  });

  it("interleaves sequential labels before animations", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ target: ".a" }), anim({ target: ".b" })],
        labels: [{ name: "first" }],
      })
    );
    const lines = code.split("\n");
    const labelIdx = lines.findIndex((l) => l.includes("addLabel"));
    const firstAnim = lines.findIndex((l) => l.includes(".to("));
    // Label should come before or at the first animation
    expect(labelIdx).toBeLessThanOrEqual(firstAnim);
  });

  it("places positional labels at the end of the chain", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ target: ".a" })],
        labels: [{ name: "end", position: "+=2" }],
      })
    );
    const lines = code.split("\n");
    const labelIdx = lines.findIndex((l) => l.includes("addLabel"));
    const lastAnim = lines.findLastIndex((l) => l.includes(".to("));
    expect(labelIdx).toBeGreaterThan(lastAnim);
  });

  it("handles multiple labels", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a" }),
          anim({ target: ".b" }),
          anim({ target: ".c" }),
        ],
        labels: [{ name: "alpha" }, { name: "beta" }],
      })
    );
    expect(code).toContain('.addLabel("alpha")');
    expect(code).toContain('.addLabel("beta")');
  });
});

// ── Timeline settings ──────────────────────────────────────

describe("timeline settings", () => {
  it("includes repeat in timeline constructor", () => {
    const { code } = generateTimelineCode(
      defaults({ settings: { repeat: -1 } })
    );
    expect(code).toContain("repeat: -1");
    expect(code).toContain("gsap.timeline(");
  });

  it("includes yoyo in timeline constructor", () => {
    const { code } = generateTimelineCode(
      defaults({ settings: { yoyo: true } })
    );
    expect(code).toContain("yoyo: true");
  });

  it("includes paused in timeline constructor", () => {
    const { code } = generateTimelineCode(
      defaults({ settings: { paused: true } })
    );
    expect(code).toContain("paused: true");
  });

  it("includes repeatDelay in timeline constructor", () => {
    const { code } = generateTimelineCode(
      defaults({ settings: { repeatDelay: 0.5 } })
    );
    expect(code).toContain("repeatDelay: 0.5");
  });

  it("combines multiple settings", () => {
    const { code } = generateTimelineCode(
      defaults({
        settings: { repeat: -1, yoyo: true, paused: true, repeatDelay: 1 },
      })
    );
    expect(code).toContain("repeat: -1");
    expect(code).toContain("yoyo: true");
    expect(code).toContain("paused: true");
    expect(code).toContain("repeatDelay: 1");
  });

  it("generates empty parens when settings has no relevant keys", () => {
    const { code } = generateTimelineCode(defaults({ settings: {} }));
    expect(code).toContain("gsap.timeline()");
  });

  it("omits settings object when not provided", () => {
    const { code } = generateTimelineCode(defaults());
    expect(code).toContain("gsap.timeline()");
  });
});

// ── Timeline defaults ──────────────────────────────────────

describe("timeline defaults", () => {
  it("includes defaults object in timeline constructor", () => {
    const { code } = generateTimelineCode(
      defaults({
        settings: {
          defaults: { duration: 0.5, ease: "power2.inOut" },
        },
      })
    );
    expect(code).toContain("defaults:");
    expect(code).toContain("duration: 0.5");
    expect(code).toContain('"power2.inOut"');
  });

  it("defaults appear inside the gsap.timeline() call", () => {
    const { code } = generateTimelineCode(
      defaults({
        settings: { defaults: { duration: 1 } },
      })
    );
    // The timeline constructor line should contain defaults
    const timelineLine = code
      .split("\n")
      .find((l) => l.includes("gsap.timeline("));
    expect(timelineLine).toContain("defaults:");
  });
});

// ── fromTo within timeline ─────────────────────────────────

describe("fromTo in timeline", () => {
  it("generates .fromTo() with two vars objects", () => {
    const { code, warnings } = generateTimelineCode(
      defaults({
        animations: [
          {
            target: ".box",
            method: "fromTo",
            duration: 1,
            fromProperties: { opacity: 0 },
            properties: { opacity: 1 },
          },
        ],
      })
    );
    expect(code).toContain(".fromTo(");
    expect(code).toContain("opacity: 0");
    expect(code).toContain("opacity: 1");
    expect(warnings).toHaveLength(0);
  });

  it("warns and falls back to .to() when fromProperties is missing", () => {
    const { code, warnings } = generateTimelineCode(
      defaults({
        animations: [
          {
            target: ".box",
            method: "fromTo",
            duration: 1,
            properties: { opacity: 1 },
          },
        ],
      })
    );
    expect(code).toContain(".to(");
    expect(code).not.toContain(".fromTo(");
    expect(warnings.some((w) => w.includes("fromTo"))).toBe(true);
    expect(warnings.some((w) => w.includes("fromProperties"))).toBe(true);
  });
});

// ── set within timeline ────────────────────────────────────

describe("set in timeline", () => {
  it("generates .set() call", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".box", method: "set", properties: { opacity: 0 } }),
        ],
      })
    );
    expect(code).toContain(".set(");
  });

  it("omits duration from set call", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".box", method: "set", properties: { x: 0 } }),
        ],
      })
    );
    // Extract just the .set() call portion
    const setLine = code.split("\n").find((l) => l.includes(".set("));
    expect(setLine).not.toContain("duration");
  });

  it("omits ease from set call", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({
            target: ".box",
            method: "set",
            properties: { x: 0 },
            ease: "power2.out",
          }),
        ],
      })
    );
    const setLine = code.split("\n").find((l) => l.includes(".set("));
    expect(setLine).not.toContain("ease");
  });
});

// ── includeImports ─────────────────────────────────────────

describe("includeImports", () => {
  it("includes import when true", () => {
    const { code } = generateTimelineCode(defaults());
    expect(code).toContain('import gsap from "gsap";');
  });

  it("omits import when false", () => {
    const { code } = generateTimelineCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toContain("import");
    expect(code).toContain("const tl = gsap.timeline(");
  });

  it("snippet starts directly with const when imports disabled", () => {
    const { code } = generateTimelineCode(
      defaults({ includeImports: false })
    );
    expect(code).toMatch(/^\/\/ gsap_timeline:/);
  });
});

// ── Custom variableName ────────────────────────────────────

describe("variableName", () => {
  it("uses custom variable name", () => {
    const { code } = generateTimelineCode(
      defaults({ variableName: "heroTimeline" })
    );
    expect(code).toContain("const heroTimeline = gsap.timeline(");
    expect(code).toContain("heroTimeline.to(");
  });

  it("defaults to 'tl'", () => {
    const { code } = generateTimelineCode(defaults());
    expect(code).toContain("const tl = gsap.timeline(");
    expect(code).toContain("tl.to(");
  });
});

// ── Mixed methods ──────────────────────────────────────────

describe("mixed methods", () => {
  it("handles to, from, set, and fromTo in one timeline", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a", method: "set", properties: { opacity: 0 } }),
          anim({ target: ".a", method: "from", properties: { y: -50 } }),
          anim({ target: ".b", method: "to", properties: { x: 100 } }),
          {
            target: ".c",
            method: "fromTo",
            duration: 1,
            fromProperties: { scale: 0 },
            properties: { scale: 1 },
          },
        ],
      })
    );
    expect(code).toContain(".set(");
    expect(code).toContain(".from(");
    expect(code).toContain(".to(");
    expect(code).toContain(".fromTo(");
  });
});

// ── Performance warnings ───────────────────────────────────

describe("performance warnings", () => {
  it("warns for layout-triggering properties", () => {
    const { warnings } = generateTimelineCode(
      defaults({
        animations: [anim({ properties: { width: 200 } })],
      })
    );
    expect(warnings.some((w) => w.includes("width"))).toBe(true);
    expect(warnings.some((w) => w.includes("Performance"))).toBe(true);
  });

  it("warns for multiple layout properties across animations", () => {
    const { warnings } = generateTimelineCode(
      defaults({
        animations: [
          anim({ target: ".a", properties: { width: 100 } }),
          anim({ target: ".b", properties: { height: 50, margin: 10 } }),
        ],
      })
    );
    const perfWarnings = warnings.filter((w) => w.startsWith("Performance:"));
    expect(perfWarnings.length).toBeGreaterThanOrEqual(3);
  });

  it("does not warn for GPU-accelerated properties", () => {
    const { warnings } = generateTimelineCode(
      defaults({
        animations: [
          anim({ properties: { x: 100, y: 50, opacity: 1, scale: 2 } }),
        ],
      })
    );
    const perfWarnings = warnings.filter((w) => w.startsWith("Performance:"));
    expect(perfWarnings).toHaveLength(0);
  });

  it("checks fromProperties for warnings", () => {
    const { warnings } = generateTimelineCode(
      defaults({
        animations: [
          {
            target: ".box",
            method: "fromTo",
            duration: 1,
            fromProperties: { height: 0 },
            properties: { height: 100 },
          },
        ],
      })
    );
    expect(warnings.some((w) => w.includes("height"))).toBe(true);
  });
});

// ── Stagger ────────────────────────────────────────────────

describe("stagger in timeline", () => {
  it("includes numeric stagger in animation vars", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ stagger: 0.1 })],
      })
    );
    expect(code).toContain("stagger: 0.1");
  });

  it("includes object stagger with from", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [
          anim({ stagger: { amount: 0.5, from: "center" } }),
        ],
      })
    );
    expect(code).toContain("stagger:");
    expect(code).toContain("amount: 0.5");
    expect(code).toContain('"center"');
  });
});

// ── Ease in timeline animations ────────────────────────────

describe("ease in animations", () => {
  it("includes ease when specified on animation", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim({ ease: "back.out" })],
      })
    );
    expect(code).toContain('"back.out"');
  });

  it("omits ease when not specified", () => {
    const { code } = generateTimelineCode(
      defaults({
        animations: [anim()],
      })
    );
    // The .to() vars should not contain ease
    const toLine = code.split("\n").find((l) => l.includes(".to("));
    expect(toLine).not.toContain("ease:");
  });
});

// ── Full integration example ───────────────────────────────

describe("integration", () => {
  it("generates a complete timeline matching expected structure", () => {
    const { code, warnings } = generateTimelineCode({
      animations: [
        { target: ".box1", method: "to", duration: 1, properties: { x: 100, opacity: 1 } },
        { target: ".box2", method: "to", duration: 0.8, properties: { y: 50 }, position: "-=0.3" },
        { target: ".box3", method: "to", duration: 0.5, properties: { rotation: 360 }, position: "midpoint" },
      ],
      settings: {
        repeat: -1,
        yoyo: true,
        defaults: { ease: "power2.inOut" },
      },
      labels: [{ name: "midpoint", position: "+=1" }],
      variableName: "tl",
      includeImports: true,
    });

    // Imports
    expect(code).toContain('import gsap from "gsap";');
    // Timeline constructor with settings
    expect(code).toContain("repeat: -1");
    expect(code).toContain("yoyo: true");
    expect(code).toContain("defaults:");
    expect(code).toContain('"power2.inOut"');
    // Animations
    expect(code).toContain('.to(".box1"');
    expect(code).toContain('.to(".box2"');
    expect(code).toContain('"-=0.3"');
    expect(code).toContain('.to(".box3"');
    expect(code).toContain('"midpoint"');
    // Label
    expect(code).toContain('.addLabel("midpoint"');
    // No perf warnings for transforms + opacity
    const perfWarnings = warnings.filter((w) => w.startsWith("Performance:"));
    expect(perfWarnings).toHaveLength(0);
  });
});
