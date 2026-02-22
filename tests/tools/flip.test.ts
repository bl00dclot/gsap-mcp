import { describe, it, expect } from "vitest";
import {
  generateFlipCode,
  type FlipParams,
} from "../../src/tools/plugins/flip.js";

function defaults(
  overrides: Partial<FlipParams> = {}
): FlipParams {
  return {
    targets: ".grid-item",
    action: "full",
    options: {
      duration: 0.7,
      ease: "power1.inOut",
    },
    includeImports: true,
    ...overrides,
  };
}

// ── "full" action ─────────────────────────────────────────

describe("full action", () => {
  it("generates complete 3-step Flip pattern", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain("Flip.getState(");
    expect(code).toContain("Flip.from(state,");
  });

  it("includes step 1 comment", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain("1. Capture current state");
  });

  it("includes step 2 comment", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain("2. Make your DOM changes");
  });

  it("includes step 3 comment", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain("3. Animate from old state to new");
  });

  it("includes default placeholder comment when no stateChange", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain("reorder elements, toggle classes");
  });

  it("uses stateChange as step 2 comment when provided", () => {
    const { code } = generateFlipCode(
      defaults({ stateChange: "Toggle .active class on clicked item" })
    );
    expect(code).toContain("Toggle .active class on clicked item");
    expect(code).not.toContain("reorder elements, toggle classes");
  });

  it("includes targets in getState call", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain('Flip.getState(".grid-item")');
  });

  it("includes options in Flip.from call", () => {
    const { code } = generateFlipCode(
      defaults({
        options: {
          duration: 0.7,
          ease: "power1.inOut",
          scale: true,
          absolute: true,
        },
      })
    );
    expect(code).toContain("scale: true");
    expect(code).toContain("absolute: true");
  });
});

// ── "getState" action ─────────────────────────────────────

describe("getState action", () => {
  it("generates just the getState call", () => {
    const { code } = generateFlipCode(
      defaults({ action: "getState" })
    );
    expect(code).toContain('Flip.getState(".grid-item")');
  });

  it("does not include Flip.from", () => {
    const { code } = generateFlipCode(
      defaults({ action: "getState" })
    );
    expect(code).not.toContain("Flip.from(");
  });

  it("does not include step comments", () => {
    const { code } = generateFlipCode(
      defaults({ action: "getState" })
    );
    expect(code).not.toContain("1. Capture");
    expect(code).not.toContain("2. Make");
    expect(code).not.toContain("3. Animate");
  });
});

// ── "state" action (alias) ────────────────────────────────

describe("state action (alias)", () => {
  it("generates same output as getState", () => {
    const getState = generateFlipCode(
      defaults({ action: "getState" })
    );
    const state = generateFlipCode(
      defaults({ action: "state" })
    );
    expect(state.code).toBe(getState.code);
  });
});

// ── "from" action ─────────────────────────────────────────

describe("from action", () => {
  it("generates Flip.from call", () => {
    const { code } = generateFlipCode(
      defaults({ action: "from" })
    );
    expect(code).toContain("Flip.from(state,");
  });

  it("does not include getState call", () => {
    const { code } = generateFlipCode(
      defaults({ action: "from" })
    );
    expect(code).not.toContain("Flip.getState(");
  });

  it("includes options", () => {
    const { code } = generateFlipCode(
      defaults({
        action: "from",
        options: { duration: 1, ease: "power2.out", scale: true },
      })
    );
    expect(code).toContain("duration: 1");
    expect(code).toContain('"power2.out"');
    expect(code).toContain("scale: true");
  });
});

// ── "fit" action ──────────────────────────────────────────

describe("fit action", () => {
  it("generates Flip.fit with source and destination", () => {
    const { code } = generateFlipCode(
      defaults({
        action: "fit",
        targets: ".source",
        stateChange: ".destination",
      })
    );
    expect(code).toContain('Flip.fit(".source", ".destination"');
  });

  it("includes options in fit call", () => {
    const { code } = generateFlipCode(
      defaults({
        action: "fit",
        stateChange: ".dest",
        options: { duration: 0.5, ease: "power1.inOut", scale: true },
      })
    );
    expect(code).toContain("duration: 0.5");
    expect(code).toContain("scale: true");
  });

  it("warns when stateChange (destination) is missing", () => {
    const { warnings } = generateFlipCode(
      defaults({ action: "fit" })
    );
    expect(warnings.some((w) => w.includes("destination"))).toBe(true);
    expect(warnings.some((w) => w.includes("fit"))).toBe(true);
  });

  it("still generates code with fallback when destination missing", () => {
    const { code } = generateFlipCode(
      defaults({ action: "fit" })
    );
    expect(code).toContain("Flip.fit(");
    expect(code).toContain('".destination"');
  });
});

