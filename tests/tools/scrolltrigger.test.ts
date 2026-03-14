import { describe, it, expect } from "vitest";
import {
  generateScrollTriggerCode,
  type ScrollTriggerParams,
} from "../../src/tools/plugins/scrolltrigger.js";

function defaults(
  overrides: Partial<ScrollTriggerParams> = {}
): ScrollTriggerParams {
  return {
    animation: {
      target: ".element",
      method: "to",
      properties: { opacity: 1 },
      duration: 1,
    },
    trigger: {
      trigger: ".section",
      start: "top bottom",
      end: "bottom top",
    },
    mode: "standalone",
    includeImports: true,
    ...overrides,
  };
}

// ── Standalone mode ───────────────────────────────────────

describe("standalone mode", () => {
  it("generates gsap.to with inline scrollTrigger", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toContain("gsap.to(");
    expect(code).toContain("scrollTrigger:");
  });

  it("includes trigger selector", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toContain('trigger: ".section"');
  });

  it("includes start and end", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toContain('"top bottom"');
    expect(code).toContain('"bottom top"');
  });

  it("includes animation target", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toContain('".element"');
  });

  it("includes animation properties", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".parallax",
          method: "to",
          properties: { yPercent: -50 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("yPercent: -50");
  });

  it("includes duration in standalone non-fromTo mode", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "to",
          properties: { opacity: 0 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("duration: 1");
  });

  it("with scrub boolean", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      })
    );
    expect(code).toContain("scrub: true");
  });

  it("with scrub number", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      })
    );
    expect(code).toContain("scrub: 1.5");
  });

  it("with pin boolean", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top top",
          end: "+=1000",
          pin: true,
        },
      })
    );
    expect(code).toContain("pin: true");
  });

  it("with pin selector string", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top top",
          end: "+=1000",
          pin: ".pin-container",
        },
      })
    );
    expect(code).toContain('pin: ".pin-container"');
  });

  it("with snap number", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          snap: 0.5,
        },
      })
    );
    expect(code).toContain("snap: 0.5");
  });

  it("with snap object", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          snap: { snapTo: 0.25, duration: 0.3, ease: "power1.inOut" },
        },
      })
    );
    expect(code).toContain("snapTo: 0.25");
    expect(code).toContain("duration: 0.3");
  });

  it("with toggleActions", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play pause resume reset",
        },
      })
    );
    expect(code).toContain('"play pause resume reset"');
  });

  it("with toggleClass", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          toggleClass: "active",
        },
      })
    );
    expect(code).toContain('"active"');
  });

  it("with once", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          once: true,
        },
      })
    );
    expect(code).toContain("once: true");
  });

  it("uses gsap.from when method is from", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "from",
          properties: { opacity: 0 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("gsap.from(");
  });
});

// ── Timeline mode ─────────────────────────────────────────

describe("timeline mode", () => {
  it("generates gsap.timeline with scrollTrigger in options", () => {
    const { code } = generateScrollTriggerCode(
      defaults({ mode: "timeline" })
    );
    expect(code).toContain("gsap.timeline(");
    expect(code).toContain("scrollTrigger:");
  });

  it("chains animation after timeline creation", () => {
    const { code } = generateScrollTriggerCode(
      defaults({ mode: "timeline" })
    );
    expect(code).toContain("tl.to(");
  });

  it("with pin and scrub", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "timeline",
        trigger: {
          trigger: ".panel",
          start: "top top",
          end: "+=3000",
          scrub: 1,
          pin: true,
        },
      })
    );
    expect(code).toContain("pin: true");
    expect(code).toContain("scrub: 1");
    expect(code).toContain("gsap.timeline(");
  });

  it("uses from method when specified", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "timeline",
        animation: {
          target: ".element",
          method: "from",
          properties: { opacity: 0 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("tl.from(");
  });

  it("uses fromTo when fromProperties provided", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "timeline",
        animation: {
          target: ".element",
          method: "fromTo",
          fromProperties: { opacity: 0 },
          properties: { opacity: 1 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("tl.fromTo(");
  });
});

// ── Batch mode ────────────────────────────────────────────

describe("batch mode", () => {
  it("generates ScrollTrigger.batch()", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "batch",
        batchOptions: {
          targets: ".cards",
          onEnter: { opacity: 1, y: 0, stagger: 0.1 },
        },
      })
    );
    expect(code).toContain("ScrollTrigger.batch(");
    expect(code).toContain('".cards"');
  });

  it("returns error when batchOptions missing", () => {
    const result = generateScrollTriggerCode(
      defaults({ mode: "batch" })
    );
    expect(result.code).toBe("");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("batchOptions");
  });

  it("includes interval and batchMax", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "batch",
        batchOptions: {
          targets: ".cards",
          interval: 0.1,
          batchMax: 3,
          onEnter: { opacity: 1, y: 0, stagger: 0.1 },
        },
      })
    );
    expect(code).toContain("interval: 0.1");
    expect(code).toContain("batchMax: 3");
  });

  it("includes onEnter callback", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "batch",
        batchOptions: {
          targets: ".cards",
          onEnter: { opacity: 1, y: 0, stagger: 0.1 },
        },
      })
    );
    expect(code).toContain("onEnter:");
    expect(code).toContain("(batch) => gsap.to(batch,");
  });

  it("includes onLeave callback", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        mode: "batch",
        batchOptions: {
          targets: ".cards",
          onEnter: { opacity: 1 },
          onLeave: { opacity: 0, y: 20 },
        },
      })
    );
    expect(code).toContain("onLeave:");
    expect(code).toContain("(batch) => gsap.to(batch,");
  });
});

