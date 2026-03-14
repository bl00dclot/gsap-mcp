import { describe, it, expect } from "vitest";
import {
  generateControlsCode,
  type ControlsParams,
} from "../../src/tools/dev/controls.js";

function defaults(overrides: Partial<ControlsParams> = {}): ControlsParams {
  return {
    action: "play",
    target: "timeline",
    generateUI: false,
    ...overrides,
  };
}

// ── Default variable names ───────────────────────────────

describe("default variable names", () => {
  it('uses "tl" for timeline target', () => {
    const { code } = generateControlsCode(defaults());
    expect(code).toBe("tl.play();");
  });

  it('uses "tween" for tween target', () => {
    const { code } = generateControlsCode(defaults({ target: "tween" }));
    expect(code).toBe("tween.play();");
  });

  it('uses "gsap.globalTimeline" for global target', () => {
    const { code } = generateControlsCode(defaults({ target: "global" }));
    expect(code).toBe("gsap.globalTimeline.play();");
  });
});

// ── Custom variableName ──────────────────────────────────

describe("custom variableName", () => {
  it("uses custom variableName for timeline", () => {
    const { code } = generateControlsCode(
      defaults({ variableName: "myTimeline" })
    );
    expect(code).toBe("myTimeline.play();");
  });

  it("uses custom variableName for tween", () => {
    const { code } = generateControlsCode(
      defaults({ target: "tween", variableName: "heroTween" })
    );
    expect(code).toBe("heroTween.play();");
  });

  it("uses custom variableName for global", () => {
    const { code } = generateControlsCode(
      defaults({ target: "global", variableName: "masterTl", action: "pause" })
    );
    expect(code).toBe("masterTl.pause();");
  });
});

// ── Backward compat: deprecated selector key ─────────────

describe("deprecated selector backward compat", () => {
  it("uses selector value as variable name when variableName not provided", () => {
    const { code } = generateControlsCode(
      defaults({ selector: "legacyTl" })
    );
    expect(code).toContain("legacyTl.play();");
  });

  it("includes deprecation comment when selector is used", () => {
    const { code } = generateControlsCode(
      defaults({ selector: "legacyTl" })
    );
    expect(code).toContain(
      '// DEPRECATED: parameter "selector" has been renamed to "variableName"'
    );
  });

  it("variableName takes precedence over selector when both provided", () => {
    const { code } = generateControlsCode(
      defaults({ variableName: "newTl", selector: "oldTl" })
    );
    expect(code).toContain("newTl.play();");
    expect(code).not.toContain("oldTl");
    expect(code).not.toContain("DEPRECATED");
  });

  it("no deprecation comment when only variableName is used", () => {
    const { code } = generateControlsCode(
      defaults({ variableName: "myTl" })
    );
    expect(code).not.toContain("DEPRECATED");
  });
});

// ── Play action ──────────────────────────────────────────

describe("play action", () => {
  it("generates play call", () => {
    const { code } = generateControlsCode(defaults({ action: "play" }));
    expect(code).toBe("tl.play();");
  });

  it("produces no warnings", () => {
    const { warnings } = generateControlsCode(defaults({ action: "play" }));
    expect(warnings).toHaveLength(0);
  });
});

// ── Pause action ─────────────────────────────────────────

describe("pause action", () => {
  it("generates pause call", () => {
    const { code } = generateControlsCode(defaults({ action: "pause" }));
    expect(code).toBe("tl.pause();");
  });
});

// ── Resume action ────────────────────────────────────────

describe("resume action", () => {
  it("generates resume call", () => {
    const { code } = generateControlsCode(defaults({ action: "resume" }));
    expect(code).toBe("tl.resume();");
  });
});

// ── Reverse action ───────────────────────────────────────

describe("reverse action", () => {
  it("generates reverse call", () => {
    const { code } = generateControlsCode(defaults({ action: "reverse" }));
    expect(code).toBe("tl.reverse();");
  });
});

// ── Restart action ───────────────────────────────────────

