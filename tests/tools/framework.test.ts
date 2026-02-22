import { describe, it, expect } from "vitest";
import {
  generateFrameworkCode,
  type FrameworkParams,
} from "../../src/tools/dev/framework.js";

function defaults(overrides: Partial<FrameworkParams> = {}): FrameworkParams {
  return {
    framework: "react",
    ...overrides,
  };
}

// ── All 4 frameworks generate code ───────────────────────

describe("all frameworks generate code", () => {
  const frameworks = ["react", "vue", "angular", "svelte"] as const;

  for (const framework of frameworks) {
    it(`${framework} produces non-empty code`, () => {
      const { code } = generateFrameworkCode(defaults({ framework }));
      expect(code.length).toBeGreaterThan(0);
    });

    it(`${framework} includes gsap import`, () => {
      const { code } = generateFrameworkCode(defaults({ framework }));
      expect(code).toContain("gsap");
    });
  }
});

// ── Default type per framework ───────────────────────────

describe("default type per framework", () => {
  it("react defaults to hook", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "react" }));
    expect(code).toContain("function useGsapAnimation");
  });

  it("vue defaults to hook (composable)", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "vue" }));
    expect(code).toContain("function useGsapAnimation");
  });

  it("angular defaults to directive", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("@Directive");
  });

  it("svelte defaults to action", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "svelte" }));
    expect(code).toContain("export function animate");
  });
});

// ── React: hook ──────────────────────────────────────────

describe("React hook", () => {
  it("uses useRef", () => {
    const { code } = generateFrameworkCode(defaults());
    expect(code).toContain("useRef");
  });

  it("uses useLayoutEffect", () => {
    const { code } = generateFrameworkCode(defaults());
    expect(code).toContain("useLayoutEffect");
  });

  it("uses gsap.context for cleanup", () => {
    const { code } = generateFrameworkCode(defaults());
    expect(code).toContain("gsap.context(");
    expect(code).toContain("ctx.revert()");
  });

  it("returns elementRef", () => {
    const { code } = generateFrameworkCode(defaults());
    expect(code).toContain("return elementRef");
  });

  it("includes TypeScript types when typescript is true", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { typescript: true } })
    );
    expect(code).toContain("<HTMLDivElement>");
  });

  it("omits TypeScript types when typescript is false", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { typescript: false } })
    );
    expect(code).not.toContain("<HTMLDivElement>");
  });

  it("uses ref target when refs is true", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { refs: true } })
    );
    expect(code).toContain("elementRef.current");
  });

  it("uses CSS selector when refs is false", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { refs: false } })
    );
    expect(code).toContain('".element"');
    expect(code).not.toContain("elementRef.current");
  });
});

// ── React: component ─────────────────────────────────────

describe("React component", () => {
  it("generates a functional component", () => {
    const { code } = generateFrameworkCode(
      defaults({ type: "component" })
    );
    expect(code).toContain("AnimatedComponent");
  });

  it("includes React.FC type when typescript is true", () => {
    const { code } = generateFrameworkCode(
      defaults({ type: "component", options: { typescript: true } })
    );
    expect(code).toContain("React.FC");
  });

  it("returns JSX with ref", () => {
    const { code } = generateFrameworkCode(
      defaults({ type: "component" })
    );
    expect(code).toContain("ref={elementRef}");
  });
});

// ── Vue: hook (composable) ───────────────────────────────

