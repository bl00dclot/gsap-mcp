import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodeBuilder } from "../../generators/code-builder.js";

// ── Types ──────────────────────────────────────────────────

export type UtilityMethod =
  | "interpolate"
  | "mapRange"
  | "clamp"
  | "wrap"
  | "wrapYoyo"
  | "distribute"
  | "random"
  | "snap"
  | "normalize"
  | "pipe"
  | "unitize"
  | "toArray"
  | "selector"
  | "shuffle";

export interface UtilitiesParams {
  method: UtilityMethod;
  params: Record<string, unknown>;
  example: boolean;
}

export interface UtilitiesResult {
  code: string;
  warnings: string[];
}

// ── Core generation logic ──────────────────────────────────

export function generateUtilitiesCode(
  params: UtilitiesParams
): UtilitiesResult {
  const warnings: string[] = [];

  const generator = methodGenerators[params.method];
  const rawCode = generator(params.params, params.example, warnings);

  const builder = new CodeBuilder();
  const header = builder.buildHeaderComment({
    toolName: "gsap_utilities",
    target: "values",
    method: params.method,
  });

  return { code: `${header}\n${rawCode}`, warnings };
}

// ── Method generators ──────────────────────────────────────

type MethodGenerator = (
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
) => string;

const methodGenerators: Record<UtilityMethod, MethodGenerator> = {
  interpolate: genInterpolate,
  mapRange: genMapRange,
  clamp: genClamp,
  wrap: genWrap,
  wrapYoyo: genWrapYoyo,
  distribute: genDistribute,
  random: genRandom,
  snap: genSnap,
  normalize: genNormalize,
  pipe: genPipe,
  unitize: genUnitize,
  toArray: genToArray,
  selector: genSelector,
  shuffle: genShuffle,
};

// ── interpolate ────────────────────────────────────────────

function genInterpolate(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const start = p.start ?? warnMissing("start", 0, warnings);
  const end = p.end ?? warnMissing("end", 100, warnings);
  const progress = p.progress ?? warnMissing("progress", 0.5, warnings);

  const lines: string[] = [];
  if (example) {
    lines.push("// Interpolate between two values based on progress (0–1)");
  }
  lines.push(
    `const result = gsap.utils.interpolate(${fmt(start)}, ${fmt(end)}, ${fmt(progress)});`
  );
  if (example) {
    const result = computeInterpolate(start, end, progress);
    if (result !== null) lines.push(`// Returns: ${result}`);
  }
  return lines.join("\n");
}

function computeInterpolate(
  start: unknown,
  end: unknown,
  progress: unknown
): string | null {
  if (
    typeof start === "number" &&
    typeof end === "number" &&
    typeof progress === "number"
  ) {
    return String(start + (end - start) * progress);
  }
  return null;
}

// ── mapRange ───────────────────────────────────────────────

function genMapRange(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const inMin = p.inMin ?? warnMissing("inMin", 0, warnings);
  const inMax = p.inMax ?? warnMissing("inMax", 100, warnings);
  const outMin = p.outMin ?? warnMissing("outMin", 0, warnings);
  const outMax = p.outMax ?? warnMissing("outMax", 1, warnings);
  const value = p.value ?? warnMissing("value", 50, warnings);

  const lines: string[] = [];
  if (example) {
    lines.push("// Map a value from one range to another");
  }
  lines.push(
    `const result = gsap.utils.mapRange(${fmt(inMin)}, ${fmt(inMax)}, ${fmt(outMin)}, ${fmt(outMax)}, ${fmt(value)});`
  );
  if (example) {
    const result = computeMapRange(inMin, inMax, outMin, outMax, value);
    if (result !== null) lines.push(`// Returns: ${result}`);
  }
  return lines.join("\n");
}

function computeMapRange(
  inMin: unknown,
  inMax: unknown,
  outMin: unknown,
  outMax: unknown,
  value: unknown
): string | null {
  if (
    typeof inMin === "number" &&
    typeof inMax === "number" &&
    typeof outMin === "number" &&
    typeof outMax === "number" &&
    typeof value === "number"
  ) {
    const normalized = (value - inMin) / (inMax - inMin);
    return String(outMin + (outMax - outMin) * normalized);
  }
  return null;
}

// ── clamp ──────────────────────────────────────────────────

