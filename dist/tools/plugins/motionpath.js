import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
// ── Core generation logic ──────────────────────────────────
export function generateMotionPathCode(params) {
    const warnings = [];
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
        builder.addImport("gsap/MotionPathPlugin", ["MotionPathPlugin"]);
        builder.addPlugin("MotionPathPlugin");
    }
    // MotionPathHelper tip
    builder.addComment("Tip: Use MotionPathHelper for visual path editing in development.");
    // Align without alignOrigin suggestion
    if (params.options?.align && !params.options.alignOrigin) {
        builder.addComment("Consider adding alignOrigin: [0.5, 0.5] to center the element on the path.");
    }
    builder.newLine();
    // Build motionPath config
    const motionPath = buildMotionPathConfig(params);
    // Build tween vars
    const vars = {
        duration: params.duration,
        motionPath,
        ease: params.ease,
    };
    const varsStr = formatGsapVars(vars);
    builder.addLine(`gsap.to("${params.target}", ${varsStr});`);
    const code = params.includeImports
        ? builder.build()
        : builder.buildSnippet();
    return { code, warnings };
}
// ── Build motionPath config ────────────────────────────────
function buildMotionPathConfig(params) {
    const config = {
        path: params.path,
    };
    if (params.options) {
        const opts = params.options;
        if (opts.autoRotate !== undefined)
            config.autoRotate = opts.autoRotate;
        if (opts.align !== undefined)
            config.align = opts.align;
        if (opts.alignOrigin !== undefined)
            config.alignOrigin = opts.alignOrigin;
        if (opts.start !== undefined)
            config.start = opts.start;
        if (opts.end !== undefined)
            config.end = opts.end;
        if (opts.curviness !== undefined)
            config.curviness = opts.curviness;
        if (opts.type !== undefined)
            config.type = opts.type;
    }
    return config;
}
// ── MCP tool registration ──────────────────────────────────
const optionsSchema = z
    .object({
    autoRotate: z.union([z.boolean(), z.number()]).optional(),
    align: z.string().optional(),
    alignOrigin: z.tuple([z.number(), z.number()]).optional(),
    start: z.number().optional(),
    end: z.number().optional(),
    curviness: z.number().optional(),
    type: z.enum(["cubic", "thru", "soft"]).optional(),
})
    .optional();
export function registerMotionPathTool(server) {
    server.registerTool("gsap_motionpath", {
        title: "GSAP MotionPath",
        description: "Animate elements along SVG paths or custom point arrays",
        inputSchema: {
            target: z.string().describe("CSS selector for the element to animate"),
            path: z
                .union([
                z.string(),
                z.array(z.object({ x: z.number(), y: z.number() })),
            ])
                .describe("SVG path selector or points array"),
            duration: z.number().optional().default(5),
            options: optionsSchema,
            ease: z.string().optional().default("none"),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateMotionPathCode(args);
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
