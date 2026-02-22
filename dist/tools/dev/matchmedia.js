import { z } from "zod";
import { formatGsapVars } from "../../generators/templates.js";
// ── Core generation logic ──────────────────────────────────
export function generateMatchMediaCode(params) {
    const warnings = [];
    const lines = [];
    if (params.breakpoints.length === 0) {
        warnings.push("No breakpoints provided. Add at least one breakpoint.");
        return { code: "", warnings };
    }
    if (params.includeImports) {
        lines.push('import gsap from "gsap";');
        lines.push("");
    }
    lines.push("const mm = gsap.matchMedia();");
    for (const bp of params.breakpoints) {
        lines.push("");
        lines.push(`// ${bp.name}`);
        lines.push(`mm.add("${bp.query}", () => {`);
        for (const anim of bp.animations) {
            const animCode = generateAnimation(anim, warnings);
            for (const line of animCode.split("\n")) {
                lines.push(`  ${line}`);
            }
            lines.push("");
        }
        lines.push("  return () => { /* animations auto-revert on cleanup */ };");
        lines.push("});");
    }
    return { code: lines.join("\n"), warnings };
}
// ── Animation generation ───────────────────────────────────
function generateAnimation(anim, warnings) {
    const vars = { ...anim.properties };
    if (anim.duration !== undefined)
        vars.duration = anim.duration;
    if (anim.ease !== undefined)
        vars.ease = anim.ease;
    if (anim.method === "fromTo") {
        if (!anim.fromProperties) {
            warnings.push(`fromTo on "${anim.target}" is missing fromProperties. Falling back to .to().`);
            return `gsap.to("${anim.target}", ${formatGsapVars(vars)});`;
        }
        const fromVars = formatGsapVars(anim.fromProperties);
        const toVars = formatGsapVars(vars);
        return `gsap.fromTo("${anim.target}", ${fromVars}, ${toVars});`;
    }
    const varsStr = formatGsapVars(vars);
    return `gsap.${anim.method}("${anim.target}", ${varsStr});`;
}
// ── MCP tool registration ──────────────────────────────────
const animationSchema = z.object({
    target: z.string().describe("CSS selector for the animation target"),
    method: z
        .enum(["to", "from", "fromTo"])
        .optional()
        .default("to")
        .describe("GSAP method: to, from, or fromTo"),
    properties: z
        .record(z.string(), z.any())
        .describe("CSS/GSAP properties to animate"),
    fromProperties: z
        .record(z.string(), z.any())
        .optional()
        .describe("Starting properties for fromTo animations"),
    duration: z.number().optional().describe("Animation duration in seconds"),
    ease: z.string().optional().describe("Easing function"),
});
const breakpointSchema = z.object({
    name: z.string().describe("Breakpoint name (used as comment)"),
    query: z
        .string()
        .describe('CSS media query string, e.g. "(max-width: 768px)"'),
    animations: z
        .array(animationSchema)
        .describe("Animations to run at this breakpoint"),
});
export function registerMatchMediaTool(server) {
    server.registerTool("gsap_matchmedia", {
        title: "GSAP MatchMedia",
        description: "Create responsive animations that adapt to screen sizes using gsap.matchMedia()",
        inputSchema: {
            breakpoints: z
                .array(breakpointSchema)
                .describe("Array of breakpoints with media queries and animations"),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generateMatchMediaCode(args);
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