function genClamp(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const min = p.min ?? warnMissing("min", 0, warnings);
  const max = p.max ?? warnMissing("max", 100, warnings);
  const value = p.value ?? warnMissing("value", 50, warnings);

  const lines: string[] = [];
  if (example) {
    lines.push("// Clamp a value within a min/max range");
  }
  lines.push(
    `const result = gsap.utils.clamp(${fmt(min)}, ${fmt(max)}, ${fmt(value)});`
  );
  if (example) {
    const result = computeClamp(min, max, value);
    if (result !== null) lines.push(`// Returns: ${result}`);
  }
  return lines.join("\n");
}

function computeClamp(
  min: unknown,
  max: unknown,
  value: unknown
): string | null {
  if (
    typeof min === "number" &&
    typeof max === "number" &&
    typeof value === "number"
  ) {
    return String(Math.min(max, Math.max(min, value)));
  }
  return null;
}

// ── wrap ───────────────────────────────────────────────────

function genWrap(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const isArrayForm =
    p.array !== undefined;

  const lines: string[] = [];

  if (isArrayForm) {
    const arr = p.array as unknown[];
    const index = p.index ?? warnMissing("index", 0, warnings);
    if (example) {
      lines.push("// Wrap an index around an array (cycles through values)");
    }
    lines.push(
      `const result = gsap.utils.wrap(${fmtArray(arr)}, ${fmt(index)});`
    );
    if (example && typeof index === "number") {
      const wrapped = arr[((index % arr.length) + arr.length) % arr.length];
      lines.push(`// Returns: ${fmt(wrapped)}`);
    }
  } else {
    const min = p.min ?? warnMissing("min", 0, warnings);
    const max = p.max ?? warnMissing("max", 100, warnings);
    const value = p.value ?? warnMissing("value", 50, warnings);
    if (example) {
      lines.push("// Wrap a value within a numeric range");
    }
    lines.push(
      `const result = gsap.utils.wrap(${fmt(min)}, ${fmt(max)}, ${fmt(value)});`
    );
    if (
      example &&
      typeof min === "number" &&
      typeof max === "number" &&
      typeof value === "number"
    ) {
      const range = max - min;
      const wrapped = ((((value - min) % range) + range) % range) + min;
      lines.push(`// Returns: ${wrapped}`);
    }
  }

  return lines.join("\n");
}

// ── wrapYoyo ───────────────────────────────────────────────

function genWrapYoyo(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const min = p.min ?? warnMissing("min", 0, warnings);
  const max = p.max ?? warnMissing("max", 100, warnings);
  const value = p.value ?? warnMissing("value", 50, warnings);

  const lines: string[] = [];
  if (example) {
    lines.push(
      "// Wrap a value within a range, reversing direction at boundaries (yoyo)"
    );
  }
  lines.push(
    `const result = gsap.utils.wrapYoyo(${fmt(min)}, ${fmt(max)}, ${fmt(value)});`
  );
  return lines.join("\n");
}

// ── distribute ─────────────────────────────────────────────

function genDistribute(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const amount = p.amount ?? warnMissing("amount", 1, warnings);

  const configParts: string[] = [];
  if (p.base !== undefined) configParts.push(`base: ${fmt(p.base)}`);
  configParts.push(`amount: ${fmt(amount)}`);
  if (p.from !== undefined) configParts.push(`from: ${fmt(p.from)}`);
  if (p.ease !== undefined) configParts.push(`ease: ${fmt(p.ease)}`);

  const config = `{ ${configParts.join(", ")} }`;

  const lines: string[] = [];
  if (example) {
    lines.push(
      "// Distribute values across elements (useful for stagger-like effects)"
    );
  }
  lines.push(`const distribute = gsap.utils.distribute(${config});`);
  if (example) {
    lines.push("// Usage: gsap.to(\".items\", { x: distribute });");
  }
  return lines.join("\n");
}

// ── random ─────────────────────────────────────────────────

