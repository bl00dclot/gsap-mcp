import { describe, it, expect } from "vitest";
import {
  generateSplitTextCode,
  type SplitTextParams,
} from "../../src/tools/plugins/splittext.js";

function defaults(
  overrides: Partial<SplitTextParams> = {}
): SplitTextParams {
  return {
    target: ".headline",
    type: "chars,words",
    animation: {
      method: "from",
      properties: { opacity: 0, y: 20 },
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.02,
    },
    revert: true,
    useTimeline: false,
    includeImports: true,
    ...overrides,
  };
}

// ── Default output ────────────────────────────────────────

describe("default params", () => {
  it("generates from animation on split.chars with revert", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).toContain("gsap.from(split.chars");
    expect(code).toContain("new SplitText(");
    expect(code).toContain("split.revert()");
  });

  it("includes SplitText constructor with type", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).toContain('"chars,words"');
  });

  it("includes target in SplitText constructor", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).toContain('".headline"');
  });
});

// ── Type targeting ────────────────────────────────────────

describe("type targeting", () => {
  it('type "words" targets split.words', () => {
    const { code } = generateSplitTextCode(
      defaults({ type: "words" })
    );
    expect(code).toContain("split.words");
    expect(code).not.toContain("split.chars");
  });

  it('type "lines" targets split.lines', () => {
    const { code } = generateSplitTextCode(
      defaults({ type: "lines" })
    );
    expect(code).toContain("split.lines");
  });

  it('type "chars,words,lines" targets split.chars (first in list)', () => {
    const { code } = generateSplitTextCode(
      defaults({ type: "chars,words,lines" })
    );
    expect(code).toContain("split.chars");
  });

  it('type "words,chars" targets split.words (first in list)', () => {
    const { code } = generateSplitTextCode(
      defaults({ type: "words,chars" })
    );
    expect(code).toContain("split.words");
  });

  it("warns about invalid type values", () => {
    const { warnings } = generateSplitTextCode(
      defaults({ type: "chars,invalid" })
    );
    expect(warnings.some((w) => w.includes("invalid"))).toBe(true);
    expect(warnings.some((w) => w.includes("Unknown split type"))).toBe(true);
  });

  it("still generates code with invalid type values", () => {
    const { code } = generateSplitTextCode(
      defaults({ type: "chars,invalid" })
    );
    expect(code).toContain("split.chars");
    expect(code).toContain("gsap.from(");
  });
});

// ── Animation methods ─────────────────────────────────────

describe("animation methods", () => {
  it("generates gsap.from", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).toContain("gsap.from(");
  });

  it("generates gsap.to", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "to",
          properties: { opacity: 1 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("gsap.to(");
  });

  it("generates gsap.fromTo", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "fromTo",
          fromProperties: { opacity: 0 },
          properties: { opacity: 1 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("gsap.fromTo(");
  });
});

// ── fromTo validation ─────────────────────────────────────

