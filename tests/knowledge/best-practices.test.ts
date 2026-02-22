import { describe, it, expect } from "vitest";
import {
  performanceTips,
  commonPitfalls,
  optimizationRules,
  type Pitfall,
  type OptimizationRule,
} from "../../src/knowledge/best-practices.js";

describe("performanceTips", () => {
  it("contains at least 10 tips", () => {
    expect(performanceTips.length).toBeGreaterThanOrEqual(10);
  });

  it("every tip is a non-empty string", () => {
    for (const tip of performanceTips) {
      expect(typeof tip).toBe("string");
      expect(tip.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate tips", () => {
    expect(new Set(performanceTips).size).toBe(performanceTips.length);
  });
});

describe("commonPitfalls", () => {
  it("contains at least 8 pitfalls", () => {
    expect(commonPitfalls.length).toBeGreaterThanOrEqual(8);
  });

  it("every pitfall has a non-empty mistake", () => {
    for (const pitfall of commonPitfalls) {
      expect(pitfall.mistake.length).toBeGreaterThan(0);
    }
  });

  it("every pitfall has a non-empty fix", () => {
    for (const pitfall of commonPitfalls) {
      expect(pitfall.fix.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate mistakes", () => {
    const mistakes = commonPitfalls.map((p) => p.mistake);
    expect(new Set(mistakes).size).toBe(mistakes.length);
  });

  it("fix differs from mistake for every entry", () => {
    for (const pitfall of commonPitfalls) {
      expect(pitfall.fix).not.toBe(pitfall.mistake);
    }
  });
});

describe("optimizationRules", () => {
  it("contains at least 5 rules", () => {
    expect(optimizationRules.length).toBeGreaterThanOrEqual(5);
  });

  it("every rule has a non-empty pattern", () => {
    for (const rule of optimizationRules) {
      expect(rule.pattern.length).toBeGreaterThan(0);
    }
  });

  it("every rule has a non-empty suggestion", () => {
    for (const rule of optimizationRules) {
      expect(rule.suggestion.length).toBeGreaterThan(0);
    }
  });

  it("every rule has a valid severity", () => {
    const validSeverities = ["warning", "error", "info"];
    for (const rule of optimizationRules) {
      expect(validSeverities).toContain(rule.severity);
    }
  });

  it("patterns are valid regex strings", () => {
    for (const rule of optimizationRules) {
      expect(() => new RegExp(rule.pattern)).not.toThrow();
    }
  });

  it("has at least one rule of each severity level", () => {
    const severities = new Set(optimizationRules.map((r) => r.severity));
    expect(severities).toContain("warning");
    expect(severities).toContain("error");
    expect(severities).toContain("info");
  });
});
