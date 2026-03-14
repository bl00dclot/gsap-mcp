import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";
import { findProperty } from "../../knowledge/properties.js";

// ── Input types ────────────────────────────────────────────

export interface ScrollTriggerAnimation {
  target: string;
  method: "to" | "from" | "fromTo";
  properties: Record<string, unknown>;
  fromProperties?: Record<string, unknown>;
  duration: number;
  ease?: string;
}

export interface ScrollTriggerConfig {
  trigger: string;
  start: string;
  end: string;
  scrub?: boolean | number;
  pin?: boolean | string;
  pinSpacing?: boolean;
  snap?: number | { snapTo: number | number[] | "labels"; duration?: number; ease?: string };
  markers?: boolean;
  toggleActions?: string;
  toggleClass?: string;
  once?: boolean;
}

export interface BatchOptions {
  targets: string;
  interval?: number;
  batchMax?: number;
  onEnter?: Record<string, unknown>;
  onLeave?: Record<string, unknown>;
}

export type ScrollTriggerMode = "standalone" | "timeline" | "batch";

export interface ScrollTriggerParams {
  animation: ScrollTriggerAnimation;
  trigger: ScrollTriggerConfig;
  mode: ScrollTriggerMode;
  batchOptions?: BatchOptions;
  includeImports: boolean;
}

// ── Result types ───────────────────────────────────────────

export interface ScrollTriggerResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateScrollTriggerCode(
  params: ScrollTriggerParams
): ScrollTriggerResult {
  const warnings: string[] = [];

  // Batch mode requires batchOptions
  if (params.mode === "batch" && !params.batchOptions) {
    return {
      code: "",
      warnings: [
        'Error: "batch" mode requires batchOptions to be provided.',
      ],
    };
  }

  // Validate fromTo requires fromProperties
  let effectiveMethod = params.animation.method;
  if (effectiveMethod === "fromTo" && !params.animation.fromProperties) {
    warnings.push(
      'Warning: fromTo is missing fromProperties — generating as .to() instead.'
    );
    effectiveMethod = "to";
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

  const builder = new CodeBuilder();

  if (params.includeImports) {
    builder.addDefaultImport("gsap", "gsap");
    builder.addImport("gsap/ScrollTrigger", ["ScrollTrigger"]);
    builder.addPlugin("ScrollTrigger");
  }

  // Add markers dev-only comment
  if (params.trigger.markers) {
    builder.addComment("markers are for development only — remove before production");
  }

  switch (params.mode) {
    case "standalone":
      generateStandalone(builder, params, effectiveMethod);
      break;
    case "timeline":
      generateTimeline(builder, params, effectiveMethod);
      break;
    case "batch":
      generateBatch(builder, params);
      break;
  }

  const code = params.includeImports
    ? builder.build()
    : builder.buildSnippet();

  return { code, warnings };
}

// ── Standalone mode ────────────────────────────────────────

function generateStandalone(
  builder: CodeBuilder,
  params: ScrollTriggerParams,
  method: "to" | "from" | "fromTo"
): void {
  const { animation, trigger } = params;

  const scrollTriggerConfig = buildTriggerConfig(trigger);

  const vars: Record<string, unknown> = {
    ...animation.properties,
    ease: animation.ease ?? "none",
    scrollTrigger: scrollTriggerConfig,
  };

  if (method === "fromTo") {
    const fromVars = formatGsapVars(animation.fromProperties!);
    const toVars = formatGsapVars({
      duration: animation.duration,
      ...vars,
    });
    builder.addLine(
      `gsap.fromTo("${animation.target}", ${fromVars}, ${toVars});`
    );
  } else {
    const allVars = formatGsapVars({
      duration: animation.duration,
      ...animation.properties,
      ease: animation.ease ?? "none",
      scrollTrigger: scrollTriggerConfig,
    });
    builder.addLine(`gsap.${method}("${animation.target}", ${allVars});`);
  }
}

// ── Timeline mode ──────────────────────────────────────────

function generateTimeline(
  builder: CodeBuilder,
  params: ScrollTriggerParams,
  method: "to" | "from" | "fromTo"
): void {
  const { animation, trigger } = params;

  const scrollTriggerConfig = buildTriggerConfig(trigger);
  const timelineOpts = formatGsapVars({
    scrollTrigger: scrollTriggerConfig,
  });

  builder.addLine(`const tl = gsap.timeline(${timelineOpts});`);
  builder.newLine();

  const vars: Record<string, unknown> = {
    duration: animation.duration,
    ...animation.properties,
  };
  if (animation.ease) {
    vars.ease = animation.ease;
  }

  if (method === "fromTo") {
    const fromVars = formatGsapVars(animation.fromProperties!);
    const toVars = formatGsapVars(vars);
    builder.addLine(
      `tl.fromTo("${animation.target}", ${fromVars}, ${toVars});`
    );
  } else {
    const varsStr = formatGsapVars(vars);
    builder.addLine(`tl.${method}("${animation.target}", ${varsStr});`);
  }
}

// ── Batch mode ─────────────────────────────────────────────

function generateBatch(
  builder: CodeBuilder,
  params: ScrollTriggerParams
): void {
  const batch = params.batchOptions!;

  const config: Record<string, unknown> = {};

  if (batch.interval !== undefined) {
    config.interval = batch.interval;
  }
  if (batch.batchMax !== undefined) {
    config.batchMax = batch.batchMax;
  }
  if (batch.onEnter) {
    config.onEnter = `(batch) => gsap.to(batch, ${formatGsapVars(batch.onEnter)})`;
  }
  if (batch.onLeave) {
    config.onLeave = `(batch) => gsap.to(batch, ${formatGsapVars(batch.onLeave)})`;
  }

  const configStr = formatBatchConfig(config);
  builder.addLine(`ScrollTrigger.batch("${batch.targets}", ${configStr});`);
}

// ── Trigger config builder ─────────────────────────────────

function buildTriggerConfig(
  trigger: ScrollTriggerConfig
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    trigger: trigger.trigger,
    start: `${trigger.start}`, // trigger-position viewport-position
    end: trigger.end,
  };

  if (trigger.scrub !== undefined) config.scrub = trigger.scrub;
  if (trigger.pin !== undefined) config.pin = trigger.pin;
  if (trigger.pinSpacing !== undefined) config.pinSpacing = trigger.pinSpacing;
  if (trigger.snap !== undefined) config.snap = trigger.snap;
  if (trigger.markers !== undefined && trigger.markers) config.markers = true;
  if (trigger.toggleActions !== undefined) config.toggleActions = trigger.toggleActions;
  if (trigger.toggleClass !== undefined) config.toggleClass = trigger.toggleClass;
  if (trigger.once !== undefined) config.once = trigger.once;

  return config;
}

