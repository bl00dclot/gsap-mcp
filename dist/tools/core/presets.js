import { z } from "zod";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
// ── Preset types ───────────────────────────────────────────
export const PRESET_TYPES = [
    "fadeIn", "fadeOut",
    "slideUp", "slideDown", "slideLeft", "slideRight",
    "scaleIn", "scaleOut",
    "rotateIn",
    "bounceIn", "elasticIn",
    "staggerFadeIn", "staggerSlideUp",
    "blurIn",
    "pulseGlow", "shake",
    "typewriter", "counter",
    "parallax",
    "drawLine", "morphShape",
];
const DEFAULT_DISTANCE = 100;
export const PRESETS = {
    fadeIn: {
        method: "from",
        defaultProperties: { opacity: 0 },
        defaultDuration: 1,
        defaultEase: "power2.out",
        description: "Fade in from invisible",
    },
    fadeOut: {
        method: "to",
        defaultProperties: { opacity: 0 },
        defaultDuration: 1,
        defaultEase: "power2.in",
        description: "Fade out to invisible",
    },
    slideUp: {
        method: "from",
        defaultProperties: { y: DEFAULT_DISTANCE, opacity: 0 },
        defaultDuration: 0.8,
        defaultEase: "power3.out",
        usesDistance: true,
        description: "Slide up from below with fade",
    },
    slideDown: {
        method: "from",
        defaultProperties: { y: -DEFAULT_DISTANCE, opacity: 0 },
        defaultDuration: 0.8,
        defaultEase: "power3.out",
        usesDistance: true,
        description: "Slide down from above with fade",
    },
    slideLeft: {
        method: "from",
        defaultProperties: { x: DEFAULT_DISTANCE, opacity: 0 },
        defaultDuration: 0.8,
        defaultEase: "power3.out",
        usesDistance: true,
        description: "Slide in from the right with fade",
    },
    slideRight: {
        method: "from",
        defaultProperties: { x: -DEFAULT_DISTANCE, opacity: 0 },
        defaultDuration: 0.8,
        defaultEase: "power3.out",
        usesDistance: true,
        description: "Slide in from the left with fade",
    },
    scaleIn: {
        method: "from",
        defaultProperties: { scale: 0, opacity: 0 },
        defaultDuration: 0.6,
        defaultEase: "back.out",
        description: "Scale up from zero with fade",
    },
    scaleOut: {
        method: "to",
        defaultProperties: { scale: 0, opacity: 0 },
        defaultDuration: 0.6,
        defaultEase: "back.in",
        description: "Scale down to zero with fade",
    },
    rotateIn: {
        method: "from",
        defaultProperties: { rotation: -180, opacity: 0 },
        defaultDuration: 1,
        defaultEase: "power3.out",
        description: "Rotate in with fade",
    },
    bounceIn: {
        method: "from",
        defaultProperties: { y: -50, opacity: 0 },
        defaultDuration: 1.2,
        defaultEase: "bounce.out",
        description: "Drop in with bounce",
    },
    elasticIn: {
        method: "from",
        defaultProperties: { scale: 0, opacity: 0 },
        defaultDuration: 1.5,
        defaultEase: "elastic.out",
        description: "Scale in with elastic spring",
    },
    staggerFadeIn: {
        method: "from",
        defaultProperties: { opacity: 0, y: 20 },
        defaultDuration: 0.5,
        defaultEase: "power2.out",
        usesStagger: true,
        defaultStagger: 0.1,
        description: "Staggered fade in with subtle lift",
    },
    staggerSlideUp: {
        method: "from",
        defaultProperties: { y: DEFAULT_DISTANCE, opacity: 0 },
        defaultDuration: 0.6,
        defaultEase: "power3.out",
        usesStagger: true,
        defaultStagger: 0.1,
        usesDistance: true,
        description: "Staggered slide up from below",
    },
    blurIn: {
        method: "from",
        defaultProperties: { opacity: 0, filter: "blur(10px)" },
        defaultDuration: 0.8,
        defaultEase: "power2.out",
        description: "Fade in with blur clear",
    },
    pulseGlow: {
        method: "to",
        defaultProperties: { scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" },
        defaultDuration: 0.8,
        defaultEase: "power1.inOut",
        extra: { repeat: -1, yoyo: true },
        description: "Infinite pulsing glow effect",
    },
    shake: {
        method: "to",
        defaultProperties: { x: 10 },
        defaultDuration: 0.1,
        defaultEase: "power1.inOut",
        extra: { repeat: 5, yoyo: true },
        description: "Quick horizontal shake",
    },
    typewriter: {
        method: "to",
        defaultProperties: { text: "Your text here" },
        defaultDuration: 2,
        defaultEase: "none",
        plugins: ["TextPlugin"],
        custom: true,
        description: "Typewriter text reveal (requires TextPlugin)",
    },
    counter: {
        method: "to",
        defaultProperties: {},
        defaultDuration: 2,
        defaultEase: "power1.out",
        custom: true,
        description: "Animated number counter",
    },
    parallax: {
        method: "to",
        defaultProperties: { yPercent: -50 },
        defaultDuration: 1,
        defaultEase: "none",
        plugins: ["ScrollTrigger"],
        custom: true,
        description: "Scroll-driven parallax (requires ScrollTrigger)",
    },
    drawLine: {
        method: "fromTo",
        defaultFromProperties: { drawSVG: "0%" },
        defaultProperties: { drawSVG: "100%" },
        defaultDuration: 1.5,
        defaultEase: "power2.inOut",
        plugins: ["DrawSVGPlugin"],
        description: "Draw SVG stroke (requires DrawSVGPlugin)",
    },
    morphShape: {
        method: "to",
        defaultProperties: { morphSVG: "#targetShape" },
        defaultDuration: 1,
        defaultEase: "power2.inOut",
        plugins: ["MorphSVGPlugin"],
        description: "Morph between SVG shapes (requires MorphSVGPlugin)",
    },
};
// ── Core generation logic ──────────────────────────────────
export function generatePresetCode(params) {
    const preset = PRESETS[params.type];
    const warnings = [];
    const pluginsRequired = preset.plugins ? [...preset.plugins] : [];
    if (pluginsRequired.length > 0) {
        warnings.push(`Requires plugin(s): ${pluginsRequired.join(", ")}. Make sure to install and register them.`);
    }
    const builder = new CodeBuilder();
    if (params.includeImports) {
        builder.addDefaultImport("gsap", "gsap");
        for (const plugin of pluginsRequired) {
            builder.addImport(`gsap/${plugin}`, [plugin]);
            builder.addPlugin(plugin);
        }
    }
    // Resolve options
    const duration = params.options?.duration ?? preset.defaultDuration;
    const ease = params.options?.ease ?? preset.defaultEase;
    const delay = params.options?.delay;
    const distance = params.options?.distance ?? DEFAULT_DISTANCE;
    const stagger = params.options?.stagger ?? preset.defaultStagger;
    const target = params.target;
    // Handle custom presets
    if (preset.custom) {
        generateCustomPreset(builder, params.type, target, duration, ease, delay, pluginsRequired);
    }
    else {
        generateStandardPreset(builder, preset, target, duration, ease, delay, distance, stagger);
    }
    const code = params.includeImports ? builder.build() : builder.buildSnippet();
    return { code, warnings, pluginsRequired };
}
// ── Standard preset generation ─────────────────────────────
function generateStandardPreset(builder, preset, target, duration, ease, delay, distance, stagger) {
    // Build properties, applying distance override only for slide presets
    const props = preset.usesDistance
        ? applyDistance({ ...preset.defaultProperties }, distance)
        : { ...preset.defaultProperties };
    // Build vars
    const vars = {
        duration,
        ...props,
        ease,
    };
    if (preset.usesStagger && stagger !== undefined) {
        vars.stagger = stagger;
    }
    if (delay !== undefined) {
        vars.delay = delay;
    }
    if (preset.extra) {
        Object.assign(vars, preset.extra);
    }
    if (preset.method === "fromTo") {
        const fromVars = formatGsapVars(preset.defaultFromProperties ?? {});
        const toVars = formatGsapVars(vars);
        builder.addLine(`gsap.fromTo("${target}", ${fromVars}, ${toVars});`);
    }
    else {
        const varsStr = formatGsapVars(vars);
        builder.addLine(`gsap.${preset.method}("${target}", ${varsStr});`);
    }
}
function applyDistance(props, distance) {
    // Only override if the property exists and matches the default distance pattern
    if (typeof props.y === "number") {
        const sign = props.y > 0 ? 1 : -1;
        props.y = sign * distance;
    }
    if (typeof props.x === "number") {
        const sign = props.x > 0 ? 1 : -1;
        props.x = sign * distance;
    }
    return props;
}
// ── Custom preset generation ───────────────────────────────
function generateCustomPreset(builder, type, target, duration, ease, delay, _plugins) {
    switch (type) {
        case "typewriter": {
            const vars = {
                duration,
                text: "Your text here",
                ease,
            };
            if (delay !== undefined)
                vars.delay = delay;
            builder.addLine(`gsap.to("${target}", ${formatGsapVars(vars)});`);
            break;
        }
        case "counter": {
            builder.addLine("const obj = { value: 0 };");
            const vars = {
                duration,
                value: 100,
                ease,
                onUpdate: "() => { element.textContent = Math.round(obj.value); }",
            };
            if (delay !== undefined)
                vars.delay = delay;
            builder.addLine(`gsap.to(obj, ${formatGsapVars(vars)});`);
            break;
        }
        case "parallax": {
            const vars = {
                yPercent: -50,
                ease,
                scrollTrigger: {
                    trigger: target,
                    scrub: true,
                },
            };
            if (delay !== undefined)
                vars.delay = delay;
            builder.addLine(`gsap.to("${target}", ${formatGsapVars(vars)});`);
            break;
        }
        default:
            break;
    }
}
// ── MCP tool registration ──────────────────────────────────
export function registerPresetTool(server) {
    server.registerTool("gsap_preset", {
        title: "GSAP Animation Presets",
        description: "Get ready-to-use GSAP animation code for common patterns like fadeIn, slideUp, staggerReveal, etc.",
        inputSchema: {
            type: z.enum(PRESET_TYPES),
            target: z.string().optional().default(".element"),
            options: z
                .object({
                duration: z.number().optional(),
                ease: z.string().optional(),
                stagger: z.number().optional(),
                delay: z.number().optional(),
                distance: z.number().optional(),
            })
                .optional(),
            includeImports: z.boolean().optional().default(true),
        },
    }, async (args) => {
        const result = generatePresetCode(args);
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
