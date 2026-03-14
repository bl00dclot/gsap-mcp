import { describe, it, expect } from "vitest";
import {
  generatePresetCode,
  PRESET_TYPES,
  type PresetParams,
} from "../../src/tools/core/presets.js";

function defaults(overrides: Partial<PresetParams> = {}): PresetParams {
  return {
    type: "fadeIn",
    target: ".element",
    includeImports: true,
    ...overrides,
  };
}

// ── Every preset generates valid code ──────────────────────

describe("all presets generate code", () => {
  for (const type of PRESET_TYPES) {
    it(`${type} generates non-empty code`, () => {
      const { code } = generatePresetCode(defaults({ type }));
      expect(code.length).toBeGreaterThan(0);
      expect(code).toContain("gsap.");
    });
  }
});

// ── fadeIn / fadeOut ────────────────────────────────────────

describe("fadeIn", () => {
  it("uses gsap.from", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeIn" }));
    expect(code).toContain("gsap.from(");
  });

  it("includes opacity: 0 in properties", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeIn" }));
    expect(code).toContain("opacity: 0");
  });

  it("uses power2.out ease by default", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeIn" }));
    expect(code).toContain('"power2.out"');
  });
});

describe("fadeOut", () => {
  it("uses gsap.to", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeOut" }));
    expect(code).toContain("gsap.to(");
  });

  it("includes opacity: 0 in properties", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeOut" }));
    expect(code).toContain("opacity: 0");
  });
});

// ── Slide presets ──────────────────────────────────────────

describe("slideUp", () => {
  it("uses gsap.from", () => {
    const { code } = generatePresetCode(defaults({ type: "slideUp" }));
    expect(code).toContain("gsap.from(");
  });

  it("uses y with default distance of 100", () => {
    const { code } = generatePresetCode(defaults({ type: "slideUp" }));
    expect(code).toContain("y: 100");
  });

  it("uses custom distance when provided", () => {
    const { code } = generatePresetCode(
      defaults({ type: "slideUp", options: { distance: 200 } })
    );
    expect(code).toContain("y: 200");
  });

  it("includes opacity: 0", () => {
    const { code } = generatePresetCode(defaults({ type: "slideUp" }));
    expect(code).toContain("opacity: 0");
  });
});

describe("slideDown", () => {
  it("uses negative y direction", () => {
    const { code } = generatePresetCode(defaults({ type: "slideDown" }));
    expect(code).toContain("y: -100");
  });

  it("custom distance applies negative direction", () => {
    const { code } = generatePresetCode(
      defaults({ type: "slideDown", options: { distance: 50 } })
    );
    expect(code).toContain("y: -50");
  });
});

describe("slideLeft", () => {
  it("uses positive x direction", () => {
    const { code } = generatePresetCode(defaults({ type: "slideLeft" }));
    expect(code).toContain("x: 100");
  });
});

describe("slideRight", () => {
  it("uses negative x direction", () => {
    const { code } = generatePresetCode(defaults({ type: "slideRight" }));
    expect(code).toContain("x: -100");
  });

  it("custom distance applies negative direction", () => {
    const { code } = generatePresetCode(
      defaults({ type: "slideRight", options: { distance: 75 } })
    );
    expect(code).toContain("x: -75");
  });
});

// ── Scale presets ──────────────────────────────────────────

describe("scaleIn", () => {
  it("uses gsap.from with scale: 0", () => {
    const { code } = generatePresetCode(defaults({ type: "scaleIn" }));
    expect(code).toContain("gsap.from(");
    expect(code).toContain("scale: 0");
  });

  it("uses back.out ease", () => {
    const { code } = generatePresetCode(defaults({ type: "scaleIn" }));
    expect(code).toContain('"back.out"');
  });
});

describe("scaleOut", () => {
  it("uses gsap.to with scale: 0", () => {
    const { code } = generatePresetCode(defaults({ type: "scaleOut" }));
    expect(code).toContain("gsap.to(");
    expect(code).toContain("scale: 0");
  });
});

// ── Other standard presets ─────────────────────────────────

describe("rotateIn", () => {
  it("includes rotation: -180", () => {
    const { code } = generatePresetCode(defaults({ type: "rotateIn" }));
    expect(code).toContain("rotation: -180");
  });
});

describe("bounceIn", () => {
  it("uses bounce.out ease", () => {
    const { code } = generatePresetCode(defaults({ type: "bounceIn" }));
    expect(code).toContain('"bounce.out"');
  });
});

describe("elasticIn", () => {
  it("uses elastic.out ease", () => {
    const { code } = generatePresetCode(defaults({ type: "elasticIn" }));
    expect(code).toContain('"elastic.out"');
  });
});

