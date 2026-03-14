import { describe, it, expect } from "vitest";
import {
  generateTextPluginCode,
  type TextPluginParams,
} from "../../src/tools/plugins/textplugin.js";

function defaults(
  overrides: Partial<TextPluginParams> = {}
): TextPluginParams {
  return {
    target: ".text",
    text: "Hello World!",
    duration: 2,
    type: "replace",
    ease: "none",
    includeImports: true,
    ...overrides,
  };
}

// ── Replace type: simple string form ──────────────────────

describe("replace type: simple form", () => {
  it("generates gsap.to with text property as string", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).toContain("gsap.to(");
    expect(code).toContain('"Hello World!"');
  });

  it("uses simple text string form (no value key)", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).toContain('text: "Hello World!"');
    expect(code).not.toContain("value:");
  });

  it("includes duration", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).toContain("duration: 2");
  });

  it("includes ease", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).toContain('"none"');
  });
});

// ── Replace with delimiter ────────────────────────────────

describe("replace with delimiter", () => {
  it("uses object form with value + delimiter", () => {
    const { code } = generateTextPluginCode(
      defaults({ options: { delimiter: " " } })
    );
    expect(code).toContain('value: "Hello World!"');
    expect(code).toContain('delimiter: " "');
  });

  it("empty string delimiter uses object form", () => {
    const { code } = generateTextPluginCode(
      defaults({ options: { delimiter: "" } })
    );
    expect(code).toContain("value:");
    expect(code).toContain("delimiter:");
  });
});

// ── Replace with newClass/oldClass ────────────────────────

describe("replace with classes", () => {
  it("newClass uses object form", () => {
    const { code } = generateTextPluginCode(
      defaults({ options: { newClass: "highlight" } })
    );
    expect(code).toContain('value: "Hello World!"');
    expect(code).toContain('newClass: "highlight"');
  });

  it("oldClass uses object form", () => {
    const { code } = generateTextPluginCode(
      defaults({ options: { oldClass: "faded" } })
    );
    expect(code).toContain('value: "Hello World!"');
    expect(code).toContain('oldClass: "faded"');
  });

  it("both newClass and oldClass", () => {
    const { code } = generateTextPluginCode(
      defaults({ options: { newClass: "new-text", oldClass: "old-text" } })
    );
    expect(code).toContain('newClass: "new-text"');
    expect(code).toContain('oldClass: "old-text"');
  });
});

// ── Replace with delimiter + classes ──────────────────────

describe("replace with delimiter + classes combined", () => {
  it("all options in object form", () => {
    const { code } = generateTextPluginCode(
      defaults({
        options: {
          delimiter: " ",
          newClass: "new",
          oldClass: "old",
        },
      })
    );
    expect(code).toContain('value: "Hello World!"');
    expect(code).toContain('delimiter: " "');
    expect(code).toContain('newClass: "new"');
    expect(code).toContain('oldClass: "old"');
  });
});

// ── Scramble type: simple form ────────────────────────────

describe("scramble type: simple form", () => {
  it("generates scrambleText as string when no options", () => {
    const { code } = generateTextPluginCode(
      defaults({ type: "scramble" })
    );
    expect(code).toContain('scrambleText: "Hello World!"');
    expect(code).not.toContain("text:");
  });

  it("uses gsap.to", () => {
    const { code } = generateTextPluginCode(
      defaults({ type: "scramble" })
    );
    expect(code).toContain("gsap.to(");
  });
});

// ── Scramble with options ─────────────────────────────────

describe("scramble with options", () => {
  it("chars appears when set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { chars: "XO#$%-+=?" } },
      })
    );
    expect(code).toContain('"XO#$%-+=?"');
  });

  it("revealDelay appears when set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { revealDelay: 0.5 } },
      })
    );
    expect(code).toContain("revealDelay: 0.5");
  });

  it("speed appears when set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { speed: 0.3 } },
      })
    );
    expect(code).toContain("speed: 0.3");
  });

  it("tweenLength appears when set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { tweenLength: false } },
      })
    );
    expect(code).toContain("tweenLength: false");
  });

  it("rightToLeft appears when set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { rightToLeft: true } },
      })
    );
    expect(code).toContain("rightToLeft: true");
  });

  it("uses object form with text key when options are set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { chars: "abc" } },
      })
    );
    expect(code).toContain('text: "Hello World!"');
    expect(code).toContain('"abc"');
  });

  it("multiple scramble options combined", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: {
          scrambleText: {
            chars: "XO",
            revealDelay: 0.5,
            speed: 0.4,
          },
        },
      })
    );
    expect(code).toContain('"XO"');
    expect(code).toContain("revealDelay: 0.5");
    expect(code).toContain("speed: 0.4");
  });
});