function genRandom(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const min = p.min ?? warnMissing("min", 0, warnings);
  const max = p.max ?? warnMissing("max", 100, warnings);

  const lines: string[] = [];
  if (example) {
    lines.push("// Generate a random number within a range");
  }

  if (p.snap !== undefined) {
    lines.push(
      `const result = gsap.utils.random(${fmt(min)}, ${fmt(max)}, ${fmt(p.snap)});`
    );
    if (example) {
      lines.push(
        `// Returns: random number between ${fmt(min)} and ${fmt(max)}, snapped to increments of ${fmt(p.snap)}`
      );
    }
  } else {
    lines.push(
      `const result = gsap.utils.random(${fmt(min)}, ${fmt(max)});`
    );
    if (example) {
      lines.push(
        `// Returns: random number between ${fmt(min)} and ${fmt(max)}`
      );
    }
  }
  return lines.join("\n");
}

// ── snap ───────────────────────────────────────────────────

function genSnap(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const isArrayForm = p.array !== undefined;

  const lines: string[] = [];

  if (isArrayForm) {
    const arr = p.array as unknown[];
    const value = p.value ?? warnMissing("value", 0, warnings);
    if (example) {
      lines.push("// Snap to the closest value in an array");
    }
    lines.push(
      `const result = gsap.utils.snap(${fmtArray(arr)}, ${fmt(value)});`
    );
    if (example && typeof value === "number") {
      const closest = findClosest(arr, value);
      if (closest !== null) lines.push(`// Returns: ${closest}`);
    }
  } else {
    const snap = p.snap ?? warnMissing("snap", 1, warnings);
    const value = p.value ?? warnMissing("value", 0, warnings);
    if (example) {
      lines.push("// Snap a value to the nearest increment");
    }
    lines.push(
      `const result = gsap.utils.snap(${fmt(snap)}, ${fmt(value)});`
    );
    if (
      example &&
      typeof snap === "number" &&
      typeof value === "number" &&
      snap !== 0
    ) {
      const snapped = Math.round(value / snap) * snap;
      lines.push(`// Returns: ${snapped}`);
    }
  }

  return lines.join("\n");
}

function findClosest(arr: unknown[], value: number): number | null {
  let closest: number | null = null;
  let minDist = Infinity;
  for (const item of arr) {
    if (typeof item === "number") {
      const dist = Math.abs(item - value);
      if (dist < minDist) {
        minDist = dist;
        closest = item;
      }
    }
  }
  return closest;
}

// ── normalize ──────────────────────────────────────────────

function genNormalize(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const min = p.min ?? warnMissing("min", 0, warnings);
  const max = p.max ?? warnMissing("max", 100, warnings);
  const value = p.value ?? warnMissing("value", 50, warnings);

  const lines: string[] = [];
  if (example) {
    lines.push("// Normalize a value to a 0–1 range");
  }
  lines.push(
    `const result = gsap.utils.normalize(${fmt(min)}, ${fmt(max)}, ${fmt(value)});`
  );
  if (
    example &&
    typeof min === "number" &&
    typeof max === "number" &&
    typeof value === "number" &&
    max !== min
  ) {
    const result = (value - min) / (max - min);
    lines.push(`// Returns: ${result}`);
  }
  return lines.join("\n");
}

// ── pipe ───────────────────────────────────────────────────

function genPipe(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const functions = p.functions as string[] | undefined;
  if (!functions || functions.length === 0) {
    warnings.push(
      "pipe requires a functions array of function names. Using placeholder."
    );
    const lines: string[] = [];
    if (example) {
      lines.push("// Pipe multiple functions together (left to right)");
    }
    lines.push(
      "const transform = gsap.utils.pipe(func1, func2);"
    );
    return lines.join("\n");
  }

  const lines: string[] = [];
  if (example) {
    lines.push("// Pipe multiple functions together (left to right)");
  }
  lines.push(
    `const transform = gsap.utils.pipe(${functions.join(", ")});`
  );
  if (example) {
    lines.push("// Usage: transform(inputValue)");
  }
  return lines.join("\n");
}

// ── unitize ────────────────────────────────────────────────

function genUnitize(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const func = p.func ?? warnMissing("func", "myFunc", warnings);
  const unit = p.unit ?? warnMissing("unit", "px", warnings);

  const lines: string[] = [];
  if (example) {
    lines.push(
      `// Wrap a function so its return value gets a "${unit}" unit suffix`
    );
  }
  lines.push(
    `const withUnit = gsap.utils.unitize(${fmt(func)}, ${fmt(unit)});`
  );
  if (example) {
    lines.push(`// Usage: withUnit(100) → "100${unit}"`);
  }
  return lines.join("\n");
}