describe("blurIn", () => {
  it("includes filter: blur", () => {
    const { code } = generatePresetCode(defaults({ type: "blurIn" }));
    expect(code).toContain("blur(10px)");
  });
});

describe("pulseGlow", () => {
  it("includes repeat: -1 and yoyo: true", () => {
    const { code } = generatePresetCode(defaults({ type: "pulseGlow" }));
    expect(code).toContain("repeat: -1");
    expect(code).toContain("yoyo: true");
  });

  it("includes boxShadow", () => {
    const { code } = generatePresetCode(defaults({ type: "pulseGlow" }));
    expect(code).toContain("boxShadow:");
  });
});

describe("shake", () => {
  it("includes repeat and yoyo", () => {
    const { code } = generatePresetCode(defaults({ type: "shake" }));
    expect(code).toContain("repeat: 5");
    expect(code).toContain("yoyo: true");
  });

  it("has short duration", () => {
    const { code } = generatePresetCode(defaults({ type: "shake" }));
    expect(code).toContain("duration: 0.1");
  });
});

// ── Stagger presets ────────────────────────────────────────

describe("staggerFadeIn", () => {
  it("includes stagger in output", () => {
    const { code } = generatePresetCode(defaults({ type: "staggerFadeIn" }));
    expect(code).toContain("stagger: 0.1");
  });

  it("includes y: 20 for subtle lift", () => {
    const { code } = generatePresetCode(defaults({ type: "staggerFadeIn" }));
    expect(code).toContain("y: 20");
  });
});

describe("staggerSlideUp", () => {
  it("includes stagger in output", () => {
    const { code } = generatePresetCode(
      defaults({ type: "staggerSlideUp" })
    );
    expect(code).toContain("stagger: 0.1");
  });

  it("uses default distance for y", () => {
    const { code } = generatePresetCode(
      defaults({ type: "staggerSlideUp" })
    );
    expect(code).toContain("y: 100");
  });
});

describe("stagger override", () => {
  it("custom stagger overrides default", () => {
    const { code } = generatePresetCode(
      defaults({ type: "staggerFadeIn", options: { stagger: 0.3 } })
    );
    expect(code).toContain("stagger: 0.3");
    expect(code).not.toContain("stagger: 0.1");
  });
});

// ── Plugin presets ─────────────────────────────────────────

describe("typewriter (TextPlugin)", () => {
  it("generates gsap.to with text property", () => {
    const { code } = generatePresetCode(defaults({ type: "typewriter" }));
    expect(code).toContain("gsap.to(");
    expect(code).toContain('"Your text here"');
  });

  it("includes TextPlugin import and registration", () => {
    const { code } = generatePresetCode(defaults({ type: "typewriter" }));
    expect(code).toContain('import { TextPlugin } from "gsap/TextPlugin"');
    expect(code).toContain("gsap.registerPlugin(TextPlugin)");
  });

  it("populates pluginsRequired", () => {
    const { pluginsRequired } = generatePresetCode(
      defaults({ type: "typewriter" })
    );
    expect(pluginsRequired).toContain("TextPlugin");
  });

  it("uses ease: none by default", () => {
    const { code } = generatePresetCode(defaults({ type: "typewriter" }));
    expect(code).toContain('"none"');
  });

  it("uses custom text from options.text", () => {
    const { code } = generatePresetCode(
      defaults({ type: "typewriter", options: { text: "Hello World" } })
    );
    expect(code).toContain('"Hello World"');
  });
});

describe("counter", () => {
  it("generates object proxy pattern", () => {
    const { code } = generatePresetCode(defaults({ type: "counter" }));
    expect(code).toContain("{ value: 0 }");
    expect(code).toContain("gsap.to(obj");
    expect(code).toContain("value: 100");
  });

  it("includes onUpdate", () => {
    const { code } = generatePresetCode(defaults({ type: "counter" }));
    expect(code).toContain("onUpdate:");
  });

  it("has no plugin requirements", () => {
    const { pluginsRequired } = generatePresetCode(
      defaults({ type: "counter" })
    );
    expect(pluginsRequired).toHaveLength(0);
  });
});

