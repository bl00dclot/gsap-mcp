import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatGsapVars } from "../../generators/templates.js";

// ── Types ──────────────────────────────────────────────────

export type Framework = "react" | "vue" | "angular" | "svelte";
export type IntegrationType = "hook" | "component" | "directive" | "action";

export interface FrameworkAnimation {
  target: string;
  method: "to" | "from" | "fromTo" | "timeline";
  properties: Record<string, unknown>;
  fromProperties?: Record<string, unknown>;
  duration: number;
  ease: string;
}

export interface FrameworkOptions {
  typescript: boolean;
  cleanup: boolean;
  scrollTrigger: boolean;
  refs: boolean;
}

export interface FrameworkParams {
  framework: Framework;
  type?: IntegrationType;
  animation?: FrameworkAnimation;
  plugins?: string[];
  options?: Partial<FrameworkOptions>;
}

export interface FrameworkResult {
  code: string;
  warnings: string[];
}

// ── Defaults ───────────────────────────────────────────────

const DEFAULT_ANIMATION: FrameworkAnimation = {
  target: ".element",
  method: "to",
  properties: { opacity: 1, y: 0 },
  duration: 1,
  ease: "power2.out",
};

const DEFAULT_OPTIONS: FrameworkOptions = {
  typescript: true,
  cleanup: true,
  scrollTrigger: false,
  refs: true,
};

const DEFAULT_TYPE: Record<Framework, IntegrationType> = {
  react: "hook",
  vue: "hook",
  angular: "directive",
  svelte: "action",
};

const VALID_TYPES: Record<Framework, IntegrationType[]> = {
  react: ["hook", "component"],
  vue: ["hook", "component"],
  angular: ["directive", "component"],
  svelte: ["action", "component"],
};

// ── Core generation logic ──────────────────────────────────

export function generateFrameworkCode(
  params: FrameworkParams
): FrameworkResult {
  const warnings: string[] = [];
  const anim = { ...DEFAULT_ANIMATION, ...params.animation };
  const opts = { ...DEFAULT_OPTIONS, ...params.options };
  const type = params.type ?? DEFAULT_TYPE[params.framework];

  // Warn on mismatched type/framework
  if (!VALID_TYPES[params.framework].includes(type)) {
    warnings.push(
      `"${type}" is not idiomatic for ${params.framework}. Consider using "${DEFAULT_TYPE[params.framework]}" instead.`
    );
  }

  // Angular is always TypeScript
  if (params.framework === "angular") {
    opts.typescript = true;
  }

  const plugins = params.plugins ?? [];
  if (opts.scrollTrigger && !plugins.includes("ScrollTrigger")) {
    plugins.push("ScrollTrigger");
  }

  const generator = frameworkGenerators[params.framework];
  const code = generator(type, anim, opts, plugins, warnings);

  return { code, warnings };
}

// ── Framework generators ───────────────────────────────────

type FrameworkGenerator = (
  type: IntegrationType,
  anim: FrameworkAnimation,
  opts: FrameworkOptions,
  plugins: string[],
  warnings: string[]
) => string;

const frameworkGenerators: Record<Framework, FrameworkGenerator> = {
  react: genReact,
  vue: genVue,
  angular: genAngular,
  svelte: genSvelte,
};

// ── Animation call helper ──────────────────────────────────

function buildAnimCall(
  target: string,
  anim: FrameworkAnimation,
  warnings: string[]
): string {
  const vars: Record<string, unknown> = {
    ...anim.properties,
    duration: anim.duration,
    ease: anim.ease,
  };

  if (anim.method === "timeline") {
    const varsStr = formatGsapVars(vars);
    return `const tl = gsap.timeline();\ntl.to(${target}, ${varsStr});`;
  }

  if (anim.method === "fromTo") {
    if (!anim.fromProperties) {
      warnings.push(
        `fromTo is missing fromProperties. Falling back to .to().`
      );
      return `gsap.to(${target}, ${formatGsapVars(vars)});`;
    }
    return `gsap.fromTo(${target}, ${formatGsapVars(anim.fromProperties)}, ${formatGsapVars(vars)});`;
  }

  return `gsap.${anim.method}(${target}, ${formatGsapVars(vars)});`;
}