describe("restart action", () => {
  it("generates restart call", () => {
    const { code } = generateControlsCode(defaults({ action: "restart" }));
    expect(code).toBe("tl.restart();");
  });
});

// ── Seek action ──────────────────────────────────────────

describe("seek action", () => {
  it("generates seek with number value", () => {
    const { code } = generateControlsCode(
      defaults({ action: "seek", value: 2 })
    );
    expect(code).toBe("tl.seek(2);");
  });

  it("generates seek with string label", () => {
    const { code } = generateControlsCode(
      defaults({ action: "seek", value: "section2" })
    );
    expect(code).toBe('tl.seek("section2");');
  });

  it("warns and defaults to 0 when value missing", () => {
    const { code, warnings } = generateControlsCode(
      defaults({ action: "seek" })
    );
    expect(code).toBe("tl.seek(0);");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("seek requires a value");
  });

  it("generates seek with float value", () => {
    const { code } = generateControlsCode(
      defaults({ action: "seek", value: 1.5 })
    );
    expect(code).toBe("tl.seek(1.5);");
  });

  it("generates seek with zero value (no warning)", () => {
    const { code, warnings } = generateControlsCode(
      defaults({ action: "seek", value: 0 })
    );
    expect(code).toBe("tl.seek(0);");
    expect(warnings).toHaveLength(0);
  });
});

// ── TimeScale action ─────────────────────────────────────

describe("timeScale action", () => {
  it("generates timeScale with value", () => {
    const { code } = generateControlsCode(
      defaults({ action: "timeScale", value: 0.5 })
    );
    expect(code).toBe("tl.timeScale(0.5);");
  });

  it("generates timeScale with 2x", () => {
    const { code } = generateControlsCode(
      defaults({ action: "timeScale", value: 2 })
    );
    expect(code).toBe("tl.timeScale(2);");
  });

  it("warns and defaults to 1 when value missing", () => {
    const { code, warnings } = generateControlsCode(
      defaults({ action: "timeScale" })
    );
    expect(code).toBe("tl.timeScale(1);");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("timeScale requires a numeric value");
  });
});

// ── Progress action ──────────────────────────────────────

describe("progress action", () => {
  it("generates progress with value", () => {
    const { code } = generateControlsCode(
      defaults({ action: "progress", value: 0.5 })
    );
    expect(code).toBe("tl.progress(0.5);");
  });

  it("generates progress with 1", () => {
    const { code } = generateControlsCode(
      defaults({ action: "progress", value: 1 })
    );
    expect(code).toBe("tl.progress(1);");
  });

  it("warns and defaults to 0 when value missing", () => {
    const { code, warnings } = generateControlsCode(
      defaults({ action: "progress" })
    );
    expect(code).toBe("tl.progress(0);");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("progress requires a numeric value");
  });
});

// ── Kill action ──────────────────────────────────────────

describe("kill action", () => {
  it("generates kill for timeline", () => {
    const { code } = generateControlsCode(defaults({ action: "kill" }));
    expect(code).toBe("tl.kill();");
  });

  it("generates kill for tween", () => {
    const { code } = generateControlsCode(
      defaults({ action: "kill", target: "tween" })
    );
    expect(code).toBe("tween.kill();");
  });

  it("generates killTweensOf for global with variableName", () => {
    const { code } = generateControlsCode(
      defaults({ action: "kill", target: "global", variableName: ".element" })
    );
    expect(code).toBe('gsap.killTweensOf(".element");');
  });

  it("generates globalTimeline.kill for global without selector", () => {
    const { code } = generateControlsCode(
      defaults({ action: "kill", target: "global" })
    );
    expect(code).toBe("gsap.globalTimeline.kill();");
  });

  it("generates kill with custom variableName for tween", () => {
    const { code } = generateControlsCode(
      defaults({ action: "kill", target: "tween", variableName: "myTween" })
    );
    expect(code).toBe("myTween.kill();");
  });
});

// ── Global target with various actions ───────────────────

