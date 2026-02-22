import { describe, it, expect, beforeEach } from "vitest";
import { CodeBuilder } from "../../src/generators/code-builder.js";

describe("CodeBuilder", () => {
  let builder: CodeBuilder;

  beforeEach(() => {
    builder = new CodeBuilder();
  });

  // ── Imports ──────────────────────────────────────────────

  describe("addDefaultImport", () => {
    it("generates a default import statement", () => {
      builder.addDefaultImport("gsap", "gsap");
      expect(builder.getImportBlock()).toBe('import gsap from "gsap";');
    });

    it("overwrites duplicate default imports for the same module", () => {
      builder.addDefaultImport("gsap", "gsap");
      builder.addDefaultImport("gsap", "gsapCore");
      expect(builder.getImportBlock()).toBe('import gsapCore from "gsap";');
    });

    it("handles multiple default imports from different modules", () => {
      builder.addDefaultImport("gsap", "gsap");
      builder.addDefaultImport("lodash", "_");
      const block = builder.getImportBlock();
      expect(block).toContain('import gsap from "gsap";');
      expect(block).toContain('import _ from "lodash";');
    });
  });

  describe("addImport", () => {
    it("generates a named import statement", () => {
      builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
      expect(builder.getImportBlock()).toBe(
        'import { ScrollTrigger } from "gsap/ScrollTrigger";'
      );
    });

    it("deduplicates named imports for the same module", () => {
      builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
      builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
      expect(builder.getImportBlock()).toBe(
        'import { ScrollTrigger } from "gsap/ScrollTrigger";'
      );
    });

    it("merges named imports for the same module", () => {
      builder.addImport("gsap", ["gsap", "Power2"]);
      builder.addImport("gsap", ["Back"]);
      // Sorted alphabetically
      expect(builder.getImportBlock()).toBe(
        'import { Back, Power2, gsap } from "gsap";'
      );
    });

    it("sorts named imports alphabetically", () => {
      builder.addImport("gsap", ["Zed", "Alpha", "Middle"]);
      expect(builder.getImportBlock()).toBe(
        'import { Alpha, Middle, Zed } from "gsap";'
      );
    });
  });

  describe("getImportBlock", () => {
    it("returns empty string when no imports added", () => {
      expect(builder.getImportBlock()).toBe("");
    });

    it("places default imports before named imports", () => {
      builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
      builder.addDefaultImport("gsap", "gsap");
      const lines = builder.getImportBlock().split("\n");
      expect(lines[0]).toBe('import gsap from "gsap";');
      expect(lines[1]).toBe(
        'import { ScrollTrigger } from "gsap/ScrollTrigger";'
      );
    });

    it("combines default and named imports from different modules", () => {
      builder.addDefaultImport("gsap", "gsap");
      builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
      builder.addImport("gsap/Flip", ["Flip"]);
      const block = builder.getImportBlock();
      expect(block).toContain('import gsap from "gsap";');
      expect(block).toContain('import { ScrollTrigger } from "gsap/ScrollTrigger";');
      expect(block).toContain('import { Flip } from "gsap/Flip";');
    });
  });

  // ── Plugin registration ──────────────────────────────────

  describe("addPlugin / getRegistrationBlock", () => {
    it("returns empty string when no plugins added", () => {
      expect(builder.getRegistrationBlock()).toBe("");
    });

    it("generates registration for a single plugin", () => {
      builder.addPlugin("ScrollTrigger");
      expect(builder.getRegistrationBlock()).toBe(
        "gsap.registerPlugin(ScrollTrigger);"
      );
    });

    it("deduplicates plugins", () => {
      builder.addPlugin("ScrollTrigger");
      builder.addPlugin("ScrollTrigger");
      expect(builder.getRegistrationBlock()).toBe(
        "gsap.registerPlugin(ScrollTrigger);"
      );
    });

    it("sorts multiple plugins alphabetically", () => {
      builder.addPlugin("Flip");
      builder.addPlugin("ScrollTrigger");
      builder.addPlugin("Draggable");
      expect(builder.getRegistrationBlock()).toBe(
        "gsap.registerPlugin(Draggable, Flip, ScrollTrigger);"
      );
    });
  });

  // ── Code body ────────────────────────────────────────────

  describe("addLine", () => {
    it("adds a line with no indentation by default", () => {
      builder.addLine('gsap.to(".box", { x: 100 });');
      expect(builder.buildSnippet()).toBe('gsap.to(".box", { x: 100 });');
    });

    it("adds a line with specified indentation", () => {
      builder.addLine('x: 100,', 1);
      expect(builder.buildSnippet()).toBe("  x: 100,");
    });

    it("applies multiple levels of indentation", () => {
      builder.addLine("deep: true,", 3);
      expect(builder.buildSnippet()).toBe("      deep: true,");
    });
  });

  describe("addBlock", () => {
    it("adds multiple lines at once", () => {
      builder.addBlock([
        "const tl = gsap.timeline();",
        'tl.to(".box", { x: 100 });',
      ]);
      expect(builder.buildSnippet()).toBe(
        'const tl = gsap.timeline();\ntl.to(".box", { x: 100 });'
      );
    });

    it("indents all lines in the block", () => {
      builder.addBlock(["x: 100,", "y: 200,"], 2);
      expect(builder.buildSnippet()).toBe("    x: 100,\n    y: 200,");
    });
  });

  describe("addComment", () => {
    it("adds a JS comment", () => {
      builder.addComment("Animate the hero section");
      expect(builder.buildSnippet()).toBe("// Animate the hero section");
    });

    it("adds an indented comment", () => {
      builder.addComment("inner step", 1);
      expect(builder.buildSnippet()).toBe("  // inner step");
    });
  });

  describe("newLine", () => {
    it("inserts an empty line", () => {
      builder.addLine("a");
      builder.newLine();
      builder.addLine("b");
      expect(builder.buildSnippet()).toBe("a\n\nb");
    });
  });

  // ── Chaining ─────────────────────────────────────────────

  describe("method chaining", () => {
    it("supports chaining all builder methods", () => {
      const result = builder
        .addDefaultImport("gsap", "gsap")
        .addImport("gsap/ScrollTrigger", ["ScrollTrigger"])
        .addPlugin("ScrollTrigger")
        .addComment("Hero animation")
        .addLine('gsap.to(".hero", { y: -50 });')
        .newLine()
        .addLine("// done")
        .build();

      expect(result).toContain('import gsap from "gsap";');
      expect(result).toContain("gsap.registerPlugin(ScrollTrigger);");
      expect(result).toContain("// Hero animation");
    });
  });

  // ── Output ───────────────────────────────────────────────

  describe("build", () => {
    it("returns empty string when nothing added", () => {
      expect(builder.build()).toBe("");
    });

    it("returns only body when no imports or plugins", () => {
      builder.addLine('gsap.to(".box", { x: 100 });');
      expect(builder.build()).toBe('gsap.to(".box", { x: 100 });');
    });

    it("returns only imports when no body", () => {
      builder.addDefaultImport("gsap", "gsap");
      expect(builder.build()).toBe('import gsap from "gsap";');
    });

    it("separates imports, registration, and body with blank lines", () => {
      builder.addDefaultImport("gsap", "gsap");
      builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
      builder.addPlugin("ScrollTrigger");
      builder.addLine('gsap.to(".box", { x: 100 });');

      const output = builder.build();
      const sections = output.split("\n\n");
      expect(sections).toHaveLength(3);
      expect(sections[0]).toContain("import");
      expect(sections[1]).toContain("registerPlugin");
      expect(sections[2]).toContain("gsap.to");
    });

    it("omits registration section when no plugins added", () => {
      builder.addDefaultImport("gsap", "gsap");
      builder.addLine('gsap.to(".box", { x: 100 });');

      const output = builder.build();
      const sections = output.split("\n\n");
      expect(sections).toHaveLength(2);
      expect(sections[0]).toContain("import");
      expect(sections[1]).toContain("gsap.to");
    });

    it("produces a complete real-world example", () => {
      builder
        .addDefaultImport("gsap", "gsap")
        .addImport("gsap/ScrollTrigger", ["ScrollTrigger"])
        .addPlugin("ScrollTrigger")
        .addComment("Fade in on scroll")
        .addLine("const tl = gsap.timeline({")
        .addLine("scrollTrigger: {", 1)
        .addLine('trigger: ".section",', 2)
        .addLine('start: "top center",', 2)
        .addLine("},", 1)
        .addLine("});")
        .addLine('tl.to(".box", { opacity: 1, y: 0, duration: 1 });');

      const output = builder.build();
      expect(output).toBe(
        [
          'import gsap from "gsap";',
          'import { ScrollTrigger } from "gsap/ScrollTrigger";',
          "",
          "gsap.registerPlugin(ScrollTrigger);",
          "",
          "// Fade in on scroll",
          "const tl = gsap.timeline({",
          "  scrollTrigger: {",
          '    trigger: ".section",',
          '    start: "top center",',
          "  },",
          "});",
          'tl.to(".box", { opacity: 1, y: 0, duration: 1 });',
        ].join("\n")
      );
    });
  });

  describe("buildSnippet", () => {
    it("returns only body lines, no imports or registration", () => {
      builder.addDefaultImport("gsap", "gsap");
      builder.addPlugin("ScrollTrigger");
      builder.addLine('gsap.to(".box", { x: 100 });');

      expect(builder.buildSnippet()).toBe('gsap.to(".box", { x: 100 });');
    });

    it("returns empty string when no body lines", () => {
      builder.addDefaultImport("gsap", "gsap");
      expect(builder.buildSnippet()).toBe("");
    });
  });
});