function indent(code: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((l) => (l === "" ? "" : `${pad}${l}`))
    .join("\n");
}

function pluginImports(plugins: string[]): string[] {
  const lines: string[] = [];
  for (const p of plugins) {
    lines.push(`import { ${p} } from "gsap/${p}";`);
  }
  if (plugins.length > 0) {
    lines.push(`gsap.registerPlugin(${plugins.join(", ")});`);
  }
  return lines;
}

// ── React ──────────────────────────────────────────────────

function genReact(
  type: IntegrationType,
  anim: FrameworkAnimation,
  opts: FrameworkOptions,
  plugins: string[],
  warnings: string[]
): string {
  const lines: string[] = [];
  const refType = opts.typescript ? "<HTMLDivElement>" : "";
  const refTarget = opts.refs ? "elementRef.current" : `"${anim.target}"`;
  const animCall = buildAnimCall(refTarget, anim, warnings);

  // Imports
  if (type === "hook") {
    lines.push(
      `import { useRef, useLayoutEffect } from "react";`
    );
  } else {
    lines.push(
      `import React, { useRef, useLayoutEffect } from "react";`
    );
  }
  lines.push('import gsap from "gsap";');
  lines.push(...pluginImports(plugins));
  lines.push("");

  if (type === "hook") {
    // Custom hook
    lines.push(`function useGsapAnimation() {`);
    if (opts.refs) {
      lines.push(`  const elementRef = useRef${refType}(null);`);
    }
    lines.push("");
    lines.push("  useLayoutEffect(() => {");
    if (opts.cleanup) {
      lines.push("    const ctx = gsap.context(() => {");
      lines.push(indent(animCall, 6));
      if (opts.refs) {
        lines.push("    }, elementRef);");
      } else {
        lines.push("    });");
      }
      lines.push("");
      lines.push("    return () => ctx.revert();");
    } else {
      lines.push(indent(animCall, 4));
    }
    lines.push("  }, []);");
    lines.push("");
    if (opts.refs) {
      lines.push("  return elementRef;");
    }
    lines.push("}");
  } else {
    // Component
    const fcType = opts.typescript ? ": React.FC" : "";
    lines.push(`const AnimatedComponent${fcType} = () => {`);
    if (opts.refs) {
      lines.push(`  const elementRef = useRef${refType}(null);`);
    }
    lines.push("");
    lines.push("  useLayoutEffect(() => {");
    if (opts.cleanup) {
      lines.push("    const ctx = gsap.context(() => {");
      lines.push(indent(animCall, 6));
      if (opts.refs) {
        lines.push("    }, elementRef);");
      } else {
        lines.push("    });");
      }
      lines.push("");
      lines.push("    return () => ctx.revert();");
    } else {
      lines.push(indent(animCall, 4));
    }
    lines.push("  }, []);");
    lines.push("");
    if (opts.refs) {
      lines.push("  return <div ref={elementRef}>Animated</div>;");
    } else {
      lines.push(`  return <div className="${anim.target.replace(".", "")}">Animated</div>;`);
    }
    lines.push("};");
  }

  return lines.join("\n");
}

// ── Vue ────────────────────────────────────────────────────

