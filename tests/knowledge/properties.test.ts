import { describe, it, expect } from "vitest";
import {
  TRANSFORM_PROPERTIES,
  CSS_PROPERTIES,
  SVG_PROPERTIES,
  ALL_PROPERTIES,
  getPropertiesByType,
  getGpuAcceleratedProperties,
  getLayoutTriggeringProperties,
  findProperty,
  type AnimatableProperty,
} from "../../src/knowledge/properties.js";

describe("ALL_PROPERTIES", () => {
  it("is the union of transform, css, and svg properties", () => {
    expect(ALL_PROPERTIES.length).toBe(
      TRANSFORM_PROPERTIES.length + CSS_PROPERTIES.length + SVG_PROPERTIES.length
    );
  });

  it("every entry has a non-empty name", () => {
    for (const prop of ALL_PROPERTIES) {
      expect(prop.name.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty gsapName", () => {
    for (const prop of ALL_PROPERTIES) {
      expect(prop.gsapName.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a valid type", () => {
    const validTypes = ["transform", "css", "svg"];
    for (const prop of ALL_PROPERTIES) {
      expect(validTypes).toContain(prop.type);
    }
  });

  it("every entry has gpuAccelerated as a boolean", () => {
    for (const prop of ALL_PROPERTIES) {
      expect(typeof prop.gpuAccelerated).toBe("boolean");
    }
  });

  it("performanceNote is a non-empty string when present", () => {
    const withNotes = ALL_PROPERTIES.filter((p) => p.performanceNote !== undefined);
    expect(withNotes.length).toBeGreaterThan(0);
    for (const prop of withNotes) {
      expect(prop.performanceNote!.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate gsapName values", () => {
    const names = ALL_PROPERTIES.map((p) => p.gsapName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("TRANSFORM_PROPERTIES", () => {
  it("includes all expected GSAP transform shorthands", () => {
    const expected = [
      "x", "y", "z", "rotation", "rotationX", "rotationY",
      "scale", "scaleX", "scaleY", "skewX", "skewY",
      "xPercent", "yPercent",
    ];
    const gsapNames = TRANSFORM_PROPERTIES.map((p) => p.gsapName);
    for (const name of expected) {
      expect(gsapNames).toContain(name);
    }
  });

  it("all transforms are GPU-accelerated", () => {
    for (const prop of TRANSFORM_PROPERTIES) {
      expect(prop.gpuAccelerated).toBe(true);
    }
  });

  it("all transforms have type 'transform'", () => {
    for (const prop of TRANSFORM_PROPERTIES) {
      expect(prop.type).toBe("transform");
    }
  });
});

describe("CSS_PROPERTIES", () => {
  it("includes opacity, backgroundColor, width, height among others", () => {
    const gsapNames = CSS_PROPERTIES.map((p) => p.gsapName);
    expect(gsapNames).toContain("opacity");
    expect(gsapNames).toContain("backgroundColor");
    expect(gsapNames).toContain("width");
    expect(gsapNames).toContain("height");
  });

  it("opacity is GPU-accelerated", () => {
    const opacity = CSS_PROPERTIES.find((p) => p.gsapName === "opacity");
    expect(opacity).toBeDefined();
    expect(opacity!.gpuAccelerated).toBe(true);
  });

  it("width and height are NOT GPU-accelerated", () => {
    for (const name of ["width", "height"]) {
      const prop = CSS_PROPERTIES.find((p) => p.gsapName === name);
      expect(prop).toBeDefined();
      expect(prop!.gpuAccelerated).toBe(false);
    }
  });
});

describe("SVG_PROPERTIES", () => {
  it("includes attr.*, drawSVG, and morphSVG", () => {
    const gsapNames = SVG_PROPERTIES.map((p) => p.gsapName);
    expect(gsapNames).toContain("attr.*");
    expect(gsapNames).toContain("drawSVG");
    expect(gsapNames).toContain("morphSVG");
  });

  it("all SVG properties have type 'svg'", () => {
    for (const prop of SVG_PROPERTIES) {
      expect(prop.type).toBe("svg");
    }
  });
});

describe("getPropertiesByType", () => {
  it("returns only transform properties for type 'transform'", () => {
    const results = getPropertiesByType("transform");
    expect(results.length).toBe(TRANSFORM_PROPERTIES.length);
    for (const r of results) {
      expect(r.type).toBe("transform");
    }
  });

  it("returns only css properties for type 'css'", () => {
    const results = getPropertiesByType("css");
    expect(results.length).toBe(CSS_PROPERTIES.length);
    for (const r of results) {
      expect(r.type).toBe("css");
    }
  });

  it("returns only svg properties for type 'svg'", () => {
    const results = getPropertiesByType("svg");
    expect(results.length).toBe(SVG_PROPERTIES.length);
    for (const r of results) {
      expect(r.type).toBe("svg");
    }
  });
});

describe("getGpuAcceleratedProperties", () => {
  it("returns all transforms plus opacity", () => {
    const gpu = getGpuAcceleratedProperties();
    expect(gpu.length).toBe(TRANSFORM_PROPERTIES.length + 1); // +1 for opacity
    for (const p of gpu) {
      expect(p.gpuAccelerated).toBe(true);
    }
  });
});

describe("getLayoutTriggeringProperties", () => {
  it("returns properties whose performanceNote mentions layout", () => {
    const layout = getLayoutTriggeringProperties();
    expect(layout.length).toBeGreaterThan(0);
    for (const p of layout) {
      expect(p.gpuAccelerated).toBe(false);
      expect(p.performanceNote).toContain("layout");
    }
  });

  it("includes width, height, margin, padding", () => {
    const layout = getLayoutTriggeringProperties();
    const names = layout.map((p) => p.gsapName);
    expect(names).toContain("width");
    expect(names).toContain("height");
    expect(names).toContain("margin");
    expect(names).toContain("padding");
  });
});

describe("findProperty", () => {
  it("finds a property by gsapName", () => {
    const result = findProperty("x");
    expect(result).toBeDefined();
    expect(result!.gsapName).toBe("x");
    expect(result!.type).toBe("transform");
  });

  it("returns undefined for unknown gsapName", () => {
    expect(findProperty("nonexistent")).toBeUndefined();
  });
});