describe("Vue composable", () => {
  it("imports ref and onMounted from vue", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "vue" }));
    expect(code).toContain('from "vue"');
    expect(code).toContain("ref");
    expect(code).toContain("onMounted");
  });

  it("imports onUnmounted when cleanup is true", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { cleanup: true } })
    );
    expect(code).toContain("onUnmounted");
  });

  it("uses gsap.context with revert", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "vue" }));
    expect(code).toContain("gsap.context(");
    expect(code).toContain("ctx.revert()");
  });

  it("returns elementRef", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "vue" }));
    expect(code).toContain("return { elementRef }");
  });

  it("includes Ref type when typescript is true", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { typescript: true } })
    );
    expect(code).toContain("Ref<HTMLElement | null>");
  });

  it("omits Ref type when typescript is false", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { typescript: false } })
    );
    expect(code).not.toContain("Ref<");
    expect(code).not.toContain("type Ref");
  });

  it("uses elementRef.value as target", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { refs: true } })
    );
    expect(code).toContain("elementRef.value");
  });

  it("uses CSS selector when refs is false", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { refs: false } })
    );
    expect(code).toContain('".element"');
  });
});

// ── Vue: component ───────────────────────────────────────

describe("Vue component", () => {
  it("generates script setup block", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", type: "component" })
    );
    expect(code).toContain("<script setup>");
    expect(code).toContain("</script>");
  });

  it("generates template block", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", type: "component" })
    );
    expect(code).toContain("<template>");
    expect(code).toContain("</template>");
  });
});

// ── Svelte: action ───────────────────────────────────────

describe("Svelte action", () => {
  it("exports an action function", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "svelte" }));
    expect(code).toContain("export function animate");
  });

  it("uses node parameter", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "svelte" }));
    expect(code).toContain("node");
  });

  it("returns destroy for cleanup", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", options: { cleanup: true } })
    );
    expect(code).toContain("destroy()");
  });

  it("uses gsap.killTweensOf in destroy", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", options: { cleanup: true } })
    );
    expect(code).toContain("gsap.killTweensOf(node)");
  });

  it("includes TypeScript type annotation", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", options: { typescript: true } })
    );
    expect(code).toContain(": HTMLElement");
  });

  it("omits type annotation when typescript is false", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", options: { typescript: false } })
    );
    expect(code).not.toContain(": HTMLElement");
  });
});

// ── Svelte: component ────────────────────────────────────

describe("Svelte component", () => {
  it("uses onMount/onDestroy pattern", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", type: "component" })
    );
    expect(code).toContain("onMount");
    expect(code).toContain("onDestroy");
  });

  it("includes script and template", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", type: "component" })
    );
    expect(code).toContain("<script>");
    expect(code).toContain("</script>");
    expect(code).toContain("bind:this={element}");
  });
});

// ── Angular: directive ───────────────────────────────────

describe("Angular directive", () => {
  it("uses @Directive decorator", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("@Directive");
  });

  it("uses ElementRef", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("ElementRef");
  });

  it("implements AfterViewInit", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("AfterViewInit");
    expect(code).toContain("ngAfterViewInit");
  });

  it("implements OnDestroy with cleanup", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("OnDestroy");
    expect(code).toContain("ngOnDestroy");
  });

  it("uses gsap.killTweensOf in ngOnDestroy", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("gsap.killTweensOf");
  });

  it("uses this.el.nativeElement as target", () => {
    const { code } = generateFrameworkCode(defaults({ framework: "angular" }));
    expect(code).toContain("this.el.nativeElement");
  });

  it("always uses TypeScript", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "angular", options: { typescript: false } })
    );
    // Angular ignores typescript: false
    expect(code).toContain("ElementRef");
    expect(code).toContain("implements");
  });
});

// ── Angular: component ───────────────────────────────────

describe("Angular component", () => {
  it("uses @Component decorator", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "angular", type: "component" })
    );
    expect(code).toContain("@Component");
  });

  it("uses ViewChild", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "angular", type: "component" })
    );
    expect(code).toContain("@ViewChild");
  });
});

// ── TypeScript toggle ────────────────────────────────────

describe("TypeScript toggle", () => {
  it("React with typescript: true has types", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { typescript: true } })
    );
    expect(code).toContain("<HTMLDivElement>");
  });

  it("React with typescript: false omits types", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { typescript: false } })
    );
    expect(code).not.toContain("<HTMLDivElement>");
  });

  it("Vue with typescript: true has Ref type", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { typescript: true } })
    );
    expect(code).toContain("type Ref");
  });

  it("Vue with typescript: false omits Ref type", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { typescript: false } })
    );
    expect(code).not.toContain("type Ref");
  });
});