function genVue(
  type: IntegrationType,
  anim: FrameworkAnimation,
  opts: FrameworkOptions,
  plugins: string[],
  warnings: string[]
): string {
  const lines: string[] = [];
  const refTypeAnnotation = opts.typescript ? ": Ref<HTMLElement | null>" : "";
  const refTarget = opts.refs ? "elementRef.value" : `"${anim.target}"`;
  const animCall = buildAnimCall(refTarget, anim, warnings);

  // Imports
  if (type === "hook") {
    const vueImports = ["ref", "onMounted"];
    if (opts.cleanup) vueImports.push("onUnmounted");
    if (opts.typescript) vueImports.push("type Ref");
    lines.push(`import { ${vueImports.join(", ")} } from "vue";`);
  } else {
    const vueImports = ["ref", "onMounted"];
    if (opts.cleanup) vueImports.push("onUnmounted");
    if (opts.typescript) vueImports.push("type Ref");
    lines.push(`import { ${vueImports.join(", ")} } from "vue";`);
  }
  lines.push('import gsap from "gsap";');
  lines.push(...pluginImports(plugins));
  lines.push("");

  if (type === "hook") {
    lines.push("function useGsapAnimation() {");
    if (opts.refs) {
      lines.push(`  const elementRef = ref${refTypeAnnotation}(null);`);
    }
    if (opts.cleanup) {
      lines.push("  let ctx: gsap.Context;");
    }
    lines.push("");
    lines.push("  onMounted(() => {");
    if (opts.cleanup) {
      lines.push("    ctx = gsap.context(() => {");
      lines.push(indent(animCall, 6));
      lines.push("    });");
    } else {
      lines.push(indent(animCall, 4));
    }
    lines.push("  });");
    if (opts.cleanup) {
      lines.push("");
      lines.push("  onUnmounted(() => {");
      lines.push("    ctx.revert();");
      lines.push("  });");
    }
    lines.push("");
    if (opts.refs) {
      lines.push("  return { elementRef };");
    }
    lines.push("}");
  } else {
    // Component (script setup style)
    lines.push("<script setup>");
    if (opts.refs) {
      lines.push(`const elementRef = ref${refTypeAnnotation}(null);`);
    }
    if (opts.cleanup) {
      lines.push("let ctx: gsap.Context;");
    }
    lines.push("");
    lines.push("onMounted(() => {");
    if (opts.cleanup) {
      lines.push("  ctx = gsap.context(() => {");
      lines.push(indent(animCall, 4));
      lines.push("  });");
    } else {
      lines.push(indent(animCall, 2));
    }
    lines.push("});");
    if (opts.cleanup) {
      lines.push("");
      lines.push("onUnmounted(() => {");
      lines.push("  ctx.revert();");
      lines.push("});");
    }
    lines.push("</script>");
    lines.push("");
    lines.push("<template>");
    if (opts.refs) {
      lines.push('  <div ref="elementRef">Animated</div>');
    } else {
      lines.push(`  <div class="${anim.target.replace(".", "")}">Animated</div>`);
    }
    lines.push("</template>");
  }

  return lines.join("\n");
}

// ── Svelte ─────────────────────────────────────────────────

function genSvelte(
  type: IntegrationType,
  anim: FrameworkAnimation,
  opts: FrameworkOptions,
  plugins: string[],
  warnings: string[]
): string {
  const lines: string[] = [];

  if (type === "action") {
    const nodeType = opts.typescript ? ": HTMLElement" : "";
    const animCall = buildAnimCall("node", anim, warnings);

    lines.push('import gsap from "gsap";');
    lines.push(...pluginImports(plugins));
    lines.push("");
    lines.push(`export function animate(node${nodeType}) {`);
    lines.push(indent(animCall, 2));
    if (opts.cleanup) {
      lines.push("");
      lines.push("  return {");
      lines.push("    destroy() {");
      lines.push("      gsap.killTweensOf(node);");
      lines.push("    }");
      lines.push("  };");
    }
    lines.push("}");
  } else {
    // Component pattern (onMount/onDestroy)
    const refTarget = opts.refs ? "element" : `"${anim.target}"`;
    const animCall = buildAnimCall(refTarget, anim, warnings);

    lines.push("<script>");
    lines.push('  import { onMount, onDestroy } from "svelte";');
    lines.push('  import gsap from "gsap";');
    for (const p of plugins) {
      lines.push(`  import { ${p} } from "gsap/${p}";`);
    }
    if (plugins.length > 0) {
      lines.push(`  gsap.registerPlugin(${plugins.join(", ")});`);
    }
    lines.push("");
    if (opts.refs) {
      lines.push("  let element;");
    }
    lines.push("");
    lines.push("  onMount(() => {");
    lines.push(indent(animCall, 4));
    lines.push("  });");
    if (opts.cleanup) {
      lines.push("");
      lines.push("  onDestroy(() => {");
      if (opts.refs) {
        lines.push("    gsap.killTweensOf(element);");
      } else {
        lines.push(`    gsap.killTweensOf("${anim.target}");`);
      }
      lines.push("  });");
    }
    lines.push("</script>");
    lines.push("");
    if (opts.refs) {
      lines.push("<div bind:this={element}>Animated</div>");
    } else {
      lines.push(`<div class="${anim.target.replace(".", "")}">Animated</div>`);
    }
  }

  return lines.join("\n");
}