describe("parallax (ScrollTrigger)", () => {
  it("generates gsap.to with scrollTrigger config", () => {
    const { code } = generatePresetCode(defaults({ type: "parallax" }));
    expect(code).toContain("gsap.to(");
    expect(code).toContain("scrollTrigger:");
    expect(code).toContain("scrub: true");
  });

  it("includes ScrollTrigger import and registration", () => {
    const { code } = generatePresetCode(defaults({ type: "parallax" }));
    expect(code).toContain(
      'import { ScrollTrigger } from "gsap/ScrollTrigger"'
    );
    expect(code).toContain("gsap.registerPlugin(ScrollTrigger)");
  });

  it("populates pluginsRequired with ScrollTrigger", () => {
    const { pluginsRequired } = generatePresetCode(
      defaults({ type: "parallax" })
    );
    expect(pluginsRequired).toContain("ScrollTrigger");
  });

  it("uses target as scrollTrigger trigger", () => {
    const { code } = generatePresetCode(
      defaults({ type: "parallax", target: "#hero" })
    );
    expect(code).toContain('"#hero"');
  });

  it("includes yPercent: -50", () => {
    const { code } = generatePresetCode(defaults({ type: "parallax" }));
    expect(code).toContain("yPercent: -50");
  });
});

describe("drawLine (DrawSVGPlugin)", () => {
  it("generates gsap.fromTo with drawSVG", () => {
    const { code } = generatePresetCode(defaults({ type: "drawLine" }));
    expect(code).toContain("gsap.fromTo(");
    expect(code).toContain('"0%"');
    expect(code).toContain('"100%"');
  });

  it("includes DrawSVGPlugin import", () => {
    const { code } = generatePresetCode(defaults({ type: "drawLine" }));
    expect(code).toContain("DrawSVGPlugin");
  });

  it("populates pluginsRequired", () => {
    const { pluginsRequired } = generatePresetCode(
      defaults({ type: "drawLine" })
    );
    expect(pluginsRequired).toContain("DrawSVGPlugin");
  });
});

describe("morphShape (MorphSVGPlugin)", () => {
  it("generates gsap.to with morphSVG", () => {
    const { code } = generatePresetCode(defaults({ type: "morphShape" }));
    expect(code).toContain("gsap.to(");
    expect(code).toContain("morphSVG:");
    expect(code).toContain('"#targetShape"');
  });

  it("includes MorphSVGPlugin import", () => {
    const { code } = generatePresetCode(defaults({ type: "morphShape" }));
    expect(code).toContain("MorphSVGPlugin");
  });

  it("populates pluginsRequired", () => {
    const { pluginsRequired } = generatePresetCode(
      defaults({ type: "morphShape" })
    );
    expect(pluginsRequired).toContain("MorphSVGPlugin");
  });
});

// ── Plugin warnings ────────────────────────────────────────

describe("plugin warnings", () => {
  it("warns about required plugins", () => {
    const { warnings } = generatePresetCode(defaults({ type: "typewriter" }));
    expect(warnings.some((w) => w.includes("TextPlugin"))).toBe(true);
  });

  it("no warnings for plugin-free presets", () => {
    const { warnings } = generatePresetCode(defaults({ type: "fadeIn" }));
    expect(warnings).toHaveLength(0);
  });
});

// ── Option overrides ───────────────────────────────────────

describe("option overrides", () => {
  it("custom duration overrides default", () => {
    const { code } = generatePresetCode(
      defaults({ type: "fadeIn", options: { duration: 2.5 } })
    );
    expect(code).toContain("duration: 2.5");
    expect(code).not.toContain("duration: 1");
  });

  it("custom ease overrides default", () => {
    const { code } = generatePresetCode(
      defaults({ type: "fadeIn", options: { ease: "expo.out" } })
    );
    expect(code).toContain('"expo.out"');
    expect(code).not.toContain('"power2.out"');
  });

  it("delay is included when provided", () => {
    const { code } = generatePresetCode(
      defaults({ type: "fadeIn", options: { delay: 0.5 } })
    );
    expect(code).toContain("delay: 0.5");
  });

  it("delay is omitted when not provided", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeIn" }));
    expect(code).not.toContain("delay:");
  });
});

// ── includeImports ─────────────────────────────────────────

describe("includeImports", () => {
  it("includes import when true", () => {
    const { code } = generatePresetCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
  });

  it("omits import when false", () => {
    const { code } = generatePresetCode(defaults({ includeImports: false }));
    expect(code).not.toContain("import");
  });

  it("omits plugin imports and registration when false", () => {
    const { code } = generatePresetCode(
      defaults({ type: "typewriter", includeImports: false })
    );
    expect(code).not.toContain("import");
    expect(code).not.toContain("registerPlugin");
  });
});

// ── Target override ────────────────────────────────────────

describe("target override", () => {
  it("uses custom target in output", () => {
    const { code } = generatePresetCode(
      defaults({ type: "fadeIn", target: "#hero .title" })
    );
    expect(code).toContain('"#hero .title"');
  });

  it("uses default .element target", () => {
    const { code } = generatePresetCode(defaults({ type: "fadeIn" }));
    expect(code).toContain('".element"');
  });
});