// ── toArray ────────────────────────────────────────────────

function genToArray(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const selector = p.selector ?? warnMissing("selector", ".items", warnings);

  const lines: string[] = [];
  if (example) {
    lines.push(
      "// Convert a selector string, NodeList, or array-like into a flat Array"
    );
  }
  lines.push(
    `const elements = gsap.utils.toArray(${fmt(selector)});`
  );
  if (example) {
    lines.push("// Returns: Array of matching DOM elements");
  }
  return lines.join("\n");
}

// ── selector ───────────────────────────────────────────────

function genSelector(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const scope = p.scope ?? warnMissing("scope", ".container", warnings);

  const lines: string[] = [];
  if (example) {
    lines.push(
      "// Create a scoped selector function for a given element"
    );
  }
  lines.push(
    `const q = gsap.utils.selector(${fmt(scope)});`
  );
  if (example) {
    lines.push(
      '// Usage: gsap.to(q(".child"), { opacity: 1 });'
    );
  }
  return lines.join("\n");
}

// ── shuffle ────────────────────────────────────────────────

function genShuffle(
  p: Record<string, unknown>,
  example: boolean,
  warnings: string[]
): string {
  const arr = p.array as unknown[] | undefined;
  if (!arr) {
    warnings.push(
      "shuffle requires an array parameter. Using placeholder."
    );
    const lines: string[] = [];
    if (example) {
      lines.push("// Randomly shuffle an array in place");
    }
    lines.push(
      "const shuffled = gsap.utils.shuffle([1, 2, 3, 4, 5]);"
    );
    return lines.join("\n");
  }

  const lines: string[] = [];
  if (example) {
    lines.push("// Randomly shuffle an array in place");
  }
  lines.push(
    `const shuffled = gsap.utils.shuffle(${fmtArray(arr)});`
  );
  if (example) {
    lines.push("// Returns: the same array, shuffled in place");
  }
  return lines.join("\n");
}

// ── Helpers ────────────────────────────────────────────────

function fmt(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function fmtArray(arr: unknown[]): string {
  return `[${arr.map(fmt).join(", ")}]`;
}

function warnMissing<T>(name: string, fallback: T, warnings: string[]): T {
  warnings.push(
    `Missing required parameter "${name}". Using default: ${JSON.stringify(fallback)}.`
  );
  return fallback;
}

// ── MCP tool registration ──────────────────────────────────

export function registerUtilitiesTool(server: McpServer): void {
  server.registerTool(
    "gsap_utilities",
    {
      title: "GSAP Utilities",
      description:
        "Generate code using GSAP utility functions for math, range mapping, and DOM helpers. Use for value interpolation, clamping, wrapping, snapping, and scoped DOM selection within animation logic. Not for generating animations — use gsap_tween or gsap_timeline for that.",
      inputSchema: {
        method: z
          .enum([
            "interpolate",
            "mapRange",
            "clamp",
            "wrap",
            "wrapYoyo",
            "distribute",
            "random",
            "snap",
            "normalize",
            "pipe",
            "unitize",
            "toArray",
            "selector",
            "shuffle",
          ])
          .describe("The GSAP utility method to generate"),
        params: z
          .record(z.string(), z.any())
          .describe(
            "Method-specific parameters (keys vary by method): " +
            "interpolate → {start, end, progress}; " +
            "mapRange → {inMin, inMax, outMin, outMax, value}; " +
            "clamp → {min, max, value}; " +
            "wrap → {min, max, value} or {array, index}; " +
            "wrapYoyo → {min, max, value}; " +
            "distribute → {amount, base?, from?, ease?}; " +
            "random → {min, max, snap?}; " +
            "snap → {snap, value} or {array, value}; " +
            "normalize → {min, max, value}; " +
            "pipe → {functions: string[]}; " +
            "unitize → {func, unit}; " +
            "toArray → {selector}; " +
            "selector → {scope}; " +
            "shuffle → {array}"
          ),
        example: z
          .boolean()
          .optional()
          .default(true)
          .describe("Include usage example comment"),
      },
    },
    async (args) => {
      const result = generateUtilitiesCode(args as UtilitiesParams);

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
