import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";

// ── Input types ────────────────────────────────────────────

export interface MotionPathOptions {
  autoRotate?: boolean | number;
  align?: string;
  alignOrigin?: [number, number];
  start?: number;
  end?: number;
  curviness?: number;
  type?: "cubic" | "thru" | "soft";
}

export interface MotionPathParams {
  target: string;
  path: string | { x: number; y: number }[];
  duration: number;
  options?: MotionPathOptions;
  ease: string;
  includeImports: boolean;
}

// ── Result types ───────────────────────────────────────────

export interface MotionPathResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateMotionPathCode(
  params: MotionPathParams
): MotionPathResult {
  const warnings: string[] = [];
  const builder = new CodeBuilder();

  if (params.includeImports) {
    builder.addDefaultImport("gsap", "gsap");
    builder.addImport("gsap/MotionPathPlugin", ["MotionPathPlugin"]);
    builder.addPlugin("MotionPathPlugin");
  }

  // MotionPathHelper tip
  builder.addComment(
    "Tip: Use MotionPathHelper for visual path editing in development."
  );

  // Align without alignOrigin suggestion
  if (params.options?.align && !params.options.alignOrigin) {
    builder.addComment(
      "Consider adding alignOrigin: [0.5, 0.5] to center the element on the path."
    );
  }

  builder.newLine();

  // Build motionPath config
  const motionPath = buildMotionPathConfig(params);

  // Build tween vars
  const vars: Record<string, unknown> = {
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

function buildMotionPathConfig(
  params: MotionPathParams
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    path: params.path,
  };

  if (params.options) {
    const opts = params.options;
    if (opts.autoRotate !== undefined) config.autoRotate = opts.autoRotate;
    if (opts.align !== undefined) config.align = opts.align;
    if (opts.alignOrigin !== undefined) config.alignOrigin = opts.alignOrigin;
    if (opts.start !== undefined) config.start = opts.start;
    if (opts.end !== undefined) config.end = opts.end;
    if (opts.curviness !== undefined) config.curviness = opts.curviness;
    if (opts.type !== undefined) config.type = opts.type;
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

export function registerMotionPathTool(server: McpServer): void {
  server.registerTool(
    "gsap_motionpath",
    {
      title: "GSAP MotionPath",
      description:
        "Animate an element along an SVG path or array of points using MotionPathPlugin.\nUse for curved movement paths. For straight-line positional animation\nuse gsap_tween instead.",
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
    },
    async (args) => {
      const result = generateMotionPathCode(
        args as unknown as MotionPathParams
      );

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
