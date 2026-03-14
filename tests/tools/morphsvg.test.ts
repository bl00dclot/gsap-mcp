import { describe, it, expect } from "vitest";
import {
  generateMorphSVGCode,
  type MorphSVGParams,
} from "../../src/tools/plugins/morphsvg.js";

function defaults(
  overrides: Partial<MorphSVGParams> = {}
): MorphSVGParams {
  return {
    target: "#startShape",
    endShape: "#endShape",
    duration: 2,
    ease: "power1.inOut",
    useTimeline: false,
    includeImports: true,
    ...overrides,
  };
}

// ── Basic morph ───────────────────────────────────────────

describe("basic morph with defaults", () => {
  it("generates gsap.to with morphSVG property", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain("gsap.to(");
    expect(code).toContain("morphSVG:");
  });

  it("includes target selector", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain('"#startShape"');
  });

  it("includes endShape as shape property", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain('shape: "#endShape"');
  });

  it("includes default duration", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain("duration: 2");
  });

  it("includes default ease", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain('"power1.inOut"');
  });

  it("returns empty warnings array", () => {
    const { warnings } = generateMorphSVGCode(defaults());
    expect(warnings).toHaveLength(0);
  });
});

// ── Custom duration and ease ──────────────────────────────

describe("custom duration and ease", () => {
  it("uses custom duration", () => {
    const { code } = generateMorphSVGCode(defaults({ duration: 3.5 }));
    expect(code).toContain("duration: 3.5");
  });

  it("uses custom ease", () => {
    const { code } = generateMorphSVGCode(
      defaults({ ease: "elastic.out" })
    );
    expect(code).toContain('"elastic.out"');
  });
});

// ── shapeIndex values ─────────────────────────────────────

describe("shapeIndex", () => {
  it('"auto" appears in morphSVG config', () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "auto" } })
    );
    expect(code).toContain('shapeIndex: "auto"');
  });

  it("number appears in morphSVG config", () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: 3 } })
    );
    expect(code).toContain("shapeIndex: 3");
  });

  it('"log" appears in morphSVG config', () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "log" } })
    );
    expect(code).toContain('shapeIndex: "log"');
  });

  it('"log" adds debug comment', () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "log" } })
    );
    expect(code).toContain("log all shape index values");
    expect(code).toContain("debugging");
  });

  it('"auto" does not add debug comment', () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "auto" } })
    );
    expect(code).not.toContain("log all shape index values");
  });

  it("number does not add debug comment", () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: 5 } })
    );
    expect(code).not.toContain("log all shape index values");
  });
});

// ── type option ───────────────────────────────────────────

describe("type option", () => {
  it('"rotational" appears in morphSVG config', () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: "auto", type: "rotational" },
      })
    );
    expect(code).toContain('type: "rotational"');
  });

  it('"linear" appears in morphSVG config', () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: "auto", type: "linear" },
      })
    );
    expect(code).toContain('type: "linear"');
  });
});

// ── origin option ─────────────────────────────────────────

describe("origin option", () => {
  it("appears when set", () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: "auto", origin: "50% 50%" },
      })
    );
    expect(code).toContain('origin: "50% 50%"');
  });
});

// ── map option ────────────────────────────────────────────

describe("map option", () => {
  it('"size" appears when set', () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: "auto", map: "size" },
      })
    );
    expect(code).toContain('map: "size"');
  });

  it('"position" appears when set', () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: "auto", map: "position" },
      })
    );
    expect(code).toContain('map: "position"');
  });

  it('"complexity" appears when set', () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: "auto", map: "complexity" },
      })
    );
    expect(code).toContain('map: "complexity"');
  });
});

// ── endShape formats ──────────────────────────────────────

describe("endShape", () => {
  it("CSS selector as endShape", () => {
    const { code } = generateMorphSVGCode(
      defaults({ endShape: "#targetPath" })
    );
    expect(code).toContain('shape: "#targetPath"');
  });

  it("raw SVG path data as endShape", () => {
    const pathData = "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80";
    const { code } = generateMorphSVGCode(
      defaults({ endShape: pathData })
    );
    expect(code).toContain(pathData);
  });
});

// ── useTimeline ───────────────────────────────────────────

describe("useTimeline", () => {
  it("wraps in gsap.timeline() when true", () => {
    const { code } = generateMorphSVGCode(
      defaults({ useTimeline: true })
    );
    expect(code).toContain("gsap.timeline()");
    expect(code).toContain("tl.to(");
  });

  it("uses gsap.to directly when false", () => {
    const { code } = generateMorphSVGCode(
      defaults({ useTimeline: false })
    );
    expect(code).not.toContain("gsap.timeline()");
    expect(code).toContain("gsap.to(");
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports and registerPlugin", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain(
      'import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"'
    );
    expect(code).toContain("gsap.registerPlugin(MorphSVGPlugin)");
  });

  it("false omits imports and registerPlugin", () => {
    const { code } = generateMorphSVGCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toMatch(/^import /m);
    expect(code).not.toContain("registerPlugin");
  });
});

// ── convertToPath tip ─────────────────────────────────────

describe("convertToPath tip", () => {
  it("comment is present", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).toContain("MorphSVGPlugin.convertToPath");
    expect(code).toContain("non-path SVG elements");
  });

  it("comment is present even with includeImports false", () => {
    const { code } = generateMorphSVGCode(
      defaults({ includeImports: false })
    );
    expect(code).toContain("MorphSVGPlugin.convertToPath");
  });
});

// ── Options omit undefined fields ─────────────────────────

describe("options omit undefined fields", () => {
  it("no type key when not specified", () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "auto" } })
    );
    expect(code).toContain("shapeIndex:");
    expect(code).not.toContain("type:");
  });

  it("no origin key when not specified", () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "auto" } })
    );
    expect(code).not.toContain("origin:");
  });

  it("no map key when not specified", () => {
    const { code } = generateMorphSVGCode(
      defaults({ options: { shapeIndex: "auto" } })
    );
    expect(code).not.toContain("map:");
  });

  it("no shapeIndex when options not provided", () => {
    const { code } = generateMorphSVGCode(defaults());
    expect(code).not.toContain("shapeIndex:");
  });

  it("only includes provided option fields", () => {
    const { code } = generateMorphSVGCode(
      defaults({
        options: { shapeIndex: 2, type: "rotational" },
      })
    );
    expect(code).toContain("shapeIndex: 2");
    expect(code).toContain('type: "rotational"');
    expect(code).not.toContain("origin:");
    expect(code).not.toContain("map:");
  });
});

// ── Custom target ─────────────────────────────────────────

describe("custom target", () => {
  it("uses custom target selector", () => {
    const { code } = generateMorphSVGCode(
      defaults({ target: ".morphable-path" })
    );
    expect(code).toContain('".morphable-path"');
  });
});