describe("fromTo validation", () => {
  it("warns and falls back to .from() when fromProperties missing", () => {
    const { code, warnings } = generateSplitTextCode(
      defaults({
        animation: {
          method: "fromTo",
          properties: { opacity: 1 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("gsap.from(");
    expect(code).not.toContain("gsap.fromTo(");
    expect(warnings.some((w) => w.includes("fromProperties"))).toBe(true);
  });
});

// ── Revert ────────────────────────────────────────────────

describe("revert", () => {
  it("adds onComplete with split.revert() when true", () => {
    const { code } = generateSplitTextCode(defaults({ revert: true }));
    expect(code).toContain("onComplete:");
    expect(code).toContain("split.revert()");
  });

  it("omits onComplete when false", () => {
    const { code } = generateSplitTextCode(defaults({ revert: false }));
    expect(code).not.toContain("onComplete:");
    expect(code).not.toContain("split.revert()");
  });
});

// ── useTimeline ───────────────────────────────────────────

describe("useTimeline", () => {
  it("wraps in gsap.timeline() when true", () => {
    const { code } = generateSplitTextCode(
      defaults({ useTimeline: true })
    );
    expect(code).toContain("gsap.timeline()");
    expect(code).toContain("tl.from(");
  });

  it("timeline uses .to() method when specified", () => {
    const { code } = generateSplitTextCode(
      defaults({
        useTimeline: true,
        animation: {
          method: "to",
          properties: { opacity: 1 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("tl.to(");
  });

  it("timeline uses .fromTo() method when specified", () => {
    const { code } = generateSplitTextCode(
      defaults({
        useTimeline: true,
        animation: {
          method: "fromTo",
          fromProperties: { opacity: 0, y: 30 },
          properties: { opacity: 1, y: 0 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("tl.fromTo(");
  });

  it("does not use gsap.timeline() when false", () => {
    const { code } = generateSplitTextCode(
      defaults({ useTimeline: false })
    );
    expect(code).not.toContain("gsap.timeline()");
    expect(code).toContain("gsap.from(");
  });
});

// ── Stagger ───────────────────────────────────────────────

describe("stagger", () => {
  it("number stagger appears in output", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).toContain("stagger: 0.02");
  });

  it("object stagger appears in output", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "from",
          properties: { opacity: 0 },
          duration: 0.5,
          ease: "power2.out",
          stagger: { amount: 0.5, from: "center" },
        },
      })
    );
    expect(code).toContain("amount: 0.5");
    expect(code).toContain('"center"');
  });

  it("stagger with ease appears in output", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "from",
          properties: { opacity: 0 },
          duration: 0.5,
          ease: "power2.out",
          stagger: { amount: 1, from: "edges", ease: "power1.in" },
        },
      })
    );
    expect(code).toContain('"edges"');
    expect(code).toContain('"power1.in"');
  });
});

// ── Class options ─────────────────────────────────────────

describe("class options", () => {
  it("linesClass appears in SplitText constructor", () => {
    const { code } = generateSplitTextCode(
      defaults({ linesClass: "split-line" })
    );
    expect(code).toContain('"split-line"');
    expect(code).toContain("linesClass:");
  });

  it("wordsClass appears in SplitText constructor", () => {
    const { code } = generateSplitTextCode(
      defaults({ wordsClass: "split-word" })
    );
    expect(code).toContain('"split-word"');
    expect(code).toContain("wordsClass:");
  });

  it("charsClass appears in SplitText constructor", () => {
    const { code } = generateSplitTextCode(
      defaults({ charsClass: "split-char" })
    );
    expect(code).toContain('"split-char"');
    expect(code).toContain("charsClass:");
  });

  it("all class options appear together", () => {
    const { code } = generateSplitTextCode(
      defaults({
        linesClass: "line",
        wordsClass: "word",
        charsClass: "char",
      })
    );
    expect(code).toContain("linesClass:");
    expect(code).toContain("wordsClass:");
    expect(code).toContain("charsClass:");
  });

  it("omitted when not provided", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).not.toContain("linesClass:");
    expect(code).not.toContain("wordsClass:");
    expect(code).not.toContain("charsClass:");
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports and registerPlugin", () => {
    const { code } = generateSplitTextCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain(
      'import { SplitText } from "gsap/SplitText"'
    );
    expect(code).toContain("gsap.registerPlugin(SplitText)");
  });

  it("false omits imports and registerPlugin", () => {
    const { code } = generateSplitTextCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toMatch(/^import /m);
    expect(code).not.toContain("registerPlugin");
  });
});

// ── Custom duration, ease, properties ─────────────────────

describe("custom animation options", () => {
  it("custom duration appears in output", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "from",
          properties: { opacity: 0 },
          duration: 1.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("duration: 1.5");
  });

  it("custom ease appears in output", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "from",
          properties: { opacity: 0 },
          duration: 0.5,
          ease: "elastic.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain('"elastic.out"');
  });

  it("custom properties appear in output", () => {
    const { code } = generateSplitTextCode(
      defaults({
        animation: {
          method: "from",
          properties: { opacity: 0, scale: 0.5, rotation: 15 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(code).toContain("opacity: 0");
    expect(code).toContain("scale: 0.5");
    expect(code).toContain("rotation: 15");
  });
});

// ── Performance warnings ──────────────────────────────────

describe("performance warnings", () => {
  it("warns about layout-triggering properties", () => {
    const { warnings } = generateSplitTextCode(
      defaults({
        animation: {
          method: "from",
          properties: { width: 0 },
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.02,
        },
      })
    );
    expect(warnings.some((w) => w.includes("width"))).toBe(true);
    expect(warnings.some((w) => w.includes("Performance"))).toBe(true);
  });

  it("no performance warnings for GPU-accelerated properties", () => {
    const { warnings } = generateSplitTextCode(defaults());
    expect(
      warnings.filter((w) => w.includes("Performance"))
    ).toHaveLength(0);
  });
});

// ── Custom target ─────────────────────────────────────────

describe("custom target", () => {
  it("uses custom target selector", () => {
    const { code } = generateSplitTextCode(
      defaults({ target: "#hero .title" })
    );
    expect(code).toContain('"#hero .title"');
  });
});
