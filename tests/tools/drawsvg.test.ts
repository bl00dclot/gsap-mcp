import { describe, it, expect } from "vitest";
import {
  generateDrawSVGCode,
  type DrawSVGParams,
} from "../../src/tools/plugins/drawsvg.js";

function defaults(
  overrides: Partial<DrawSVGParams> = {}
): DrawSVGParams {
  return {
    target: ".path",
    from: "0%",
    to: "100%",
    duration: 2,
    useTimeline: false,
    includeImports: true,
    ...overrides,
  };
}

// ── Basic draw with defaults ──────────────────────────────

describe("basic draw with defaults", () => {
  it("generates gsap.fromTo with drawSVG", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain("gsap.fromTo(");
    expect(code).toContain("drawSVG:");
  });

  it("uses 0% as from value", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain('"0%"');
  });

  it("uses 100% as to value", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain('"100%"');
  });

  it("includes target selector", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain('".path"');
  });

  it("includes default duration", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain("duration: 2");
  });

  it("includes default ease", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain('"power2.inOut"');
  });

  it("returns empty warnings", () => {
    const { warnings } = generateDrawSVGCode(defaults());
    expect(warnings).toHaveLength(0);
  });
});

// ── Custom from/to values ─────────────────────────────────

describe("custom from/to values", () => {
  it("uses custom from value", () => {
    const { code } = generateDrawSVGCode(defaults({ from: "50%" }));
    expect(code).toContain('"50%"');
  });

  it("uses custom to value", () => {
    const { code } = generateDrawSVGCode(defaults({ to: "75%" }));
    expect(code).toContain('"75%"');
  });

  it("supports range format like '50% 50%'", () => {
    const { code } = generateDrawSVGCode(
      defaults({ from: "50% 50%" })
    );
    expect(code).toContain('"50% 50%"');
  });

  it("supports range to value", () => {
    const { code } = generateDrawSVGCode(
      defaults({ to: "20% 80%" })
    );
    expect(code).toContain('"20% 80%"');
  });
});

// ── Custom duration and ease ──────────────────────────────

describe("custom duration and ease", () => {
  it("uses custom duration", () => {
    const { code } = generateDrawSVGCode(defaults({ duration: 3.5 }));
    expect(code).toContain("duration: 3.5");
  });

  it("uses custom ease", () => {
    const { code } = generateDrawSVGCode(
      defaults({ options: { ease: "none" } })
    );
    expect(code).toContain('"none"');
  });
});

// ── Stagger ───────────────────────────────────────────────

describe("stagger", () => {
  it("appears when set", () => {
    const { code } = generateDrawSVGCode(
      defaults({ options: { ease: "power2.inOut", stagger: 0.1 } })
    );
    expect(code).toContain("stagger: 0.1");
  });

  it("omitted when not set", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).not.toContain("stagger:");
  });
});

// ── Repeat and yoyo ───────────────────────────────────────

describe("repeat and yoyo", () => {
  it("repeat appears when set", () => {
    const { code } = generateDrawSVGCode(
      defaults({ options: { ease: "power2.inOut", repeat: -1 } })
    );
    expect(code).toContain("repeat: -1");
  });

  it("yoyo appears when set", () => {
    const { code } = generateDrawSVGCode(
      defaults({ options: { ease: "power2.inOut", yoyo: true } })
    );
    expect(code).toContain("yoyo: true");
  });

  it("repeat and yoyo together", () => {
    const { code } = generateDrawSVGCode(
      defaults({
        options: { ease: "power2.inOut", repeat: 3, yoyo: true },
      })
    );
    expect(code).toContain("repeat: 3");
    expect(code).toContain("yoyo: true");
  });

  it("repeat omitted when not set", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).not.toContain("repeat:");
  });

  it("yoyo omitted when not set", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).not.toContain("yoyo:");
  });
});

// ── Delay ─────────────────────────────────────────────────

describe("delay", () => {
  it("appears when set", () => {
    const { code } = generateDrawSVGCode(
      defaults({ options: { ease: "power2.inOut", delay: 0.5 } })
    );
    expect(code).toContain("delay: 0.5");
  });

  it("omitted when not set", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).not.toContain("delay:");
  });
});

// ── useTimeline ───────────────────────────────────────────

describe("useTimeline", () => {
  it("wraps in gsap.timeline() when true", () => {
    const { code } = generateDrawSVGCode(
      defaults({ useTimeline: true })
    );
    expect(code).toContain("gsap.timeline()");
    expect(code).toContain("tl.fromTo(");
  });

  it("uses gsap.fromTo directly when false", () => {
    const { code } = generateDrawSVGCode(
      defaults({ useTimeline: false })
    );
    expect(code).not.toContain("gsap.timeline()");
    expect(code).toContain("gsap.fromTo(");
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports and registerPlugin", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain(
      'import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"'
    );
    expect(code).toContain("gsap.registerPlugin(DrawSVGPlugin)");
  });

  it("false omits imports and registerPlugin", () => {
    const { code } = generateDrawSVGCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toContain("import");
    expect(code).not.toContain("registerPlugin");
  });
});

// ── Stroke tip comment ────────────────────────────────────

describe("stroke tip comment", () => {
  it("is present", () => {
    const { code } = generateDrawSVGCode(defaults());
    expect(code).toContain("stroke and stroke-width");
  });

  it("is present even with includeImports false", () => {
    const { code } = generateDrawSVGCode(
      defaults({ includeImports: false })
    );
    expect(code).toContain("stroke and stroke-width");
  });
});

// ── Multiple options combined ─────────────────────────────

describe("multiple options combined", () => {
  it("all options appear in one call", () => {
    const { code } = generateDrawSVGCode(
      defaults({
        duration: 1.5,
        from: "10%",
        to: "90%",
        options: {
          ease: "elastic.out",
          stagger: 0.2,
          repeat: 2,
          yoyo: true,
          delay: 1,
        },
      })
    );
    expect(code).toContain("duration: 1.5");
    expect(code).toContain('"10%"');
    expect(code).toContain('"90%"');
    expect(code).toContain('"elastic.out"');
    expect(code).toContain("stagger: 0.2");
    expect(code).toContain("repeat: 2");
    expect(code).toContain("yoyo: true");
    expect(code).toContain("delay: 1");
  });
});

// ── Custom target ─────────────────────────────────────────

describe("custom target", () => {
  it("uses custom target selector", () => {
    const { code } = generateDrawSVGCode(
      defaults({ target: "#logo-outline path" })
    );
    expect(code).toContain('"#logo-outline path"');
  });
});
