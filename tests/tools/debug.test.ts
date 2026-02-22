import { describe, it, expect } from "vitest";
import {
  generateDebugCode,
  type DebugParams,
} from "../../src/tools/dev/debug.js";

function defaults(overrides: Partial<DebugParams> = {}): DebugParams {
  return {
    action: "visualize",
    target: "tl",
    ...overrides,
  };
}

// ── visualize action ─────────────────────────────────────

describe("visualize action", () => {
  it("generates ScrollTrigger.defaults with markers", () => {
    const { code } = generateDebugCode(defaults({ action: "visualize" }));
    expect(code).toContain("ScrollTrigger.defaults({ markers: true })");
  });

  it("logs timeline duration and children count", () => {
    const { code } = generateDebugCode(defaults({ action: "visualize" }));
    expect(code).toContain("tl.duration()");
    expect(code).toContain("tl.getChildren().length");
  });

  it("includes production warning", () => {
    const { code } = generateDebugCode(defaults({ action: "visualize" }));
    expect(code).toContain("production");
  });

  it("uses custom target name", () => {
    const { code } = generateDebugCode(
      defaults({ action: "visualize", target: "mainTimeline" })
    );
    expect(code).toContain("mainTimeline.duration()");
    expect(code).toContain("mainTimeline.getChildren().length");
  });

  it("produces no warnings", () => {
    const { warnings } = generateDebugCode(defaults({ action: "visualize" }));
    expect(warnings).toHaveLength(0);
  });
});

// ── gsdevtools action ────────────────────────────────────

describe("gsdevtools action", () => {
  it("imports GSDevTools", () => {
    const { code } = generateDebugCode(defaults({ action: "gsdevtools" }));
    expect(code).toContain('import { GSDevTools } from "gsap/GSDevTools"');
  });

  it("registers the plugin", () => {
    const { code } = generateDebugCode(defaults({ action: "gsdevtools" }));
    expect(code).toContain("gsap.registerPlugin(GSDevTools)");
  });

  it("creates GSDevTools with animation target", () => {
    const { code } = generateDebugCode(defaults({ action: "gsdevtools" }));
    expect(code).toContain("GSDevTools.create({ animation: tl })");
  });

  it("uses custom target", () => {
    const { code } = generateDebugCode(
      defaults({ action: "gsdevtools", target: "heroTl" })
    );
    expect(code).toContain("GSDevTools.create({ animation: heroTl })");
  });

  it("notes premium plugin requirement", () => {
    const { code } = generateDebugCode(defaults({ action: "gsdevtools" }));
    expect(code).toContain("premium");
  });
});

// ── log action ───────────────────────────────────────────

describe("log action", () => {
  it("generates eventCallback with onUpdate", () => {
    const { code } = generateDebugCode(defaults({ action: "log" }));
    expect(code).toContain('eventCallback("onUpdate"');
  });

  it("logs progress and time", () => {
    const { code } = generateDebugCode(defaults({ action: "log" }));
    expect(code).toContain("tl.progress()");
    expect(code).toContain("tl.time()");
  });

  it("uses toFixed(2) for formatting", () => {
    const { code } = generateDebugCode(defaults({ action: "log" }));
    expect(code).toContain(".toFixed(2)");
  });

  it("uses custom target", () => {
    const { code } = generateDebugCode(
      defaults({ action: "log", target: "myTl" })
    );
    expect(code).toContain("myTl.eventCallback(");
    expect(code).toContain("myTl.progress()");
    expect(code).toContain("myTl.time()");
  });
});

// ── slowmo action ────────────────────────────────────────

describe("slowmo action", () => {
  it("generates globalTimeline.timeScale with default 0.25", () => {
    const { code } = generateDebugCode(defaults({ action: "slowmo" }));
    expect(code).toContain("gsap.globalTimeline.timeScale(0.25)");
  });

  it("uses custom timeScale value", () => {
    const { code } = generateDebugCode(
      defaults({ action: "slowmo", options: { timeScale: 0.1 } })
    );
    expect(code).toContain("gsap.globalTimeline.timeScale(0.1)");
  });

  it("includes comment about the speed value", () => {
    const { code } = generateDebugCode(
      defaults({ action: "slowmo", options: { timeScale: 0.5 } })
    );
    expect(code).toContain("0.5x speed");
  });

  it("includes reset comment", () => {
    const { code } = generateDebugCode(defaults({ action: "slowmo" }));
    expect(code).toContain("gsap.globalTimeline.timeScale(1)");
    expect(code).toContain("Reset to normal speed");
  });

  it("defaults timeScale to 0.25 when options missing", () => {
    const { code } = generateDebugCode(defaults({ action: "slowmo" }));
    expect(code).toContain("0.25");
  });
});

// ── labelDump action ─────────────────────────────────────

describe("labelDump action", () => {
  it("uses target.labels (GSAP 3 API)", () => {
    const { code } = generateDebugCode(defaults({ action: "labelDump" }));
    expect(code).toContain("tl.labels");
  });

  it("does not use getLabels()", () => {
    const { code } = generateDebugCode(defaults({ action: "labelDump" }));
    expect(code).not.toContain("getLabels()");
  });

  it("iterates with Object.entries", () => {
    const { code } = generateDebugCode(defaults({ action: "labelDump" }));
    expect(code).toContain("Object.entries(labels)");
  });

  it("logs label name and time", () => {
    const { code } = generateDebugCode(defaults({ action: "labelDump" }));
    expect(code).toContain("Label:");
    expect(code).toContain("name");
    expect(code).toContain("time");
  });

  it("uses custom target", () => {
    const { code } = generateDebugCode(
      defaults({ action: "labelDump", target: "masterTl" })
    );
    expect(code).toContain("masterTl.labels");
  });
});

// ── Custom target across all actions ─────────────────────

describe("custom target across actions", () => {
  const actions = [
    "visualize",
    "gsdevtools",
    "log",
    "labelDump",
  ] as const;

  for (const action of actions) {
    it(`${action} uses custom target`, () => {
      const { code } = generateDebugCode(
        defaults({ action, target: "customTl" })
      );
      expect(code).toContain("customTl");
    });
  }

  it("slowmo ignores target (uses globalTimeline)", () => {
    const { code } = generateDebugCode(
      defaults({ action: "slowmo", target: "customTl" })
    );
    expect(code).toContain("gsap.globalTimeline.timeScale");
    expect(code).not.toContain("customTl");
  });
});

// ── No warnings for all actions ──────────────────────────

describe("no warnings for all actions", () => {
  const actions = [
    "visualize",
    "gsdevtools",
    "log",
    "slowmo",
    "labelDump",
  ] as const;

  for (const action of actions) {
    it(`${action} produces no warnings`, () => {
      const { warnings } = generateDebugCode(defaults({ action }));
      expect(warnings).toHaveLength(0);
    });
  }
});
