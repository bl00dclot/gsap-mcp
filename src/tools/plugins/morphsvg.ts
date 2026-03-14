import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";

// ── Input types ────────────────────────────────────────────

export interface MorphSVGOptions {
  shapeIndex: number | "auto" | "log";
  type?: "rotational" | "linear";
  origin?: string;
  map?: "size" | "position" | "complexity";
}

export interface MorphSVGParams {
  target: string;
  endShape: string;
  duration: number;
  ease: string;
  options?: MorphSVGOptions;
  useTimeline: boolean;
  includeImports: boolean;
}

// ── Result types ───────────────────────────────────────────

export interface MorphSVGResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateMorphSVGCode(
  params: MorphSVGParams
): MorphSVGResult {
  const warnings: string[] = [];
  const builder = new CodeBuilder();

  if (params.includeImports) {
    builder.addDefaultImport("gsap", "gsap");
    builder.addImport("gsap/MorphSVGPlugin", ["MorphSVGPlugin"]);
    builder.addPlugin("MorphSVGPlugin");
  }

  // convertToPath tip
  builder.addComment(
    'Tip: Use MorphSVGPlugin.convertToPath("circle, rect, ellipse") to convert'
  );
  builder.addComment(
    "non-path SVG elements to paths before morphing."
  );

  // shapeIndex "log" debug comment
  if (params.options?.shapeIndex === "log") {
    builder.newLine();
    builder.addComment(
      'shapeIndex: "log" will log all shape index values to the console'
    );
    builder.addComment(
      "for debugging. Choose the best index, then replace \"log\" with that number."
    );
  }

  builder.newLine();

  // Build morphSVG property object
  const morphSVG = buildMorphSVGConfig(params);

  // Build the tween vars
  const vars: Record<string, unknown> = {
    duration: params.duration,
    morphSVG,
    ease: params.ease,
  };

  if (params.useTimeline) {
    generateTimeline(builder, params.target, vars);
  } else {
    generateDirect(builder, params.target, vars);
  }

  const code = params.includeImports
    ? builder.build()
    : builder.buildSnippet();

  return { code, warnings };
}

// ── Build morphSVG config ──────────────────────────────────

function buildMorphSVGConfig(
  params: MorphSVGParams
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    shape: params.endShape,
  };

  if (params.options) {
    if (params.options.shapeIndex !== undefined) {
      config.shapeIndex = params.options.shapeIndex;
    }
    if (params.options.type !== undefined) {
      config.type = params.options.type;
    }
    if (params.options.origin !== undefined) {
      config.origin = params.options.origin;
    }
    if (params.options.map !== undefined) {
      config.map = params.options.map;
    }
  }

  return config;
}

// ── Direct animation ──────────────────────────────────────

function generateDirect(
  builder: CodeBuilder,
  target: string,
  vars: Record<string, unknown>
): void {
  const varsStr = formatGsapVars(vars);
  builder.addLine(`gsap.to("${target}", ${varsStr});`);
}

// ── Timeline animation ────────────────────────────────────

function generateTimeline(
  builder: CodeBuilder,
  target: string,
  vars: Record<string, unknown>
): void {
  builder.addLine("const tl = gsap.timeline();");
  builder.newLine();

  const varsStr = formatGsapVars(vars);
  builder.addLine(`tl.to("${target}", ${varsStr});`);
}

// ── MCP tool registration ──────────────────────────────────

const optionsSchema = z
  .object({
    shapeIndex: z
      .union([z.number(), z.literal("auto"), z.literal("log")])
      .optional()
      .default("auto"),
    type: z.enum(["rotational", "linear"]).optional(),
    origin: z.string().optional(),
    map: z.enum(["size", "position", "complexity"]).optional(),
  })
  .optional();

export function registerMorphSVGTool(server: McpServer): void {
  server.registerTool(
    "gsap_morphsvg",
    {
      title: "GSAP MorphSVG",
      description:
        "Morph one SVG path into another using MorphSVGPlugin.\nTarget and endShape must be SVG path elements or path data strings.\nFor drawing SVG strokes use gsap_drawsvg instead.",
      inputSchema: {
        target: z
          .string()
          .describe("CSS selector for the source SVG path/shape"),
        endShape: z
          .string()
          .describe(
            "CSS selector or raw SVG path data string for the target shape"
          ),
        duration: z.number().optional().default(2),
        ease: z.string().optional().default("power1.inOut"),
        options: optionsSchema,
        useTimeline: z
          .boolean()
          .optional()
          .default(false),
        includeImports: z.boolean().optional().default(true),
      },
    },
    async (args) => {
      const result = generateMorphSVGCode(
        args as unknown as MorphSVGParams
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