// ── Cleanup toggle ───────────────────────────────────────

describe("cleanup toggle", () => {
  it("React with cleanup: true includes ctx.revert", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { cleanup: true } })
    );
    expect(code).toContain("ctx.revert()");
  });

  it("React with cleanup: false omits ctx.revert", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { cleanup: false } })
    );
    expect(code).not.toContain("ctx.revert()");
    expect(code).not.toContain("gsap.context(");
  });

  it("Vue with cleanup: false omits onUnmounted", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { cleanup: false } })
    );
    expect(code).not.toContain("onUnmounted");
    expect(code).not.toContain("ctx.revert()");
  });

  it("Svelte action with cleanup: false omits destroy", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "svelte", options: { cleanup: false } })
    );
    expect(code).not.toContain("destroy");
  });

  it("Angular with cleanup: false omits ngOnDestroy", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "angular", options: { cleanup: false } })
    );
    expect(code).not.toContain("ngOnDestroy");
  });
});

// ── refs toggle ──────────────────────────────────────────

describe("refs toggle", () => {
  it("React refs: false uses CSS selector", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { refs: false } })
    );
    expect(code).toContain('".element"');
    expect(code).not.toContain("elementRef.current");
  });

  it("Vue refs: false uses CSS selector", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "vue", options: { refs: false } })
    );
    expect(code).toContain('".element"');
    expect(code).not.toContain("elementRef.value");
  });

  it("Angular refs: false uses CSS selector", () => {
    const { code } = generateFrameworkCode(
      defaults({ framework: "angular", options: { refs: false } })
    );
    expect(code).toContain('".element"');
    expect(code).not.toContain("this.el.nativeElement");
  });
});

// ── ScrollTrigger option ─────────────────────────────────

describe("scrollTrigger option", () => {
  it("adds ScrollTrigger import when scrollTrigger is true", () => {
    const { code } = generateFrameworkCode(
      defaults({ options: { scrollTrigger: true } })
    );
    expect(code).toContain('import { ScrollTrigger } from "gsap/ScrollTrigger"');
    expect(code).toContain("gsap.registerPlugin(ScrollTrigger)");
  });

  it("does not duplicate ScrollTrigger if already in plugins", () => {
    const { code } = generateFrameworkCode(
      defaults({
        plugins: ["ScrollTrigger"],
        options: { scrollTrigger: true },
      })
    );
    const importCount = (
      code.match(/import \{ ScrollTrigger \}/g) || []
    ).length;
    expect(importCount).toBe(1);
  });
});

// ── plugins array ────────────────────────────────────────

describe("plugins array", () => {
  it("adds plugin imports", () => {
    const { code } = generateFrameworkCode(
      defaults({ plugins: ["Flip", "Draggable"] })
    );
    expect(code).toContain('import { Flip } from "gsap/Flip"');
    expect(code).toContain('import { Draggable } from "gsap/Draggable"');
  });

  it("registers plugins", () => {
    const { code } = generateFrameworkCode(
      defaults({ plugins: ["Flip"] })
    );
    expect(code).toContain("gsap.registerPlugin(Flip)");
  });

  it("works across all frameworks", () => {
    for (const framework of ["react", "vue", "angular", "svelte"] as const) {
      const { code } = generateFrameworkCode(
        defaults({ framework, plugins: ["ScrollTrigger"] })
      );
      expect(code).toContain("ScrollTrigger");
    }
  });
});

// ── Timeline method ──────────────────────────────────────

