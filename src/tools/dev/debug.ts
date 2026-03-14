import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ── Types ──────────────────────────────────────────────────

export type DebugAction =
  | "visualize"
  | "gsdevtools"
  | "log"
  | "slowmo"
  | "labelDump";

export interface DebugOptions {
  showMarkers?: boolean;
  logDetails?: boolean;
  timeScale?: number;
}

export interface DebugParams {
  action: DebugAction;
  target: string;
  options?: DebugOptions;
}

export interface DebugResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateDebugCode(params: DebugParams): DebugResult {
  const warnings: string[] = [];
  const target = params.target;

  const generator = actionGenerators[params.action];
  const code = generator(target, params.options ?? {}, warnings);

  return { code, warnings };
}

// ── Action generators ──────────────────────────────────────

type ActionGenerator = (
  target: string,
  options: DebugOptions,
  warnings: string[]
) => string;

const actionGenerators: Record<DebugAction, ActionGenerator> = {
  visualize: genVisualize,
  gsdevtools: genGSDevTools,
  log: genLog,
  slowmo: genSlowmo,
  labelDump: genLabelDump,
};

// ── visualize ──────────────────────────────────────────────

function genVisualize(
  target: string,
  options: DebugOptions,
  _warnings: string[]
): string {
  const lines: string[] = [];

  lines.push("// Enable ScrollTrigger markers for visual debugging");
  lines.push("ScrollTrigger.defaults({ markers: true });");
  lines.push("");
  lines.push("// Log timeline info");
  lines.push(
    `console.log("Duration:", ${target}.duration(), "Children:", ${target}.getChildren().length);`
  );
  lines.push("");
  lines.push(
    "// ⚠️ Remove markers before deploying to production"
  );

  return lines.join("\n");
}

// ── gsdevtools ─────────────────────────────────────────────

function genGSDevTools(
  target: string,
  _options: DebugOptions,
  _warnings: string[]
): string {
  const lines: string[] = [];

  lines.push('import { GSDevTools } from "gsap/GSDevTools";');
  lines.push("gsap.registerPlugin(GSDevTools);");
  lines.push("");
  lines.push(`GSDevTools.create({ animation: ${target} });`);
  lines.push("");
  lines.push(
    "// Note: GSDevTools is a premium GSAP plugin (Club membership required)"
  );

  return lines.join("\n");
}

// ── log ────────────────────────────────────────────────────

function genLog(
  target: string,
  _options: DebugOptions,
  _warnings: string[]
): string {
  const lines: string[] = [];

  lines.push("// Log timeline progress and current time on each update");
  lines.push(
    `${target}.eventCallback("onUpdate", () => {`
  );
  lines.push(
    `  console.log(\`Progress: \${${target}.progress().toFixed(2)}, Time: \${${target}.time().toFixed(2)}\`);`
  );
  lines.push("});");

  return lines.join("\n");
}

// ── slowmo ─────────────────────────────────────────────────

function genSlowmo(
  _target: string,
  options: DebugOptions,
  _warnings: string[]
): string {
  const timeScale = options.timeScale ?? 0.25;

  const lines: string[] = [];

  lines.push(`// Slow down all animations to ${timeScale}x speed for debugging`);
  lines.push(`gsap.globalTimeline.timeScale(${timeScale});`);
  lines.push("");
  lines.push("// Reset to normal speed:");
  lines.push("// gsap.globalTimeline.timeScale(1);");

  return lines.join("\n");
}

// ── labelDump ──────────────────────────────────────────────

function genLabelDump(
  target: string,
  _options: DebugOptions,
  _warnings: string[]
): string {
  const lines: string[] = [];

  lines.push("// Dump all timeline labels and their positions");
  lines.push(`const labels = ${target}.labels;`);
  lines.push("for (const [name, time] of Object.entries(labels)) {");
  lines.push("  console.log(`Label: \"${name}\" at ${time}s`);");
  lines.push("}");

  return lines.join("\n");
}

// ── MCP tool registration ──────────────────────────────────

export function registerDebugTool(server: McpServer): void {
  server.registerTool(
    "gsap_debug",
    {
      title: "GSAP Debug Helper",
      description:
        "Generate debugging utilities for GSAP animations during development. Modes: visualize (ScrollTrigger markers + timeline info log), gsdevtools (GSDevTools panel — requires Club GSAP membership), log (onUpdate progress/time logging), slowmo (slow down all animations via globalTimeline.timeScale), labelDump (print all timeline labels). Use only during development — remove all debug code before production.",
      inputSchema: {
        action: z
          .enum(["visualize", "gsdevtools", "log", "slowmo", "labelDump"])
          .describe("Debug action to generate"),
        target: z
          .string()
          .optional()
          .default("tl")
          .describe("Timeline variable name"),
        options: z
          .object({
            showMarkers: z.boolean().optional(),
            logDetails: z.boolean().optional(),
            timeScale: z.number().optional().default(0.25),
          })
          .optional(),
      },
    },
    async (args) => {
      const result = generateDebugCode(args as DebugParams);

      const content: { type: "text"; text: string }[] = [
        { type: "text", text: result.code },
      ];

      if (result.warnings.length > 0) {
        content.push({
          type: "text",
          text: `\n--- Warnings ---\n${result.warnings.join("\n")}`,
        });
      }

      return { content };
    }
  );
}
