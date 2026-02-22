import { z } from "zod";
import { analyzeGsapCode } from "./analyze.js";
// ── Core generation logic ──────────────────────────────────
export function generatePerformanceCode(params) {
    const warnings = [];
    const generator = actionGenerators[params.action];
    const code = generator(params, warnings);
    return { code, warnings };
}
const actionGenerators = {
    monitor: genMonitor,
    optimize: genOptimize,
    profile: genProfile,
};
// ── monitor ────────────────────────────────────────────────
function genMonitor(params, _warnings) {
    const metrics = params.options?.metrics ?? ["fps"];
    const lines = [];
    if (metrics.includes("fps")) {
        lines.push("// FPS Counter — displays current frames per second");
        lines.push("let frameCount = 0;");
        lines.push("let lastTime = performance.now();");
        lines.push("let fps = 0;");
        lines.push("");
        lines.push("function measureFPS() {");
        lines.push("  frameCount++;");
        lines.push("  const now = performance.now();");
        lines.push("  if (now - lastTime >= 1000) {");
        lines.push("    fps = frameCount;");
        lines.push("    frameCount = 0;");
        lines.push("    lastTime = now;");
        lines.push('    console.log(`FPS: ${fps}`);');
        lines.push("  }");
        lines.push("  requestAnimationFrame(measureFPS);");
        lines.push("}");
        lines.push("requestAnimationFrame(measureFPS);");
    }
    if (metrics.includes("memory")) {
        if (lines.length > 0)
            lines.push("");
        lines.push("// Memory usage monitor (Chrome-only)");
        lines.push("// Note: performance.memory is a non-standard Chrome extension");
        lines.push("function logMemory() {");
        lines.push("  if (performance.memory) {");
        lines.push("    console.log(`Heap: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);");
        lines.push("  }");
        lines.push("}");
        lines.push("setInterval(logMemory, 2000);");
    }
    if (metrics.includes("reflows")) {
        if (lines.length > 0)
            lines.push("");
        lines.push("// Reflow detection — monitors layout-triggering reads");
        lines.push("const reflows = { count: 0 };");
        lines.push("const observer = new PerformanceObserver((list) => {");
        lines.push('  for (const entry of list.getEntries().filter(e => e.entryType === "layout-shift")) {');
        lines.push("    reflows.count++;");
        lines.push('    console.log(`Layout shift detected: ${entry.value?.toFixed(4) ?? "N/A"}`);');
        lines.push("  }");
        lines.push("});");
        lines.push('observer.observe({ type: "layout-shift", buffered: true });');
    }
    return lines.join("\n");
}
// ── optimize ───────────────────────────────────────────────
function genOptimize(params, warnings) {
    if (!params.code) {
        warnings.push("optimize requires a code string to analyze. Provide the code parameter.");
        return "// No code provided for optimization analysis.";
    }
    const analysis = analyzeGsapCode({
        code: params.code,
        checkPerformance: true,
        suggestOptimizations: true,
        checkAccessibility: false,
    });
    const lines = [];
    // Summary header
    lines.push(`// ── Performance Analysis: ${analysis.summary} ──`);
    lines.push("");
    if (analysis.issues.length > 0) {
        lines.push("// Issues found:");
        for (const issue of analysis.issues) {
            const badge = issue.severity === "error"
                ? "[ERROR]"
                : issue.severity === "warning"
                    ? "[WARN]"
                    : "[INFO]";
            lines.push(`//   ${badge} ${issue.message}`);
            lines.push(`//     → ${issue.suggestion}`);
        }
        lines.push("");
    }
    lines.push(params.code);
    return lines.join("\n");
}
// ── profile ────────────────────────────────────────────────
function genProfile(_params, _warnings) {
    const lines = [];
    lines.push("// Performance profiler — measures animation creation and frame times");
    lines.push("");
    lines.push("// 1. Measure animation creation time");
    lines.push("const startCreate = performance.now();");
    lines.push("");
    lines.push("// ... create your animations here ...");
    lines.push("");
    lines.push("const createTime = performance.now() - startCreate;");
    lines.push('console.log(`Animation creation: ${createTime.toFixed(2)}ms`);');
    lines.push("");
    lines.push("// 2. Measure frame times during playback");
    lines.push("const frameTimes = [];");
    lines.push("let lastFrame = performance.now();");
    lines.push("");
    lines.push("gsap.ticker.add(() => {");
    lines.push("  const now = performance.now();");
    lines.push("  frameTimes.push(now - lastFrame);");
    lines.push("  lastFrame = now;");
    lines.push("});");
    lines.push("");
    lines.push("// Call this after animation completes to see results");
    lines.push("function reportFrameTimes() {");
    lines.push("  const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;");
    lines.push("  const max = Math.max(...frameTimes);");
    lines.push("  const min = Math.min(...frameTimes);");
    lines.push('  console.log(`Frames: ${frameTimes.length}, Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);');
    lines.push("}");
    return lines.join("\n");
}
// ── MCP tool registration ──────────────────────────────────
export function registerPerformanceTool(server) {
    server.registerTool("gsap_performance", {
        title: "GSAP Performance Profiler",
        description: "Generate performance monitoring and optimization code for GSAP animations",
        inputSchema: {
            action: z
                .enum(["monitor", "optimize", "profile"])
                .describe("Performance action to generate"),
            code: z
                .string()
                .optional()
                .describe("Code to optimize (for optimize action)"),
            options: z
                .object({
                metrics: z
                    .array(z.enum(["fps", "memory", "reflows"]))
                    .optional()
                    .default(["fps"]),
            })
                .optional(),
        },
    }, async (args) => {
        const result = generatePerformanceCode(args);
        const content = [
            { type: "text", text: result.code },
        ];
        if (result.warnings.length > 0) {
            content.push({
                type: "text",
                text: `\n--- Warnings ---\n${result.warnings.join("\n")}`,
            });
        }
        return { content };
    });
}