describe("timeline method", () => {
  it("generates gsap.timeline()", () => {
    const { code } = generateFrameworkCode(
      defaults({
        animation: {
          target: ".box",
          method: "timeline",
          properties: { x: 100 },
          duration: 1,
          ease: "power2.out",
        },
      })
    );
    expect(code).toContain("gsap.timeline()");
    expect(code).toContain("tl.to(");
  });
});

// ── fromTo method ────────────────────────────────────────

describe("fromTo method", () => {
  it("generates gsap.fromTo with fromProperties", () => {
    const { code } = generateFrameworkCode(
      defaults({
        animation: {
          target: ".box",
          method: "fromTo",
          fromProperties: { opacity: 0 },
          properties: { opacity: 1 },
          duration: 1,
          ease: "power2.out",
        },
      })
    );
    expect(code).toContain("gsap.fromTo(");
  });

  it("falls back to .to() and warns when fromProperties missing", () => {
    const { code, warnings } = generateFrameworkCode(
      defaults({
        animation: {
          target: ".box",
          method: "fromTo",
          properties: { opacity: 1 },
          duration: 1,
          ease: "power2.out",
        },
      })
    );
    expect(code).toContain("gsap.to(");
    expect(code).not.toContain("gsap.fromTo(");
    expect(warnings.some((w) => w.includes("fromProperties"))).toBe(true);
  });
});

// ── from method ──────────────────────────────────────────

describe("from method", () => {
  it("generates gsap.from", () => {
    const { code } = generateFrameworkCode(
      defaults({
        animation: {
          target: ".box",
          method: "from",
          properties: { opacity: 0 },
          duration: 1,
          ease: "power2.out",
        },
      })
    );
    expect(code).toContain("gsap.from(");
  });
});

// ── Mismatched type/framework warns ──────────────────────

describe("mismatched type/framework warns", () => {
  it("directive on React warns", () => {
    const { warnings } = generateFrameworkCode(
      defaults({ framework: "react", type: "directive" })
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("not idiomatic");
    expect(warnings[0]).toContain("react");
  });

  it("action on React warns", () => {
    const { warnings } = generateFrameworkCode(
      defaults({ framework: "react", type: "action" })
    );
    expect(warnings).toHaveLength(1);
  });

  it("directive on Vue warns", () => {
    const { warnings } = generateFrameworkCode(
      defaults({ framework: "vue", type: "directive" })
    );
    expect(warnings).toHaveLength(1);
  });

  it("hook on Angular warns", () => {
    const { warnings } = generateFrameworkCode(
      defaults({ framework: "angular", type: "hook" })
    );
    expect(warnings).toHaveLength(1);
  });

  it("hook on Svelte warns", () => {
    const { warnings } = generateFrameworkCode(
      defaults({ framework: "svelte", type: "hook" })
    );
    expect(warnings).toHaveLength(1);
  });

  it("idiomatic type produces no mismatch warning", () => {
    const { warnings } = generateFrameworkCode(
      defaults({ framework: "react", type: "hook" })
    );
    expect(warnings).toHaveLength(0);
  });

  it("component is valid for all frameworks", () => {
    for (const framework of ["react", "vue", "angular", "svelte"] as const) {
      const { warnings } = generateFrameworkCode(
        defaults({ framework, type: "component" })
      );
      const mismatchWarnings = warnings.filter((w) =>
        w.includes("not idiomatic")
      );
      expect(mismatchWarnings).toHaveLength(0);
    }
  });
});

// ── Custom animation properties ──────────────────────────

describe("custom animation properties", () => {
  it("uses provided properties", () => {
    const { code } = generateFrameworkCode(
      defaults({
        animation: {
          target: ".hero",
          method: "to",
          properties: { x: 200, scale: 1.5 },
          duration: 2,
          ease: "elastic.out(1, 0.3)",
        },
      })
    );
    expect(code).toContain("x: 200");
    expect(code).toContain("scale: 1.5");
    expect(code).toContain("duration: 2");
    expect(code).toContain("elastic.out(1, 0.3)");
  });
});