// ── Markers ───────────────────────────────────────────────

describe("markers", () => {
  it("dev-only comment appears when markers is true", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "bottom top",
          markers: true,
        },
      })
    );
    expect(code).toContain("markers are for development only");
    expect(code).toContain("markers: true");
  });

  it("no markers comment when markers is false", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).not.toContain("markers are for development only");
  });
});

// ── Start/end positions ───────────────────────────────────

describe("start/end positions", () => {
  it("custom start value is used", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top center",
          end: "bottom top",
        },
      })
    );
    expect(code).toContain('"top center"');
  });

  it("custom end value is used", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top bottom",
          end: "+=3000",
        },
      })
    );
    expect(code).toContain('"+=3000"');
  });
});

// ── fromTo validation ─────────────────────────────────────

describe("fromTo handling", () => {
  it("works correctly with fromProperties", () => {
    const { code, warnings } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "fromTo",
          fromProperties: { opacity: 0 },
          properties: { opacity: 1 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("gsap.fromTo(");
    expect(warnings).not.toContain(
      expect.stringContaining("fromProperties")
    );
  });

  it("warns and falls back to .to() when fromProperties missing", () => {
    const { code, warnings } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "fromTo",
          properties: { opacity: 1 },
          duration: 1,
        },
      })
    );
    expect(code).toContain("gsap.to(");
    expect(code).not.toContain("gsap.fromTo(");
    expect(warnings.some((w) => w.includes("fromProperties"))).toBe(true);
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports and registerPlugin", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain(
      'import { ScrollTrigger } from "gsap/ScrollTrigger"'
    );
    expect(code).toContain("gsap.registerPlugin(ScrollTrigger)");
  });

  it("false omits imports and registerPlugin", () => {
    const { code } = generateScrollTriggerCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toMatch(/^import /m);
    expect(code).not.toContain("registerPlugin");
  });
});

// ── Performance warnings ──────────────────────────────────

describe("performance warnings", () => {
  it("warns about layout-triggering properties", () => {
    const { warnings } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "to",
          properties: { width: 200 },
          duration: 1,
        },
      })
    );
    expect(warnings.some((w) => w.includes("width"))).toBe(true);
    expect(warnings.some((w) => w.includes("Performance"))).toBe(true);
  });

  it("no performance warnings for GPU-accelerated properties", () => {
    const { warnings } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "to",
          properties: { x: 100, opacity: 0.5 },
          duration: 1,
        },
      })
    );
    expect(
      warnings.filter((w) => w.includes("Performance"))
    ).toHaveLength(0);
  });
});

// ── pinSpacing ────────────────────────────────────────────

describe("pinSpacing", () => {
  it("appears in output when set", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top top",
          end: "+=1000",
          pin: true,
          pinSpacing: false,
        },
      })
    );
    expect(code).toContain("pinSpacing: false");
  });

  it("omitted when not set", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: ".section",
          start: "top top",
          end: "+=1000",
          pin: true,
        },
      })
    );
    expect(code).not.toContain("pinSpacing");
  });
});

// ── Custom target in trigger ──────────────────────────────

describe("custom trigger selector", () => {
  it("uses custom trigger selector", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        trigger: {
          trigger: "#hero-section",
          start: "top center",
          end: "bottom center",
        },
      })
    );
    expect(code).toContain('"#hero-section"');
  });
});

// ── Ease ──────────────────────────────────────────────────

describe("ease", () => {
  it("uses custom ease when provided", () => {
    const { code } = generateScrollTriggerCode(
      defaults({
        animation: {
          target: ".element",
          method: "to",
          properties: { opacity: 1 },
          duration: 1,
          ease: "power2.inOut",
        },
      })
    );
    expect(code).toContain('"power2.inOut"');
  });

  it("defaults to none when ease not provided", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toContain('"none"');
  });
});

// ── Header comment ─────────────────────────────────────────

describe("header comment", () => {
  it("prepends ScrollTrigger plugin header comment", () => {
    const { code } = generateScrollTriggerCode(defaults());
    expect(code).toMatch(
      /^\/\/ Animates .element with ScrollTrigger \(requires: import \{ ScrollTrigger \} from "gsap\/ScrollTrigger"\)/
    );
  });

  it("no header comment on error (empty code)", () => {
    const { code } = generateScrollTriggerCode(defaults({ mode: "batch" }));
    expect(code).toBe("");
  });
});
