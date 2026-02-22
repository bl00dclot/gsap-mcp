import { describe, it, expect } from "vitest";
import {
  generateMatchMediaCode,
  type MatchMediaParams,
  type MatchMediaBreakpoint,
} from "../../src/tools/dev/matchmedia.js";

function bp(overrides: Partial<MatchMediaBreakpoint> = {}): MatchMediaBreakpoint {
  return {
    name: "Mobile",
    query: "(max-width: 768px)",
    animations: [
      {
        target: ".hero",
        method: "to",
        properties: { scale: 0.8 },
        duration: 1,
      },
    ],
    ...overrides,
  };
}

function defaults(overrides: Partial<MatchMediaParams> = {}): MatchMediaParams {
  return {
    breakpoints: [bp()],
    includeImports: true,
    ...overrides,
  };
}

// ── Single breakpoint ────────────────────────────────────

describe("single breakpoint", () => {
  it("generates gsap.matchMedia and mm.add", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain("const mm = gsap.matchMedia();");
    expect(code).toContain("mm.add(");
  });

  it("includes the media query string", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain('"(max-width: 768px)"');
  });

  it("generates gsap.to call inside callback", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain('gsap.to(".hero"');
    expect(code).toContain("scale: 0.8");
  });

  it("includes duration", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain("duration: 1");
  });

  it("produces no warnings", () => {
    const { warnings } = generateMatchMediaCode(defaults());
    expect(warnings).toHaveLength(0);
  });
});

// ── Breakpoint name as comment ───────────────────────────

describe("breakpoint name as comment", () => {
  it("includes name as a comment", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain("// Mobile");
  });

  it("uses custom name", () => {
    const { code } = generateMatchMediaCode(
      defaults({ breakpoints: [bp({ name: "Tablet" })] })
    );
    expect(code).toContain("// Tablet");
  });
});

// ── Multiple breakpoints ─────────────────────────────────

describe("multiple breakpoints", () => {
  it("generates multiple mm.add blocks", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({ name: "Mobile", query: "(max-width: 768px)" }),
          bp({
            name: "Desktop",
            query: "(min-width: 769px)",
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { scale: 1.2 },
                duration: 1,
                ease: "power2.out",
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("// Mobile");
    expect(code).toContain("// Desktop");
    const addCount = (code.match(/mm\.add\(/g) || []).length;
    expect(addCount).toBe(2);
  });

  it("each breakpoint has its own query", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({ query: "(max-width: 768px)" }),
          bp({ name: "Desktop", query: "(min-width: 769px)" }),
        ],
      })
    );
    expect(code).toContain('"(max-width: 768px)"');
    expect(code).toContain('"(min-width: 769px)"');
  });
});

// ── Cleanup return ───────────────────────────────────────

describe("cleanup return", () => {
  it("includes cleanup return in each breakpoint", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain("return () => {");
    expect(code).toContain("auto-revert on cleanup");
  });

  it("includes cleanup in every breakpoint", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({ name: "Mobile" }),
          bp({ name: "Desktop", query: "(min-width: 769px)" }),
        ],
      })
    );
    const cleanupCount = (code.match(/return \(\) => \{/g) || []).length;
    expect(cleanupCount).toBe(2);
  });
});

// ── Multiple animations per breakpoint ───────────────────

describe("multiple animations per breakpoint", () => {
  it("generates multiple gsap calls inside one callback", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              { target: ".hero", method: "to", properties: { opacity: 1 } },
              { target: ".nav", method: "to", properties: { y: 0 } },
            ],
          }),
        ],
      })
    );
    expect(code).toContain('gsap.to(".hero"');
    expect(code).toContain('gsap.to(".nav"');
  });

  it("animations are indented inside callback", () => {
    const { code } = generateMatchMediaCode(defaults());
    const lines = code.split("\n");
    const gsapLine = lines.find((l) => l.includes("gsap.to("));
    expect(gsapLine).toBeDefined();
    expect(gsapLine!.startsWith("  ")).toBe(true);
  });
});

// ── Method variants ──────────────────────────────────────

describe("method: to", () => {
  it("generates gsap.to", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain("gsap.to(");
  });
});

describe("method: from", () => {
  it("generates gsap.from", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".hero",
                method: "from",
                properties: { opacity: 0 },
                duration: 1,
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("gsap.from(");
    expect(code).toContain("opacity: 0");
  });
});

