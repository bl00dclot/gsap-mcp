import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars, formatPosition } from "../../generators/templates.js";
import { findProperty } from "../../knowledge/properties.js";

// ── Input types ────────────────────────────────────────────

export interface TimelineAnimation {
  target: string;
  method: "to" | "from" | "fromTo" | "set";
  duration: number;
  properties: Record<string, unknown>;
  fromProperties?: Record<string, unknown>;
  ease?: string;
  stagger?: number | { amount: number; from?: string };
  position?: string;
}

export interface TimelineLabel {
  name: string;
  position?: string;
}

export interface TimelineSettings {
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  paused?: boolean;
  defaults?: Record<string, unknown>;
}

export interface TimelineParams {
  animations: TimelineAnimation[];
  settings?: TimelineSettings;
  labels?: TimelineLabel[];
  variableName: string;
  includeImports: boolean;
}

// ── Result types ───────────────────────────────────────────

export interface TimelineResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateTimelineCode(params: TimelineParams): TimelineResult {
  const warnings: string[] = [];

  // Validate non-empty animations
  if (params.animations.length === 0) {
    return {
      code: "",
      warnings: ["Error: animations array must not be empty."],
    };
  }

  // Validate fromTo entries and check properties
  for (const anim of params.animations) {
    if (anim.method === "fromTo" && !anim.fromProperties) {
      warnings.push(
        `Warning: fromTo on "${anim.target}" is missing fromProperties — generating as .to() instead.`
      );
    }

    const propsToCheck = {
      ...anim.properties,
      ...(anim.fromProperties ?? {}),
    };
    for (const key of Object.keys(propsToCheck)) {
      const prop = findProperty(key);
      if (prop && !prop.gpuAccelerated && prop.performanceNote) {
        warnings.push(`Performance: "${key}" — ${prop.performanceNote}`);
      }
    }
  }

  // Build code
  const builder = new CodeBuilder();
  const v = params.variableName;

  if (params.includeImports) {
    builder.addDefaultImport("gsap", "gsap");
  }

  // Build gsap.timeline() call
  const timelineArgs = buildTimelineArgs(params.settings);
  builder.addLine(`const ${v} = gsap.timeline(${timelineArgs});`);

  // Build a merged sequence of labels + animations sorted by insertion order
  // Labels are inserted before the first animation at their position,
  // or in declaration order if no position is specified
  const steps = buildSteps(params.animations, params.labels ?? []);

  // Generate chained calls
  builder.newLine();
  const chainLines = generateChainLines(v, steps, warnings);
  for (const line of chainLines) {
    builder.addLine(line);
  }

  const rawCode = params.includeImports ? builder.build() : builder.buildSnippet();
  const header = builder.buildHeaderComment({
    toolName: "gsap_timeline",
    target: params.animations[0].target,
    method: params.animations[0].method,
  });

  return { code: `${header}\n${rawCode}`, warnings };
}

// ── Helpers ────────────────────────────────────────────────

interface StepAnimation {
  kind: "animation";
  anim: TimelineAnimation;
}

interface StepLabel {
  kind: "label";
  label: TimelineLabel;
}

type Step = StepAnimation | StepLabel;

function buildSteps(
  animations: TimelineAnimation[],
  labels: TimelineLabel[]
): Step[] {
  // Labels with a position are inserted inline; labels without a position
  // go between animations in declaration order. We interleave by tracking
  // a label queue: labels without positions are inserted before the next animation.
  const positionalLabels = labels.filter((l) => l.position !== undefined);
  const sequentialLabels = labels.filter((l) => l.position === undefined);
  let seqIdx = 0;

  const steps: Step[] = [];

  for (const anim of animations) {
    // Insert the next sequential label before this animation
    if (seqIdx < sequentialLabels.length) {
      steps.push({ kind: "label", label: sequentialLabels[seqIdx] });
      seqIdx++;
    }
    steps.push({ kind: "animation", anim });
  }

  // Remaining sequential labels go at the end
  while (seqIdx < sequentialLabels.length) {
    steps.push({ kind: "label", label: sequentialLabels[seqIdx] });
    seqIdx++;
  }

  // Positional labels go at the end (they specify their own position)
  for (const label of positionalLabels) {
    steps.push({ kind: "label", label });
  }

  return steps;
}

