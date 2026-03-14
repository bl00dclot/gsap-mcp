import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodeBuilder } from "../../generators/code-builder.js";
import { formatGsapVars } from "../../generators/templates.js";

// ── Input types ────────────────────────────────────────────

export interface ScrambleTextOptions {
  chars?: string;
  tweenLength?: boolean;
  revealDelay?: number;
  speed?: number;
  rightToLeft?: boolean;
}

export interface TextPluginOptions {
  delimiter?: string;
  speed?: number;
  scrambleText?: ScrambleTextOptions;
  newClass?: string;
  oldClass?: string;
}

export interface TextPluginParams {
  target: string;
  text: string;
  duration: number;
  type: "replace" | "scramble";
  options?: TextPluginOptions;
  ease: string;
  includeImports: boolean;
}

// ── Result types ───────────────────────────────────────────

export interface TextPluginResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateTextPluginCode(
  params: TextPluginParams
): TextPluginResult {
  const warnings: string[] = [];
  const builder = new CodeBuilder();

  if (params.type === "replace") {
    generateReplace(builder, params);
  } else {
    generateScramble(builder, params);
  }

  const rawCode = params.includeImports
    ? builder.build()
    : builder.buildSnippet();
  const header = builder.buildHeaderComment({
    toolName: "gsap_textplugin",
    target: params.target,
    method: "to",
    plugin: "TextPlugin",
  });

  return { code: `${header}\n${rawCode}`, warnings };
}

// ── Replace type ──────────────────────────────────────────

function generateReplace(
  builder: CodeBuilder,
  params: TextPluginParams
): void {
  if (params.includeImports) {
    builder.addDefaultImport("gsap", "gsap");
    builder.addImport("gsap/TextPlugin", ["TextPlugin"]);
    builder.addPlugin("TextPlugin");
  }

  const needsObjectForm =
    params.options?.delimiter !== undefined ||
    params.options?.newClass !== undefined ||
    params.options?.oldClass !== undefined;

  let textValue: unknown;
  if (needsObjectForm) {
    const textObj: Record<string, unknown> = {
      value: params.text,
    };
    if (params.options?.delimiter !== undefined) {
      textObj.delimiter = params.options.delimiter;
    }
    if (params.options?.newClass !== undefined) {
      textObj.newClass = params.options.newClass;
    }
    if (params.options?.oldClass !== undefined) {
      textObj.oldClass = params.options.oldClass;
    }
    textValue = textObj;
  } else {
    textValue = params.text;
  }

  const vars: Record<string, unknown> = {
    duration: params.duration,
    text: textValue,
    ease: params.ease,
  };

  if (params.options?.speed !== undefined) {
    vars.speed = params.options.speed;
  }

  const varsStr = formatGsapVars(vars);
  builder.addLine(`gsap.to("${params.target}", ${varsStr});`);
}

// ── Scramble type ─────────────────────────────────────────

function generateScramble(
  builder: CodeBuilder,
  params: TextPluginParams
): void {
  if (params.includeImports) {
    builder.addDefaultImport("gsap", "gsap");
    builder.addImport("gsap/ScrambleTextPlugin", ["ScrambleTextPlugin"]);
    builder.addPlugin("ScrambleTextPlugin");
  }

  const scrambleOpts = params.options?.scrambleText;
  const hasScrambleOptions =
    scrambleOpts &&
    (scrambleOpts.chars !== undefined ||
      scrambleOpts.tweenLength !== undefined ||
      scrambleOpts.revealDelay !== undefined ||
      scrambleOpts.speed !== undefined ||
      scrambleOpts.rightToLeft !== undefined);

  let scrambleValue: unknown;
  if (hasScrambleOptions) {
    const scrambleObj: Record<string, unknown> = {
      text: params.text,
    };
    if (scrambleOpts!.chars !== undefined) scrambleObj.chars = scrambleOpts!.chars;
    if (scrambleOpts!.tweenLength !== undefined) scrambleObj.tweenLength = scrambleOpts!.tweenLength;
    if (scrambleOpts!.revealDelay !== undefined) scrambleObj.revealDelay = scrambleOpts!.revealDelay;
    if (scrambleOpts!.speed !== undefined) scrambleObj.speed = scrambleOpts!.speed;
    if (scrambleOpts!.rightToLeft !== undefined) scrambleObj.rightToLeft = scrambleOpts!.rightToLeft;
    scrambleValue = scrambleObj;
  } else {
    scrambleValue = params.text;
  }

  const vars: Record<string, unknown> = {
    duration: params.duration,
    scrambleText: scrambleValue,
    ease: params.ease,
  };

  const varsStr = formatGsapVars(vars);
  builder.addLine(`gsap.to("${params.target}", ${varsStr});`);
}

// ── MCP tool registration ──────────────────────────────────

const scrambleTextSchema = z
  .object({
    chars: z.string().optional(),
    tweenLength: z.boolean().optional(),
    revealDelay: z.number().optional(),
    speed: z.number().optional(),
    rightToLeft: z.boolean().optional(),
  })
  .optional();

const optionsSchema = z
  .object({
    delimiter: z.string().optional(),
    speed: z.number().optional(),
    scrambleText: scrambleTextSchema,
    newClass: z.string().optional(),
    oldClass: z.string().optional(),
  })
  .optional();

export function registerTextPluginTool(server: McpServer): void {
  server.registerTool(
    "gsap_textplugin",
    {
      title: "GSAP TextPlugin",
      description:
        "Animate text content replacement character-by-character using TextPlugin\nor ScrambleTextPlugin. Use type 'replace' for typewriter effect, 'scramble'\nfor randomized scramble reveal. For animating split characters use\ngsap_splittext instead.",
      inputSchema: {
        target: z.string().describe("CSS selector for the text element"),
        text: z.string().describe("The target text content"),
        duration: z.number().optional().default(2),
        type: z
          .enum(["replace", "scramble"])
          .optional()
          .default("replace"),
        options: optionsSchema,
        ease: z.string().optional().default("none"),
        includeImports: z.boolean().optional().default(true),
      },
    },
    async (args) => {
      const result = generateTextPluginCode(
        args as unknown as TextPluginParams
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
