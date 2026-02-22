import { z } from "zod";
// ── Core generation logic ──────────────────────────────────
export function generateDebugCode(params) {
    const warnings = [];
    const target = params.target;
    const generator = actionGenerators[params.action];
    const code = generator(target, params.options ?? {}, warnings);
    return { code, warnings };
}
const actionGenerators = {
    visualize: genVisualize,
    gsdevtools: genGSDevTools,
    log: genLog,
    slowmo: genSlowmo,
    labelDump: genLabelDump,
};
// ── visualize ──────────────────────────────────────────────
function genVisualize(target, options, _warnings) {
    const lines = [];
    lines.push("// Enable ScrollTrigger markers for visual debugging");
    lines.push("ScrollTrigger.defaults({ markers: true });");
    lines.push("");
    lines.push("// Log timeline info");
    lines.push(`console.log("Duration:", ${target}.duration(), "Children:", ${target}.getChildren().length);`);
    lines.push("");
    lines.push("// ⚠️ Remove markers before deploying to production");
    return lines.join("\n");
}
// ── gsdevtools ─────────────────────────────────────────────
function genGSDevTools(target, _options, _warnings) {
    const lines = [];
    lines.push('import { GSDevTools } from "gsap/GSDevTools";');
    lines.push("gsap.registerPlugin(GSDevTools);");
    lines.push("");
    lines.push(`GSDevTools.create({ animation: ${target} });`);
    lines.push("");
    lines.push("// Note: GSDevTools is a premium GSAP plugin (Club membership required)");
    return lines.join("\n");
}
// ── log ────────────────────────────────────────────────────
function genLog(target, _options, _warnings) {
    const lines = [];
    lines.push("// Log timeline progress and current time on each update");
    lines.push(`${target}.eventCallback("onUpdate", () => {`);
    lines.push(`  console.log(\`Progress: \${${target}.progress().toFixed(2)}, Time: \${${target}.time().toFixed(2)}\`);`);
    lines.push("});");
    return lines.join("\n");
}
// ── slowmo ─────────────────────────────────────────────────
function genSlowmo(_target, options, _warnings) {
    const timeScale = options.timeScale ?? 0.25;
    const lines = [];
    lines.push(`// Slow down all animations to ${timeScale}x speed for debugging`);
    lines.push(`gsap.globalTimeline.timeScale(${timeScale});`);
    lines.push("");
    lines.push("// Reset to normal speed:");
    lines.push("// gsap.globalTimeline.timeScale(1);");
    return lines.join("\n");
}
// ── labelDump ──────────────────────────────────────────────
function genLabelDump(target, _options, _warnings) {
    const lines = [];
    lines.push("// Dump all timeline labels and their positions");
    lines.push(`const labels = ${target}.labels;`);
    lines.push("for (const [name, time] of Object.entries(labels)) {");
    lines.push("  console.log(`Label: \"${name}\" at ${time}s`);");
    lines.push("}");
    return lines.join("\n");
}
// ── MCP tool registration ──────────────────────────────────
export function registerDebugTool(server) {
    server.registerTool("gsap_debug", {
        title: "GSAP Debug Helper",
        description: "Generate debug utilities for GSAP animations: timeline visualization, GSDevTools, logging, slow-motion",
        inputSchema: {
            action: z
                .enum(["visualize", "gsdevtools", "log", "slowmo", "labelDump"])
                .describe("Debug action to generate"),
            target: z
                .string()
                .optional()
                .default("tl")
                .describe("Timeline variable name"),
            options: z
                .object({
                showMarkers: z.boolean().optional(),
                logDetails: z.boolean().optional(),
                timeScale: z.number().optional().default(0.25),
            })
                .optional(),
        },
    }, async (args) => {
        const result = generateDebugCode(args);
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
