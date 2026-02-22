import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
// ── Core generation logic ──────────────────────────────────
export function generateMorphSVGCode(params) {
    const warnings = [];
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
        builder.addImport("gsap/MorphSVGPlugin", ["MorphSVGPlugin"]);
        builder.addPlugin("MorphSVGPlugin");
    }
    // convertToPath tip
    builder.addComment('Tip: Use MorphSVGPlugin.convertToPath("circle, rect, ellipse") to convert');
    builder.addComment("non-path SVG elements to paths before morphing.");
    // shapeIndex "log" debug comment
    if (params.options?.shapeIndex === "log") {
        builder.newLine();
        builder.addComment('shapeIndex: "log" will log all shape index values to the console');
        builder.addComment("for debugging. Choose the best index, then replace \"log\" with that number.");
    }
    builder.newLine();
    // Build morphSVG property object
    const morphSVG = buildMorphSVGConfig(params);
    // Build the tween vars
    const vars = {
        duration: params.duration,
        morphSVG,
        ease: params.ease,
    };
    if (params.useTimeline) {
        generateTimeline(builder, params.target, vars);
    }
    else {
        generateDirect(builder, params.target, vars);
    }
    const code = params.includeImports
        ? builder.build()
        : builder.buildSnippet();
    return { code, warnings };
}
// ── Build morphSVG config ──────────────────────────────────
function buildMorphSVGConfig(params) {
    const config = {
        shape: params.endShape,
    };
    if (params.options) {
        if (params.options.shapeIndex !== undefined) {
            config.shapeIndex = params.options.shapeIndex;
        }
        if (params.options.type !== undefined) {
            config.type = params.options.type;
        }
        if (params.options.origin !== undefined) {
            config.origin = params.options.origin;
        }
        if (params.options.map !== undefined) {
            config.map = params.options.map;
        }
    }
    return config;
}
// ── Direct animation ──────────────────────────────────────
function generateDirect(builder, target, vars) {
    const varsStr = formatGsapVars(vars);
    builder.addLine(`gsap.to("${target}", ${varsStr});`);
}
// ── Timeline animation ────────────────────────────────────
function generateTimeline(builder, target, vars) {
    builder.addLine("const tl = gsap.timeline();");
    builder.newLine();
    const varsStr = formatGsapVars(vars);
    builder.addLine(`tl.to("${target}", ${varsStr});`);
}
// ── MCP tool registration ──────────────────────────────────
const optionsSchema = z
    .object({
    shapeIndex: z
        .union([z.number(), z.literal("auto"), z.literal("log")])
        .optional()
        .default("auto"),
    type: z.enum(["rotational", "linear"]).optional(),
    origin: z.string().optional(),
    map: z.enum(["size", "position", "complexity"]).optional(),
})
    .optional();
export function registerMorphSVGTool(server) {
    server.registerTool("gsap_morphsvg", {
        title: "GSAP MorphSVG",
        description: "Morph between SVG shapes and paths with smooth transitions",
        inputSchema: {
            target: z
                .string()
                .describe("CSS selector for the source SVG path/shape"),
            endShape: z
                .string()
                .describe("CSS selector or raw SVG path data string for the target shape"),
            duration: z.number().optional().default(2),
            ease: z.string().optional().default("power1.inOut"),
            options: optionsSchema,
            useTimeline: z
                .boolean()
                .optional()
                .default(false),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateMorphSVGCode(args);
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
