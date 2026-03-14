import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ── Types ──────────────────────────────────────────────────

export type ControlsAction =
  | "play"
  | "pause"
  | "resume"
  | "reverse"
  | "restart"
  | "seek"
  | "timeScale"
  | "kill"
  | "progress";

export type ControlsTarget = "tween" | "timeline" | "global";

export interface ControlsParams {
  action: ControlsAction;
  target: ControlsTarget;
  variableName?: string;
  /** @deprecated Use variableName instead */
  selector?: string;
  value?: number | string;
  generateUI: boolean;
}

export interface ControlsResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateControlsCode(params: ControlsParams): ControlsResult {
  const warnings: string[] = [];
  const varName = resolveVarName(params);

  const actionCode = generateAction(params, varName, warnings);

  let code = actionCode;
  if (params.generateUI) {
    code += "\n\n" + generateUIPanel(varName);
  }

  if (params.selector !== undefined && params.variableName === undefined) {
    code =
      `// DEPRECATED: parameter "selector" has been renamed to "variableName"\n` +
      code;
  }

  return { code, warnings };
}

// ── Variable name resolution ───────────────────────────────

function resolveVarName(params: ControlsParams): string {
  if (params.variableName) return params.variableName;
  if (params.selector) return params.selector;

  switch (params.target) {
    case "timeline":
      return "tl";
    case "tween":
      return "tween";
    case "global":
      return "gsap.globalTimeline";
  }
}

// ── Action code generation ─────────────────────────────────

function generateAction(
  params: ControlsParams,
  varName: string,
  warnings: string[]
): string {
  switch (params.action) {
    case "play":
      return `${varName}.play();`;

    case "pause":
      return `${varName}.pause();`;

    case "resume":
      return `${varName}.resume();`;

    case "reverse":
      return `${varName}.reverse();`;

    case "restart":
      return `${varName}.restart();`;

    case "seek":
      return generateSeek(params, varName, warnings);

    case "timeScale":
      return generateTimeScale(params, varName, warnings);

    case "kill":
      return generateKill(params, varName, warnings);

    case "progress":
      return generateProgress(params, varName, warnings);
  }
}

function generateSeek(
  params: ControlsParams,
  varName: string,
  warnings: string[]
): string {
  if (params.value === undefined) {
    warnings.push(
      "seek requires a value (number in seconds or string label). Defaulting to 0."
    );
    return `${varName}.seek(0);`;
  }

  const formatted =
    typeof params.value === "string" ? `"${params.value}"` : params.value;
  return `${varName}.seek(${formatted});`;
}

function generateTimeScale(
  params: ControlsParams,
  varName: string,
  warnings: string[]
): string {
  if (params.value === undefined) {
    warnings.push(
      "timeScale requires a numeric value (multiplier). Defaulting to 1."
    );
    return `${varName}.timeScale(1);`;
  }

  return `${varName}.timeScale(${params.value});`;
}

function generateProgress(
  params: ControlsParams,
  varName: string,
  warnings: string[]
): string {
  if (params.value === undefined) {
    warnings.push(
      "progress requires a numeric value (0–1). Defaulting to 0."
    );
    return `${varName}.progress(0);`;
  }

  return `${varName}.progress(${params.value});`;
}

function generateKill(
  params: ControlsParams,
  varName: string,
  warnings: string[]
): string {
  const killTarget = params.variableName ?? params.selector;
  if (params.target === "global" && killTarget) {
    return `gsap.killTweensOf("${killTarget}");`;
  }

  return `${varName}.kill();`;
}

// ── UI panel generation ────────────────────────────────────

function generateUIPanel(varName: string): string {
  const lines = [
    `<!-- GSAP Control Panel -->`,
    `<div id="gsap-controls" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: #1a1a2e; padding: 8px 16px; display: flex; gap: 8px; align-items: center; font-family: monospace;">`,
    `  <button onclick="${varName}.play()" style="padding: 4px 12px; cursor: pointer;">Play</button>`,
    `  <button onclick="${varName}.pause()" style="padding: 4px 12px; cursor: pointer;">Pause</button>`,
    `  <button onclick="${varName}.reverse()" style="padding: 4px 12px; cursor: pointer;">Reverse</button>`,
    `  <button onclick="${varName}.restart()" style="padding: 4px 12px; cursor: pointer;">Restart</button>`,
    `  <button onclick="${varName}.timeScale(0.5)" style="padding: 4px 12px; cursor: pointer;">0.5x</button>`,
    `  <button onclick="${varName}.timeScale(1)" style="padding: 4px 12px; cursor: pointer;">1x</button>`,
    `  <button onclick="${varName}.timeScale(2)" style="padding: 4px 12px; cursor: pointer;">2x</button>`,
    `</div>`,
  ];
  return lines.join("\n");
}

// ── MCP tool registration ──────────────────────────────────

export function registerControlsTool(server: McpServer): void {
  server.registerTool(
    "gsap_controls",
    {
      title: "GSAP Animation Controls",
      description:
        "Generate playback control code for an existing tween or timeline variable (play, pause, reverse, seek, timeScale, kill, progress). Use when you need runtime control over an animation you have already created. Provide the JS variable name (e.g. tl, heroAnimation) in variableName — NOT a CSS selector. For generating the animation itself use gsap_tween or gsap_timeline instead.",
      inputSchema: {
        action: z
          .enum([
            "play",
            "pause",
            "resume",
            "reverse",
            "restart",
            "seek",
            "timeScale",
            "kill",
            "progress",
          ])
          .describe("The control action to generate"),
        target: z
          .enum(["tween", "timeline", "global"])
          .optional()
          .default("timeline")
          .describe("Target type: tween, timeline, or global"),
        variableName: z
          .string()
          .optional()
          .describe(
            "JavaScript variable name of the tween or timeline to control, e.g. tl, heroAnimation. NOT a CSS selector."
          ),
        selector: z
          .string()
          .optional()
          .describe(
            'Deprecated: use variableName instead. Accepted for backward compatibility.'
          )
          .transform((val) => val),
        value: z
          .union([z.number(), z.string()])
          .optional()
          .describe(
            "Value for seek (seconds or label), timeScale (multiplier), or progress (0–1)"
          ),
        generateUI: z
          .boolean()
          .optional()
          .default(false)
          .describe("Generate an HTML control panel"),
      },
    },
    async (args) => {
      const result = generateControlsCode(
        args as unknown as ControlsParams
      );

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
