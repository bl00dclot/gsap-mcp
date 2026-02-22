import { describe, it, expect } from "vitest";
import {
  formatGsapVars,
  formatPosition,
  wrapInFunction,
  generateCDNLinks,
} from "../../src/generators/templates.js";

describe("formatGsapVars", () => {
  it("formats a simple flat object", () => {
    expect(formatGsapVars({ x: 100, opacity: 1 })).toBe(
      "{ x: 100, opacity: 1 }"
    );
  });

  it("formats string values with quotes", () => {
    expect(formatGsapVars({ ease: "power2.out" })).toBe(
      '{ ease: "power2.out" }'
    );
  });

  it("formats boolean values", () => {
    expect(formatGsapVars({ paused: true })).toBe("{ paused: true }");
  });

  it("formats null values", () => {
    expect(formatGsapVars({ onComplete: null })).toBe(
      "{ onComplete: null }"
    );
  });

  it("formats an empty object", () => {
    expect(formatGsapVars({})).toBe("{}");
  });

  it("formats nested objects inline when short", () => {
    const result = formatGsapVars({
      scrollTrigger: { trigger: ".box" },
    });
    expect(result).toBe('{ scrollTrigger: { trigger: ".box" } }');
  });

  it("formats nested objects multi-line when long", () => {
    const result = formatGsapVars({
      scrollTrigger: {
        trigger: ".very-long-selector-name",
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });
    expect(result).toContain("\n");
    expect(result).toContain("trigger:");
    expect(result).toContain("scrub: true");
  });

  it("formats arrays inline when short", () => {
    const result = formatGsapVars({ scale: 1, keyframes: [0, 0.5, 1] });
    expect(result).toContain("[0, 0.5, 1]");
  });

  it("formats empty arrays", () => {
    expect(formatGsapVars({ keyframes: [] })).toBe("{ keyframes: [] }");
  });

  it("formats mixed types together", () => {
    const result = formatGsapVars({
      x: 100,
      ease: "power2.out",
      paused: false,
      duration: 0.5,
    });
    expect(result).toContain("x: 100");
    expect(result).toContain('"power2.out"');
    expect(result).toContain("paused: false");
    expect(result).toContain("duration: 0.5");
  });

  it("handles a large object with multi-line output", () => {
    const result = formatGsapVars({
      x: 100,
      y: 200,
      opacity: 0,
      duration: 1,
      ease: "power2.inOut",
      stagger: 0.1,
    });
    // 6 keys — should go multi-line since inline exceeds 60 chars
    expect(result).toContain("\n");
    expect(result).toMatch(/^\{/);
    expect(result).toMatch(/\}$/);
  });
});

describe("formatPosition", () => {
  it("returns empty string for undefined", () => {
    expect(formatPosition(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatPosition("")).toBe("");
  });

  it("formats a relative position", () => {
    expect(formatPosition("+=0.5")).toBe(', "+=0.5"');
  });

  it("formats an absolute position", () => {
    expect(formatPosition("2")).toBe(', "2"');
  });

  it("formats a label position", () => {
    expect(formatPosition("myLabel")).toBe(', "myLabel"');
  });

  it("formats the start marker", () => {
    expect(formatPosition("<")).toBe(', "<"');
  });

  it("formats a complex position", () => {
    expect(formatPosition("<+=0.3")).toBe(', "<+=0.3"');
  });
});

describe("wrapInFunction", () => {
  it("wraps a single line of code", () => {
    const result = wrapInFunction("animate", 'gsap.to(".box", { x: 100 });');
    expect(result).toBe(
      [
        "function animate() {",
        '  gsap.to(".box", { x: 100 });',
        "}",
      ].join("\n")
    );
  });

  it("wraps multiple lines of code with proper indentation", () => {
    const code = [
      "const tl = gsap.timeline();",
      'tl.to(".a", { x: 100 });',
      'tl.to(".b", { y: 50 });',
    ].join("\n");

    const result = wrapInFunction("buildTimeline", code);
    expect(result).toBe(
      [
        "function buildTimeline() {",
        "  const tl = gsap.timeline();",
        '  tl.to(".a", { x: 100 });',
        '  tl.to(".b", { y: 50 });',
        "}",
      ].join("\n")
    );
  });

  it("preserves blank lines inside the function body", () => {
    const code = "const a = 1;\n\nconst b = 2;";
    const result = wrapInFunction("init", code);
    expect(result).toBe(
      [
        "function init() {",
        "  const a = 1;",
        "",
        "  const b = 2;",
        "}",
      ].join("\n")
    );
  });

  it("handles empty code", () => {
    const result = wrapInFunction("noop", "");
    expect(result).toBe("function noop() {\n\n}");
  });
});

describe("generateCDNLinks", () => {
  const CDN_BASE = "https://cdn.jsdelivr.net/npm/gsap@3/dist";

  it("returns core GSAP script tag with no plugins", () => {
    expect(generateCDNLinks()).toBe(
      `<script src="${CDN_BASE}/gsap.min.js"></script>`
    );
  });

  it("returns core GSAP script tag with empty plugins array", () => {
    expect(generateCDNLinks([])).toBe(
      `<script src="${CDN_BASE}/gsap.min.js"></script>`
    );
  });

  it("includes ScrollTrigger plugin CDN link", () => {
    const result = generateCDNLinks(["ScrollTrigger"]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(`<script src="${CDN_BASE}/gsap.min.js"></script>`);
    expect(lines[1]).toBe(
      `<script src="${CDN_BASE}/ScrollTrigger.min.js"></script>`
    );
  });

  it("includes multiple plugin CDN links", () => {
    const result = generateCDNLinks(["ScrollTrigger", "Flip", "Draggable"]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain("gsap.min.js");
    expect(lines[1]).toContain("ScrollTrigger.min.js");
    expect(lines[2]).toContain("Flip.min.js");
    expect(lines[3]).toContain("Draggable.min.js");
  });

  it("skips unknown plugins gracefully", () => {
    const result = generateCDNLinks(["ScrollTrigger", "UnknownPlugin"]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("gsap.min.js");
    expect(lines[1]).toContain("ScrollTrigger.min.js");
  });

  it("generates all known plugin CDN links", () => {
    const allPlugins = [
      "ScrollTrigger",
      "Flip",
      "Draggable",
      "MotionPathPlugin",
      "TextPlugin",
      "Observer",
      "ScrollToPlugin",
      "EaselPlugin",
      "PixiPlugin",
    ];
    const result = generateCDNLinks(allPlugins);
    const lines = result.split("\n");
    // core + 9 plugins
    expect(lines).toHaveLength(10);
  });
});