// ── Angular ────────────────────────────────────────────────

function genAngular(
  type: IntegrationType,
  anim: FrameworkAnimation,
  opts: FrameworkOptions,
  plugins: string[],
  warnings: string[]
): string {
  const lines: string[] = [];
  const target = opts.refs
    ? "this.el.nativeElement"
    : `"${anim.target}"`;
  const animCall = buildAnimCall(target, anim, warnings);

  if (type === "directive") {
    lines.push(
      'import { Directive, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";'
    );
    lines.push('import gsap from "gsap";');
    lines.push(...pluginImports(plugins));
    lines.push("");
    lines.push('@Directive({ selector: "[appGsapAnimate]" })');
    lines.push(
      "export class GsapAnimateDirective implements AfterViewInit, OnDestroy {"
    );
    lines.push("  constructor(private el: ElementRef) {}");
    lines.push("");
    lines.push("  ngAfterViewInit() {");
    lines.push(indent(animCall, 4));
    lines.push("  }");
    if (opts.cleanup) {
      lines.push("");
      lines.push("  ngOnDestroy() {");
      lines.push(`    gsap.killTweensOf(${target});`);
      lines.push("  }");
    }
    lines.push("}");
  } else {
    // Component
    lines.push(
      'import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild } from "@angular/core";'
    );
    lines.push('import gsap from "gsap";');
    lines.push(...pluginImports(plugins));
    lines.push("");
    lines.push("@Component({");
    lines.push('  selector: "app-animated",');
    lines.push(
      '  template: `<div #animatedEl>Animated</div>`,'
    );
    lines.push("})");
    lines.push(
      "export class AnimatedComponent implements AfterViewInit, OnDestroy {"
    );
    if (opts.refs) {
      lines.push(
        '  @ViewChild("animatedEl") el!: ElementRef;'
      );
    }
    lines.push("");
    lines.push("  ngAfterViewInit() {");
    lines.push(indent(animCall, 4));
    lines.push("  }");
    if (opts.cleanup) {
      lines.push("");
      lines.push("  ngOnDestroy() {");
      lines.push(`    gsap.killTweensOf(${target});`);
      lines.push("  }");
    }
    lines.push("}");
  }

  return lines.join("\n");
}

// ── MCP tool registration ──────────────────────────────────

const animationSchema = z
  .object({
    target: z.string().optional().default(".element"),
    method: z
      .enum(["to", "from", "fromTo", "timeline"])
      .optional()
      .default("to"),
    properties: z.record(z.string(), z.any()).optional().default({ opacity: 1, y: 0 }),
    fromProperties: z.record(z.string(), z.any()).optional(),
    duration: z.number().optional().default(1),
    ease: z.string().optional().default("power2.out"),
  })
  .optional();

const optionsSchema = z
  .object({
    typescript: z.boolean().optional().default(true),
    cleanup: z.boolean().optional().default(true),
    scrollTrigger: z.boolean().optional().default(false),
    refs: z.boolean().optional().default(true),
  })
  .optional();

export function registerFrameworkTool(server: McpServer): void {
  server.registerTool(
    "gsap_framework_integration",
    {
      title: "GSAP Framework Integration",
      description:
        "Generate framework-specific GSAP code for React, Vue, Angular, or Svelte",
      inputSchema: {
        framework: z
          .enum(["react", "vue", "angular", "svelte"])
          .describe("Target framework"),
        type: z
          .enum(["hook", "component", "directive", "action"])
          .optional()
          .describe(
            "Integration type (defaults to framework idiom: react→hook, vue→hook, angular→directive, svelte→action)"
          ),
        animation: animationSchema.describe("Animation configuration"),
        plugins: z
          .array(z.string())
          .optional()
          .describe('Plugin names to include (e.g. ["ScrollTrigger"])'),
        options: optionsSchema.describe("Generation options"),
      },
    },
    async (args) => {
      const result = generateFrameworkCode(args as FrameworkParams);

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
