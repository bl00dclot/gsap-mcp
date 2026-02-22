import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
// ── Core generation logic ──────────────────────────────────
export function generateDrawSVGCode(params) {
    const warnings = [];
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
        builder.addImport("gsap/DrawSVGPlugin", ["DrawSVGPlugin"]);
        builder.addPlugin("DrawSVGPlugin");
    }
    // Stroke tip
    builder.addComment("Tip: Ensure your SVG paths have stroke and stroke-width defined in CSS or SVG attributes.");
    builder.newLine();
    // Build from and to vars
    const fromVars = {
        drawSVG: params.from,
    };
    const toVars = {
        drawSVG: params.to,
        duration: params.duration,
        ease: params.options?.ease ?? "power2.inOut",
    };
    if (params.options?.stagger !== undefined) {
        toVars.stagger = params.options.stagger;
    }
    if (params.options?.repeat !== undefined) {
        toVars.repeat = params.options.repeat;
    }
    if (params.options?.yoyo !== undefined) {
        toVars.yoyo = params.options.yoyo;
    }
    if (params.options?.delay !== undefined) {
        toVars.delay = params.options.delay;
    }
    if (params.useTimeline) {
        generateTimeline(builder, params.target, fromVars, toVars);
    }
    else {
        generateDirect(builder, params.target, fromVars, toVars);
    }
    const code = params.includeImports
        ? builder.build()
        : builder.buildSnippet();
    return { code, warnings };
}
// ── Direct animation ──────────────────────────────────────
function generateDirect(builder, target, fromVars, toVars) {
    const fromStr = formatGsapVars(fromVars);
    const toStr = formatGsapVars(toVars);
    builder.addLine(`gsap.fromTo("${target}", ${fromStr}, ${toStr});`);
}
// ── Timeline animation ────────────────────────────────────
function generateTimeline(builder, target, fromVars, toVars) {
    builder.addLine("const tl = gsap.timeline();");
    builder.newLine();
    const fromStr = formatGsapVars(fromVars);
    const toStr = formatGsapVars(toVars);
    builder.addLine(`tl.fromTo("${target}", ${fromStr}, ${toStr});`);
}
// ── MCP tool registration ──────────────────────────────────
const optionsSchema = z
    .object({
    ease: z.string().optional().default("power2.inOut"),
    stagger: z.number().optional(),
    repeat: z.number().optional(),
    yoyo: z.boolean().optional(),
    delay: z.number().optional(),
})
    .optional();
export function registerDrawSVGTool(server) {
    server.registerTool("gsap_drawsvg", {
        title: "GSAP DrawSVG",
        description: "Animate SVG stroke drawing and line art progressively",
        inputSchema: {
            target: z
                .string()
                .describe("CSS selector for SVG path(s)"),
            from: z
                .string()
                .optional()
                .default("0%")
                .describe('Start position (e.g. "0%", "50% 50%")'),
            to: z
                .string()
                .optional()
                .default("100%")
                .describe("End position"),
            duration: z.number().optional().default(2),
            options: optionsSchema,
            useTimeline: z.boolean().optional().default(false),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateDrawSVGCode(args);
        const content = [
            { type: "text", text: result.code },
        ];
        if (result.warnings.length > 0) {
            content.push({
                type: "text",
                text: `\n--- Notes ---\n${result.warnings.join("\n")}`,
            });
        }
        return { content };
    });
}
