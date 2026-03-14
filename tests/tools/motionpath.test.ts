import { describe, it, expect } from "vitest";
import {
  generateMotionPathCode,
  type MotionPathParams,
} from "../../src/tools/plugins/motionpath.js";

function defaults(
  overrides: Partial<MotionPathParams> = {}
): MotionPathParams {
  return {
    target: ".element",
    path: "#myPath",
    duration: 5,
    ease: "none",
    includeImports: true,
    ...overrides,
  };
}

// ── Basic with SVG path selector ──────────────────────────

describe("basic with SVG path selector", () => {
  it("generates gsap.to with motionPath", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain("gsap.to(");
    expect(code).toContain("motionPath:");
  });

  it("includes path selector", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain('"#myPath"');
  });

  it("includes target selector", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain('".element"');
  });

  it("includes default duration", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain("duration: 5");
  });

  it("includes default ease", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain('"none"');
  });

  it("returns empty warnings", () => {
    const { warnings } = generateMotionPathCode(defaults());
    expect(warnings).toHaveLength(0);
  });
});

// ── Path as points array ──────────────────────────────────

describe("path as points array", () => {
  it("formats points array in output", () => {
    const points = [
      { x: 100, y: 0 },
      { x: 200, y: 100 },
      { x: 300, y: 0 },
    ];
    const { code } = generateMotionPathCode(
      defaults({ path: points })
    );
    expect(code).toContain("x: 100");
    expect(code).toContain("y: 0");
    expect(code).toContain("x: 200");
    expect(code).toContain("y: 100");
    expect(code).toContain("x: 300");
  });

  it("does not quote the path when it is an array", () => {
    const points = [{ x: 50, y: 50 }];
    const { code } = generateMotionPathCode(
      defaults({ path: points })
    );
    // Path should not be a string — should contain object notation
    expect(code).toContain("x: 50");
    expect(code).toContain("y: 50");
  });
});

// ── autoRotate ────────────────────────────────────────────

describe("autoRotate", () => {
  it("boolean true appears in config", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { autoRotate: true } })
    );
    expect(code).toContain("autoRotate: true");
  });

  it("boolean false appears in config", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { autoRotate: false } })
    );
    expect(code).toContain("autoRotate: false");
  });

  it("number (degree offset) appears in config", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { autoRotate: 90 } })
    );
    expect(code).toContain("autoRotate: 90");
  });

  it("omitted when not set", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).not.toContain("autoRotate:");
  });
});

// ── align and alignOrigin ─────────────────────────────────

describe("align and alignOrigin", () => {
  it("align appears when set", () => {
    const { code } = generateMotionPathCode(
      defaults({
        options: { align: "#myPath", alignOrigin: [0.5, 0.5] },
      })
    );
    expect(code).toContain('align: "#myPath"');
  });

  it("alignOrigin values appear as array", () => {
    const { code } = generateMotionPathCode(
      defaults({
        options: { align: "#myPath", alignOrigin: [0.5, 0.5] },
      })
    );
    expect(code).toContain("alignOrigin:");
    expect(code).toContain("0.5");
  });

  it("custom alignOrigin values", () => {
    const { code } = generateMotionPathCode(
      defaults({
        options: { align: "#myPath", alignOrigin: [0, 1] },
      })
    );
    expect(code).toContain("alignOrigin:");
  });

  it("align without alignOrigin triggers suggestion comment", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { align: "#myPath" } })
    );
    expect(code).toContain("alignOrigin: [0.5, 0.5]");
    expect(code).toContain("center the element");
  });

  it("align with alignOrigin does not trigger suggestion comment", () => {
    const { code } = generateMotionPathCode(
      defaults({
        options: { align: "#myPath", alignOrigin: [0.5, 0.5] },
      })
    );
    expect(code).not.toContain("Consider adding alignOrigin");
  });

  it("no align does not trigger suggestion comment", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).not.toContain("Consider adding alignOrigin");
  });
});

// ── start and end ─────────────────────────────────────────

describe("start and end", () => {
  it("start appears in config", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { start: 0.2 } })
    );
    expect(code).toContain("start: 0.2");
  });

  it("end appears in config", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { end: 0.8 } })
    );
    expect(code).toContain("end: 0.8");
  });

  it("both start and end", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { start: 0.1, end: 0.9 } })
    );
    expect(code).toContain("start: 0.1");
    expect(code).toContain("end: 0.9");
  });

  it("omitted when not set", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).not.toContain("start:");
    expect(code).not.toContain("end:");
  });
});

// ── curviness ─────────────────────────────────────────────

describe("curviness", () => {
  it("appears when set", () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { curviness: 1.5 } })
    );
    expect(code).toContain("curviness: 1.5");
  });

  it("omitted when not set", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).not.toContain("curviness:");
  });
});

// ── type ──────────────────────────────────────────────────

describe("type", () => {
  it('"cubic" appears when set', () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { type: "cubic" } })
    );
    expect(code).toContain('"cubic"');
  });

  it('"thru" appears when set', () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { type: "thru" } })
    );
    expect(code).toContain('"thru"');
  });

  it('"soft" appears when set', () => {
    const { code } = generateMotionPathCode(
      defaults({ options: { type: "soft" } })
    );
    expect(code).toContain('"soft"');
  });

  it("omitted when not set", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).not.toContain("type:");
  });
});

// ── Custom duration and ease ──────────────────────────────

describe("custom duration and ease", () => {
  it("uses custom duration", () => {
    const { code } = generateMotionPathCode(
      defaults({ duration: 3 })
    );
    expect(code).toContain("duration: 3");
  });

  it("uses custom ease", () => {
    const { code } = generateMotionPathCode(
      defaults({ ease: "power2.inOut" })
    );
    expect(code).toContain('"power2.inOut"');
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports and registerPlugin", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain(
      'import { MotionPathPlugin } from "gsap/MotionPathPlugin"'
    );
    expect(code).toContain("gsap.registerPlugin(MotionPathPlugin)");
  });

  it("false omits imports and registerPlugin", () => {
    const { code } = generateMotionPathCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toMatch(/^import /m);
    expect(code).not.toContain("registerPlugin");
  });
});

// ── MotionPathHelper tip ──────────────────────────────────

describe("MotionPathHelper tip", () => {
  it("is present", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain("MotionPathHelper");
    expect(code).toContain("visual path editing");
  });

  it("is present even with includeImports false", () => {
    const { code } = generateMotionPathCode(
      defaults({ includeImports: false })
    );
    expect(code).toContain("MotionPathHelper");
  });
});

// ── Options omit undefined fields ─────────────────────────

describe("options omit undefined fields", () => {
  it("only path when no options", () => {
    const { code } = generateMotionPathCode(defaults());
    expect(code).toContain("path:");
    expect(code).not.toContain("autoRotate:");
    expect(code).not.toContain("align:");
    expect(code).not.toContain("alignOrigin:");
    expect(code).not.toContain("start:");
    expect(code).not.toContain("end:");
    expect(code).not.toContain("curviness:");
    expect(code).not.toContain("type:");
  });

  it("only includes provided option fields", () => {
    const { code } = generateMotionPathCode(
      defaults({
        options: { autoRotate: true, curviness: 2 },
      })
    );
    expect(code).toContain("autoRotate: true");
    expect(code).toContain("curviness: 2");
    expect(code).not.toContain("align:");
    expect(code).not.toContain("start:");
    expect(code).not.toContain("type:");
  });
});
