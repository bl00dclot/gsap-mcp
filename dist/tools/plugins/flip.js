import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
// ── Core generation logic ──────────────────────────────────
export function generateFlipCode(params) {
    const warnings = [];
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
        builder.addImport("gsap/Flip", ["Flip"]);
        builder.addPlugin("Flip");
    }
    switch (params.action) {
        case "full":
            generateFull(builder, params);
            break;
        case "getState":
        case "state":
            generateGetState(builder, params.targets);
            break;
        case "from":
            generateFrom(builder, params);
            break;
        case "fit":
            generateFit(builder, params, warnings);
            break;
    }
    const code = params.includeImports
        ? builder.build()
        : builder.buildSnippet();
    return { code, warnings };
}
// ── Full 3-step pattern ────────────────────────────────────
function generateFull(builder, params) {
    builder.addComment("1. Capture current state");
    builder.addLine(`const state = Flip.getState("${params.targets}");`);
    builder.newLine();
    builder.addComment("2. Make your DOM changes");
    if (params.stateChange) {
        builder.addComment(params.stateChange);
    }
    else {
        builder.addComment("(e.g. reorder elements, toggle classes, reparent nodes)");
    }
    builder.newLine();
    builder.addComment("3. Animate from old state to new");
    const opts = buildFlipOptions(params.options);
    const optsStr = formatGsapVars(opts);
    builder.addLine(`Flip.from(state, ${optsStr});`);
}
// ── getState only ──────────────────────────────────────────
function generateGetState(builder, targets) {
    builder.addLine(`const state = Flip.getState("${targets}");`);
}
// ── from only ──────────────────────────────────────────────
function generateFrom(builder, params) {
    const opts = buildFlipOptions(params.options);
    const optsStr = formatGsapVars(opts);
    builder.addLine(`Flip.from(state, ${optsStr});`);
}
// ── fit ────────────────────────────────────────────────────
function generateFit(builder, params, warnings) {
    const destination = params.stateChange;
    if (!destination) {
        warnings.push('Warning: "fit" action requires stateChange to specify the destination selector.');
    }
    const dest = destination ?? ".destination";
    const opts = buildFlipOptions(params.options);
    const optsStr = formatGsapVars(opts);
    builder.addLine(`Flip.fit("${params.targets}", "${dest}", ${optsStr});`);
}
// ── Build Flip options ─────────────────────────────────────
function buildFlipOptions(options) {
    const opts = {};
    if (!options)
        return opts;
    opts.duration = options.duration;
    opts.ease = options.ease;
    if (options.scale !== undefined)
        opts.scale = options.scale;
    if (options.absolute !== undefined)
        opts.absolute = options.absolute;
    if (options.simple !== undefined)
        opts.simple = options.simple;
    if (options.fade !== undefined)
        opts.fade = options.fade;
    if (options.spin !== undefined)
        opts.spin = options.spin;
    if (options.nested !== undefined)
        opts.nested = options.nested;
    if (options.prune !== undefined)
        opts.prune = options.prune;
    if (options.props !== undefined)
        opts.props = options.props;
    if (options.stagger !== undefined)
        opts.stagger = options.stagger;
    if (options.onEnter !== undefined)
        opts.onEnter = options.onEnter;
    if (options.onLeave !== undefined)
        opts.onLeave = options.onLeave;
    return opts;
}
// ── MCP tool registration ──────────────────────────────────
const optionsSchema = z
    .object({
    duration: z.number().optional().default(0.7),
    ease: z.string().optional().default("power1.inOut"),
    scale: z.boolean().optional(),
    absolute: z.boolean().optional(),
    simple: z.boolean().optional(),
    fade: z.boolean().optional(),
    spin: z.union([z.boolean(), z.number()]).optional(),
    nested: z.boolean().optional(),
    prune: z.boolean().optional(),
    props: z.string().optional(),
    stagger: z.number().optional(),
    onEnter: z.record(z.string(), z.any()).optional(),
    onLeave: z.record(z.string(), z.any()).optional(),
})
    .optional();
export function registerFlipTool(server) {
    server.registerTool("gsap_flip", {
        title: "GSAP Flip",
        description: "Create smooth state-based layout animations. Capture state, make DOM changes, animate the transition.",
        inputSchema: {
            targets: z.string().describe("CSS selector"),
            action: z.enum(["full", "state", "from", "fit", "getState"]),
            options: optionsSchema,
            stateChange: z
                .string()
                .optional()
                .describe("Description of DOM change (comment for full; destination selector for fit)"),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateFlipCode(args);
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