function buildTimelineArgs(settings?: TimelineSettings): string {
  if (!settings) return "";

  const obj: Record<string, unknown> = {};

  if (settings.repeat !== undefined) obj.repeat = settings.repeat;
  if (settings.repeatDelay !== undefined) obj.repeatDelay = settings.repeatDelay;
  if (settings.yoyo !== undefined) obj.yoyo = settings.yoyo;
  if (settings.paused !== undefined) obj.paused = settings.paused;
  if (settings.defaults !== undefined) obj.defaults = settings.defaults;

  if (Object.keys(obj).length === 0) return "";

  return formatGsapVars(obj);
}

function generateChainLines(
  v: string,
  steps: Step[],
  warnings: string[]
): string[] {
  const lines: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const prefix = i === 0 ? `${v}` : "  ";

    if (step.kind === "label") {
      const posArg = formatPosition(step.label.position);
      lines.push(`${prefix}.addLabel("${step.label.name}"${posArg})`);
    } else {
      const { anim } = step;
      const isSet = anim.method === "set";

      // Determine effective method (fall back to "to" if fromTo is missing fromProperties)
      let method = anim.method;
      if (method === "fromTo" && !anim.fromProperties) {
        method = "to";
      }

      // Build vars object
      const vars: Record<string, unknown> = {};
      if (!isSet) {
        vars.duration = anim.duration;
      }
      Object.assign(vars, anim.properties);
      if (!isSet && anim.ease) {
        vars.ease = anim.ease;
      }
      if (anim.stagger !== undefined) {
        vars.stagger = anim.stagger;
      }

      const posArg = formatPosition(anim.position);

      if (method === "fromTo") {
        const fromVars = formatGsapVars(anim.fromProperties!);
        const toVars = formatGsapVars(vars);
        lines.push(
          `${prefix}.fromTo("${anim.target}", ${fromVars}, ${toVars}${posArg})`
        );
      } else {
        const varsStr = formatGsapVars(vars);
        lines.push(
          `${prefix}.${method}("${anim.target}", ${varsStr}${posArg})`
        );
      }
    }
  }

  // Add semicolon to last line
  if (lines.length > 0) {
    lines[lines.length - 1] += ";";
  }

  return lines;
}

// ── Zod schemas ────────────────────────────────────────────

const animationSchema = z.object({
  target: z.string(),
  method: z.enum(["to", "from", "fromTo", "set"]).optional().default("to"),
  duration: z.number().optional().default(1),
  properties: z.record(z.string(), z.any()),
  fromProperties: z.record(z.string(), z.any()).optional(),
  ease: z.string().optional(),
  stagger: z
    .union([
      z.number(),
      z.object({
        amount: z.number(),
        from: z.string().optional(),
      }),
    ])
    .optional(),
  position: z
    .string()
    .optional()
    .describe('Timeline position — e.g. "+=0.5", "<", "<0.3", "myLabel"'),
});

const settingsSchema = z
  .object({
    repeat: z.number().optional(),
    repeatDelay: z.number().optional(),
    yoyo: z.boolean().optional(),
    paused: z.boolean().optional(),
    defaults: z.record(z.string(), z.any()).optional(),
  })
  .optional();

const labelSchema = z.object({
  name: z.string(),
  position: z.string().optional(),
});

// ── MCP tool registration ──────────────────────────────────

export function registerTimelineTool(server: McpServer): void {
  server.registerTool(
    "gsap_timeline",
    {
      title: "GSAP Timeline Creator",
      description:
        "Build a GSAP timeline with multiple sequenced or overlapping tweens,\nlabels, and position parameters. Use when you need 2+ animations coordinated\ntogether. For a single animation use gsap_tween instead.",
      inputSchema: {
        animations: z.array(animationSchema),
        settings: settingsSchema,
        labels: z.array(labelSchema).optional(),
        variableName: z.string().optional().default("tl"),
        includeImports: z.boolean().optional().default(true),
      },
    },
    async (args) => {
      const result = generateTimelineCode(args as unknown as TimelineParams);

      // Validation error (empty animations)
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