// ── Options ───────────────────────────────────────────────

describe("options", () => {
  it("duration appears in output", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 1.2, ease: "power1.inOut" },
      })
    );
    expect(code).toContain("duration: 1.2");
  });

  it("ease appears in output", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "elastic.out" },
      })
    );
    expect(code).toContain('"elastic.out"');
  });

  it("scale appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", scale: true },
      })
    );
    expect(code).toContain("scale: true");
  });

  it("absolute appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", absolute: true },
      })
    );
    expect(code).toContain("absolute: true");
  });

  it("simple appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", simple: true },
      })
    );
    expect(code).toContain("simple: true");
  });

  it("fade appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", fade: true },
      })
    );
    expect(code).toContain("fade: true");
  });

  it("spin boolean appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", spin: true },
      })
    );
    expect(code).toContain("spin: true");
  });

  it("spin number appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", spin: 2 },
      })
    );
    expect(code).toContain("spin: 2");
  });

  it("nested appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", nested: true },
      })
    );
    expect(code).toContain("nested: true");
  });

  it("prune appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", prune: true },
      })
    );
    expect(code).toContain("prune: true");
  });

  it("props appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: {
          duration: 0.7,
          ease: "power1.inOut",
          props: "color,backgroundColor",
        },
      })
    );
    expect(code).toContain('"color,backgroundColor"');
  });

  it("stagger appears when set", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", stagger: 0.05 },
      })
    );
    expect(code).toContain("stagger: 0.05");
  });
});

// ── onEnter/onLeave ───────────────────────────────────────

describe("onEnter and onLeave", () => {
  it("onEnter appears in Flip.from options", () => {
    const { code } = generateFlipCode(
      defaults({
        options: {
          duration: 0.7,
          ease: "power1.inOut",
          onEnter: { opacity: 0, scale: 0 },
        },
      })
    );
    expect(code).toContain("onEnter:");
    expect(code).toContain("opacity: 0");
  });

  it("onLeave appears in Flip.from options", () => {
    const { code } = generateFlipCode(
      defaults({
        options: {
          duration: 0.7,
          ease: "power1.inOut",
          onLeave: { opacity: 0, scale: 0 },
        },
      })
    );
    expect(code).toContain("onLeave:");
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports and registerPlugin", () => {
    const { code } = generateFlipCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain('import { Flip } from "gsap/Flip"');
    expect(code).toContain("gsap.registerPlugin(Flip)");
  });

  it("false omits imports and registerPlugin", () => {
    const { code } = generateFlipCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toContain("import");
    expect(code).not.toContain("registerPlugin");
  });
});

// ── Options omit undefined fields ─────────────────────────

describe("options omit undefined fields", () => {
  it("only includes provided fields", () => {
    const { code } = generateFlipCode(
      defaults({
        options: { duration: 0.7, ease: "power1.inOut", scale: true },
      })
    );
    expect(code).toContain("duration: 0.7");
    expect(code).toContain("scale: true");
    expect(code).not.toContain("absolute:");
    expect(code).not.toContain("simple:");
    expect(code).not.toContain("fade:");
    expect(code).not.toContain("spin:");
    expect(code).not.toContain("nested:");
    expect(code).not.toContain("prune:");
    expect(code).not.toContain("props:");
    expect(code).not.toContain("stagger:");
    expect(code).not.toContain("onEnter:");
    expect(code).not.toContain("onLeave:");
  });

  it("empty options produces empty object", () => {
    const { code } = generateFlipCode(
      defaults({ action: "from", options: undefined })
    );
    expect(code).toContain("Flip.from(state, {})");
  });
});

// ── Custom targets selector ───────────────────────────────

describe("custom targets selector", () => {
  it("uses custom targets in output", () => {
    const { code } = generateFlipCode(
      defaults({ targets: ".card-container > .card" })
    );
    expect(code).toContain('".card-container > .card"');
  });
});
