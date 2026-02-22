import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
import { findEasing, EASING_CATALOG } from "../../knowledge/easings.js";
import { findProperty } from "../../knowledge/properties.js";
// ── Input types ────────────────────────────────────────────
const staggerSchema = z.union([
    z.number(),
    z.object({
        amount: z.number(),
        from: z.string().optional(),
        grid: z.tuple([z.number(), z.number()]).optional(),
        ease: z.string().optional(),
    }),
]);
// ── Core generation logic ──────────────────────────────────
export function generateTweenCode(params) {
    const warnings = [];
    // Validate fromTo requires fromProperties
    if (params.method === "fromTo" && !params.fromProperties) {
        return {
            code: "",
            warnings: [
                'Error: "fromTo" method requires fromProperties to be provided.',
            ],
        };
    }
    // Validate ease
    const isSet = params.method === "set";
    if (!isSet && params.ease) {
        const isCustomEase = params.ease.startsWith("steps(") ||
            params.ease.startsWith("rough(") ||
            params.ease.startsWith("slow(") ||
            params.ease.startsWith("expoScale(");
        if (!isCustomEase && !findEasing(params.ease)) {
            warnings.push(`Unknown ease "${params.ease}" — this may be a custom ease or a typo. Known easings: ${EASING_CATALOG.filter((e) => e.category !== "custom").map((e) => e.name).slice(0, 5).join(", ")}, ...`);
        }
    }
    // Check properties for performance warnings
    const allProps = {
        ...params.properties,
        ...(params.fromProperties ?? {}),
    };
    for (const key of Object.keys(allProps)) {
        const prop = findProperty(key);
        if (prop && !prop.gpuAccelerated && prop.performanceNote) {
            warnings.push(`Performance: "${key}" — ${prop.performanceNote}`);
        }
    }
    // Build code
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
    }
    // Assemble the vars object
    const vars = {};
    if (!isSet) {
        vars.duration = params.duration;
    }
    // Spread animation properties
    Object.assign(vars, params.properties);
    if (!isSet && params.ease) {
        vars.ease = params.ease;
    }
    if (params.stagger !== undefined) {
        vars.stagger = params.stagger;
    }
    if (params.delay !== undefined) {
        vars.delay = params.delay;
    }
    if (params.repeat !== undefined) {
        vars.repeat = params.repeat;
    }
    if (params.yoyo !== undefined) {
        vars.yoyo = params.yoyo;
    }
    if (params.overwrite !== undefined) {
        vars.overwrite = params.overwrite;
    }
    if (params.onComplete !== undefined) {
        vars.onComplete = params.onComplete;
    }
    // Generate the call
    if (params.method === "fromTo") {
        const fromVars = formatGsapVars(params.fromProperties);
        const toVars = formatGsapVars(vars);
        builder.addLine(`gsap.fromTo("${params.target}", ${fromVars}, ${toVars});`);
    }
    else {
        const varsStr = formatGsapVars(vars);
        builder.addLine(`gsap.${params.method}("${params.target}", ${varsStr});`);
    }
    const code = params.includeImports ? builder.build() : builder.buildSnippet();
    return { code, warnings };
}
// ── MCP tool registration ──────────────────────────────────
export function registerTweenTool(server) {
    server.registerTool("gsap_tween", {
        title: "GSAP Tween Generator",
        description: "Generate GSAP tween animations (to, from, fromTo, set) with full property support",
        inputSchema: {
            target: z.string().describe("CSS selector or target description"),
            method: z.enum(["to", "from", "fromTo", "set"]),
            duration: z.number().optional().default(1),
            properties: z
                .record(z.string(), z.any())
                .describe("Animation properties (x, y, opacity, scale, etc.)"),
            fromProperties: z
                .record(z.string(), z.any())
                .optional()
                .describe("Starting properties — required for fromTo method"),
            ease: z.string().optional().default("power1.out"),
            stagger: staggerSchema.optional(),
            delay: z.number().optional(),
            repeat: z.number().optional(),
            yoyo: z.boolean().optional(),
            overwrite: z.union([z.boolean(), z.literal("auto")]).optional(),
            onComplete: z
                .string()
                .optional()
                .describe("Function name to call on complete"),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateTweenCode(args);
        // fromTo validation error
        if (result.code === "" && result.warnings.length > 0) {
            return {
                isError: true,
                content: [{ type: "text", text: result.warnings[0] }],
            };
        }
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