// ── Scramble only includes set options ────────────────────

describe("scramble omits unset options", () => {
  it("only includes chars when only chars is set", () => {
    const { code } = generateTextPluginCode(
      defaults({
        type: "scramble",
        options: { scrambleText: { chars: "abc" } },
      })
    );
    expect(code).toContain("chars:");
    expect(code).not.toContain("tweenLength:");
    expect(code).not.toContain("revealDelay:");
    expect(code).not.toContain("rightToLeft:");
  });
});

// ── Plugin imports ────────────────────────────────────────

describe("plugin imports", () => {
  it("replace imports TextPlugin", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).toContain('import { TextPlugin } from "gsap/TextPlugin"');
    expect(code).toContain("gsap.registerPlugin(TextPlugin)");
  });

  it("replace does not import ScrambleTextPlugin", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).not.toContain("ScrambleTextPlugin");
  });

  it("scramble imports ScrambleTextPlugin", () => {
    const { code } = generateTextPluginCode(
      defaults({ type: "scramble" })
    );
    expect(code).toContain(
      'import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"'
    );
    expect(code).toContain("gsap.registerPlugin(ScrambleTextPlugin)");
  });

  it("scramble does not import TextPlugin", () => {
    const { code } = generateTextPluginCode(
      defaults({ type: "scramble" })
    );
    expect(code).not.toMatch(/^import.*gsap\/TextPlugin/m);
  });
});

// ── Custom duration and ease ──────────────────────────────

describe("custom duration and ease", () => {
  it("uses custom duration", () => {
    const { code } = generateTextPluginCode(
      defaults({ duration: 5 })
    );
    expect(code).toContain("duration: 5");
  });

  it("uses custom ease", () => {
    const { code } = generateTextPluginCode(
      defaults({ ease: "power2.inOut" })
    );
    expect(code).toContain('"power2.inOut"');
  });
});

// ── includeImports ────────────────────────────────────────

describe("includeImports", () => {
  it("true adds imports for replace", () => {
    const { code } = generateTextPluginCode(defaults());
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain("TextPlugin");
  });

  it("true adds imports for scramble", () => {
    const { code } = generateTextPluginCode(
      defaults({ type: "scramble" })
    );
    expect(code).toContain('import gsap from "gsap"');
    expect(code).toContain("ScrambleTextPlugin");
  });

  it("false omits imports for replace", () => {
    const { code } = generateTextPluginCode(
      defaults({ includeImports: false })
    );
    expect(code).not.toMatch(/^import /m);
    expect(code).not.toContain("registerPlugin");
  });

  it("false omits imports for scramble", () => {
    const { code } = generateTextPluginCode(
      defaults({ type: "scramble", includeImports: false })
    );
    expect(code).not.toMatch(/^import /m);
    expect(code).not.toContain("registerPlugin");
  });
});

// ── Custom target ─────────────────────────────────────────

describe("custom target", () => {
  it("uses custom target selector", () => {
    const { code } = generateTextPluginCode(
      defaults({ target: "#hero-title" })
    );
    expect(code).toContain('"#hero-title"');
  });
});

// ── Text content with special characters ──────────────────

describe("text content", () => {
  it("handles text with special characters", () => {
    const { code } = generateTextPluginCode(
      defaults({ text: "Hello & welcome! <3" })
    );
    expect(code).toContain("Hello & welcome! <3");
  });

  it("handles text with numbers", () => {
    const { code } = generateTextPluginCode(
      defaults({ text: "Score: 100%" })
    );
    expect(code).toContain("Score: 100%");
  });

  it("handles empty text", () => {
    const { code } = generateTextPluginCode(
      defaults({ text: "" })
    );
    expect(code).toContain('text: ""');
  });
});
