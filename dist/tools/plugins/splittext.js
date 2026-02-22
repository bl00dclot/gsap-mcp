import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
import { findProperty } from "../../knowledge/properties.js";
// ── Constants ──────────────────────────────────────────────
const VALID_SPLIT_TYPES = new Set(["chars", "words", "lines"]);
// ── Core generation logic ──────────────────────────────────
export function generateSplitTextCode(params) {
    const warnings = [];
    // Validate type values
    const typeSegments = params.type.split(",").map((s) => s.trim());
    const invalidTypes = typeSegments.filter((t) => !VALID_SPLIT_TYPES.has(t));
    if (invalidTypes.length > 0) {
        warnings.push(`Unknown split type(s): ${invalidTypes.join(", ")}. Valid types are: chars, words, lines.`);
    }
    // Validate fromTo requires fromProperties
    let effectiveMethod = params.animation.method;
    if (effectiveMethod === "fromTo" && !params.animation.fromProperties) {
        warnings.push("Warning: fromTo is missing fromProperties — generating as .from() instead.");
        effectiveMethod = "from";
    }
    // Check animated properties for performance warnings
    const allProps = {
        ...params.animation.properties,
        ...(params.animation.fromProperties ?? {}),
    };
    for (const key of Object.keys(allProps)) {
        const prop = findProperty(key);
        if (prop && !prop.gpuAccelerated && prop.performanceNote) {
            warnings.push(`Performance: "${key}" — ${prop.performanceNote}`);
        }
    }
    // Determine animation target from first valid type
    const firstType = typeSegments.find((t) => VALID_SPLIT_TYPES.has(t)) ?? "chars";
    const splitTarget = `split.${firstType}`;
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
        builder.addImport("gsap/SplitText", ["SplitText"]);
        builder.addPlugin("SplitText");
    }
    // Build SplitText constructor
    generateSplitConstructor(builder, params);
    builder.newLine();
    // Generate animation
    if (params.useTimeline) {
        generateTimelineAnimation(builder, params, effectiveMethod, splitTarget);
    }
    else {
        generateDirectAnimation(builder, params, effectiveMethod, splitTarget);
    }
    const code = params.includeImports
        ? builder.build()
        : builder.buildSnippet();
    return { code, warnings };
}
// ── SplitText constructor ──────────────────────────────────
function generateSplitConstructor(builder, params) {
    const opts = {
        type: params.type,
    };
    if (params.linesClass)
        opts.linesClass = params.linesClass;
    if (params.wordsClass)
        opts.wordsClass = params.wordsClass;
    if (params.charsClass)
        opts.charsClass = params.charsClass;
    const optsStr = formatGsapVars(opts);
    builder.addLine(`const split = new SplitText("${params.target}", ${optsStr});`);
}
// ── Direct animation (no timeline) ────────────────────────
function generateDirectAnimation(builder, params, method, splitTarget) {
    const vars = buildAnimationVars(params, method);
    if (method === "fromTo") {
        const fromVars = formatGsapVars(params.animation.fromProperties);
        const toVars = formatGsapVars(vars);
        builder.addLine(`gsap.fromTo(${splitTarget}, ${fromVars}, ${toVars});`);
    }
    else {
        const varsStr = formatGsapVars(vars);
        builder.addLine(`gsap.${method}(${splitTarget}, ${varsStr});`);
    }
}
// ── Timeline animation ────────────────────────────────────
function generateTimelineAnimation(builder, params, method, splitTarget) {
    builder.addLine("const tl = gsap.timeline();");
    builder.newLine();
    const vars = buildAnimationVars(params, method);
    if (method === "fromTo") {
        const fromVars = formatGsapVars(params.animation.fromProperties);
        const toVars = formatGsapVars(vars);
        builder.addLine(`tl.fromTo(${splitTarget}, ${fromVars}, ${toVars});`);
    }
    else {
        const varsStr = formatGsapVars(vars);
        builder.addLine(`tl.${method}(${splitTarget}, ${varsStr});`);
    }
}
// ── Build animation vars ──────────────────────────────────
function buildAnimationVars(params, method) {
    const { animation } = params;
    const vars = {
        duration: animation.duration,
        ...animation.properties,
        ease: animation.ease,
        stagger: animation.stagger,
    };
    if (params.revert) {
        vars.onComplete = "() => split.revert()";
    }
    return vars;
}
// ── MCP tool registration ──────────────────────────────────
const staggerSchema = z.union([
    z.number(),
    z.object({
        amount: z.number(),
        from: z
            .enum(["start", "end", "center", "edges", "random"])
            .optional(),
        ease: z.string().optional(),
    }),
]);
const animationSchema = z.object({
    method: z
        .enum(["to", "from", "fromTo"])
        .optional()
        .default("from"),
    properties: z.record(z.string(), z.any()),
    fromProperties: z.record(z.string(), z.any()).optional(),
    duration: z.number().optional().default(0.5),
    ease: z.string().optional().default("power2.out"),
    stagger: staggerSchema.optional().default(0.02),
});
export function registerSplitTextTool(server) {
    server.registerTool("gsap_splittext", {
        title: "GSAP SplitText",
        description: "Split text into chars, words, or lines and animate them with stagger effects",
        inputSchema: {
            target: z.string().describe("CSS selector for the text element"),
            type: z
                .string()
                .optional()
                .default("chars,words")
                .describe('Comma-separated: "chars", "words", "lines"'),
            animation: animationSchema,
            revert: z
                .boolean()
                .optional()
                .default(true)
                .describe("Revert split after animation completes"),
            useTimeline: z
                .boolean()
                .optional()
                .default(false)
                .describe("Wrap in timeline for control"),
            linesClass: z.string().optional(),
            wordsClass: z.string().optional(),
            charsClass: z.string().optional(),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateSplitTextCode(args);
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
