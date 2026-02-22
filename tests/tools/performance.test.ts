import { describe, it, expect } from "vitest";
import {
  generatePerformanceCode,
  type PerformanceParams,
} from "../../src/tools/dev/performance.js";

function defaults(
  overrides: Partial<PerformanceParams> = {}
): PerformanceParams {
  return {
    action: "monitor",
    ...overrides,
  };
}

// ── monitor: fps ─────────────────────────────────────────

describe("monitor with fps metric", () => {
  it("generates FPS counter", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["fps"] } })
    );
    expect(code).toContain("FPS");
    expect(code).toContain("requestAnimationFrame");
  });

  it("counts frames per second", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["fps"] } })
    );
    expect(code).toContain("frameCount");
    expect(code).toContain("performance.now()");
  });

  it("logs FPS value", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["fps"] } })
    );
    expect(code).toContain("console.log");
    expect(code).toContain("fps");
  });

  it("defaults to fps when no metrics specified", () => {
    const { code } = generatePerformanceCode(defaults());
    expect(code).toContain("FPS");
    expect(code).toContain("requestAnimationFrame");
  });

  it("produces no warnings", () => {
    const { warnings } = generatePerformanceCode(
      defaults({ options: { metrics: ["fps"] } })
    );
    expect(warnings).toHaveLength(0);
  });
});

// ── monitor: memory ──────────────────────────────────────

describe("monitor with memory metric", () => {
  it("generates memory monitor", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["memory"] } })
    );
    expect(code).toContain("performance.memory");
  });

  it("notes Chrome-only limitation", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["memory"] } })
    );
    expect(code).toContain("Chrome");
  });

  it("logs heap size in MB", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["memory"] } })
    );
    expect(code).toContain("usedJSHeapSize");
    expect(code).toContain("MB");
  });

  it("uses setInterval for periodic logging", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["memory"] } })
    );
    expect(code).toContain("setInterval");
  });
});

// ── monitor: reflows ─────────────────────────────────────

describe("monitor with reflows metric", () => {
  it("generates reflow detection", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["reflows"] } })
    );
    expect(code).toContain("PerformanceObserver");
  });

  it("observes layout-shift entries", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["reflows"] } })
    );
    expect(code).toContain("layout-shift");
  });

  it("counts reflows", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["reflows"] } })
    );
    expect(code).toContain("reflows");
    expect(code).toContain("count");
  });
});

// ── monitor: combined metrics ────────────────────────────

describe("monitor with combined metrics", () => {
  it("includes both fps and memory", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["fps", "memory"] } })
    );
    expect(code).toContain("requestAnimationFrame");
    expect(code).toContain("performance.memory");
  });

  it("includes all three metrics", () => {
    const { code } = generatePerformanceCode(
      defaults({ options: { metrics: ["fps", "memory", "reflows"] } })
    );
    expect(code).toContain("requestAnimationFrame");
    expect(code).toContain("performance.memory");
    expect(code).toContain("PerformanceObserver");
  });
});

// ── optimize ─────────────────────────────────────────────

describe("optimize action", () => {
  it("analyzes code and prepends summary", () => {
    const sampleCode = `gsap.to(".box", { width: 100, duration: 1 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toContain("Performance Analysis:");
    expect(code).toContain(sampleCode);
  });

  it("includes the original code", () => {
    const sampleCode = `gsap.to(".hero", { opacity: 1 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toContain(sampleCode);
  });

  it("detects layout-triggering properties", () => {
    const sampleCode = `gsap.to(".box", { width: 100 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toContain("width");
    expect(code).toContain("layout");
  });

  it("detects duration: 0", () => {
    const sampleCode = `gsap.to(".box", { opacity: 1, duration: 0 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toContain("[ERROR]");
    expect(code).toContain("duration: 0");
  });

  it("detects legacy GSAP 2 syntax", () => {
    const sampleCode = `TweenMax.to(".box", 1, { opacity: 1 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toContain("Legacy GSAP 2");
  });

  it("shows clean analysis for good code", () => {
    const sampleCode = `gsap.to(".box", { opacity: 1 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toContain("No issues found");
  });

  it("warns when code is missing", () => {
    const { code, warnings } = generatePerformanceCode(
      defaults({ action: "optimize" })
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("optimize requires a code string");
    expect(code).toContain("No code provided");
  });

  it("shows score in summary", () => {
    const sampleCode = `gsap.to(".box", { width: 100 });`;
    const { code } = generatePerformanceCode(
      defaults({ action: "optimize", code: sampleCode })
    );
    expect(code).toMatch(/Score: \d+\/100/);
  });
});

// ── profile ──────────────────────────────────────────────

describe("profile action", () => {
  it("measures creation time with performance.now", () => {
    const { code } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(code).toContain("performance.now()");
    expect(code).toContain("startCreate");
    expect(code).toContain("createTime");
  });

  it("logs creation time in ms", () => {
    const { code } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(code).toContain("Animation creation:");
    expect(code).toContain("ms");
  });

  it("measures frame times with gsap.ticker", () => {
    const { code } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(code).toContain("gsap.ticker.add");
    expect(code).toContain("frameTimes");
  });

  it("includes reportFrameTimes function", () => {
    const { code } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(code).toContain("function reportFrameTimes()");
  });

  it("reports avg, min, max frame times", () => {
    const { code } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(code).toContain("Avg:");
    expect(code).toContain("Min:");
    expect(code).toContain("Max:");
  });

  it("produces no warnings", () => {
    const { warnings } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(warnings).toHaveLength(0);
  });
});

// ── No warnings for non-optimize actions ─────────────────

describe("no warnings for non-optimize actions", () => {
  it("monitor produces no warnings", () => {
    const { warnings } = generatePerformanceCode(defaults());
    expect(warnings).toHaveLength(0);
  });

  it("profile produces no warnings", () => {
    const { warnings } = generatePerformanceCode(
      defaults({ action: "profile" })
    );
    expect(warnings).toHaveLength(0);
  });
});