// ── Batch config formatter ─────────────────────────────────

function formatBatchConfig(config: Record<string, unknown>): string {
  const entries = Object.entries(config);
  if (entries.length === 0) return "{}";

  const INDENT = "  ";
  const lines = entries.map(([k, v]) => {
    // onEnter/onLeave are already formatted as raw function strings
    if (k === "onEnter" || k === "onLeave") {
      return `${INDENT}${k}: ${v}`;
    }
    return `${INDENT}${k}: ${formatValue(v)}`;
  });

  return `{\n${lines.join(",\n")}\n}`;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return String(value);
}

// ── MCP tool registration ──────────────────────────────────

const animationSchema = z.object({
  target: z.string(),
  method: z
    .enum(["to", "from", "fromTo"])
    .optional()
    .default("to"),
  properties: z.record(z.string(), z.any()),
  fromProperties: z.record(z.string(), z.any()).optional(),
  duration: z.number().optional().default(1),
  ease: z.string().optional(),
});

const triggerSchema = z.object({
  trigger: z
    .string()
    .describe("CSS selector for the trigger element"),
  start: z
    .string()
    .optional()
    .default("top bottom")
    .describe(
      'Scroll start position — format: "triggerEdge viewportEdge", e.g. "top bottom" means trigger\'s top hits viewport\'s bottom'
    ),
  end: z
    .string()
    .optional()
    .default("bottom top")
    .describe(
      'Scroll end position — format: "triggerEdge viewportEdge", e.g. "bottom top" means trigger\'s bottom hits viewport\'s top'
    ),
  scrub: z.union([z.boolean(), z.number()]).optional(),
  pin: z.union([z.boolean(), z.string()]).optional(),
  pinSpacing: z.boolean().optional(),
  snap: z
    .union([
      z.number(),
      z.object({
        snapTo: z.union([
          z.number(),
          z.array(z.number()),
          z.literal("labels"),
        ]),
        duration: z.number().optional(),
        ease: z.string().optional(),
      }),
    ])
    .optional(),
  markers: z.boolean().optional().default(false),
  toggleActions: z
    .string()
    .optional()
    .describe(
      'Four space-separated actions: onEnter onLeave onEnterBack onLeaveBack.\nEach action is one of: play, pause, resume, reverse, restart, reset, complete, none.\nExample: "play pause resume reset"'
    ),
  toggleClass: z.string().optional(),
  once: z.boolean().optional(),
});

const batchOptionsSchema = z
  .object({
    targets: z.string(),
    interval: z.number().optional(),
    batchMax: z.number().optional(),
    onEnter: z.record(z.string(), z.any()).optional(),
    onLeave: z.record(z.string(), z.any()).optional(),
  })
  .optional();

export function registerScrollTriggerTool(server: McpServer): void {
  server.registerTool(
    "gsap_scrolltrigger",
    {
      title: "GSAP ScrollTrigger",
      description:
        "Animate elements based on scroll position using ScrollTrigger.\nUse for scroll-driven animations (scrub), pin sections, or trigger-on-scroll effects.\nFor scroll-independent animations use gsap_tween or gsap_timeline instead.",
      inputSchema: {
        animation: animationSchema,
        trigger: triggerSchema,
        mode: z
          .enum(["standalone", "timeline", "batch"])
          .optional()
          .default("standalone"),
        batchOptions: batchOptionsSchema,
        includeImports: z.boolean().optional().default(true),
      },
    },
    async (args) => {
      const result = generateScrollTriggerCode(
        args as unknown as ScrollTriggerParams
      );

      // Validation error
      if (result.code === "" && result.warnings.length > 0) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: result.warnings[0] }],
        };
      }

      const content: { type: "text"; text: string }[] = [
        { type: "text", text: result.code },
      ];

      if (result.warnings.length > 0) {
        content.push({
          type: "text",
          text: `\n--- Notes ---\n${result.warnings.join("\n")}`,
        });
      }

      return { content };
    }
  );
}
