import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  findEasing,
  getEasingsByCategory,
  EASING_CATALOG,
  EASING_CATEGORIES,
  type EasingEntry,
  type EasingCategory,
} from "../../knowledge/easings.js";

// ── Types ──────────────────────────────────────────────────

export interface EasingParams {
  category: "all" | EasingCategory;
  name?: string;
  preview: boolean;
}

export interface EasingResult {
  text: string;
  found: boolean;
}

// ── Core logic ─────────────────────────────────────────────

export function generateEasingReference(params: EasingParams): EasingResult {
  // Name lookup takes priority
  if (params.name) {
    return lookupByName(params.name, params.preview);
  }
  return listByCategory(params.category, params.preview);
}

// ── Name lookup ────────────────────────────────────────────

function lookupByName(name: string, preview: boolean): EasingResult {
  const easing = findEasing(name);

  if (easing) {
    return { text: formatSingleEasing(easing, preview), found: true };
  }

  // Not found — suggest similar names
  const lower = name.toLowerCase();
  const suggestions = EASING_CATALOG.filter((e) =>
    e.name.toLowerCase().includes(lower)
  ).map((e) => e.name);

  const lines = [`Easing "${name}" not found.`];
  if (suggestions.length > 0) {
    lines.push("");
    lines.push("Did you mean:");
    for (const s of suggestions) {
      lines.push(`  - ${s}`);
    }
  } else {
    lines.push("");
    lines.push(
      "Tip: Use category browsing to see all available easings. Standard easings include power1-power4 with .in/.out/.inOut variants."
    );
  }

  return { text: lines.join("\n"), found: false };
}

function formatSingleEasing(easing: EasingEntry, preview: boolean): string {
  const lines: string[] = [];

  lines.push(`${easing.name} (${easing.category})`);
  lines.push(easing.description);

  if (easing.cssEquivalent) {
    lines.push(`CSS equivalent: ${easing.cssEquivalent}`);
  }

  if (preview) {
    lines.push("");
    lines.push("Preview:");
    lines.push(easing.previewCode);
  }

  return lines.join("\n");
}

// ── Category listing ───────────────────────────────────────

const CATEGORY_TITLES: Record<EasingCategory, string> = {
  standard: "Standard Easings",
  special: "Special Easings",
  custom: "Custom/Parametric Easings",
};

function listByCategory(
  category: "all" | EasingCategory,
  preview: boolean
): EasingResult {
  const categories: EasingCategory[] =
    category === "all"
      ? [...EASING_CATEGORIES]
      : [category];

  const sections: string[] = [];

  for (const cat of categories) {
    const easings = getEasingsByCategory(cat);
    if (easings.length === 0) continue;

    const title = `GSAP ${CATEGORY_TITLES[cat]}`;
    const divider = "\u2550".repeat(title.length);
    const lines: string[] = [title, divider];

    for (const easing of easings) {
      const cssNote = easing.cssEquivalent
        ? ` (CSS: ${easing.cssEquivalent})`
        : "";
      lines.push(`${padName(easing.name)} \u2014 ${easing.description}${cssNote}`);

      if (preview) {
        lines.push(`  ${easing.previewCode}`);
      }
    }

    sections.push(lines.join("\n"));
  }

  return { text: sections.join("\n\n"), found: true };
}

function padName(name: string): string {
  return name.padEnd(14);
}

// ── MCP tool registration ──────────────────────────────────

export function registerEasingTool(server: McpServer): void {
  server.registerTool(
    "gsap_easing",
    {
      title: "GSAP Easing Reference",
      description:
        "Browse and preview GSAP easing functions. Get code examples and visual descriptions.",
      inputSchema: {
        category: z
          .enum(["all", "standard", "special", "custom"])
          .optional()
          .default("all"),
        name: z
          .string()
          .optional()
          .describe(
            'Specific easing to look up (e.g. "elastic.out", "power2.inOut")'
          ),
        preview: z
          .boolean()
          .optional()
          .default(true)
          .describe("Include preview code snippets"),
      },
    },
    async (args) => {
      const result = generateEasingReference(args as EasingParams);

      return {
        content: [{ type: "text" as const, text: result.text }],
      };
    }
  );
}