describe("method: fromTo with fromProperties", () => {
  it("generates gsap.fromTo with both vars objects", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".box",
                method: "fromTo",
                fromProperties: { opacity: 0, x: -50 },
                properties: { opacity: 1, x: 0 },
                duration: 1,
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("gsap.fromTo(");
    expect(code).toContain('".box"');
  });

  it("from vars come before to vars", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".box",
                method: "fromTo",
                fromProperties: { opacity: 0 },
                properties: { opacity: 1 },
                duration: 0.5,
              },
            ],
          }),
        ],
      })
    );
    const fromToLine = code
      .split("\n")
      .find((l) => l.includes("gsap.fromTo("))!;
    const opacityPositions = [...fromToLine.matchAll(/opacity/g)].map(
      (m) => m.index
    );
    expect(opacityPositions).toHaveLength(2);
    expect(opacityPositions[0]).toBeLessThan(opacityPositions[1]);
  });
});

describe("method: fromTo without fromProperties", () => {
  it("falls back to gsap.to and warns", () => {
    const { code, warnings } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".box",
                method: "fromTo",
                properties: { opacity: 1 },
                duration: 1,
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("gsap.to(");
    expect(code).not.toContain("gsap.fromTo(");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("fromProperties");
    expect(warnings[0]).toContain(".box");
  });
});

// ── Empty breakpoints warning ────────────────────────────

describe("empty breakpoints", () => {
  it("warns when breakpoints array is empty", () => {
    const { warnings } = generateMatchMediaCode(
      defaults({ breakpoints: [] })
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("No breakpoints");
  });

  it("returns empty code when no breakpoints", () => {
    const { code } = generateMatchMediaCode(
      defaults({ breakpoints: [] })
    );
    expect(code).toBe("");
  });
});

// ── includeImports ───────────────────────────────────────

describe("includeImports", () => {
  it("true includes import statement", () => {
    const { code } = generateMatchMediaCode(
      defaults({ includeImports: true })
    );
    expect(code).toContain('import gsap from "gsap"');
  });

  it("false omits import statement", () => {
    const { code } = generateMatchMediaCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toContain("import");
  });

  it("false still includes matchMedia setup", () => {
    const { code } = generateMatchMediaCode(
      defaults({ includeImports: false })
    );
    expect(code).toContain("const mm = gsap.matchMedia();");
    expect(code).toContain("mm.add(");
  });
});

// ── Custom duration and ease ─────────────────────────────

describe("custom duration and ease", () => {
  it("includes duration in vars", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { x: 100 },
                duration: 2.5,
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("duration: 2.5");
  });

  it("includes ease in vars", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { x: 100 },
                ease: "power3.inOut",
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain('"power3.inOut"');
  });

  it("includes both duration and ease", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { y: -50 },
                duration: 1,
                ease: "back.out(1.7)",
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("duration: 1");
    expect(code).toContain('"back.out(1.7)"');
  });

  it("omits duration when not provided", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { opacity: 1 },
              },
            ],
          }),
        ],
      })
    );
    expect(code).not.toContain("duration:");
  });

  it("omits ease when not provided", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { opacity: 1 },
              },
            ],
          }),
        ],
      })
    );
    expect(code).not.toContain("ease:");
  });
});

// ── Reduced motion breakpoint ────────────────────────────

describe("reduced motion breakpoint", () => {
  it("handles prefers-reduced-motion query", () => {
    const { code } = generateMatchMediaCode(
      defaults({
        breakpoints: [
          bp({
            name: "Reduced Motion",
            query: "(prefers-reduced-motion: reduce)",
            animations: [
              {
                target: ".hero",
                method: "to",
                properties: { duration: 0 },
              },
            ],
          }),
        ],
      })
    );
    expect(code).toContain("// Reduced Motion");
    expect(code).toContain('"(prefers-reduced-motion: reduce)"');
  });
});

// ── Full example structure ───────────────────────────────

describe("full example structure", () => {
  it("produces correct structure order: import → mm → add blocks", () => {
    const { code } = generateMatchMediaCode(defaults());
    const lines = code.split("\n");

    const importIdx = lines.findIndex((l) => l.includes("import gsap"));
    const mmIdx = lines.findIndex((l) =>
      l.includes("const mm = gsap.matchMedia()")
    );
    const addIdx = lines.findIndex((l) => l.includes("mm.add("));

    expect(importIdx).toBeLessThan(mmIdx);
    expect(mmIdx).toBeLessThan(addIdx);
  });

  it("closes mm.add with });", () => {
    const { code } = generateMatchMediaCode(defaults());
    expect(code).toContain("});");
  });
});