describe("global target", () => {
  it("play on global", () => {
    const { code } = generateControlsCode(
      defaults({ action: "play", target: "global" })
    );
    expect(code).toBe("gsap.globalTimeline.play();");
  });

  it("pause on global", () => {
    const { code } = generateControlsCode(
      defaults({ action: "pause", target: "global" })
    );
    expect(code).toBe("gsap.globalTimeline.pause();");
  });

  it("reverse on global", () => {
    const { code } = generateControlsCode(
      defaults({ action: "reverse", target: "global" })
    );
    expect(code).toBe("gsap.globalTimeline.reverse();");
  });

  it("timeScale on global", () => {
    const { code } = generateControlsCode(
      defaults({ action: "timeScale", target: "global", value: 0.25 })
    );
    expect(code).toBe("gsap.globalTimeline.timeScale(0.25);");
  });

  it("seek on global with label", () => {
    const { code } = generateControlsCode(
      defaults({ action: "seek", target: "global", value: "intro" })
    );
    expect(code).toBe('gsap.globalTimeline.seek("intro");');
  });
});

// ── generateUI ───────────────────────────────────────────

describe("generateUI", () => {
  it("appends HTML control panel when true", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain("tl.play();");
    expect(code).toContain("<!-- GSAP Control Panel -->");
    expect(code).toContain('id="gsap-controls"');
  });

  it("contains Play button", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain(">Play</button>");
  });

  it("contains Pause button", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain(">Pause</button>");
  });

  it("contains Reverse button", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain(">Reverse</button>");
  });

  it("contains Restart button", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain(">Restart</button>");
  });

  it("contains speed buttons (0.5x, 1x, 2x)", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain(">0.5x</button>");
    expect(code).toContain(">1x</button>");
    expect(code).toContain(">2x</button>");
  });

  it("uses resolved variable name in onclick handlers", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true, variableName: "masterTl" })
    );
    expect(code).toContain('onclick="masterTl.play()"');
    expect(code).toContain('onclick="masterTl.pause()"');
    expect(code).toContain('onclick="masterTl.reverse()"');
    expect(code).toContain('onclick="masterTl.restart()"');
  });

  it("uses global variable name in onclick handlers", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true, target: "global" })
    );
    expect(code).toContain('onclick="gsap.globalTimeline.play()"');
  });

  it("has fixed positioning", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: true })
    );
    expect(code).toContain("position: fixed");
  });

  it("does not include UI panel when false", () => {
    const { code } = generateControlsCode(
      defaults({ generateUI: false })
    );
    expect(code).not.toContain("gsap-controls");
    expect(code).not.toContain("<button");
  });
});

// ── No warnings for simple actions ───────────────────────

describe("no warnings for simple actions", () => {
  const simpleActions = [
    "play",
    "pause",
    "resume",
    "reverse",
    "restart",
  ] as const;

  for (const action of simpleActions) {
    it(`${action} produces no warnings`, () => {
      const { warnings } = generateControlsCode(defaults({ action }));
      expect(warnings).toHaveLength(0);
    });
  }

  it("kill produces no warnings", () => {
    const { warnings } = generateControlsCode(defaults({ action: "kill" }));
    expect(warnings).toHaveLength(0);
  });
});

// ── Combined: action + custom selector + UI ──────────────

describe("combined params", () => {
  it("seek with custom variableName and UI", () => {
    const { code, warnings } = generateControlsCode(
      defaults({
        action: "seek",
        variableName: "heroTl",
        value: 3,
        generateUI: true,
      })
    );
    expect(code).toContain("heroTl.seek(3);");
    expect(code).toContain('onclick="heroTl.play()"');
    expect(warnings).toHaveLength(0);
  });

  it("timeScale on tween with value and UI", () => {
    const { code, warnings } = generateControlsCode(
      defaults({
        action: "timeScale",
        target: "tween",
        value: 0.25,
        generateUI: true,
      })
    );
    expect(code).toContain("tween.timeScale(0.25);");
    expect(code).toContain('onclick="tween.play()"');
    expect(warnings).toHaveLength(0);
  });
});
